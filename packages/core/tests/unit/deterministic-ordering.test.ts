/**
 * Unit tests for deterministic node ordering
 * 
 * Validates Requirement 1.6: Parser SHALL maintain deterministic node ordering based on document order
 */

import { describe, it, expect } from 'vitest';
import { Parser } from '../../src/document/parser.js';
import type { SVGNode } from '../../src/types/node.js';

describe('Deterministic Node Ordering', () => {
  describe('Consistent ordering across multiple parses', () => {
    it('should produce identical node ordering when parsing the same document twice', () => {
      const parser = new Parser();
      const svg = '<svg><rect /><circle /><path /></svg>';
      
      const result1 = parser.parse(svg);
      const result2 = parser.parse(svg);
      
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      
      if (result1.ok && result2.ok) {
        // Check that children are in the same order
        expect(result1.value.root.children.length).toBe(result2.value.root.children.length);
        
        for (let i = 0; i < result1.value.root.children.length; i++) {
          expect(result1.value.root.children[i].type).toBe(result2.value.root.children[i].type);
        }
      }
    });
    
    it('should maintain consistent ordering for deeply nested structures', () => {
      const parser = new Parser();
      const svg = `
        <svg>
          <g>
            <rect />
            <circle />
          </g>
          <g>
            <path />
            <ellipse />
          </g>
        </svg>
      `;
      
      const result1 = parser.parse(svg);
      const result2 = parser.parse(svg);
      
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      
      if (result1.ok && result2.ok) {
        // Helper to collect all node types in document order
        const collectTypes = (node: SVGNode): string[] => {
          const types = [node.type];
          node.children.forEach(child => {
            types.push(...collectTypes(child));
          });
          return types;
        };
        
        const types1 = collectTypes(result1.value.root);
        const types2 = collectTypes(result2.value.root);
        
        expect(types1).toEqual(types2);
      }
    });
    
    it('should maintain consistent ordering with complex attributes', () => {
      const parser = new Parser();
      const svg = `
        <svg width="100" height="100">
          <rect x="10" y="20" width="30" height="40" fill="red" />
          <circle cx="50" cy="60" r="25" stroke="blue" />
          <path d="M 0 0 L 10 10" stroke-width="2" />
        </svg>
      `;
      
      const result1 = parser.parse(svg);
      const result2 = parser.parse(svg);
      
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      
      if (result1.ok && result2.ok) {
        // Verify children order
        for (let i = 0; i < result1.value.root.children.length; i++) {
          const child1 = result1.value.root.children[i];
          const child2 = result2.value.root.children[i];
          
          expect(child1.type).toBe(child2.type);
          
          // Verify attributes are the same (order doesn't matter for Map)
          expect(child1.attributes.size).toBe(child2.attributes.size);
          child1.attributes.forEach((value, key) => {
            expect(child2.attributes.get(key)).toBe(value);
          });
        }
      }
    });
  });
  
  describe('Document order preservation', () => {
    it('should preserve the order of sibling elements', () => {
      const parser = new Parser();
      const svg = '<svg><rect /><circle /><ellipse /><path /><line /></svg>';
      
      const result = parser.parse(svg);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const types = result.value.root.children.map(child => child.type);
        expect(types).toEqual(['rect', 'circle', 'ellipse', 'path', 'line']);
      }
    });
    
    it('should preserve order in nested structures', () => {
      const parser = new Parser();
      const svg = `
        <svg>
          <g id="first">
            <rect />
            <circle />
          </g>
          <g id="second">
            <path />
          </g>
          <g id="third">
            <ellipse />
            <line />
          </g>
        </svg>
      `;
      
      const result = parser.parse(svg);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Check top-level order
        expect(result.value.root.children.length).toBe(3);
        expect(result.value.root.children[0].attributes.get('id')).toBe('first');
        expect(result.value.root.children[1].attributes.get('id')).toBe('second');
        expect(result.value.root.children[2].attributes.get('id')).toBe('third');
        
        // Check first group's children order
        const firstGroup = result.value.root.children[0];
        expect(firstGroup.children[0].type).toBe('rect');
        expect(firstGroup.children[1].type).toBe('circle');
        
        // Check second group's children order
        const secondGroup = result.value.root.children[1];
        expect(secondGroup.children[0].type).toBe('path');
        
        // Check third group's children order
        const thirdGroup = result.value.root.children[2];
        expect(thirdGroup.children[0].type).toBe('ellipse');
        expect(thirdGroup.children[1].type).toBe('line');
      }
    });
    
    it('should maintain order with mixed self-closing and paired tags', () => {
      const parser = new Parser();
      const svg = `
        <svg>
          <rect />
          <g></g>
          <circle />
          <g>
            <path />
          </g>
          <ellipse />
        </svg>
      `;
      
      const result = parser.parse(svg);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const types = result.value.root.children.map(child => child.type);
        expect(types).toEqual(['rect', 'g', 'circle', 'g', 'ellipse']);
      }
    });
  });
  
  describe('Array-based children storage', () => {
    it('should store children in an array', () => {
      const parser = new Parser();
      const svg = '<svg><rect /><circle /></svg>';
      
      const result = parser.parse(svg);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.value.root.children)).toBe(true);
      }
    });
    
    it('should allow indexed access to children', () => {
      const parser = new Parser();
      const svg = '<svg><rect /><circle /><path /></svg>';
      
      const result = parser.parse(svg);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.children[0].type).toBe('rect');
        expect(result.value.root.children[1].type).toBe('circle');
        expect(result.value.root.children[2].type).toBe('path');
      }
    });
    
    it('should support iteration over children in order', () => {
      const parser = new Parser();
      const svg = '<svg><rect /><circle /><path /></svg>';
      
      const result = parser.parse(svg);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const types: string[] = [];
        result.value.root.children.forEach(child => {
          types.push(child.type);
        });
        
        expect(types).toEqual(['rect', 'circle', 'path']);
      }
    });
    
    it('should maintain order when using array methods', () => {
      const parser = new Parser();
      const svg = '<svg><rect /><circle /><path /><ellipse /></svg>';
      
      const result = parser.parse(svg);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Test map
        const types = result.value.root.children.map(child => child.type);
        expect(types).toEqual(['rect', 'circle', 'path', 'ellipse']);
        
        // Test filter
        const filtered = result.value.root.children.filter(child => 
          child.type === 'rect' || child.type === 'path'
        );
        expect(filtered.length).toBe(2);
        expect(filtered[0].type).toBe('rect');
        expect(filtered[1].type).toBe('path');
        
        // Test slice
        const sliced = result.value.root.children.slice(1, 3);
        expect(sliced.length).toBe(2);
        expect(sliced[0].type).toBe('circle');
        expect(sliced[1].type).toBe('path');
      }
    });
  });
  
  describe('Deterministic ID assignment order', () => {
    it('should assign IDs in document order', () => {
      const parser = new Parser();
      const svg = '<svg><rect /><circle /><path /></svg>';
      
      const result = parser.parse(svg);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Root should be node_1
        expect(result.value.root.id).toBe('node_1');
        
        // Children should be node_2, node_3, node_4 in order
        expect(result.value.root.children[0].id).toBe('node_2');
        expect(result.value.root.children[1].id).toBe('node_3');
        expect(result.value.root.children[2].id).toBe('node_4');
      }
    });
    
    it('should assign IDs in depth-first order for nested structures', () => {
      const parser = new Parser();
      const svg = `
        <svg>
          <g>
            <rect />
            <circle />
          </g>
          <path />
        </svg>
      `;
      
      const result = parser.parse(svg);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Collect all nodes in document order
        const nodes: SVGNode[] = [];
        const collectNodes = (node: SVGNode) => {
          nodes.push(node);
          node.children.forEach(collectNodes);
        };
        collectNodes(result.value.root);
        
        // Verify IDs are sequential
        expect(nodes[0].id).toBe('node_1'); // svg
        expect(nodes[1].id).toBe('node_2'); // g
        expect(nodes[2].id).toBe('node_3'); // rect
        expect(nodes[3].id).toBe('node_4'); // circle
        expect(nodes[4].id).toBe('node_5'); // path
      }
    });
    
    it('should produce the same ID sequence for identical documents', () => {
      const parser = new Parser();
      const svg = '<svg><g><rect /><circle /></g><path /></svg>';
      
      const result1 = parser.parse(svg);
      const result2 = parser.parse(svg);
      
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      
      if (result1.ok && result2.ok) {
        // Collect all IDs from both parses
        const collectIds = (node: SVGNode): string[] => {
          const ids = [node.id];
          node.children.forEach(child => {
            ids.push(...collectIds(child));
          });
          return ids;
        };
        
        const ids1 = collectIds(result1.value.root);
        const ids2 = collectIds(result2.value.root);
        
        expect(ids1).toEqual(ids2);
      }
    });
  });
  
  describe('Edge cases', () => {
    it('should handle empty parent elements consistently', () => {
      const parser = new Parser();
      const svg = '<svg><g></g><g></g><g></g></svg>';
      
      const result1 = parser.parse(svg);
      const result2 = parser.parse(svg);
      
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      
      if (result1.ok && result2.ok) {
        expect(result1.value.root.children.length).toBe(3);
        expect(result2.value.root.children.length).toBe(3);
        
        for (let i = 0; i < 3; i++) {
          expect(result1.value.root.children[i].type).toBe('g');
          expect(result2.value.root.children[i].type).toBe('g');
          expect(result1.value.root.children[i].children.length).toBe(0);
          expect(result2.value.root.children[i].children.length).toBe(0);
        }
      }
    });
    
    it('should handle single child consistently', () => {
      const parser = new Parser();
      const svg = '<svg><rect /></svg>';
      
      const result1 = parser.parse(svg);
      const result2 = parser.parse(svg);
      
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      
      if (result1.ok && result2.ok) {
        expect(result1.value.root.children.length).toBe(1);
        expect(result2.value.root.children.length).toBe(1);
        expect(result1.value.root.children[0].type).toBe('rect');
        expect(result2.value.root.children[0].type).toBe('rect');
      }
    });
    
    it('should handle large number of siblings consistently', () => {
      const parser = new Parser();
      
      // Create SVG with 50 rect elements
      const rects = Array.from({ length: 50 }, (_, i) => `<rect id="rect${i}" />`).join('');
      const svg = `<svg>${rects}</svg>`;
      
      const result1 = parser.parse(svg);
      const result2 = parser.parse(svg);
      
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      
      if (result1.ok && result2.ok) {
        expect(result1.value.root.children.length).toBe(50);
        expect(result2.value.root.children.length).toBe(50);
        
        // Verify order is consistent
        for (let i = 0; i < 50; i++) {
          expect(result1.value.root.children[i].attributes.get('id')).toBe(`rect${i}`);
          expect(result2.value.root.children[i].attributes.get('id')).toBe(`rect${i}`);
        }
      }
    });
  });
});
