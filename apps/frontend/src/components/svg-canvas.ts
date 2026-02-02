/**
 * SVG Canvas Component
 * 
 * Renders the SVG document and handles user interactions for selection.
 * Subscribes to document state signal for automatic updates.
 * Implements visual selection indicators (outlines, handles).
 * 
 * Requirements: 1.1, 3.1
 */

import { effect } from '../state/signals';
import { documentState, documentStateUpdater } from '../state/document-state';
import { elementRegistry } from '../state/element-registry';
import { selectionManager } from '../state/selection-manager';
import { toolPaletteState } from './svg-tool-palette';
import { createPrimitiveElement } from '../utils/primitive-tools-simple';
import { svgParser } from '../utils/svg-parser';
import { svgSerializer } from '../utils/svg-serializer';
import { historyManager } from '../state/history-manager';
import { transformEngine } from '../state/transform-engine';
import type { Operation, ToolType } from '../types';

/**
 * SVGCanvas Web Component
 * 
 * Displays the SVG document and provides interactive selection capabilities.
 * Automatically updates when the document state changes.
 */
export class SVGCanvas extends HTMLElement {
  private svgContainer: HTMLDivElement | null = null;
  private selectionOverlay: SVGSVGElement | null = null;
  private disposeEffects: (() => void)[] = [];
  private isMouseDown = false;
  private mouseDownTarget: EventTarget | null = null;
  
  // Primitive creation state
  private isCreatingPrimitive = false;
  private creationStartX = 0;
  private creationStartY = 0;
  private previewElement: SVGElement | null = null;
  
  // Drag-to-move state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCurrentX = 0;
  private dragCurrentY = 0;
  private draggedElementIds: string[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEffects();
    this.attachEventListeners();
    this.registerWithSelectionManager();
  }

  disconnectedCallback() {
    this.disposeEffects.forEach(dispose => dispose());
    this.disposeEffects = [];
    this.detachEventListeners();
  }

