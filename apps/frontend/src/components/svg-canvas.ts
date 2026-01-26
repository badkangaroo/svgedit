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
import { documentState } from '../state/document-state';
import { selectionManager } from '../state/selection-manager';
import type { DocumentNode } from '../types';

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
      this.updateSVGContent(doc);
    });
    this.disposeEffects.push(documentEffect);

    // Effect: Update selection visuals when selection changes
    const selectionEffect = effect(() => {
      const selectedIds = documentState.selectedIds.get();
      const selectedElements = documentState.selectedElements.get();
      this.updateSelectionVisuals(selectedElements);
    });
    this.disposeEffects.push(selectionEffect);

    // Effect: Update hover visuals when hover changes
    const hoverEffect = effect(() => {
      const hoveredId = documentState.hoveredId.get();
      this.updateHoverVisuals(hoveredId);
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
   */
  private updateSelectionVisuals(selectedElements: SVGElement[]) {
    if (!this.selectionOverlay) return;

    // Clear existing selection visuals
    this.selectionOverlay.innerHTML = '';

    // Draw selection indicators for each selected element
    selectedElements.forEach(element => {
      this.drawSelectionIndicator(element);
    });
  }

  /**
   * Draw selection indicator for a single element
   */
  private drawSelectionIndicator(element: SVGElement) {
    if (!this.selectionOverlay) return;

    try {
      // Get the bounding box of the element
      // Note: getBBox may not be available in test environments (jsdom)
      if (typeof element.getBBox !== 'function') {
        // Fallback for test environments - use element attributes
        const bbox = this.getFallbackBBox(element);
        if (!bbox) return;
        
        this.drawSelectionBox(bbox);
        return;
      }

      const bbox = element.getBBox();
      this.drawSelectionBox(bbox);
    } catch (error) {
      // Some elements might not support getBBox (e.g., <defs>)
      console.warn('Could not draw selection indicator for element:', element, error);
    }
  }

  /**
   * Get fallback bounding box from element attributes (for test environments)
   */
  private getFallbackBBox(element: SVGElement): DOMRect | null {
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'rect') {
      const x = parseFloat(element.getAttribute('x') || '0');
      const y = parseFloat(element.getAttribute('y') || '0');
      const width = parseFloat(element.getAttribute('width') || '0');
      const height = parseFloat(element.getAttribute('height') || '0');
      return { x, y, width, height } as DOMRect;
    }
    
    if (tagName === 'circle') {
      const cx = parseFloat(element.getAttribute('cx') || '0');
      const cy = parseFloat(element.getAttribute('cy') || '0');
      const r = parseFloat(element.getAttribute('r') || '0');
      return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 } as DOMRect;
    }
    
    if (tagName === 'ellipse') {
      const cx = parseFloat(element.getAttribute('cx') || '0');
      const cy = parseFloat(element.getAttribute('cy') || '0');
      const rx = parseFloat(element.getAttribute('rx') || '0');
      const ry = parseFloat(element.getAttribute('ry') || '0');
      return { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 } as DOMRect;
    }
    
    // For other elements, return null (can't determine bbox)
    return null;
  }

  /**
   * Draw selection box with handles
   */
  private drawSelectionBox(bbox: DOMRect) {
    if (!this.selectionOverlay) return;

    // Create selection outline rectangle
    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    outline.classList.add('selection-outline');
    outline.setAttribute('x', bbox.x.toString());
    outline.setAttribute('y', bbox.y.toString());
    outline.setAttribute('width', bbox.width.toString());
    outline.setAttribute('height', bbox.height.toString());
    
    this.selectionOverlay.appendChild(outline);

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
      
      this.selectionOverlay.appendChild(handle);
    });
  }

  /**
   * Update hover visual indicators
   */
  private updateHoverVisuals(hoveredId: string | null) {
    if (!this.selectionOverlay) return;

    // Remove existing hover indicators
    const existingHover = this.selectionOverlay.querySelectorAll('.hover-outline');
    existingHover.forEach(el => el.remove());

    if (!hoveredId) return;

    // Find the hovered element
    const doc = documentState.svgDocument.get();
    if (!doc) return;

    const hoveredElement = doc.querySelector(`[id="${hoveredId}"]`) as SVGElement | null;
    if (!hoveredElement) return;

    // Don't show hover if element is already selected
    const selectedIds = documentState.selectedIds.get();
    if (selectedIds.has(hoveredId)) return;

    try {
      // Get bounding box with fallback for test environments
      let bbox: DOMRect | null = null;
      
      if (typeof hoveredElement.getBBox === 'function') {
        bbox = hoveredElement.getBBox();
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
   * Handle mouse down events for selection
   */
  private handleMouseDown = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    this.isMouseDown = true;
    this.mouseDownTarget = mouseEvent.target;

    // Find the SVG element that was clicked
    const clickedElement = this.findSVGElement(mouseEvent.target as HTMLElement);
    
    if (clickedElement) {
      const elementId = clickedElement.getAttribute('id');
      
      if (elementId) {
        // Handle multi-select with Ctrl/Cmd key
        if (mouseEvent.ctrlKey || mouseEvent.metaKey) {
          selectionManager.toggleSelection(elementId);
        } else {
          selectionManager.select([elementId]);
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
   * Handle mouse move events for hover effects
   */
  private handleMouseMove = (event: Event) => {
    const mouseEvent = event as MouseEvent;

    // Don't update hover during drag operations
    if (this.isMouseDown) return;

    // Find the SVG element under the mouse
    const hoveredElement = this.findSVGElement(mouseEvent.target as HTMLElement);
    
    if (hoveredElement) {
      const elementId = hoveredElement.getAttribute('id');
      documentState.hoveredId.set(elementId);
    } else {
      documentState.hoveredId.set(null);
    }
  };

  /**
   * Handle mouse up events
   */
  private handleMouseUp = (event: Event) => {
    this.isMouseDown = false;
    this.mouseDownTarget = null;
  };

  /**
   * Handle mouse leave events
   */
  private handleMouseLeave = (event: Event) => {
    this.isMouseDown = false;
    this.mouseDownTarget = null;
    documentState.hoveredId.set(null);
  };

  /**
   * Find the closest SVG element from an event target
   * 
   * @param target - The event target element
   * @returns The SVG element or null if not found
   */
  private findSVGElement(target: HTMLElement): SVGElement | null {
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
    
    let current = target.parentElement;
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
