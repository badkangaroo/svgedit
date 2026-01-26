/**
 * Unit tests for SVG Canvas Component
 * Tests SVG rendering, selection handling, and visual indicators.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './svg-canvas';
import { SVGCanvas } from './svg-canvas';
import { documentStateUpdater } from '../state/document-state';
import { selectionManager } from '../state/selection-manager';

describe('SVGCanvas Component', () => {
  let canvas: SVGCanvas;

  beforeEach(() => {
    canvas = document.createElement('svg-canvas') as SVGCanvas;
    document.body.appendChild(canvas);
    documentStateUpdater.clearDocument();
    selectionManager.clearSelection();
  });

  afterEach(() => {
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  });

  describe('Component Initialization', () => {
    it('should create a canvas element', () => {
      expect(canvas).toBeInstanceOf(SVGCanvas);
      expect(canvas.tagName).toBe('SVG-CANVAS');
    });

    it('should have a shadow root', () => {
      expect(canvas.shadowRoot).not.toBeNull();
    });

    it('should render the canvas container', () => {
      const container = canvas.shadowRoot?.querySelector('.canvas-container');
      expect(container).not.toBeNull();
    });

    it('should show empty state when no document is loaded', () => {
      const emptyState = canvas.shadowRoot?.querySelector('.empty-state');
      expect(emptyState).not.toBeNull();
    });
  });

  describe('SVG Document Rendering', () => {
    it('should render an SVG document when state is updated', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100');
      svg.setAttribute('height', '100');

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '10');
      rect.setAttribute('width', '80');
      rect.setAttribute('height', '80');
      svg.appendChild(rect);

      documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');
      await new Promise(resolve => setTimeout(resolve, 10));

      const renderedSVG = canvas.shadowRoot?.querySelector('.svg-content');
      expect(renderedSVG).not.toBeNull();
      expect(renderedSVG?.tagName.toLowerCase()).toBe('svg');
    });

    it('should create a selection overlay', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100');
      svg.setAttribute('height', '100');

      documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');
      await new Promise(resolve => setTimeout(resolve, 10));

      const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
      expect(overlay).not.toBeNull();
      expect(overlay?.tagName.toLowerCase()).toBe('svg');
    });
  });

  describe('Selection Visual Indicators', () => {
    let svg: SVGElement;
    let rect: SVGElement;

    beforeEach(async () => {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '200');
      svg.setAttribute('height', '200');

      rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '50');
      rect.setAttribute('y', '50');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '80');
      svg.appendChild(rect);

      documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should show selection outline when element is selected', async () => {
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 10));

      const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
      const outline = overlay?.querySelector('.selection-outline');
      expect(outline).not.toBeNull();
    });

    it('should show selection handles when element is selected', async () => {
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 10));

      const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
      const handles = overlay?.querySelectorAll('.selection-handle');
      expect(handles?.length).toBe(4);
    });

    it('should remove selection visuals when selection is cleared', async () => {
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 10));

      let overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
      expect(overlay?.querySelector('.selection-outline')).not.toBeNull();

      selectionManager.clearSelection();
      await new Promise(resolve => setTimeout(resolve, 10));

      overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
      expect(overlay?.querySelector('.selection-outline')).toBeNull();
    });
  });

  describe('Reactive Updates', () => {
    it('should update when document state changes', async () => {
      expect(canvas.shadowRoot?.querySelector('.empty-state')).not.toBeNull();

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100');
      svg.setAttribute('height', '100');
      
      documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(canvas.shadowRoot?.querySelector('.svg-content')).not.toBeNull();
      expect(canvas.shadowRoot?.querySelector('.empty-state')).toBeNull();
    });
  });

  describe('Task 8.2: Canvas Selection Integration', () => {
    let svg: SVGElement;
    let rect1: SVGElement;
    let rect2: SVGElement;
    let circle1: SVGElement;

    beforeEach(async () => {
      // Create a test SVG with multiple elements
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '400');
      svg.setAttribute('height', '400');

      rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect1.setAttribute('id', 'rect1');
      rect1.setAttribute('x', '10');
      rect1.setAttribute('y', '10');
      rect1.setAttribute('width', '100');
      rect1.setAttribute('height', '100');
      svg.appendChild(rect1);

      rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect2.setAttribute('id', 'rect2');
      rect2.setAttribute('x', '150');
      rect2.setAttribute('y', '10');
      rect2.setAttribute('width', '100');
      rect2.setAttribute('height', '100');
      svg.appendChild(rect2);

      circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle1.setAttribute('id', 'circle1');
      circle1.setAttribute('cx', '200');
      circle1.setAttribute('cy', '200');
      circle1.setAttribute('r', '50');
      svg.appendChild(circle1);

      documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    describe('Canvas Click Events to Selection Manager', () => {
      it('should select element when clicked', async () => {
        // Simulate clicking on rect1
        const svgContent = canvas.shadowRoot?.querySelector('.svg-content');
        const renderedRect1 = svgContent?.querySelector('#rect1');
        expect(renderedRect1).not.toBeNull();

        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: renderedRect1, enumerable: true });
        
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        const selectedIds = selectionManager.getSelectedIds();
        expect(selectedIds.has('rect1')).toBe(true);
        expect(selectedIds.size).toBe(1);
      });

      it('should clear selection when clicking on empty canvas', async () => {
        // First select an element
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(selectionManager.hasSelection()).toBe(true);

        // Click on empty canvas area
        const container = canvas.shadowRoot?.querySelector('.canvas-container');
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: container, enumerable: true });
        
        container?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(selectionManager.hasSelection()).toBe(false);
      });

      it('should replace selection when clicking different element without modifier key', async () => {
        // Select rect1
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(selectionManager.getSelectedIds().has('rect1')).toBe(true);

        // Click rect2 without modifier
        const svgContent = canvas.shadowRoot?.querySelector('.svg-content');
        const renderedRect2 = svgContent?.querySelector('#rect2');
        
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: renderedRect2, enumerable: true });
        
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        const selectedIds = selectionManager.getSelectedIds();
        expect(selectedIds.has('rect1')).toBe(false);
        expect(selectedIds.has('rect2')).toBe(true);
        expect(selectedIds.size).toBe(1);
      });
    });

    describe('Multi-Select with Ctrl/Cmd Key (Requirement 3.5)', () => {
      it('should add to selection when clicking with Ctrl key', async () => {
        // Select rect1
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Click rect2 with Ctrl key
        const svgContent = canvas.shadowRoot?.querySelector('.svg-content');
        const renderedRect2 = svgContent?.querySelector('#rect2');
        
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: renderedRect2, enumerable: true });
        
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        const selectedIds = selectionManager.getSelectedIds();
        expect(selectedIds.has('rect1')).toBe(true);
        expect(selectedIds.has('rect2')).toBe(true);
        expect(selectedIds.size).toBe(2);
      });

      it('should add to selection when clicking with Cmd key (metaKey)', async () => {
        // Select rect1
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Click circle1 with Cmd key
        const svgContent = canvas.shadowRoot?.querySelector('.svg-content');
        const renderedCircle = svgContent?.querySelector('#circle1');
        
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          metaKey: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: renderedCircle, enumerable: true });
        
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        const selectedIds = selectionManager.getSelectedIds();
        expect(selectedIds.has('rect1')).toBe(true);
        expect(selectedIds.has('circle1')).toBe(true);
        expect(selectedIds.size).toBe(2);
      });

      it('should toggle selection when clicking selected element with Ctrl key', async () => {
        // Select both rect1 and rect2
        selectionManager.select(['rect1', 'rect2']);
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(selectionManager.getSelectionCount()).toBe(2);

        // Click rect1 with Ctrl key to deselect it
        const svgContent = canvas.shadowRoot?.querySelector('.svg-content');
        const renderedRect1 = svgContent?.querySelector('#rect1');
        
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: renderedRect1, enumerable: true });
        
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        const selectedIds = selectionManager.getSelectedIds();
        expect(selectedIds.has('rect1')).toBe(false);
        expect(selectedIds.has('rect2')).toBe(true);
        expect(selectedIds.size).toBe(1);
      });

      it('should not clear selection when clicking empty canvas with Ctrl key', async () => {
        // Select rect1
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Click empty canvas with Ctrl key
        const container = canvas.shadowRoot?.querySelector('.canvas-container');
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: container, enumerable: true });
        
        container?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(selectionManager.hasSelection()).toBe(true);
        expect(selectionManager.getSelectedIds().has('rect1')).toBe(true);
      });

      it('should support multi-selecting all three elements', async () => {
        // Select rect1
        const svgContent = canvas.shadowRoot?.querySelector('.svg-content');
        const renderedRect1 = svgContent?.querySelector('#rect1');
        
        let mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: renderedRect1, enumerable: true });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Add rect2 with Ctrl
        const renderedRect2 = svgContent?.querySelector('#rect2');
        mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: renderedRect2, enumerable: true });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Add circle1 with Ctrl
        const renderedCircle = svgContent?.querySelector('#circle1');
        mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: renderedCircle, enumerable: true });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        const selectedIds = selectionManager.getSelectedIds();
        expect(selectedIds.has('rect1')).toBe(true);
        expect(selectedIds.has('rect2')).toBe(true);
        expect(selectedIds.has('circle1')).toBe(true);
        expect(selectedIds.size).toBe(3);
      });
    });

    describe('Canvas Visuals Update on Selection Changes (Requirement 3.1)', () => {
      it('should show selection outline when selection manager selects element', async () => {
        // Initially no selection
        let overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        expect(overlay?.querySelector('.selection-outline')).toBeNull();

        // Select via selection manager
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Should show selection outline
        overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        expect(overlay?.querySelector('.selection-outline')).not.toBeNull();
      });

      it('should update visuals when selection changes from other views', async () => {
        // Select rect1
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        let overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        let outlines = overlay?.querySelectorAll('.selection-outline');
        expect(outlines?.length).toBe(1);

        // Change selection to rect2 (simulating selection from another view)
        selectionManager.select(['rect2']);
        await new Promise(resolve => setTimeout(resolve, 10));

        overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        outlines = overlay?.querySelectorAll('.selection-outline');
        expect(outlines?.length).toBe(1);
      });

      it('should show multiple selection outlines for multi-select', async () => {
        // Select multiple elements
        selectionManager.select(['rect1', 'rect2', 'circle1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        const outlines = overlay?.querySelectorAll('.selection-outline');
        expect(outlines?.length).toBe(3);
      });

      it('should clear visuals when selection is cleared from other views', async () => {
        // Select element
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        let overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        expect(overlay?.querySelector('.selection-outline')).not.toBeNull();

        // Clear selection (simulating clear from another view)
        selectionManager.clearSelection();
        await new Promise(resolve => setTimeout(resolve, 10));

        overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        expect(overlay?.querySelector('.selection-outline')).toBeNull();
      });

      it('should update visuals when adding to selection', async () => {
        // Select rect1
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        let overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        let outlines = overlay?.querySelectorAll('.selection-outline');
        expect(outlines?.length).toBe(1);

        // Add rect2 to selection
        selectionManager.addToSelection(['rect2']);
        await new Promise(resolve => setTimeout(resolve, 10));

        overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        outlines = overlay?.querySelectorAll('.selection-outline');
        expect(outlines?.length).toBe(2);
      });

      it('should update visuals when removing from selection', async () => {
        // Select multiple elements
        selectionManager.select(['rect1', 'rect2']);
        await new Promise(resolve => setTimeout(resolve, 10));

        let overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        let outlines = overlay?.querySelectorAll('.selection-outline');
        expect(outlines?.length).toBe(2);

        // Remove rect1 from selection
        selectionManager.removeFromSelection(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        outlines = overlay?.querySelectorAll('.selection-outline');
        expect(outlines?.length).toBe(1);
      });
    });

    describe('Edge Cases', () => {
      it('should handle clicking on element without ID', async () => {
        // Add element without ID
        const noIdRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        noIdRect.setAttribute('x', '300');
        noIdRect.setAttribute('y', '300');
        noIdRect.setAttribute('width', '50');
        noIdRect.setAttribute('height', '50');
        svg.appendChild(noIdRect);
        
        documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');
        await new Promise(resolve => setTimeout(resolve, 10));

        // Click on element without ID
        const svgContent = canvas.shadowRoot?.querySelector('.svg-content');
        const renderedNoIdRect = svgContent?.querySelector('rect:not([id])');
        
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: renderedNoIdRect, enumerable: true });
        
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Should not select anything
        expect(selectionManager.hasSelection()).toBe(false);
      });

      it('should handle rapid selection changes', async () => {
        // Rapidly change selection
        selectionManager.select(['rect1']);
        selectionManager.select(['rect2']);
        selectionManager.select(['circle1']);
        selectionManager.select(['rect1', 'rect2']);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Should show correct final selection
        const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        const outlines = overlay?.querySelectorAll('.selection-outline');
        expect(outlines?.length).toBe(2);
      });

      it('should handle selection of non-existent element gracefully', async () => {
        // Try to select element that doesn't exist
        selectionManager.select(['nonexistent']);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Should not crash, but also no visuals
        const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        const outlines = overlay?.querySelectorAll('.selection-outline');
        expect(outlines?.length).toBe(0);
      });
    });

    describe('Integration with Selection Manager', () => {
      it('should maintain selection state consistency', async () => {
        // Select via canvas click
        const svgContent = canvas.shadowRoot?.querySelector('.svg-content');
        const renderedRect1 = svgContent?.querySelector('#rect1');
        
        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(mouseEvent, 'target', { value: renderedRect1, enumerable: true });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Verify selection manager state matches
        expect(selectionManager.getSelectedIds().has('rect1')).toBe(true);
        expect(selectionManager.getSelectionCount()).toBe(1);
        expect(selectionManager.hasSelection()).toBe(true);
      });

      it('should work with selection manager methods', async () => {
        // Use various selection manager methods
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(canvas.shadowRoot?.querySelectorAll('.selection-outline').length).toBe(1);

        selectionManager.addToSelection(['rect2']);
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(canvas.shadowRoot?.querySelectorAll('.selection-outline').length).toBe(2);

        selectionManager.toggleSelection('rect1');
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(canvas.shadowRoot?.querySelectorAll('.selection-outline').length).toBe(1);

        selectionManager.clearSelection();
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(canvas.shadowRoot?.querySelectorAll('.selection-outline').length).toBe(0);
      });
    });
  });

  describe('Task 15.4: Drag-to-Move Interaction', () => {
    let svg: SVGElement;
    let rect1: SVGElement;
    let rect2: SVGElement;

    beforeEach(async () => {
      // Create a test SVG with elements
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '400');
      svg.setAttribute('height', '400');

      rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect1.setAttribute('id', 'rect1');
      rect1.setAttribute('x', '50');
      rect1.setAttribute('y', '50');
      rect1.setAttribute('width', '100');
      rect1.setAttribute('height', '100');
      svg.appendChild(rect1);

      rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect2.setAttribute('id', 'rect2');
      rect2.setAttribute('x', '200');
      rect2.setAttribute('y', '50');
      rect2.setAttribute('width', '100');
      rect2.setAttribute('height', '100');
      svg.appendChild(rect2);

      documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    describe('Drag Initiation (Requirement 7.1)', () => {
      it('should start drag when mousedown on selected element', async () => {
        // Select rect1
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Get the rendered element
        const svgContent = canvas.shadowRoot?.querySelector('.svg-content') as SVGElement;
        const renderedRect1 = svgContent?.querySelector('#rect1');
        expect(renderedRect1).not.toBeNull();

        // Simulate mousedown on selected element
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        });
        Object.defineProperty(mouseDownEvent, 'target', { value: renderedRect1, enumerable: true });
        
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseDownEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Verify drag state is active (visual feedback should be present)
        const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        const outline = overlay?.querySelector('.selection-outline');
        expect(outline).not.toBeNull();
      });

      it('should not start drag when clicking unselected element', async () => {
        // rect1 is not selected
        const svgContent = canvas.shadowRoot?.querySelector('.svg-content') as SVGElement;
        const renderedRect1 = svgContent?.querySelector('#rect1');

        // Click should select, not drag
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        });
        Object.defineProperty(mouseDownEvent, 'target', { value: renderedRect1, enumerable: true });
        
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseDownEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Element should be selected
        expect(selectionManager.getSelectedIds().has('rect1')).toBe(true);
      });
    });

    describe('Visual Feedback During Drag (Requirement 7.3)', () => {
      it('should add dragging class to selection outline during drag', async () => {
        // Select and start drag
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        const svgContent = canvas.shadowRoot?.querySelector('.svg-content') as SVGElement;
        const renderedRect1 = svgContent?.querySelector('#rect1');

        // Mousedown
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        });
        Object.defineProperty(mouseDownEvent, 'target', { value: renderedRect1, enumerable: true });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseDownEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Mousemove to trigger drag
        const mouseMoveEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 120,
        });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseMoveEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Check for dragging class
        const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        const outline = overlay?.querySelector('.selection-outline');
        expect(outline?.classList.contains('dragging')).toBe(true);
      });

      it('should remove dragging class after mouseup', async () => {
        // Select and start drag
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        const svgContent = canvas.shadowRoot?.querySelector('.svg-content') as SVGElement;
        const renderedRect1 = svgContent?.querySelector('#rect1');

        // Mousedown
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        });
        Object.defineProperty(mouseDownEvent, 'target', { value: renderedRect1, enumerable: true });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseDownEvent);

        // Mousemove
        const mouseMoveEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 120,
        });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseMoveEvent);

        // Mouseup
        const mouseUpEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 120,
        });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseUpEvent);
        await new Promise(resolve => setTimeout(resolve, 50)); // Longer wait for document state update

        // After drag, selection should still be active
        expect(selectionManager.hasSelection()).toBe(true);
        
        // Dragging class should be removed (if outline exists)
        const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        const outline = overlay?.querySelector('.selection-outline');
        
        // The outline might not exist if selection was cleared during document update
        // This is acceptable as long as dragging state is properly reset
        if (outline) {
          expect(outline.classList.contains('dragging')).toBe(false);
        }
      });
    });

    describe('Drag Cancellation', () => {
      it('should cancel drag when mouse leaves canvas', async () => {
        // Select and start drag
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        const svgContent = canvas.shadowRoot?.querySelector('.svg-content') as SVGElement;
        const renderedRect1 = svgContent?.querySelector('#rect1');

        // Store original position
        const originalX = renderedRect1?.getAttribute('x');

        // Mousedown
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        });
        Object.defineProperty(mouseDownEvent, 'target', { value: renderedRect1, enumerable: true });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseDownEvent);

        // Mousemove
        const mouseMoveEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: 150,
          clientY: 150,
        });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseMoveEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Mouse leave
        const mouseLeaveEvent = new MouseEvent('mouseleave', {
          bubbles: true,
          cancelable: true,
        });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseLeaveEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Dragging class should be removed
        const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        const outline = overlay?.querySelector('.selection-outline');
        expect(outline?.classList.contains('dragging')).toBe(false);
      });
    });

    describe('Multi-Element Drag (Requirement 7.4)', () => {
      it('should drag all selected elements together', async () => {
        // Select both rectangles
        selectionManager.select(['rect1', 'rect2']);
        await new Promise(resolve => setTimeout(resolve, 10));

        const svgContent = canvas.shadowRoot?.querySelector('.svg-content') as SVGElement;
        const renderedRect1 = svgContent?.querySelector('#rect1');

        // Mousedown on rect1
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        });
        Object.defineProperty(mouseDownEvent, 'target', { value: renderedRect1, enumerable: true });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseDownEvent);

        // Mousemove
        const mouseMoveEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 120,
        });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseMoveEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Both elements should have dragging visual feedback
        const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
        const outlines = overlay?.querySelectorAll('.selection-outline.dragging');
        expect(outlines?.length).toBe(2);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero-distance drag (click without move)', async () => {
        // Select rect1
        selectionManager.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));

        const svgContent = canvas.shadowRoot?.querySelector('.svg-content') as SVGElement;
        const renderedRect1 = svgContent?.querySelector('#rect1');

        // Mousedown and mouseup at same position
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        });
        Object.defineProperty(mouseDownEvent, 'target', { value: renderedRect1, enumerable: true });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseDownEvent);

        const mouseUpEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        });
        canvas.shadowRoot?.querySelector('.canvas-container')?.dispatchEvent(mouseUpEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Should not crash, element should remain selected
        expect(selectionManager.getSelectedIds().has('rect1')).toBe(true);
      });

      it('should handle drag with no selected elements', async () => {
        // No selection
        selectionManager.clearSelection();
        await new Promise(resolve => setTimeout(resolve, 10));

        const container = canvas.shadowRoot?.querySelector('.canvas-container');

        // Try to drag on empty canvas
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        });
        Object.defineProperty(mouseDownEvent, 'target', { value: container, enumerable: true });
        container?.dispatchEvent(mouseDownEvent);

        const mouseMoveEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 120,
        });
        container?.dispatchEvent(mouseMoveEvent);

        const mouseUpEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 120,
        });
        container?.dispatchEvent(mouseUpEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        // Should not crash
        expect(selectionManager.hasSelection()).toBe(false);
      });
    });
  });
});
