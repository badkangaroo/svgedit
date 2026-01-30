/**
 * Transform Engine
 * 
 * Handles element manipulation operations including move, resize, rotate, and delete.
 * Integrates with the history manager to support undo/redo.
 * Uses Web Workers for large documents (> 5000 nodes) to maintain UI responsiveness.
 * 
 * Requirements: 7.1, 7.4, 8.1, 8.2, 8.4, 8.5, 14.2
 */

import { Operation } from '../types';
import { documentState } from './document-state';
import { loadingIndicator } from '../utils/loading-indicator';

/**
 * Count total nodes in document tree
 */
function countNodes(tree: any[]): number {
  let count = 0;
  
  function traverse(nodes: any[]): void {
    for (const node of nodes) {
      count++;
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  
  traverse(tree);
  return count;
}

/**
 * TransformEngine class handles element manipulation operations
 * 
 * The transform engine provides methods for:
 * - Moving elements (single or multiple)
 * - Deleting elements (single or multiple)
 * - Resizing elements
 * - Rotating elements
 * - Applying arbitrary transformations
 * 
 * For large documents (> 5000 nodes), operations are offloaded to a Web Worker
 * to maintain UI responsiveness.
 * 
 * Each operation returns an Operation object that can be pushed to the history manager
 * for undo/redo support.
 */
export class TransformEngine {
  private workerThreshold = 5000; // Use worker for documents with > 5000 nodes
  /**
   * Move elements by a delta amount
   * 
   * This method handles both single and multi-element movement.
   * It updates the element's position by modifying either:
   * - x/y attributes (for elements that support them like rect, circle, ellipse, text)
   * - cx/cy attributes (for circle and ellipse)
   * - transform attribute (for elements that don't have position attributes or already have transforms)
   * 
   * For large documents (> 5000 nodes), the operation is performed in a Web Worker.
   * 
   * @param elementIds Array of element IDs to move
   * @param deltaX Horizontal movement delta
   * @param deltaY Vertical movement delta
   * @returns Operation object for undo/redo
   */
  move(elementIds: string[], deltaX: number, deltaY: number): Operation {
    const doc = documentState.svgDocument.get();
    const tree = documentState.documentTree.get();
    
    if (!doc) {
      throw new Error('No document loaded');
    }
    
    if (elementIds.length === 0) {
      throw new Error('No elements specified for move operation');
    }
    
    // Check if we should use worker
    const nodeCount = countNodes(tree);
    const shouldUseWorker = nodeCount > this.workerThreshold;
    
    if (shouldUseWorker) {
      return this.moveInWorker(elementIds, deltaX, deltaY);
    }
    
    // Use main thread for smaller documents
    return this.moveInMainThread(elementIds, deltaX, deltaY);
  }
  
  /**
   * Move elements in main thread (for smaller documents)
   */
  private moveInMainThread(elementIds: string[], deltaX: number, deltaY: number): Operation {
    const doc = documentState.svgDocument.get();
    
    if (!doc) {
      throw new Error('No document loaded');
    }
    
    // Store original states for undo
    const originalStates: Array<{
      element: SVGElement;
      x?: string | null;
      y?: string | null;
      cx?: string | null;
      cy?: string | null;
      x1?: string | null;
      y1?: string | null;
      x2?: string | null;
      y2?: string | null;
      transform?: string | null;
    }> = [];
    
    // Get elements and store their original states
    const elements: SVGElement[] = [];
    for (const id of elementIds) {
      const element = doc.querySelector(`[id="${id}"]`) as SVGElement | null;
      if (!element) {
        console.warn(`Element with id "${id}" not found`);
        continue;
      }
      elements.push(element);
      
      // Store original state
      originalStates.push({
        element,
        x: element.getAttribute('x'),
        y: element.getAttribute('y'),
        cx: element.getAttribute('cx'),
        cy: element.getAttribute('cy'),
        x1: element.getAttribute('x1'),
        y1: element.getAttribute('y1'),
        x2: element.getAttribute('x2'),
        y2: element.getAttribute('y2'),
        transform: element.getAttribute('transform'),
      });
    }
    
    if (elements.length === 0) {
      throw new Error('No valid elements found for move operation');
    }
    
    // Apply the move transformation
    const applyMove = () => {
      for (const element of elements) {
        this.moveElement(element, deltaX, deltaY);
      }
    };
    
    // Undo function: restore original states
    const undo = () => {
      for (const state of originalStates) {
        const { element, x, y, cx, cy, x1, y1, x2, y2, transform } = state;
        
        // Restore or remove attributes based on original state
        this.setOrRemoveAttribute(element, 'x', x);
        this.setOrRemoveAttribute(element, 'y', y);
        this.setOrRemoveAttribute(element, 'cx', cx);
        this.setOrRemoveAttribute(element, 'cy', cy);
        this.setOrRemoveAttribute(element, 'x1', x1);
        this.setOrRemoveAttribute(element, 'y1', y1);
        this.setOrRemoveAttribute(element, 'x2', x2);
        this.setOrRemoveAttribute(element, 'y2', y2);
        this.setOrRemoveAttribute(element, 'transform', transform);
      }
    };
    
    // Redo function: reapply the move
    const redo = () => {
      applyMove();
    };
    
    // Apply the move immediately
    applyMove();
    
    // Create and return the operation
    const description = elementIds.length === 1
      ? `Move element ${elementIds[0]}`
      : `Move ${elementIds.length} elements`;
    
    return {
      type: 'move',
      timestamp: Date.now(),
      undo,
      redo,
      description,
    };
  }
  
  /**
   * Move elements using Web Worker (for large documents > 5000 nodes)
   */
  private moveInWorker(elementIds: string[], deltaX: number, deltaY: number): Operation {
    const doc = documentState.svgDocument.get();
    
    if (!doc) {
      throw new Error('No document loaded');
    }
    
    // Store original SVG for undo
    const serializer = new XMLSerializer();
    const originalSVG = serializer.serializeToString(doc);
    
    // Create a synchronous operation that will be executed asynchronously
    // The actual transformation happens in the background
    let transformedSVG: string | null = null;
    let isComplete = false;
    
    // Start the worker transformation
    this.executeWorkerTransform('move', elementIds, { deltaX, deltaY })
      .then((result) => {
        transformedSVG = result;
        isComplete = true;
        
        // Re-parse and update the document
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(result, 'image/svg+xml');
        const newSvgElement = newDoc.documentElement as unknown as SVGElement;
        
        // Update document state
        documentState.svgDocument.set(newSvgElement);
        documentState.rawSVG.set(result);
      })
      .catch((error) => {
        console.error('Worker transformation failed:', error);
        isComplete = true;
      });
    
    // Return operation immediately (transformation happens asynchronously)
    const description = elementIds.length === 1
      ? `Move element ${elementIds[0]}`
      : `Move ${elementIds.length} elements`;
    
    return {
      type: 'move',
      timestamp: Date.now(),
      undo: () => {
        // Restore original SVG
        const parser = new DOMParser();
        const restoredDoc = parser.parseFromString(originalSVG, 'image/svg+xml');
        const restoredSvgElement = restoredDoc.documentElement as unknown as SVGElement;
        
        documentState.svgDocument.set(restoredSvgElement);
        documentState.rawSVG.set(originalSVG);
      },
      redo: () => {
        // Reapply transformed SVG if available
        if (transformedSVG) {
          const parser = new DOMParser();
          const redoDoc = parser.parseFromString(transformedSVG, 'image/svg+xml');
          const redoSvgElement = redoDoc.documentElement as unknown as SVGElement;
          
          documentState.svgDocument.set(redoSvgElement);
          documentState.rawSVG.set(transformedSVG);
        }
      },
      description,
    };
  }
  
  /**
   * Execute transformation in Web Worker
   */
  private async executeWorkerTransform(
    type: 'move' | 'delete',
    elementIds: string[],
    params: any
  ): Promise<string> {
    // Check if Worker is available
    if (typeof Worker === 'undefined') {
      throw new Error('Web Workers not supported');
    }
    
    const doc = documentState.svgDocument.get();
    if (!doc) {
      throw new Error('No document loaded');
    }
    
    // Serialize current document
    const serializer = new XMLSerializer();
    const serializedSVG = serializer.serializeToString(doc);
    
    // Show progress indicator
    const loadingHandle = loadingIndicator.show({
      message: `Processing ${type} operation...`,
      type: 'progress',
      delay: 0,
      progress: 0,
    });
    
    return new Promise((resolve, reject) => {
      try {
        // Create worker
        const worker = new Worker(
          new URL('../workers/transform.worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        const requestId = `transform-${Date.now()}-${Math.random()}`;
        
        // Set up message handler
        worker.onmessage = (event: MessageEvent) => {
          const message = event.data;
          
          if (message.requestId !== requestId) {
            return;
          }
          
          if (message.type === 'progress') {
            // Update progress indicator with percentage and message
            loadingHandle.updateProgress(message.percent);
            loadingHandle.updateMessage(message.message);
          } else if (message.type === 'result') {
            worker.terminate();
            loadingHandle.hide();
            resolve(message.serializedSVG);
          } else if (message.type === 'error') {
            worker.terminate();
            loadingHandle.hide();
            reject(new Error(message.error));
          }
        };
        
        // Set up error handler
        worker.onerror = (error) => {
          worker.terminate();
          loadingHandle.hide();
          reject(error);
        };
        
        // Send transform request to worker
        worker.postMessage({
          type,
          requestId,
          elementIds,
          params,
          serializedSVG,
        });
        
      } catch (error) {
        loadingHandle.hide();
        reject(error);
      }
    });
  }
  
  /**
   * Move a single element by updating its position attributes
   * 
   * @param element The SVG element to move
   * @param deltaX Horizontal movement delta
   * @param deltaY Vertical movement delta
   */
  private moveElement(element: SVGElement, deltaX: number, deltaY: number): void {
    const tagName = element.tagName.toLowerCase();
    
    // Handle different element types
    switch (tagName) {
      case 'rect':
      case 'image':
      case 'text':
      case 'use':
        // These elements use x and y attributes
        this.moveByXY(element, deltaX, deltaY);
        break;
        
      case 'circle':
        // Circle uses cx and cy attributes
        this.moveByCxCy(element, deltaX, deltaY);
        break;
        
      case 'ellipse':
        // Ellipse uses cx and cy attributes
        this.moveByCxCy(element, deltaX, deltaY);
        break;
        
      case 'line':
        // Line uses x1, y1, x2, y2 attributes
        this.moveLineByCoordinates(element, deltaX, deltaY);
        break;
        
      case 'path':
      case 'polygon':
      case 'polyline':
      case 'g':
        // These elements use transform attribute
        this.moveByTransform(element, deltaX, deltaY);
        break;
        
      default:
        // For unknown elements, try transform
        this.moveByTransform(element, deltaX, deltaY);
        break;
    }
  }
  
  /**
   * Move element by updating x and y attributes
   */
  private moveByXY(element: SVGElement, deltaX: number, deltaY: number): void {
    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    
    element.setAttribute('x', (x + deltaX).toString());
    element.setAttribute('y', (y + deltaY).toString());
  }
  
  /**
   * Move element by updating cx and cy attributes
   */
  private moveByCxCy(element: SVGElement, deltaX: number, deltaY: number): void {
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');
    
    element.setAttribute('cx', (cx + deltaX).toString());
    element.setAttribute('cy', (cy + deltaY).toString());
  }
  
  /**
   * Move line by updating x1, y1, x2, y2 attributes
   */
  private moveLineByCoordinates(element: SVGElement, deltaX: number, deltaY: number): void {
    const x1 = parseFloat(element.getAttribute('x1') || '0');
    const y1 = parseFloat(element.getAttribute('y1') || '0');
    const x2 = parseFloat(element.getAttribute('x2') || '0');
    const y2 = parseFloat(element.getAttribute('y2') || '0');
    
    element.setAttribute('x1', (x1 + deltaX).toString());
    element.setAttribute('y1', (y1 + deltaY).toString());
    element.setAttribute('x2', (x2 + deltaX).toString());
    element.setAttribute('y2', (y2 + deltaY).toString());
  }
  
  /**
   * Move element by updating or adding a transform attribute
   */
  private moveByTransform(element: SVGElement, deltaX: number, deltaY: number): void {
    const currentTransform = element.getAttribute('transform') || '';
    
    // Parse existing translate if present
    const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
    
    if (translateMatch) {
      // Update existing translate
      const currentX = parseFloat(translateMatch[1]);
      const currentY = parseFloat(translateMatch[2]);
      const newX = currentX + deltaX;
      const newY = currentY + deltaY;
      
      const newTransform = currentTransform.replace(
        /translate\([^)]+\)/,
        `translate(${newX}, ${newY})`
      );
      element.setAttribute('transform', newTransform);
    } else {
      // Add new translate
      const newTransform = currentTransform
        ? `translate(${deltaX}, ${deltaY}) ${currentTransform}`
        : `translate(${deltaX}, ${deltaY})`;
      element.setAttribute('transform', newTransform);
    }
  }
  
  /**
   * Delete elements from the document
   * 
   * This method handles both single and multi-element deletion.
   * It removes elements from the DOM and clears the selection.
   * The operation can be undone to restore the deleted elements.
   * 
   * For large documents (> 5000 nodes), the operation is performed in a Web Worker.
   * 
   * @param elementIds Array of element IDs to delete
   * @returns Operation object for undo/redo
   */
  delete(elementIds: string[]): Operation {
    const doc = documentState.svgDocument.get();
    const tree = documentState.documentTree.get();
    
    if (!doc) {
      throw new Error('No document loaded');
    }
    
    if (elementIds.length === 0) {
      throw new Error('No elements specified for delete operation');
    }
    
    // Check if we should use worker
    const nodeCount = countNodes(tree);
    const shouldUseWorker = nodeCount > this.workerThreshold;
    
    if (shouldUseWorker) {
      return this.deleteInWorker(elementIds);
    }
    
    // Use main thread for smaller documents
    return this.deleteInMainThread(elementIds);
  }
  
  /**
   * Delete elements in main thread (for smaller documents)
   */
  private deleteInMainThread(elementIds: string[]): Operation {
    const doc = documentState.svgDocument.get();
    
    if (!doc) {
      throw new Error('No document loaded');
    }
    
    // Store information needed to restore deleted elements
    const deletedElements: Array<{
      element: SVGElement;
      parent: Node;
      nextSibling: Node | null;
    }> = [];
    
    // Get elements and store their parent/sibling information for restoration
    for (const id of elementIds) {
      const element = doc.querySelector(`[id="${id}"]`) as SVGElement | null;
      if (!element) {
        console.warn(`Element with id "${id}" not found`);
        continue;
      }
      
      const parent = element.parentNode;
      if (!parent) {
        console.warn(`Element with id "${id}" has no parent`);
        continue;
      }
      
      // Store element, parent, and next sibling for restoration
      deletedElements.push({
        element: element.cloneNode(true) as SVGElement, // Clone for restoration
        parent,
        nextSibling: element.nextSibling,
      });
    }
    
    if (deletedElements.length === 0) {
      throw new Error('No valid elements found for delete operation');
    }
    
    // Undo function: restore deleted elements
    const undo = () => {
      for (const { element, parent, nextSibling } of deletedElements) {
        // Check if nextSibling is still in the parent (it might have been deleted too)
        if (nextSibling && nextSibling.parentNode === parent) {
          parent.insertBefore(element, nextSibling);
        } else {
          parent.appendChild(element);
        }
      }
    };
    
    // Redo function: remove the restored elements
    const redo = () => {
      for (const { element } of deletedElements) {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }
    };
    
    // Apply the delete immediately by removing the original elements
    for (const id of elementIds) {
      const element = doc.querySelector(`[id="${id}"]`) as SVGElement | null;
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
    
    // Create and return the operation
    const description = elementIds.length === 1
      ? `Delete element ${elementIds[0]}`
      : `Delete ${elementIds.length} elements`;
    
    return {
      type: 'delete',
      timestamp: Date.now(),
      undo,
      redo,
      description,
    };
  }
  
  /**
   * Delete elements using Web Worker (for large documents > 5000 nodes)
   */
  private deleteInWorker(elementIds: string[]): Operation {
    const doc = documentState.svgDocument.get();
    
    if (!doc) {
      throw new Error('No document loaded');
    }
    
    // Store original SVG for undo
    const serializer = new XMLSerializer();
    const originalSVG = serializer.serializeToString(doc);
    
    // Create a synchronous operation that will be executed asynchronously
    let transformedSVG: string | null = null;
    let isComplete = false;
    
    // Start the worker transformation
    this.executeWorkerTransform('delete', elementIds, {})
      .then((result) => {
        transformedSVG = result;
        isComplete = true;
        
        // Re-parse and update the document
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(result, 'image/svg+xml');
        const newSvgElement = newDoc.documentElement as unknown as SVGElement;
        
        // Update document state
        documentState.svgDocument.set(newSvgElement);
        documentState.rawSVG.set(result);
      })
      .catch((error) => {
        console.error('Worker transformation failed:', error);
        isComplete = true;
      });
    
    // Return operation immediately (transformation happens asynchronously)
    const description = elementIds.length === 1
      ? `Delete element ${elementIds[0]}`
      : `Delete ${elementIds.length} elements`;
    
    return {
      type: 'delete',
      timestamp: Date.now(),
      undo: () => {
        // Restore original SVG
        const parser = new DOMParser();
        const restoredDoc = parser.parseFromString(originalSVG, 'image/svg+xml');
        const restoredSvgElement = restoredDoc.documentElement as unknown as SVGElement;
        
        documentState.svgDocument.set(restoredSvgElement);
        documentState.rawSVG.set(originalSVG);
      },
      redo: () => {
        // Reapply transformed SVG if available
        if (transformedSVG) {
          const parser = new DOMParser();
          const redoDoc = parser.parseFromString(transformedSVG, 'image/svg+xml');
          const redoSvgElement = redoDoc.documentElement as unknown as SVGElement;
          
          documentState.svgDocument.set(redoSvgElement);
          documentState.rawSVG.set(transformedSVG);
        }
      },
      description,
    };
  }
  
  /**
   * Helper to set or remove an attribute based on value
   */
  private setOrRemoveAttribute(element: SVGElement, name: string, value: string | null | undefined): void {
    if (value === null || value === undefined) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value);
    }
  }
}

/**
 * Create a singleton instance of TransformEngine for use throughout the application
 */
export const transformEngine = new TransformEngine();
