/**
 * Primitive Creation Tools
 * 
 * Handles creation of SVG primitives (rectangle, circle, ellipse, line, path, text, group)
 * through canvas mouse interactions. Assigns default attributes and adds elements to document state.
 * 
 * Requirements: 6.1, 6.2, 6.4
 */

import { documentState, documentStateUpdater } from '../state/document-state';
import { selectionManager } from '../state/selection-manager';
import { svgParser } from './svg-parser';
import { svgSerializer } from './svg-serializer';
import { historyManager } from '../state/history-manager';
import type { Operation, ToolType } from '../types';

/**
 * Default attributes for each primitive type
 */
const DEFAULT_ATTRIBUTES = {
  rectangle: {
    width: 100,
    height: 80,
    fill: '#3b82f6',
    stroke: '#1e40af',
    strokeWidth: 2,
  },
  circle: {
    r: 50,
    fill: '#10b981',
    stroke: '#047857',
    strokeWidth: 2,
  },
  ellipse: {
    rx: 60,
    ry: 40,
    fill: '#8b5cf6',
    stroke: '#6d28d9',
    strokeWidth: 2,
  },
  line: {
    stroke: '#ef4444',
    strokeWidth: 3,
    strokeLinecap: 'round',
  },
  path: {
    fill: 'none',
    stroke: '#f59e0b',
    strokeWidth: 3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  text: {
    fill: '#1f2937',
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    textContent: 'Text',
  },
  group: {
    // Groups don't have visual attributes by default
  },
};

/**
 * State for tracking primitive creation during mouse interaction
 */
interface CreationState {
  isCreating: boolean;
  tool: ToolType | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  previewElement: SVGElement | null;
}

/**
 * Primitive creation manager
 */
export class PrimitiveTools {
  private creationState: CreationState = {
    isCreating: false,
    tool: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    previewElement: null,
  };

  /**
   * Handle mouse down event to start primitive creation
   * 
   * @param event - Mouse event
   * @param tool - Active tool type
   * @param svgElement - The SVG element to create primitives in
   */
  handleMouseDown(event: MouseEvent, tool: ToolType, svgElement: SVGElement): void {
    // Only handle creation tools (not select tool)
    if (tool === 'select') {
      return;
    }

    // Get mouse position relative to SVG
    const point = this.getSVGPoint(event, svgElement);
    
    this.creationState = {
      isCreating: true,
      tool,
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
      previewElement: null,
    };

    // For text and group, create immediately on click
    if (tool === 'text' || tool === 'group') {
      this.createPrimitive(svgElement);
      this.creationState.isCreating = false;
    }
  }

  /**
   * Handle mouse move event to update primitive preview
   * 
   * @param event - Mouse event
   * @param svgElement - The SVG element
   */
  handleMouseMove(event: MouseEvent, svgElement: SVGElement): void {
    if (!this.creationState.isCreating) {
      return;
    }

    // Get current mouse position
    const point = this.getSVGPoint(event, svgElement);
    this.creationState.currentX = point.x;
    this.creationState.currentY = point.y;

    // Update or create preview element
    this.updatePreview(svgElement);
  }

  /**
   * Handle mouse up event to finalize primitive creation
   * 
   * @param event - Mouse event
   * @param svgElement - The SVG element
   */
  handleMouseUp(event: MouseEvent, svgElement: SVGElement): void {
    if (!this.creationState.isCreating) {
      return;
    }

    // Remove preview element if it exists
    if (this.creationState.previewElement) {
      this.creationState.previewElement.remove();
      this.creationState.previewElement = null;
    }

    // Create the final primitive
    this.createPrimitive(svgElement);

    // Reset creation state
    this.creationState.isCreating = false;
  }

  /**
   * Get SVG coordinates from mouse event
   * 
   * @param event - Mouse event
   * @param svgElement - The SVG element
   * @returns Point with x, y coordinates in SVG space
   */
  private getSVGPoint(event: MouseEvent, svgElement: SVGElement): { x: number; y: number } {
    // Get the bounding rect of the SVG element
    const rect = svgElement.getBoundingClientRect();
    
    // Calculate position relative to SVG
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Handle viewBox transformation if present
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
      const scaleX = vbWidth / rect.width;
      const scaleY = vbHeight / rect.height;
      
      return {
        x: vbX + x * scaleX,
        y: vbY + y * scaleY,
      };
    }
    
    return { x, y };
  }

  /**
   * Update preview element during drag
   * 
   * @param svgElement - The SVG element
   */
  private updatePreview(svgElement: SVGElement): void {
    const { tool, startX, startY, currentX, currentY } = this.creationState;
    
    if (!tool || tool === 'select' || tool === 'text' || tool === 'group') {
      return;
    }

    // Create preview element if it doesn't exist
    if (!this.creationState.previewElement) {
      this.creationState.previewElement = this.createPreviewElement(tool);
      svgElement.appendChild(this.creationState.previewElement);
    }

    // Update preview element attributes based on current mouse position
    this.updatePreviewAttributes(this.creationState.previewElement, tool, startX, startY, currentX, currentY);
  }

  /**
   * Create a preview element for the given tool
   * 
   * @param tool - Tool type
   * @returns SVG element for preview
   */
  private createPreviewElement(tool: ToolType): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', this.getElementTagName(tool));
    
    // Add preview styling
    element.setAttribute('opacity', '0.5');
    element.setAttribute('stroke-dasharray', '4 4');
    
    return element;
  }

  /**
   * Update preview element attributes based on drag
   */
  private updatePreviewAttributes(
    element: SVGElement,
    tool: ToolType,
    startX: number,
    startY: number,
    currentX: number,
    currentY: number
  ): void {
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);

    switch (tool) {
      case 'rectangle':
        element.setAttribute('x', x.toString());
        element.setAttribute('y', y.toString());
        element.setAttribute('width', width.toString());
        element.setAttribute('height', height.toString());
        element.setAttribute('fill', DEFAULT_ATTRIBUTES.rectangle.fill);
        element.setAttribute('stroke', DEFAULT_ATTRIBUTES.rectangle.stroke);
        element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.rectangle.strokeWidth.toString());
        break;

      case 'circle': {
        const radius = Math.sqrt(width * width + height * height) / 2;
        element.setAttribute('cx', startX.toString());
        element.setAttribute('cy', startY.toString());
        element.setAttribute('r', radius.toString());
        element.setAttribute('fill', DEFAULT_ATTRIBUTES.circle.fill);
        element.setAttribute('stroke', DEFAULT_ATTRIBUTES.circle.stroke);
        element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.circle.strokeWidth.toString());
        break;
      }

      case 'ellipse':
        element.setAttribute('cx', startX.toString());
        element.setAttribute('cy', startY.toString());
        element.setAttribute('rx', (width / 2).toString());
        element.setAttribute('ry', (height / 2).toString());
        element.setAttribute('fill', DEFAULT_ATTRIBUTES.ellipse.fill);
        element.setAttribute('stroke', DEFAULT_ATTRIBUTES.ellipse.stroke);
        element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.ellipse.strokeWidth.toString());
        break;

      case 'line':
        element.setAttribute('x1', startX.toString());
        element.setAttribute('y1', startY.toString());
        element.setAttribute('x2', currentX.toString());
        element.setAttribute('y2', currentY.toString());
        element.setAttribute('stroke', DEFAULT_ATTRIBUTES.line.stroke);
        element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.line.strokeWidth.toString());
        element.setAttribute('stroke-linecap', DEFAULT_ATTRIBUTES.line.strokeLinecap);
        break;

      case 'path': {
        const midX = (startX + currentX) / 2;
        const midY = (startY + currentY) / 2;
        const d = `M ${startX} ${startY} Q ${midX} ${startY}, ${midX} ${midY} T ${currentX} ${currentY}`;
        element.setAttribute('d', d);
        element.setAttribute('fill', DEFAULT_ATTRIBUTES.path.fill);
        element.setAttribute('stroke', DEFAULT_ATTRIBUTES.path.stroke);
        element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.path.strokeWidth.toString());
        element.setAttribute('stroke-linecap', DEFAULT_ATTRIBUTES.path.strokeLinecap);
        element.setAttribute('stroke-linejoin', DEFAULT_ATTRIBUTES.path.strokeLinejoin);
        break;
      }
    }
  }

  /**
   * Create the final primitive and add it to the document
   */
  private createPrimitive(svgElement: SVGElement): void {
    const { tool, startX, startY, currentX, currentY } = this.creationState;
    
    if (!tool || tool === 'select') {
      return;
    }

    // Create the element
    const element = document.createElementNS('http://www.w3.org/2000/svg', this.getElementTagName(tool));
    
    // Set attributes based on tool type
    this.setPrimitiveAttributes(element, tool, startX, startY, currentX, currentY);
    
    // Add the element to the SVG document
    svgElement.appendChild(element);
    
    // Update document state
    this.updateDocumentState(svgElement, element);
  }

  /**
   * Get the SVG element tag name for a tool type
   */
  private getElementTagName(tool: ToolType): string {
    switch (tool) {
      case 'rectangle':
        return 'rect';
      case 'circle':
        return 'circle';
      case 'ellipse':
        return 'ellipse';
      case 'line':
        return 'line';
      case 'path':
        return 'path';
      case 'text':
        return 'text';
      case 'group':
        return 'g';
      default:
        return 'rect';
    }
  }

  /**
   * Set attributes on the primitive element
   */
  private setPrimitiveAttributes(
    element: SVGElement,
    tool: ToolType,
    startX: number,
    startY: number,
    currentX: number,
    currentY: number
  ): void {
    switch (tool) {
      case 'rectangle': {
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        
        const finalWidth = width < 10 ? DEFAULT_ATTRIBUTES.rectangle.width : width;
        const finalHeight = height < 10 ? DEFAULT_ATTRIBUTES.rectangle.height : height;
        
        element.setAttribute('x', x.toString());
        element.setAttribute('y', y.toString());
        element.setAttribute('width', finalWidth.toString());
        element.setAttribute('height', finalHeight.toString());
        element.setAttribute('fill', DEFAULT_ATTRIBUTES.rectangle.fill);
        element.setAttribute('stroke', DEFAULT_ATTRIBUTES.rectangle.stroke);
        element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.rectangle.strokeWidth.toString());
        break;
      }

      case 'circle': {
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const radius = Math.sqrt(width * width + height * height) / 2;
        const finalRadius = radius < 10 ? DEFAULT_ATTRIBUTES.circle.r : radius;
        
        element.setAttribute('cx', startX.toString());
        element.setAttribute('cy', startY.toString());
        element.setAttribute('r', finalRadius.toString());
        element.setAttribute('fill', DEFAULT_ATTRIBUTES.circle.fill);
        element.setAttribute('stroke', DEFAULT_ATTRIBUTES.circle.stroke);
        element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.circle.strokeWidth.toString());
        break;
      }

      case 'ellipse': {
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const finalRx = width < 10 ? DEFAULT_ATTRIBUTES.ellipse.rx : width / 2;
        const finalRy = height < 10 ? DEFAULT_ATTRIBUTES.ellipse.ry : height / 2;
        
        element.setAttribute('cx', startX.toString());
        element.setAttribute('cy', startY.toString());
        element.setAttribute('rx', finalRx.toString());
        element.setAttribute('ry', finalRy.toString());
        element.setAttribute('fill', DEFAULT_ATTRIBUTES.ellipse.fill);
        element.setAttribute('stroke', DEFAULT_ATTRIBUTES.ellipse.stroke);
        element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.ellipse.strokeWidth.toString());
        break;
      }

      case 'line': {
        const distance = Math.sqrt(
          Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)
        );
        
        let x2 = currentX;
        let y2 = currentY;
        
        if (distance < 10) {
          x2 = startX + 100;
          y2 = startY;
        }
        
        element.setAttribute('x1', startX.toString());
        element.setAttribute('y1', startY.toString());
        element.setAttribute('x2', x2.toString());
        element.setAttribute('y2', y2.toString());
        element.setAttribute('stroke', DEFAULT_ATTRIBUTES.line.stroke);
        element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.line.strokeWidth.toString());
        element.setAttribute('stroke-linecap', DEFAULT_ATTRIBUTES.line.strokeLinecap);
        break;
      }

      case 'path': {
        const distance = Math.sqrt(
          Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)
        );
        
        let endX = currentX;
        let endY = currentY;
        
        if (distance < 10) {
          endX = startX + 100;
          endY = startY + 50;
        }
        
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const d = `M ${startX} ${startY} Q ${midX} ${startY}, ${midX} ${midY} T ${endX} ${endY}`;
        
        element.setAttribute('d', d);
        element.setAttribute('fill', DEFAULT_ATTRIBUTES.path.fill);
        element.setAttribute('stroke', DEFAULT_ATTRIBUTES.path.stroke);
        element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.path.strokeWidth.toString());
        element.setAttribute('stroke-linecap', DEFAULT_ATTRIBUTES.path.strokeLinecap);
        element.setAttribute('stroke-linejoin', DEFAULT_ATTRIBUTES.path.strokeLinejoin);
        break;
      }

      case 'text':
        element.setAttribute('x', startX.toString());
        element.setAttribute('y', startY.toString());
        element.setAttribute('fill', DEFAULT_ATTRIBUTES.text.fill);
        element.setAttribute('font-size', DEFAULT_ATTRIBUTES.text.fontSize.toString());
        element.setAttribute('font-family', DEFAULT_ATTRIBUTES.text.fontFamily);
        element.textContent = DEFAULT_ATTRIBUTES.text.textContent;
        break;

      case 'group':
        element.setAttribute('transform', `translate(${startX}, ${startY})`);
        break;
    }
  }

  /**
   * Update document state after creating a primitive
   */
  private updateDocumentState(svgElement: SVGElement, newElement: SVGElement): void {
    const serializedSVG = svgSerializer.serialize(svgElement);
    const parseResult = svgParser.parse(serializedSVG);
    
    if (parseResult.success && parseResult.document) {
      const newElementId = newElement.getAttribute('id');
      
      const operation: Operation = {
        type: 'create',
        timestamp: Date.now(),
        description: `Create ${this.creationState.tool}`,
        undo: () => {
          newElement.remove();
          const undoSerialized = svgSerializer.serialize(svgElement);
          const undoParseResult = svgParser.parse(undoSerialized);
          
          if (undoParseResult.success && undoParseResult.document) {
            documentStateUpdater.setDocument(
              undoParseResult.document,
              undoParseResult.tree,
              undoSerialized
            );
          }
        },
        redo: () => {
          svgElement.appendChild(newElement);
          const redoSerialized = svgSerializer.serialize(svgElement);
          const redoParseResult = svgParser.parse(redoSerialized);
          
          if (redoParseResult.success && redoParseResult.document) {
            documentStateUpdater.setDocument(
              redoParseResult.document,
              redoParseResult.tree,
              redoSerialized
            );
          }
        },
      };
      
      historyManager.push(operation);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        serializedSVG
      );
      
      // Auto-select the newly created element (Requirement 6.5)
      if (newElementId) {
        const parsedElement = parseResult.document.querySelector(`[data-original-id="${newElementId}"]`) ||
                             parseResult.document.querySelector(`#${newElementId}`);
        
        if (parsedElement) {
          const finalId = parsedElement.getAttribute('id');
          if (finalId) {
            selectionManager.select([finalId]);
          }
        }
      }
    }
  }

  /**
   * Check if currently creating a primitive
   */
  isCreating(): boolean {
    return this.creationState.isCreating;
  }
}

/**
 * Global primitive tools instance
 */
export const primitiveTools = new PrimitiveTools();
