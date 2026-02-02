/**
 * Transform Engine Tests
 * 
 * Tests for the TransformEngine class that handles element manipulation.
 * 
 * Requirements: 7.1, 7.4, 8.1, 8.2, 8.4, 8.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransformEngine } from './transform-engine';
import { documentState } from './document-state';

describe('TransformEngine', () => {
  let engine: TransformEngine;
  let mockDocument: SVGSVGElement;
  
  beforeEach(() => {
    engine = new TransformEngine();
    
    // Create a mock SVG document
    mockDocument = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    documentState.svgDocument.set(mockDocument);
  });
  
  describe('move() - single element', () => {
    it('should move a rectangle by updating x and y attributes', () => {
      // Create a rectangle element
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      mockDocument.appendChild(rect);
      
      // Move the rectangle
      const operation = engine.move(['rect1'], 15, 25);
      
      // Check that position was updated
      expect(rect.getAttribute('x')).toBe('25');
      expect(rect.getAttribute('y')).toBe('45');
      
      // Check operation properties
      expect(operation.type).toBe('move');
      expect(operation.description).toBe('Move element rect1');
      expect(typeof operation.undo).toBe('function');
      expect(typeof operation.redo).toBe('function');
    });
    
    it('should move a circle by updating cx and cy attributes', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('id', 'circle1');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '60');
      circle.setAttribute('r', '30');
      mockDocument.appendChild(circle);
      
      engine.move(['circle1'], 10, 20);
      
      expect(circle.getAttribute('cx')).toBe('60');
      expect(circle.getAttribute('cy')).toBe('80');
    });
    
    it('should move an ellipse by updating cx and cy attributes', () => {
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('id', 'ellipse1');
      ellipse.setAttribute('cx', '100');
      ellipse.setAttribute('cy', '150');
      ellipse.setAttribute('rx', '40');
      ellipse.setAttribute('ry', '20');
      mockDocument.appendChild(ellipse);
      
      engine.move(['ellipse1'], -10, -5);
      
      expect(ellipse.getAttribute('cx')).toBe('90');
      expect(ellipse.getAttribute('cy')).toBe('145');
    });
    
    it('should move a line by updating x1, y1, x2, y2 attributes', () => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('id', 'line1');
      line.setAttribute('x1', '10');
      line.setAttribute('y1', '20');
      line.setAttribute('x2', '100');
      line.setAttribute('y2', '200');
      mockDocument.appendChild(line);
      
      engine.move(['line1'], 5, 10);
      
      expect(line.getAttribute('x1')).toBe('15');
      expect(line.getAttribute('y1')).toBe('30');
      expect(line.getAttribute('x2')).toBe('105');
      expect(line.getAttribute('y2')).toBe('210');
    });
    
    it('should move a text element by updating x and y attributes', () => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('id', 'text1');
      text.setAttribute('x', '50');
      text.setAttribute('y', '100');
      text.textContent = 'Hello';
      mockDocument.appendChild(text);
      
      engine.move(['text1'], 20, 30);
      
      expect(text.getAttribute('x')).toBe('70');
      expect(text.getAttribute('y')).toBe('130');
    });
    
    it('should move a path by adding a transform attribute', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', 'path1');
      path.setAttribute('d', 'M 10 10 L 50 50');
      mockDocument.appendChild(path);
      
      engine.move(['path1'], 15, 25);
      
      expect(path.getAttribute('transform')).toBe('translate(15, 25)');
    });
    
    it('should move a group by adding a transform attribute', () => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('id', 'group1');
      mockDocument.appendChild(group);
      
      engine.move(['group1'], 10, 20);
      
      expect(group.getAttribute('transform')).toBe('translate(10, 20)');
    });
    
    it('should update existing transform attribute on path', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', 'path1');
      path.setAttribute('d', 'M 10 10 L 50 50');
      path.setAttribute('transform', 'translate(5, 10)');
      mockDocument.appendChild(path);
      
      engine.move(['path1'], 15, 25);
      
      expect(path.getAttribute('transform')).toBe('translate(20, 35)');
    });
    
    it('should handle elements with default position values', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      // No x or y attributes set (defaults to 0)
      mockDocument.appendChild(rect);
      
      engine.move(['rect1'], 10, 20);
      
      expect(rect.getAttribute('x')).toBe('10');
      expect(rect.getAttribute('y')).toBe('20');
    });
    
    it('should handle negative delta values', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '100');
      rect.setAttribute('y', '100');
      mockDocument.appendChild(rect);
      
      engine.move(['rect1'], -50, -30);
      
      expect(rect.getAttribute('x')).toBe('50');
      expect(rect.getAttribute('y')).toBe('70');
    });
    
    it('should handle zero delta values', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '50');
      rect.setAttribute('y', '60');
      mockDocument.appendChild(rect);
      
      engine.move(['rect1'], 0, 0);
      
      expect(rect.getAttribute('x')).toBe('50');
      expect(rect.getAttribute('y')).toBe('60');
    });
  });
  
  describe('move() - multiple elements', () => {
    it('should move multiple elements by the same delta', () => {
      // Create multiple elements
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('id', 'circle1');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '60');
      mockDocument.appendChild(circle);
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('id', 'line1');
      line.setAttribute('x1', '100');
      line.setAttribute('y1', '100');
      line.setAttribute('x2', '200');
      line.setAttribute('y2', '200');
      mockDocument.appendChild(line);
      
      // Move all elements
      const operation = engine.move(['rect1', 'circle1', 'line1'], 15, 25);
      
      // Check that all elements were moved
      expect(rect.getAttribute('x')).toBe('25');
      expect(rect.getAttribute('y')).toBe('45');
      expect(circle.getAttribute('cx')).toBe('65');
      expect(circle.getAttribute('cy')).toBe('85');
      expect(line.getAttribute('x1')).toBe('115');
      expect(line.getAttribute('y1')).toBe('125');
      expect(line.getAttribute('x2')).toBe('215');
      expect(line.getAttribute('y2')).toBe('225');
      
      // Check operation description
      expect(operation.description).toBe('Move 3 elements');
    });
    
    it('should handle mixed element types in multi-select', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      mockDocument.appendChild(rect);
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', 'path1');
      path.setAttribute('d', 'M 0 0 L 10 10');
      mockDocument.appendChild(path);
      
      engine.move(['rect1', 'path1'], 10, 10);
      
      expect(rect.getAttribute('x')).toBe('10');
      expect(rect.getAttribute('y')).toBe('10');
      expect(path.getAttribute('transform')).toBe('translate(10, 10)');
    });
  });
  
  describe('move() - undo/redo', () => {
    it('should support undo for single element move', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      const operation = engine.move(['rect1'], 15, 25);
      
      // Element should be moved
      expect(rect.getAttribute('x')).toBe('25');
      expect(rect.getAttribute('y')).toBe('45');
      
      // Undo the move
      operation.undo();
      
      // Element should be back to original position
      expect(rect.getAttribute('x')).toBe('10');
      expect(rect.getAttribute('y')).toBe('20');
    });
    
    it('should support redo for single element move', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      const operation = engine.move(['rect1'], 15, 25);
      operation.undo();
      
      // Redo the move
      operation.redo();
      
      // Element should be moved again
      expect(rect.getAttribute('x')).toBe('25');
      expect(rect.getAttribute('y')).toBe('45');
    });
    
    it('should support undo for multiple element move', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('id', 'circle1');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '60');
      mockDocument.appendChild(circle);
      
      const operation = engine.move(['rect1', 'circle1'], 15, 25);
      operation.undo();
      
      // Both elements should be back to original positions
      expect(rect.getAttribute('x')).toBe('10');
      expect(rect.getAttribute('y')).toBe('20');
      expect(circle.getAttribute('cx')).toBe('50');
      expect(circle.getAttribute('cy')).toBe('60');
    });
    
    it('should restore transform attribute correctly on undo', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', 'path1');
      path.setAttribute('d', 'M 10 10 L 50 50');
      path.setAttribute('transform', 'rotate(45)');
      mockDocument.appendChild(path);
      
      const operation = engine.move(['path1'], 10, 20);
      
      // Transform should be updated
      expect(path.getAttribute('transform')).toBe('translate(10, 20) rotate(45)');
      
      operation.undo();
      
      // Transform should be restored
      expect(path.getAttribute('transform')).toBe('rotate(45)');
    });
    
    it('should remove transform attribute on undo if it did not exist originally', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', 'path1');
      path.setAttribute('d', 'M 10 10 L 50 50');
      mockDocument.appendChild(path);
      
      const operation = engine.move(['path1'], 10, 20);
      
      // Transform should be added
      expect(path.getAttribute('transform')).toBe('translate(10, 20)');
      
      operation.undo();
      
      // Transform should be removed
      expect(path.getAttribute('transform')).toBeNull();
    });
  });
  
  describe('move() - error handling', () => {
    it('should throw error when no document is loaded', () => {
      documentState.svgDocument.set(null);
      
      expect(() => {
        engine.move(['rect1'], 10, 20);
      }).toThrow('No document loaded');
    });
    
    it('should throw error when no element IDs are provided', () => {
      expect(() => {
        engine.move([], 10, 20);
      }).toThrow('No elements specified for move operation');
    });
    
    it('should throw error when no valid elements are found', () => {
      expect(() => {
        engine.move(['nonexistent'], 10, 20);
      }).toThrow('No valid elements found for move operation');
    });
    
    it('should warn and skip nonexistent elements in multi-select', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const operation = engine.move(['rect1', 'nonexistent'], 10, 20);
      
      // Should move the valid element
      expect(rect.getAttribute('x')).toBe('20');
      expect(rect.getAttribute('y')).toBe('40');
      
      // Should warn about the nonexistent element
      expect(consoleWarnSpy).toHaveBeenCalledWith('Element "nonexistent" not found');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('move() - edge cases', () => {
    it('should handle fractional delta values', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      engine.move(['rect1'], 10.5, 20.7);
      
      expect(rect.getAttribute('x')).toBe('20.5');
      expect(rect.getAttribute('y')).toBe('40.7');
    });
    
    it('should handle very large delta values', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      engine.move(['rect1'], 10000, 20000);
      
      expect(rect.getAttribute('x')).toBe('10010');
      expect(rect.getAttribute('y')).toBe('20020');
    });
    
    it('should handle elements with existing complex transforms', () => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('id', 'group1');
      group.setAttribute('transform', 'rotate(45) scale(2) translate(10, 20)');
      mockDocument.appendChild(group);
      
      engine.move(['group1'], 5, 10);
      
      // Should update the existing translate
      const transform = group.getAttribute('transform');
      expect(transform).toContain('translate(15, 30)');
      expect(transform).toContain('rotate(45)');
      expect(transform).toContain('scale(2)');
    });
  });
  
  describe('Operation metadata', () => {
    it('should include timestamp in operation', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      const beforeTime = Date.now();
      const operation = engine.move(['rect1'], 10, 20);
      const afterTime = Date.now();
      
      expect(operation.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(operation.timestamp).toBeLessThanOrEqual(afterTime);
    });
    
    it('should have correct operation type', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      const operation = engine.move(['rect1'], 10, 20);
      
      expect(operation.type).toBe('move');
    });
  });
  
  describe('delete() - single element', () => {
    it('should delete a single element from the document', () => {
      // Create a rectangle element
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      mockDocument.appendChild(rect);
      
      // Verify element exists
      expect(mockDocument.querySelector('[id="rect1"]')).toBe(rect);
      
      // Delete the rectangle
      const operation = engine.delete(['rect1']);

      // Check that element was removed (delete replaces document via setDocument)
      const doc = documentState.svgDocument.get();
      expect(doc?.querySelector('[id="rect1"]')).toBeNull();
      
      // Check operation properties
      expect(operation.type).toBe('delete');
      expect(operation.description).toBe('Delete element rect1');
      expect(typeof operation.undo).toBe('function');
      expect(typeof operation.redo).toBe('function');
    });
    
    it('should delete a circle element', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('id', 'circle1');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '60');
      circle.setAttribute('r', '30');
      mockDocument.appendChild(circle);
      
      engine.delete(['circle1']);
      
      expect(mockDocument.querySelector('[id="circle1"]')).toBeNull();
    });
    
    it('should delete a path element', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', 'path1');
      path.setAttribute('d', 'M 10 10 L 50 50');
      mockDocument.appendChild(path);
      
      engine.delete(['path1']);
      
      expect(mockDocument.querySelector('[id="path1"]')).toBeNull();
    });
    
    it('should delete a group element', () => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('id', 'group1');
      mockDocument.appendChild(group);
      
      engine.delete(['group1']);
      
      expect(mockDocument.querySelector('[id="group1"]')).toBeNull();
    });
    
    it('should delete a text element', () => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('id', 'text1');
      text.setAttribute('x', '50');
      text.setAttribute('y', '100');
      text.textContent = 'Hello';
      mockDocument.appendChild(text);
      
      engine.delete(['text1']);
      
      expect(mockDocument.querySelector('[id="text1"]')).toBeNull();
    });
  });
  
  describe('delete() - multiple elements', () => {
    it('should delete multiple elements simultaneously', () => {
      // Create multiple elements
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      mockDocument.appendChild(rect);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('id', 'circle1');
      mockDocument.appendChild(circle);
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('id', 'line1');
      mockDocument.appendChild(line);
      
      // Verify all elements exist
      expect(mockDocument.querySelector('[id="rect1"]')).toBe(rect);
      expect(mockDocument.querySelector('[id="circle1"]')).toBe(circle);
      expect(mockDocument.querySelector('[id="line1"]')).toBe(line);
      
      // Delete all elements
      const operation = engine.delete(['rect1', 'circle1', 'line1']);
      
      // Check that all elements were removed
      expect(mockDocument.querySelector('[id="rect1"]')).toBeNull();
      expect(mockDocument.querySelector('[id="circle1"]')).toBeNull();
      expect(mockDocument.querySelector('[id="line1"]')).toBeNull();
      
      // Check operation description
      expect(operation.description).toBe('Delete 3 elements');
    });
    
    it('should delete elements with different types', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      mockDocument.appendChild(rect);
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', 'path1');
      mockDocument.appendChild(path);
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('id', 'text1');
      mockDocument.appendChild(text);
      
      engine.delete(['rect1', 'path1', 'text1']);
      
      expect(mockDocument.querySelector('[id="rect1"]')).toBeNull();
      expect(mockDocument.querySelector('[id="path1"]')).toBeNull();
      expect(mockDocument.querySelector('[id="text1"]')).toBeNull();
    });
  });
  
  describe('delete() - undo/redo', () => {
    it('should support undo for single element deletion', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      mockDocument.appendChild(rect);
      
      const operation =       engine.delete(['rect1']);

      // Element should be deleted
      expect(documentState.svgDocument.get()?.querySelector('[id="rect1"]')).toBeNull();
      
      // Undo the deletion
      operation.undo();
      
      // Element should be restored
      const restoredRect = mockDocument.querySelector('[id="rect1"]') as SVGRectElement;
      expect(restoredRect).not.toBeNull();
      expect(restoredRect.getAttribute('x')).toBe('10');
      expect(restoredRect.getAttribute('y')).toBe('20');
      expect(restoredRect.getAttribute('width')).toBe('100');
      expect(restoredRect.getAttribute('height')).toBe('50');
    });
    
    it('should support redo for single element deletion', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      mockDocument.appendChild(rect);
      
      const operation = engine.delete(['rect1']);
      operation.undo();
      
      // Element should be restored
      expect(mockDocument.querySelector('[id="rect1"]')).not.toBeNull();
      
      // Redo the deletion
      operation.redo();
      
      // Element should be deleted again
      expect(mockDocument.querySelector('[id="rect1"]')).toBeNull();
    });
    
    it('should support undo for multiple element deletion', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('id', 'circle1');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '60');
      mockDocument.appendChild(circle);
      
      const operation = engine.delete(['rect1', 'circle1']);
      operation.undo();
      
      // Both elements should be restored
      const restoredRect = mockDocument.querySelector('[id="rect1"]') as SVGRectElement;
      const restoredCircle = mockDocument.querySelector('[id="circle1"]') as SVGCircleElement;
      
      expect(restoredRect).not.toBeNull();
      expect(restoredRect.getAttribute('x')).toBe('10');
      expect(restoredRect.getAttribute('y')).toBe('20');
      
      expect(restoredCircle).not.toBeNull();
      expect(restoredCircle.getAttribute('cx')).toBe('50');
      expect(restoredCircle.getAttribute('cy')).toBe('60');
    });
    
    it('should restore element at correct position in DOM', () => {
      // Create elements in specific order
      const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect1.setAttribute('id', 'rect1');
      mockDocument.appendChild(rect1);
      
      const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect2.setAttribute('id', 'rect2');
      mockDocument.appendChild(rect2);
      
      const rect3 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect3.setAttribute('id', 'rect3');
      mockDocument.appendChild(rect3);
      
      // Delete middle element
      const operation = engine.delete(['rect2']);
      
      // Undo deletion
      operation.undo();
      
      // Check that element is restored in correct position
      const children = Array.from(mockDocument.children);
      expect(children[0].getAttribute('id')).toBe('rect1');
      expect(children[1].getAttribute('id')).toBe('rect2');
      expect(children[2].getAttribute('id')).toBe('rect3');
    });
    
    it('should restore element as last child if it was last', () => {
      const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect1.setAttribute('id', 'rect1');
      mockDocument.appendChild(rect1);
      
      const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect2.setAttribute('id', 'rect2');
      mockDocument.appendChild(rect2);
      
      // Delete last element
      const operation = engine.delete(['rect2']);
      
      // Undo deletion
      operation.undo();
      
      // Check that element is restored as last child
      const children = Array.from(mockDocument.children);
      expect(children.length).toBe(2);
      expect(children[1].getAttribute('id')).toBe('rect2');
    });
    
    it('should preserve all attributes on undo', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      rect.setAttribute('fill', 'red');
      rect.setAttribute('stroke', 'blue');
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('opacity', '0.5');
      rect.setAttribute('transform', 'rotate(45)');
      mockDocument.appendChild(rect);
      
      const operation = engine.delete(['rect1']);
      operation.undo();
      
      const restoredRect = mockDocument.querySelector('[id="rect1"]') as SVGRectElement;
      expect(restoredRect.getAttribute('x')).toBe('10');
      expect(restoredRect.getAttribute('y')).toBe('20');
      expect(restoredRect.getAttribute('width')).toBe('100');
      expect(restoredRect.getAttribute('height')).toBe('50');
      expect(restoredRect.getAttribute('fill')).toBe('red');
      expect(restoredRect.getAttribute('stroke')).toBe('blue');
      expect(restoredRect.getAttribute('stroke-width')).toBe('2');
      expect(restoredRect.getAttribute('opacity')).toBe('0.5');
      expect(restoredRect.getAttribute('transform')).toBe('rotate(45)');
    });
    
    it('should preserve child elements on undo', () => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('id', 'group1');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      group.appendChild(rect);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('id', 'circle1');
      group.appendChild(circle);
      
      mockDocument.appendChild(group);
      
      const operation = engine.delete(['group1']);
      operation.undo();
      
      const restoredGroup = mockDocument.querySelector('[id="group1"]') as SVGGElement;
      expect(restoredGroup).not.toBeNull();
      expect(restoredGroup.children.length).toBe(2);
      expect(restoredGroup.children[0].getAttribute('id')).toBe('rect1');
      expect(restoredGroup.children[1].getAttribute('id')).toBe('circle1');
    });
  });
  
  describe('delete() - error handling', () => {
    it('should throw error when no document is loaded', () => {
      documentState.svgDocument.set(null);
      
      expect(() => {
        engine.delete(['rect1']);
      }).toThrow('No document loaded');
    });
    
    it('should throw error when no element IDs are provided', () => {
      expect(() => {
        engine.delete([]);
      }).toThrow('No elements specified for delete operation');
    });
    
    it('should throw error when no valid elements are found', () => {
      expect(() => {
        engine.delete(['nonexistent']);
      }).toThrow('No valid elements found for delete operation');
    });
    
    it('should warn and skip nonexistent elements in multi-select', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      mockDocument.appendChild(rect);
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const operation = engine.delete(['rect1', 'nonexistent']);
      
      // Should delete the valid element
      expect(mockDocument.querySelector('[id="rect1"]')).toBeNull();
      
      // Should warn about the nonexistent element
      expect(consoleWarnSpy).toHaveBeenCalledWith('Element with id "nonexistent" not found');
      
      consoleWarnSpy.mockRestore();
    });
  });
  
  describe('delete() - edge cases', () => {
    it('should handle deleting nested elements', () => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('id', 'group1');
      mockDocument.appendChild(group);
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      group.appendChild(rect);
      
      // Delete the nested rect
      engine.delete(['rect1']);
      
      // Group should still exist
      expect(mockDocument.querySelector('[id="group1"]')).not.toBeNull();
      // Rect should be deleted
      expect(mockDocument.querySelector('[id="rect1"]')).toBeNull();
    });
    
    it('should handle deleting parent and child separately', () => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('id', 'group1');
      mockDocument.appendChild(group);
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      group.appendChild(rect);
      
      // Delete both parent and child
      engine.delete(['group1', 'rect1']);
      
      // Both should be deleted
      expect(mockDocument.querySelector('[id="group1"]')).toBeNull();
      expect(mockDocument.querySelector('[id="rect1"]')).toBeNull();
    });
    
    it('should include timestamp in delete operation', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      mockDocument.appendChild(rect);
      
      const beforeTime = Date.now();
      const operation = engine.delete(['rect1']);
      const afterTime = Date.now();
      
      expect(operation.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(operation.timestamp).toBeLessThanOrEqual(afterTime);
    });
    
    it('should have correct operation type', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      mockDocument.appendChild(rect);
      
      const operation = engine.delete(['rect1']);
      
      expect(operation.type).toBe('delete');
    });
  });
});
