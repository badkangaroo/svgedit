/**
 * Unit tests for Primitive Creation Tools
 * 
 * Tests primitive creation functionality including:
 * - Default attributes for each primitive type
 * - Mouse event handling for creation
 * - Document state updates
 * 
 * Requirements: 6.1, 6.2, 6.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Import the instance directly to avoid circular dependency issues
import { primitiveTools } from './primitive-tools';

describe('PrimitiveTools', () => {
  let svgElement: SVGElement;

  beforeEach(() => {
    // Create a test SVG element
    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('width', '800');
    svgElement.setAttribute('height', '600');
    document.body.appendChild(svgElement);
  });

  afterEach(() => {
    // Clean up
    if (svgElement && svgElement.parentNode) {
      document.body.removeChild(svgElement);
    }
  });

  describe('Rectangle Creation', () => {
    it('should create a rectangle with default attributes', () => {
      // Create a mock mouse event
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 200,
        clientY: 180,
      });

      // Simulate rectangle creation
      primitiveTools.handleMouseDown(mouseDownEvent, 'rectangle', svgElement);
      primitiveTools.handleMouseUp(mouseUpEvent, svgElement);

      // Check that a rectangle was created
      const rect = svgElement.querySelector('rect');
      expect(rect).toBeTruthy();
      
      // Check default attributes
      expect(rect?.getAttribute('fill')).toBe('#3b82f6');
      expect(rect?.getAttribute('stroke')).toBe('#1e40af');
      expect(rect?.getAttribute('stroke-width')).toBe('2');
    });

    it('should use default size for small drags', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 102,
        clientY: 102,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'rectangle', svgElement);
      primitiveTools.handleMouseUp(mouseUpEvent, svgElement);

      const rect = svgElement.querySelector('rect');
      expect(rect?.getAttribute('width')).toBe('100');
      expect(rect?.getAttribute('height')).toBe('80');
    });
  });

  describe('Circle Creation', () => {
    it('should create a circle with default attributes', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 200,
        clientY: 200,
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 250,
        clientY: 250,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'circle', svgElement);
      primitiveTools.handleMouseUp(mouseUpEvent, svgElement);

      const circle = svgElement.querySelector('circle');
      expect(circle).toBeTruthy();
      expect(circle?.getAttribute('fill')).toBe('#10b981');
      expect(circle?.getAttribute('stroke')).toBe('#047857');
      expect(circle?.getAttribute('stroke-width')).toBe('2');
    });

    it('should use default radius for small drags', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 200,
        clientY: 200,
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 202,
        clientY: 202,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'circle', svgElement);
      primitiveTools.handleMouseUp(mouseUpEvent, svgElement);

      const circle = svgElement.querySelector('circle');
      expect(circle?.getAttribute('r')).toBe('50');
    });
  });

  describe('Ellipse Creation', () => {
    it('should create an ellipse with default attributes', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 300,
        clientY: 300,
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 400,
        clientY: 350,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'ellipse', svgElement);
      primitiveTools.handleMouseUp(mouseUpEvent, svgElement);

      const ellipse = svgElement.querySelector('ellipse');
      expect(ellipse).toBeTruthy();
      expect(ellipse?.getAttribute('fill')).toBe('#8b5cf6');
      expect(ellipse?.getAttribute('stroke')).toBe('#6d28d9');
      expect(ellipse?.getAttribute('stroke-width')).toBe('2');
    });
  });

  describe('Line Creation', () => {
    it('should create a line with default attributes', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 300,
        clientY: 200,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'line', svgElement);
      primitiveTools.handleMouseUp(mouseUpEvent, svgElement);

      const line = svgElement.querySelector('line');
      expect(line).toBeTruthy();
      expect(line?.getAttribute('stroke')).toBe('#ef4444');
      expect(line?.getAttribute('stroke-width')).toBe('3');
      expect(line?.getAttribute('stroke-linecap')).toBe('round');
    });

    it('should use default length for small drags', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 102,
        clientY: 102,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'line', svgElement);
      primitiveTools.handleMouseUp(mouseUpEvent, svgElement);

      const line = svgElement.querySelector('line');
      expect(line?.getAttribute('x1')).toBe('100');
      expect(line?.getAttribute('x2')).toBe('200'); // Default 100px length
    });
  });

  describe('Path Creation', () => {
    it('should create a path with default attributes', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 300,
        clientY: 200,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'path', svgElement);
      primitiveTools.handleMouseUp(mouseUpEvent, svgElement);

      const path = svgElement.querySelector('path');
      expect(path).toBeTruthy();
      expect(path?.getAttribute('fill')).toBe('none');
      expect(path?.getAttribute('stroke')).toBe('#f59e0b');
      expect(path?.getAttribute('stroke-width')).toBe('3');
      expect(path?.getAttribute('d')).toContain('M');
      expect(path?.getAttribute('d')).toContain('Q');
    });
  });

  describe('Text Creation', () => {
    it('should create text with default attributes on click', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 150,
        clientY: 150,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'text', svgElement);

      const text = svgElement.querySelector('text');
      expect(text).toBeTruthy();
      expect(text?.getAttribute('fill')).toBe('#1f2937');
      expect(text?.getAttribute('font-size')).toBe('24');
      expect(text?.getAttribute('font-family')).toBe('Arial, sans-serif');
      expect(text?.textContent).toBe('Text');
    });

    it('should not require mouse up for text creation', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 150,
        clientY: 150,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'text', svgElement);
      
      // Text should be created immediately
      expect(primitiveTools.isCreating()).toBe(false);
      expect(svgElement.querySelector('text')).toBeTruthy();
    });
  });

  describe('Group Creation', () => {
    it('should create a group on click', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 200,
        clientY: 200,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'group', svgElement);

      const group = svgElement.querySelector('g');
      expect(group).toBeTruthy();
      expect(group?.getAttribute('transform')).toContain('translate');
    });

    it('should not require mouse up for group creation', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 200,
        clientY: 200,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'group', svgElement);
      
      // Group should be created immediately
      expect(primitiveTools.isCreating()).toBe(false);
      expect(svgElement.querySelector('g')).toBeTruthy();
    });
  });

  describe('Select Tool', () => {
    it('should not create primitives when select tool is active', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 200,
        clientY: 200,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'select', svgElement);
      primitiveTools.handleMouseUp(mouseUpEvent, svgElement);

      // No elements should be created
      expect(svgElement.children.length).toBe(0);
    });
  });

  describe('Mouse Interaction', () => {
    it('should track creation state during drag', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'rectangle', svgElement);
      
      expect(primitiveTools.isCreating()).toBe(true);
    });

    it('should reset creation state after mouse up', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 200,
        clientY: 200,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'rectangle', svgElement);
      primitiveTools.handleMouseUp(mouseUpEvent, svgElement);
      
      expect(primitiveTools.isCreating()).toBe(false);
    });
  });

  describe('Document State Integration', () => {
    it('should create elements in the SVG', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 200,
        clientY: 200,
      });

      primitiveTools.handleMouseDown(mouseDownEvent, 'rectangle', svgElement);
      primitiveTools.handleMouseUp(mouseUpEvent, svgElement);

      // Element should be created in the SVG
      expect(svgElement.children.length).toBeGreaterThan(0);
    });
  });
});
