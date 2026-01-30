/**
 * Transform Worker Tests
 * 
 * Tests for the transform worker that handles large document transformations.
 * 
 * Requirements: 14.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { documentState } from '../state/document-state';
import { TransformEngine } from '../state/transform-engine';

describe('Transform Worker Integration', () => {
  let engine: TransformEngine;
  let mockDocument: SVGSVGElement;
  
  beforeEach(() => {
    engine = new TransformEngine();
    
    // Create a mock SVG document
    mockDocument = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    documentState.svgDocument.set(mockDocument);
    documentState.documentTree.set([]);
  });
  
  describe('Worker threshold detection', () => {
    it('should use main thread for small documents (< 5000 nodes)', () => {
      // Create a small document with < 5000 nodes
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      // Set document tree with small node count
      documentState.documentTree.set([
        {
          id: 'svg-node-1',
          type: 'svg',
          tagName: 'svg',
          attributes: new Map(),
          children: [
            {
              id: 'rect1',
              type: 'rect',
              tagName: 'rect',
              attributes: new Map([['x', '10'], ['y', '20']]),
              children: [],
              element: rect,
            }
          ],
          element: mockDocument,
        }
      ]);
      
      // Move should work synchronously for small documents
      const operation = engine.move(['rect1'], 15, 25);
      
      // Check that position was updated immediately
      expect(rect.getAttribute('x')).toBe('25');
      expect(rect.getAttribute('y')).toBe('45');
      expect(operation.type).toBe('move');
    });
    
    it('should handle documents at the threshold boundary', async () => {
      // Create a document with exactly 5001 nodes (just over threshold)
      const nodes: any[] = [];
      for (let i = 0; i < 5001; i++) {
        nodes.push({
          id: `node-${i}`,
          type: 'rect',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: null,
        });
      }
      
      documentState.documentTree.set([{
        id: 'svg-root',
        type: 'svg',
        tagName: 'svg',
        attributes: new Map(),
        children: nodes,
        element: mockDocument,
      }]);
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      // Should use worker for > 5000 nodes (returns immediately, processes async)
      const operation = engine.move(['rect1'], 10, 20);
      
      expect(operation.type).toBe('move');
      // Worker processes asynchronously, so immediate check won't show changes
      // Just verify operation was created
      expect(operation.description).toContain('Move element rect1');
      
      // Wait for worker to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    });
  });
  
  describe('Worker-based operations', () => {
    it('should handle move operation for large documents', async () => {
      // Create a large document tree (> 5000 nodes)
      const nodes: any[] = [];
      for (let i = 0; i < 5001; i++) {
        nodes.push({
          id: `node-${i}`,
          type: 'rect',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: null,
        });
      }
      
      documentState.documentTree.set([{
        id: 'svg-root',
        type: 'svg',
        tagName: 'svg',
        attributes: new Map(),
        children: nodes,
        element: mockDocument,
      }]);
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      // Move operation should return immediately (async processing)
      const operation = engine.move(['rect1'], 15, 25);
      
      expect(operation.type).toBe('move');
      expect(operation.description).toContain('Move element rect1');
      
      // Wait for worker to complete (give it some time)
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    it('should handle delete operation for large documents', async () => {
      // Create a large document tree (> 5000 nodes)
      const nodes: any[] = [];
      for (let i = 0; i < 5001; i++) {
        nodes.push({
          id: `node-${i}`,
          type: 'rect',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: null,
        });
      }
      
      documentState.documentTree.set([{
        id: 'svg-root',
        type: 'svg',
        tagName: 'svg',
        attributes: new Map(),
        children: nodes,
        element: mockDocument,
      }]);
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      mockDocument.appendChild(rect);
      
      // Delete operation should return immediately (async processing)
      const operation = engine.delete(['rect1']);
      
      expect(operation.type).toBe('delete');
      expect(operation.description).toContain('Delete element rect1');
      
      // Wait for worker to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    });
  });
  
  describe('Error handling', () => {
    it('should handle worker unavailability gracefully', () => {
      // This test verifies that the code doesn't crash when Worker is unavailable
      // In test environment, Worker might not be available
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      mockDocument.appendChild(rect);
      
      documentState.documentTree.set([{
        id: 'svg-root',
        type: 'svg',
        tagName: 'svg',
        attributes: new Map(),
        children: [],
        element: mockDocument,
      }]);
      
      // Should not throw even if worker is unavailable
      expect(() => {
        engine.move(['rect1'], 10, 20);
      }).not.toThrow();
    });
  });
});
