/**
 * Unit tests for Primitive Creation Tools (Simplified)
 * 
 * Tests primitive creation functionality including:
 * - Default attributes for each primitive type
 * - Element creation with correct tag names
 * 
 * Requirements: 6.1, 6.2, 6.4
 */

import { describe, it, expect } from 'vitest';
import { createPrimitiveElement, getElementTagName, DEFAULT_ATTRIBUTES } from './primitive-tools-simple';

describe('Primitive Tools (Simplified)', () => {
  describe('getElementTagName', () => {
    it('should return correct tag names for each tool', () => {
      expect(getElementTagName('rectangle')).toBe('rect');
      expect(getElementTagName('circle')).toBe('circle');
      expect(getElementTagName('ellipse')).toBe('ellipse');
      expect(getElementTagName('line')).toBe('line');
      expect(getElementTagName('path')).toBe('path');
      expect(getElementTagName('text')).toBe('text');
      expect(getElementTagName('group')).toBe('g');
    });
  });

  describe('Rectangle Creation', () => {
    it('should create a rectangle with default attributes', () => {
      const rect = createPrimitiveElement('rectangle', 100, 100, 200, 180);
      
      expect(rect.tagName.toLowerCase()).toBe('rect');
      expect(rect.getAttribute('fill')).toBe(DEFAULT_ATTRIBUTES.rectangle.fill);
      expect(rect.getAttribute('stroke')).toBe(DEFAULT_ATTRIBUTES.rectangle.stroke);
      expect(rect.getAttribute('stroke-width')).toBe(DEFAULT_ATTRIBUTES.rectangle.strokeWidth.toString());
      expect(rect.getAttribute('width')).toBe('100');
      expect(rect.getAttribute('height')).toBe('80');
    });

    it('should use default size for small drags', () => {
      const rect = createPrimitiveElement('rectangle', 100, 100, 102, 102);
      
      expect(rect.getAttribute('width')).toBe(DEFAULT_ATTRIBUTES.rectangle.width.toString());
      expect(rect.getAttribute('height')).toBe(DEFAULT_ATTRIBUTES.rectangle.height.toString());
    });
  });

  describe('Circle Creation', () => {
    it('should create a circle with default attributes', () => {
      const circle = createPrimitiveElement('circle', 200, 200, 250, 250);
      
      expect(circle.tagName.toLowerCase()).toBe('circle');
      expect(circle.getAttribute('fill')).toBe(DEFAULT_ATTRIBUTES.circle.fill);
      expect(circle.getAttribute('stroke')).toBe(DEFAULT_ATTRIBUTES.circle.stroke);
      expect(circle.getAttribute('stroke-width')).toBe(DEFAULT_ATTRIBUTES.circle.strokeWidth.toString());
      expect(circle.getAttribute('cx')).toBe('200');
      expect(circle.getAttribute('cy')).toBe('200');
    });

    it('should use default radius for small drags', () => {
      const circle = createPrimitiveElement('circle', 200, 200, 202, 202);
      
      expect(circle.getAttribute('r')).toBe(DEFAULT_ATTRIBUTES.circle.r.toString());
    });
  });

  describe('Ellipse Creation', () => {
    it('should create an ellipse with default attributes', () => {
      const ellipse = createPrimitiveElement('ellipse', 300, 300, 400, 350);
      
      expect(ellipse.tagName.toLowerCase()).toBe('ellipse');
      expect(ellipse.getAttribute('fill')).toBe(DEFAULT_ATTRIBUTES.ellipse.fill);
      expect(ellipse.getAttribute('stroke')).toBe(DEFAULT_ATTRIBUTES.ellipse.stroke);
      expect(ellipse.getAttribute('stroke-width')).toBe(DEFAULT_ATTRIBUTES.ellipse.strokeWidth.toString());
    });
  });

  describe('Line Creation', () => {
    it('should create a line with default attributes', () => {
      const line = createPrimitiveElement('line', 100, 100, 300, 200);
      
      expect(line.tagName.toLowerCase()).toBe('line');
      expect(line.getAttribute('stroke')).toBe(DEFAULT_ATTRIBUTES.line.stroke);
      expect(line.getAttribute('stroke-width')).toBe(DEFAULT_ATTRIBUTES.line.strokeWidth.toString());
      expect(line.getAttribute('stroke-linecap')).toBe(DEFAULT_ATTRIBUTES.line.strokeLinecap);
      expect(line.getAttribute('x1')).toBe('100');
      expect(line.getAttribute('y1')).toBe('100');
      expect(line.getAttribute('x2')).toBe('300');
      expect(line.getAttribute('y2')).toBe('200');
    });

    it('should use default length for small drags', () => {
      const line = createPrimitiveElement('line', 100, 100, 102, 102);
      
      expect(line.getAttribute('x1')).toBe('100');
      expect(line.getAttribute('x2')).toBe('200'); // Default 100px length
    });
  });

  describe('Path Creation', () => {
    it('should create a path with default attributes', () => {
      const path = createPrimitiveElement('path', 100, 100, 300, 200);
      
      expect(path.tagName.toLowerCase()).toBe('path');
      expect(path.getAttribute('fill')).toBe(DEFAULT_ATTRIBUTES.path.fill);
      expect(path.getAttribute('stroke')).toBe(DEFAULT_ATTRIBUTES.path.stroke);
      expect(path.getAttribute('stroke-width')).toBe(DEFAULT_ATTRIBUTES.path.strokeWidth.toString());
      expect(path.getAttribute('d')).toContain('M');
      expect(path.getAttribute('d')).toContain('Q');
    });
  });

  describe('Text Creation', () => {
    it('should create text with default attributes', () => {
      const text = createPrimitiveElement('text', 150, 150, 150, 150);
      
      expect(text.tagName.toLowerCase()).toBe('text');
      expect(text.getAttribute('fill')).toBe(DEFAULT_ATTRIBUTES.text.fill);
      expect(text.getAttribute('font-size')).toBe(DEFAULT_ATTRIBUTES.text.fontSize.toString());
      expect(text.getAttribute('font-family')).toBe(DEFAULT_ATTRIBUTES.text.fontFamily);
      expect(text.textContent).toBe(DEFAULT_ATTRIBUTES.text.textContent);
    });
  });

  describe('Group Creation', () => {
    it('should create a group with transform', () => {
      const group = createPrimitiveElement('group', 200, 200, 200, 200);
      
      expect(group.tagName.toLowerCase()).toBe('g');
      expect(group.getAttribute('transform')).toContain('translate');
    });
  });
});