  /**
   * Render the canvas component structure
   */
  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
          overflow: auto;
          background-color: var(--color-background);
        }

        .canvas-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          min-height: 400px;
        }

        .svg-wrapper {
          position: relative;
          display: inline-block;
        }

        .svg-content {
          display: block;
          max-width: 100%;
          max-height: 100%;
        }

        .selection-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }

        .selection-outline {
          fill: none;
          stroke: var(--color-primary, #2196F3);
          stroke-width: 2;
          stroke-dasharray: 4 4;
          pointer-events: none;
        }
        
        .selection-outline.dragging {
          opacity: 0.6;
        }

        .selection-handle {
          fill: var(--color-primary, #2196F3);
          stroke: white;
          stroke-width: 1;
          pointer-events: none;
        }

        .hover-outline {
          fill: none;
          stroke: var(--color-accent, #FF9800);
          stroke-width: 1;
          stroke-dasharray: 2 2;
          pointer-events: none;
          opacity: 0.7;
        }

        .empty-state {
          text-align: center;
          color: var(--color-on-surface-variant);
          padding: var(--spacing-xl);
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: var(--spacing-md);
          opacity: 0.5;
        }

        .empty-state-text {
          font-size: 16px;
          margin-bottom: var(--spacing-sm);
        }

        .empty-state-hint {
          font-size: 14px;
          opacity: 0.7;
        }

        /* Ensure SVG elements are selectable */
        ::slotted(svg) {
          cursor: default;
        }

        ::slotted(svg *) {
          cursor: pointer;
        }
      </style>

      <div class="canvas-container">
        <div class="svg-wrapper" id="svg-wrapper">
          <!-- SVG content will be inserted here -->
        </div>
      </div>
    `;

    this.svgContainer = this.shadowRoot.querySelector('#svg-wrapper');
  }

  /**
   * Set up reactive effects to respond to state changes
   */
  private setupEffects() {
    // Effect: Update SVG content when document changes
    const documentEffect = effect(() => {
      const doc = documentState.svgDocument.get();
      // Track rawSVG changes to trigger updates when attributes change
      documentState.rawSVG.get();
      this.updateSVGContent(doc);
    });
    this.disposeEffects.push(documentEffect);

    // Effect: Update selection visuals when selection changes
    // Only track selectedElements to avoid unnecessary effect triggers
    const selectionEffect = effect(() => {
      const selectedElements = documentState.selectedElements.get();
      this.updateSelectionVisuals(selectedElements);
    });
    this.disposeEffects.push(selectionEffect);

    // Effect: Update hover visuals when hover changes
    const hoverEffect = effect(() => {
      const hoveredUUID = documentState.hoveredUUID.get();
      this.updateHoverVisuals(hoveredUUID);
    });
    this.disposeEffects.push(hoverEffect);
  }

  /**
   * Update the SVG content displayed in the canvas
   */
  private updateSVGContent(doc: SVGElement | null) {
    if (!this.svgContainer) return;

    // Clear existing content
    this.svgContainer.innerHTML = '';

    if (!doc) {
      // Show empty state
      this.svgContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <div class="empty-state-text">No document loaded</div>
          <div class="empty-state-hint">Open an SVG file or create a new document to get started</div>
        </div>
      `;
      return;
    }

    // Clone the SVG document to avoid modifying the original
    const svgClone = doc.cloneNode(true) as SVGElement;
    svgClone.classList.add('svg-content');

    // Ensure the SVG has proper dimensions
    if (!svgClone.hasAttribute('width') && !svgClone.hasAttribute('viewBox')) {
      svgClone.setAttribute('width', '800');
      svgClone.setAttribute('height', '600');
    }

    // Create selection overlay
    this.createSelectionOverlay(svgClone);

    // Append the SVG to the container
    this.svgContainer.appendChild(svgClone);
    if (this.selectionOverlay) {
      this.svgContainer.appendChild(this.selectionOverlay);
    }
  }

  /**
   * Create the selection overlay SVG element
   */
  private createSelectionOverlay(svgElement: SVGElement) {
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    overlay.classList.add('selection-overlay');
    
    // Match the dimensions of the main SVG
    const width = svgElement.getAttribute('width') || '800';
    const height = svgElement.getAttribute('height') || '600';
    const viewBox = svgElement.getAttribute('viewBox');
    
    if (viewBox) {
      overlay.setAttribute('viewBox', viewBox);
    } else {
      overlay.setAttribute('width', width);
      overlay.setAttribute('height', height);
    }

    this.selectionOverlay = overlay;
  }

  /**
   * Update selection visual indicators
   * 
   * Optimized for large documents:
   * - Uses DocumentFragment for batched DOM updates
   * - Minimizes reflows by updating all at once
   */
  private updateSelectionVisuals(selectedElements: SVGElement[]) {
    if (!this.selectionOverlay) return;

    // Use DocumentFragment for batched DOM updates
    const fragment = document.createDocumentFragment();

    // Draw selection indicators for each selected element
    selectedElements.forEach(element => {
      this.drawSelectionIndicatorToFragment(element, fragment);
    });
    
    // Clear and update in a single operation
    this.selectionOverlay.innerHTML = '';
    this.selectionOverlay.appendChild(fragment);
    
    // Re-apply dragging class if currently dragging
    if (this.isDragging) {
      const outlines = this.selectionOverlay.querySelectorAll('.selection-outline');
      outlines.forEach(outline => outline.classList.add('dragging'));
    }
  }

  /**
   * Draw selection indicator for a single element into a fragment
   * 
   * @param element - The SVG element to draw selection for
   * @param fragment - The DocumentFragment to append to
   */
  private drawSelectionIndicatorToFragment(element: SVGElement, fragment: DocumentFragment) {
    try {
      // Get the bounding box of the element
      // Note: getBBox may not be available in test environments (jsdom)
      if (typeof (element as any).getBBox !== 'function') {
        // Fallback for test environments - use element attributes
        const bbox = this.getFallbackBBox(element);
        if (!bbox) return;
        
        this.drawSelectionBoxToFragment(bbox, fragment);
        return;
      }

      const bbox = (element as SVGGraphicsElement).getBBox();
      
      // If getBBox returns empty rect (e.g. not rendered yet), try fallback
      if (bbox.width === 0 && bbox.height === 0) {
         const fallback = this.getFallbackBBox(element);
         if (fallback) {
           this.drawSelectionBoxToFragment(fallback, fragment);
           return;
         }
      }

      this.drawSelectionBoxToFragment(bbox, fragment);
    } catch (error) {
      // Some elements might not support getBBox (e.g., <defs>)
      console.warn('Could not draw selection indicator for element:', element, error);
    }
  }

  /**
   * Get fallback bounding box from element attributes (for test environments)
   * 
   * Optimized for performance with early returns and minimal parsing.
   */
  private getFallbackBBox(element: SVGElement): DOMRect | null {
    const tagName = element.tagName.toLowerCase();
    
    // Fast path for common shapes
    switch (tagName) {
      case 'rect': {
        const x = parseFloat(element.getAttribute('x') || '0');
        const y = parseFloat(element.getAttribute('y') || '0');
        const width = parseFloat(element.getAttribute('width') || '0');
        const height = parseFloat(element.getAttribute('height') || '0');
        return { x, y, width, height } as DOMRect;
      }
      
      case 'circle': {
        const cx = parseFloat(element.getAttribute('cx') || '0');
        const cy = parseFloat(element.getAttribute('cy') || '0');
        const r = parseFloat(element.getAttribute('r') || '0');
        return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 } as DOMRect;
      }
      
      case 'ellipse': {
        const cx = parseFloat(element.getAttribute('cx') || '0');
        const cy = parseFloat(element.getAttribute('cy') || '0');
        const rx = parseFloat(element.getAttribute('rx') || '0');
        const ry = parseFloat(element.getAttribute('ry') || '0');
        return { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 } as DOMRect;
      }

      case 'line': {
        const x1 = parseFloat(element.getAttribute('x1') || '0');
        const y1 = parseFloat(element.getAttribute('y1') || '0');
        const x2 = parseFloat(element.getAttribute('x2') || '0');
        const y2 = parseFloat(element.getAttribute('y2') || '0');
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        return { x, y, width, height } as DOMRect;
      }
      
      default:
        // For other elements, return null (can't determine bbox)
        return null;
    }
  }

  /**
   * Draw selection box with handles into a fragment
   * 
   * @param bbox - The bounding box to draw selection for
   * @param fragment - The DocumentFragment to append to
   */
  private drawSelectionBoxToFragment(bbox: DOMRect, fragment: DocumentFragment) {
    // Create selection outline rectangle
    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    outline.classList.add('selection-outline');
    outline.setAttribute('x', bbox.x.toString());
    outline.setAttribute('y', bbox.y.toString());
    outline.setAttribute('width', bbox.width.toString());
    outline.setAttribute('height', bbox.height.toString());
    
    fragment.appendChild(outline);

    // Create selection handles (corner and edge handles)
    const handleSize = 6;
    const handles = [
      { x: bbox.x, y: bbox.y }, // Top-left
      { x: bbox.x + bbox.width, y: bbox.y }, // Top-right
      { x: bbox.x + bbox.width, y: bbox.y + bbox.height }, // Bottom-right
      { x: bbox.x, y: bbox.y + bbox.height }, // Bottom-left
    ];

    handles.forEach(pos => {
      const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      handle.classList.add('selection-handle');
      handle.setAttribute('x', (pos.x - handleSize / 2).toString());
      handle.setAttribute('y', (pos.y - handleSize / 2).toString());
      handle.setAttribute('width', handleSize.toString());
      handle.setAttribute('height', handleSize.toString());
      
      fragment.appendChild(handle);
    });
  }

  /**
   * Update hover visual indicators
   */
  private updateHoverVisuals(hoveredUUID: string | null) {
    if (!this.selectionOverlay) return;

    // Remove existing hover indicators
    const existingHover = this.selectionOverlay.querySelectorAll('.hover-outline');
    existingHover.forEach(el => el.remove());

    if (!hoveredUUID) return;

    // Find the hovered element via ElementRegistry
    const hoveredElement = elementRegistry.getElement(hoveredUUID);
    if (!hoveredElement) return;

    // Don't show hover if element is already selected
    const selectedUUIDs = documentState.selectedUUIDs.get();
    if (selectedUUIDs.has(hoveredUUID)) return;

    try {
      // Get bounding box with fallback for test environments
      let bbox: DOMRect | null = null;
      
      if (typeof (hoveredElement as any).getBBox === 'function') {
        bbox = (hoveredElement as SVGGraphicsElement).getBBox();
      } else {
        bbox = this.getFallbackBBox(hoveredElement);
      }
      
      if (!bbox) return;

      // Draw hover indicator
      const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      outline.classList.add('hover-outline');
      outline.setAttribute('x', bbox.x.toString());
      outline.setAttribute('y', bbox.y.toString());
      outline.setAttribute('width', bbox.width.toString());
      outline.setAttribute('height', bbox.height.toString());
      
      this.selectionOverlay.appendChild(outline);
    } catch (error) {
      console.warn('Could not draw hover indicator for element:', hoveredElement, error);
    }
  }

  /**
   * Attach event listeners for mouse interactions
   */
  private attachEventListeners() {
    if (!this.shadowRoot) return;

    const container = this.shadowRoot.querySelector('.canvas-container');
    if (!container) return;

    container.addEventListener('mousedown', this.handleMouseDown);
    container.addEventListener('mousemove', this.handleMouseMove);
    container.addEventListener('mouseup', this.handleMouseUp);
    container.addEventListener('mouseleave', this.handleMouseLeave);
  }

  /**
   * Detach event listeners
   */
  private detachEventListeners() {
    if (!this.shadowRoot) return;

    const container = this.shadowRoot.querySelector('.canvas-container');
    if (!container) return;

    container.removeEventListener('mousedown', this.handleMouseDown);
    container.removeEventListener('mousemove', this.handleMouseMove);
    container.removeEventListener('mouseup', this.handleMouseUp);
    container.removeEventListener('mouseleave', this.handleMouseLeave);
  }

  /**
   * Handle mouse down events for selection and primitive creation
   */
  private handleMouseDown = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    this.isMouseDown = true;
    this.mouseDownTarget = mouseEvent.target;

    // console.log('MouseDown target:', mouseEvent.target);

    // Get the active tool
    const activeTool = toolPaletteState.activeTool.get();
    
    // Get the SVG document element
    const svgElement = this.getSVGElement();
    
    // If a creation tool is active, start primitive creation
    if (activeTool !== 'select' && svgElement) {
      const point = this.getSVGPoint(mouseEvent, svgElement);
      this.creationStartX = point.x;
      this.creationStartY = point.y;
      
      // For text and group, create immediately
      if (activeTool === 'text' || activeTool === 'group') {
        this.finalizePrimitiveCreation(activeTool, svgElement, point.x, point.y, point.x, point.y);
      } else {
        this.isCreatingPrimitive = true;
      }
      return;
    }

    // Otherwise, handle selection or drag
    const clickedElement = this.findSVGElement(mouseEvent.target as HTMLElement);
    
    if (clickedElement) {
      const elementId = clickedElement.getAttribute('id');
      
      if (elementId) {
        const selectedIds = documentState.selectedIds.get();
        
        // Handle multi-select with Ctrl/Cmd key
        if (mouseEvent.ctrlKey || mouseEvent.metaKey) {
          // With modifier key, always toggle selection (don't start drag)
          selectionManager.toggleSelection(elementId);
        } else {
          // Without modifier key
          // Check if clicked element is already selected
          if (selectedIds.has(elementId)) {
            // Start drag operation on selected element(s)
            if (svgElement) {
              const point = this.getSVGPoint(mouseEvent, svgElement);
              this.startDrag(point.x, point.y, Array.from(selectedIds));
            }
          } else {
            // Select the clicked element and start drag
            selectionManager.select([elementId]);
            if (svgElement) {
              const point = this.getSVGPoint(mouseEvent, svgElement);
              this.startDrag(point.x, point.y, [elementId]);
            }
          }
        }
      }
    } else {
      // Clicked on empty canvas - clear selection
      if (!mouseEvent.ctrlKey && !mouseEvent.metaKey) {
        selectionManager.clearSelection();
      }
    }
  };

  /**
   * Handle mouse move events for hover effects and primitive creation
   */
  private handleMouseMove = (event: Event) => {
    const mouseEvent = event as MouseEvent;

    // Get the SVG document element
    const svgElement = this.getSVGElement();
    
    // If dragging, update the drag position
    if (this.isDragging && svgElement) {
      const point = this.getSVGPoint(mouseEvent, svgElement);
      this.updateDrag(point.x, point.y);
      return;
    }
    
    // If creating a primitive, update the preview
    if (this.isCreatingPrimitive && svgElement) {
      const point = this.getSVGPoint(mouseEvent, svgElement);
      this.updatePrimitivePreview(svgElement, point.x, point.y);
      return;
    }

    // Don't update hover during drag operations
    if (this.isMouseDown) return;

    // Find the SVG element under the mouse
    const hoveredElement = this.findSVGElement(mouseEvent.target as HTMLElement);
    
    if (hoveredElement) {
      const elementUUID = hoveredElement.getAttribute('data-uuid');
      documentState.hoveredUUID.set(elementUUID);
    } else {
      documentState.hoveredUUID.set(null);
    }
  };

  /**
   * Handle mouse up events for primitive creation and drag finalization
   */
  private handleMouseUp = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    
    // Get the SVG document element
    const svgElement = this.getSVGElement();
    
    // If dragging, finalize the drag
    if (this.isDragging && svgElement) {
      const point = this.getSVGPoint(mouseEvent, svgElement);
      this.finalizeDrag(point.x, point.y);
      return;
    }
    
    // If creating a primitive, finalize it
    if (this.isCreatingPrimitive && svgElement) {
      const activeTool = toolPaletteState.activeTool.get();
      const point = this.getSVGPoint(mouseEvent, svgElement);
      
      // Remove preview
      if (this.previewElement) {
        this.previewElement.remove();
        this.previewElement = null;
      }
      
      this.finalizePrimitiveCreation(activeTool, svgElement, this.creationStartX, this.creationStartY, point.x, point.y);
      this.isCreatingPrimitive = false;
    }
    
    this.isMouseDown = false;
    this.mouseDownTarget = null;
  };

  /**
   * Handle mouse leave events
   */
  private handleMouseLeave = (event: Event) => {
    // Cancel any ongoing drag
    if (this.isDragging) {
      this.cancelDrag();
    }
    
    this.isMouseDown = false;
    this.mouseDownTarget = null;
    documentState.hoveredUUID.set(null);
  };

  /**
   * Find the closest SVG element from an event target
   * 
   * @param target - The event target element
   * @returns The SVG element or null if not found
   */
  private findSVGElement(target: HTMLElement): SVGElement | null {
    // console.log('findSVGElement checking:', target);
    // Handle null or undefined target
    if (!target) {
      return null;
    }

    // Check if target is an SVG element (but not the root SVG)
    if (target instanceof SVGElement && target.tagName !== 'svg') {
      // Make sure it has an ID (elements without IDs are not selectable)
      if (target.hasAttribute('id')) {
        return target;
      }
    }

    // Check if target is inside an SVG element
    // Handle case where target might not have a parentElement
    if (!target.parentElement) {
      return null;
    }
    
    let current: HTMLElement | null = target.parentElement;
    while (current) {
      if (current instanceof SVGElement && current.tagName !== 'svg') {
        if (current.hasAttribute('id')) {
          return current;
        }
      }
      current = current.parentElement;
    }

    return null;
  }

  /**
   * Get the SVG document element from the canvas
   * 
   * @returns The SVG element or null if not found
   */
  private getSVGElement(): SVGElement | null {
    if (!this.svgContainer) return null;
    
    const svgElement = this.svgContainer.querySelector('svg.svg-content');
    return svgElement as SVGElement | null;
  }

  /**
   * Get SVG coordinates from mouse event
   */
  private getSVGPoint(event: MouseEvent, svgElement: SVGElement): { x: number; y: number } {
    const rect = svgElement.getBoundingClientRect();
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
   * Update primitive preview during drag
   */
  private updatePrimitivePreview(svgElement: SVGElement, currentX: number, currentY: number): void {
    const activeTool = toolPaletteState.activeTool.get();
    
    if (activeTool === 'select' || activeTool === 'text' || activeTool === 'group') {
      return;
    }

    // Create or update preview element
    if (!this.previewElement) {
      this.previewElement = createPrimitiveElement(
        activeTool,
        this.creationStartX,
        this.creationStartY,
        currentX,
        currentY
      );
      this.previewElement.setAttribute('opacity', '0.5');
      this.previewElement.setAttribute('stroke-dasharray', '4 4');
      svgElement.appendChild(this.previewElement);
    } else {
      // Update existing preview
      const updatedElement = createPrimitiveElement(
        activeTool,
        this.creationStartX,
        this.creationStartY,
        currentX,
        currentY
      );
      
      // Copy attributes from updated element to preview
      for (let i = 0; i < updatedElement.attributes.length; i++) {
        const attr = updatedElement.attributes[i];
        this.previewElement.setAttribute(attr.name, attr.value);
      }
      this.previewElement.setAttribute('opacity', '0.5');
      this.previewElement.setAttribute('stroke-dasharray', '4 4');
    }
  }

  /**
   * Finalize primitive creation and update document state
   */
  private finalizePrimitiveCreation(
    tool: ToolType,
    svgElement: SVGElement,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): void {
    // Create the final element
    const element = createPrimitiveElement(tool, startX, startY, endX, endY);
    
    // Assign a temporary ID so we can find it after parsing
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    element.setAttribute('id', tempId);
    
    // Add to SVG
    svgElement.appendChild(element);
    
    // Update document state
    const serializedSVG = svgSerializer.serialize(svgElement, { keepUUID: true });
    const parseResult = svgParser.parse(serializedSVG);
    
    if (parseResult.success && parseResult.document) {
      // Create undo operation
      const operation: Operation = {
        type: 'create',
        timestamp: Date.now(),
        description: `Create ${tool}`,
        undo: () => {
          element.remove();
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
          svgElement.appendChild(element);
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
      
      // Push to history
      historyManager.push(operation);
      
      // Update document state
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        serializedSVG
      );
      
      // Auto-select the newly created element (Requirement 6.5)
      // Find the element by its temporary ID (stored as data-original-id after parsing)
      const parsedElement = parseResult.document.querySelector(`[data-original-id="${tempId}"]`) ||
                           parseResult.document.querySelector(`#${tempId}`);
      
      if (parsedElement) {
        const finalId = parsedElement.getAttribute('id');
        
        if (finalId) {
          // Delay selection to allow document state to propagate
          setTimeout(() => {
            selectionManager.select([finalId]);
          }, 0);
        }
      }
    }
  }

  /**
   * Start a drag operation
   * 
   * @param startX Starting X coordinate in SVG space
   * @param startY Starting Y coordinate in SVG space
   * @param elementIds IDs of elements to drag
   */
  private startDrag(startX: number, startY: number, elementIds: string[]): void {
    if (elementIds.length === 0) return;
    
    this.isDragging = true;
    this.dragStartX = startX;
    this.dragStartY = startY;
    this.dragCurrentX = startX;
    this.dragCurrentY = startY;
    this.draggedElementIds = elementIds;
    
    // Add visual feedback - add 'dragging' class to selection outlines
    if (this.selectionOverlay) {
      const outlines = this.selectionOverlay.querySelectorAll('.selection-outline');
      outlines.forEach(outline => outline.classList.add('dragging'));
    }
  }
  
  /**
   * Update drag position during mouse move
   * 
   * @param currentX Current X coordinate in SVG space
   * @param currentY Current Y coordinate in SVG space
   */
  private updateDrag(currentX: number, currentY: number): void {
    if (!this.isDragging) return;
    
    // Calculate delta from last position
    const deltaX = currentX - this.dragCurrentX;
    const deltaY = currentY - this.dragCurrentY;
    
    // Update current position
    this.dragCurrentX = currentX;
    this.dragCurrentY = currentY;
    
    // Apply the move transformation in real-time
    const doc = documentState.svgDocument.get();
    if (!doc) return;
    
    for (const elementId of this.draggedElementIds) {
      const element = doc.querySelector(`[id="${elementId}"]`) as SVGElement | null;
      if (element) {
        this.applyDragDelta(element, deltaX, deltaY);
      }
    }
    
    // Update selection visuals to follow the dragged elements
    const selectedElements = documentState.selectedElements.get();
    this.updateSelectionVisuals(selectedElements);
  }
  
  /**
   * Apply drag delta to an element (temporary, for visual feedback)
   * This directly modifies the element's position attributes
   * 
   * @param element The element to move
   * @param deltaX Horizontal delta
   * @param deltaY Vertical delta
   */
  private applyDragDelta(element: SVGElement, deltaX: number, deltaY: number): void {
    const tagName = element.tagName.toLowerCase();
    
    switch (tagName) {
      case 'rect':
      case 'image':
      case 'text':
      case 'use':
        {
          const x = parseFloat(element.getAttribute('x') || '0');
          const y = parseFloat(element.getAttribute('y') || '0');
          element.setAttribute('x', (x + deltaX).toString());
          element.setAttribute('y', (y + deltaY).toString());
        }
        break;
        
      case 'circle':
      case 'ellipse':
        {
          const cx = parseFloat(element.getAttribute('cx') || '0');
          const cy = parseFloat(element.getAttribute('cy') || '0');
          element.setAttribute('cx', (cx + deltaX).toString());
          element.setAttribute('cy', (cy + deltaY).toString());
        }
        break;
        
      case 'line':
        {
          const x1 = parseFloat(element.getAttribute('x1') || '0');
          const y1 = parseFloat(element.getAttribute('y1') || '0');
          const x2 = parseFloat(element.getAttribute('x2') || '0');
          const y2 = parseFloat(element.getAttribute('y2') || '0');
          element.setAttribute('x1', (x1 + deltaX).toString());
          element.setAttribute('y1', (y1 + deltaY).toString());
          element.setAttribute('x2', (x2 + deltaX).toString());
          element.setAttribute('y2', (y2 + deltaY).toString());
        }
        break;
        
      default:
        {
          // Use transform for other elements
          const currentTransform = element.getAttribute('transform') || '';
          const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
          
          if (translateMatch) {
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
            const newTransform = currentTransform
              ? `translate(${deltaX}, ${deltaY}) ${currentTransform}`
              : `translate(${deltaX}, ${deltaY})`;
            element.setAttribute('transform', newTransform);
          }
        }
        break;
    }
  }
  
  /**
   * Finalize drag operation and push to undo stack
   * 
   * @param endX Final X coordinate in SVG space
   * @param endY Final Y coordinate in SVG space
   */
  private finalizeDrag(endX: number, endY: number): void {
    if (!this.isDragging) return;
    
    // Calculate total delta from start to end
    const totalDeltaX = endX - this.dragStartX;
    const totalDeltaY = endY - this.dragStartY;
    
    // Remove visual feedback
    if (this.selectionOverlay) {
      const outlines = this.selectionOverlay.querySelectorAll('.selection-outline');
      outlines.forEach(outline => outline.classList.remove('dragging'));
    }
    
    // Only create an operation if there was actual movement
    if (Math.abs(totalDeltaX) > 0.01 || Math.abs(totalDeltaY) > 0.01) {
      // The elements have already been moved during the drag
      // Now we need to create an operation for undo/redo
      // We'll use the transform engine to create a proper operation
      
      // First, undo the drag to get back to the original state
      const doc = documentState.svgDocument.get();
      if (doc) {
        for (const elementId of this.draggedElementIds) {
          const element = doc.querySelector(`[id="${elementId}"]`) as SVGElement | null;
          if (element) {
            this.applyDragDelta(element, -totalDeltaX, -totalDeltaY);
          }
        }
        
        // Store the current selection to restore it after document update
        const currentSelection = Array.from(documentState.selectedIds.get());
        
        // Now use the transform engine to create the operation properly
        const operation = transformEngine.move(
          this.draggedElementIds,
          totalDeltaX,
          totalDeltaY
        );
        
        // Push to history
        historyManager.push(operation);
        
        // Update document state
        const serializedSVG = svgSerializer.serialize(doc);
        const parseResult = svgParser.parse(serializedSVG);
        
        if (parseResult.success && parseResult.document) {
          documentStateUpdater.setDocument(
            parseResult.document,
            parseResult.tree,
            serializedSVG
          );
          
          // Restore selection
          if (currentSelection.length > 0) {
            selectionManager.select(currentSelection);
          }
        }
      }
    }
    
    // Reset drag state
    this.isDragging = false;
    this.draggedElementIds = [];
  }
  
  /**
   * Cancel drag operation (e.g., when mouse leaves canvas)
   */
  private cancelDrag(): void {
    if (!this.isDragging) return;
    
    // Calculate total delta to undo
    const totalDeltaX = this.dragCurrentX - this.dragStartX;
    const totalDeltaY = this.dragCurrentY - this.dragStartY;
    
    // Undo the drag
    const doc = documentState.svgDocument.get();
    if (doc) {
      for (const elementId of this.draggedElementIds) {
        const element = doc.querySelector(`[id="${elementId}"]`) as SVGElement | null;
        if (element) {
          this.applyDragDelta(element, -totalDeltaX, -totalDeltaY);
        }
      }
      
      // Update selection visuals
      const selectedElements = documentState.selectedElements.get();
      this.updateSelectionVisuals(selectedElements);
    }
    
    // Remove visual feedback
    if (this.selectionOverlay) {
      const outlines = this.selectionOverlay.querySelectorAll('.selection-outline');
      outlines.forEach(outline => outline.classList.remove('dragging'));
    }
    
    // Reset drag state
    this.isDragging = false;
    this.draggedElementIds = [];
  }

  /**
   * Register canvas sync callback with selection manager
   */
  private registerWithSelectionManager() {
    selectionManager.registerSyncCallbacks({
      onCanvasSync: (event) => {
        // Canvas sync is handled automatically through reactive effects
        // This callback is here for consistency with the architecture
      },
    });
  }
}

// Register the custom element
customElements.define('svg-canvas', SVGCanvas);
