/**
 * Unit tests for XML/SVG Parser
 */

import { describe, it, expect } from 'vitest';
import { Parser } from '../../src/document/parser.js';
import type { SVGNode } from '../../src/types/node.js';

describe('Parser', () => {
  describe('Basic XML parsing', () => {
    it('should parse a simple self-closing element', () => {
      const parser = new Parser();
      const result = parser.parse('<svg />');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.type).toBe('svg');
        expect(result.value.root.children.length).toBe(0);
        expect(result.value.nodes.size).toBe(1);
      }
    });
    
    it('should parse an element with opening and closing tags', () => {
      const parser = new Parser();
      const result = parser.parse('<svg></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.type).toBe('svg');
        expect(result.value.root.children.length).toBe(0);
      }
    });
    
    it('should parse nested elements', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><rect /></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.type).toBe('svg');
        expect(result.value.root.children.length).toBe(1);
        expect(result.value.root.children[0].type).toBe('rect');
        expect(result.value.root.children[0].parent).toBe(result.value.root);
      }
    });
    
    it('should parse deeply nested elements', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><g><rect /></g></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.type).toBe('svg');
        expect(result.value.root.children.length).toBe(1);
        
        const group = result.value.root.children[0];
        expect(group.type).toBe('g');
        expect(group.children.length).toBe(1);
        expect(group.parent).toBe(result.value.root);
        
        const rect = group.children[0];
        expect(rect.type).toBe('rect');
        expect(rect.parent).toBe(group);
      }
    });
    
    it('should parse multiple sibling elements', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><rect /><circle /><path /></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.children.length).toBe(3);
        expect(result.value.root.children[0].type).toBe('rect');
        expect(result.value.root.children[1].type).toBe('circle');
        expect(result.value.root.children[2].type).toBe('path');
      }
    });
  });
  
  describe('Attribute parsing', () => {
    it('should parse attributes with double quotes', () => {
      const parser = new Parser();
      const result = parser.parse('<rect x="10" y="20" />');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.attributes.get('x')).toBe('10');
        expect(result.value.root.attributes.get('y')).toBe('20');
      }
    });
    
    it('should parse attributes with single quotes', () => {
      const parser = new Parser();
      const result = parser.parse("<rect x='10' y='20' />");
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.attributes.get('x')).toBe('10');
        expect(result.value.root.attributes.get('y')).toBe('20');
      }
    });
    
    it('should parse attributes with various value types', () => {
      const parser = new Parser();
      const result = parser.parse('<rect width="100" height="50.5" fill="red" />');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.attributes.get('width')).toBe('100');
        expect(result.value.root.attributes.get('height')).toBe('50.5');
        expect(result.value.root.attributes.get('fill')).toBe('red');
      }
    });
    
    it('should parse attributes with special characters', () => {
      const parser = new Parser();
      const result = parser.parse('<path d="M 10 20 L 30 40" />');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.attributes.get('d')).toBe('M 10 20 L 30 40');
      }
    });
    
    it('should handle attributes with namespaces', () => {
      const parser = new Parser();
      const result = parser.parse('<svg xmlns:xlink="http://www.w3.org/1999/xlink" />');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.attributes.get('xmlns:xlink')).toBe('http://www.w3.org/1999/xlink');
      }
    });
  });

  describe('Unknown elements', () => {
    it('should preserve unknown elements and emit warnings', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><custom-element foo="bar" /></svg>');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const document = result.value;
        expect(document.root.children.length).toBe(1);
        expect(document.root.children[0].type).toBe('custom-element');
        expect(document.root.children[0].attributes.get('foo')).toBe('bar');

        expect(document.warnings?.length).toBeGreaterThan(0);
        expect(document.warnings?.[0]).toMatchObject({
          code: 'UNKNOWN_ELEMENT',
          elementName: 'custom-element'
        });

        expect(document.unknownElements).toContain('custom-element');
      }
    });
  });
  
  describe('Stable ID generation', () => {
    it('should assign unique IDs to all nodes', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><rect /><circle /><path /></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ids = new Set<string>();
        ids.add(result.value.root.id);
        result.value.root.children.forEach(child => ids.add(child.id));
        
        // All IDs should be unique
        expect(ids.size).toBe(4);
      }
    });
    
    it('should create node index with all nodes', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><g><rect /></g></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should have 3 nodes: svg, g, rect
        expect(result.value.nodes.size).toBe(3);
        
        // All nodes should be in the index
        expect(result.value.nodes.get(result.value.root.id)).toBe(result.value.root);
        const group = result.value.root.children[0];
        expect(result.value.nodes.get(group.id)).toBe(group);
        const rect = group.children[0];
        expect(result.value.nodes.get(rect.id)).toBe(rect);
      }
    });
    
    it('should generate IDs in deterministic order', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><rect /><circle /></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // IDs should follow counter pattern
        expect(result.value.root.id).toBe('node_1');
        expect(result.value.root.children[0].id).toBe('node_2');
        expect(result.value.root.children[1].id).toBe('node_3');
      }
    });
    
    it('should reset ID counter for each parse', () => {
      const parser = new Parser();
      
      // First parse
      const result1 = parser.parse('<svg><rect /></svg>');
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value.root.id).toBe('node_1');
        expect(result1.value.root.children[0].id).toBe('node_2');
      }
      
      // Second parse should reset counter
      const result2 = parser.parse('<svg><circle /></svg>');
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value.root.id).toBe('node_1');
        expect(result2.value.root.children[0].id).toBe('node_2');
      }
    });
    
    it('should assign IDs to deeply nested structures', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><g><g><g><rect /></g></g></g></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should have 5 nodes total
        expect(result.value.nodes.size).toBe(5);
        
        // All nodes should have unique IDs
        const ids = Array.from(result.value.nodes.keys());
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(5);
        
        // All IDs should follow the pattern
        ids.forEach(id => {
          expect(id).toMatch(/^node_\d+$/);
        });
      }
    });
    
    it('should include all nodes in index regardless of depth', () => {
      const parser = new Parser();
      const result = parser.parse(`
        <svg>
          <g>
            <rect />
            <circle />
          </g>
          <g>
            <path />
          </g>
        </svg>
      `);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should have 6 nodes: svg, 2 groups, rect, circle, path
        expect(result.value.nodes.size).toBe(6);
        
        // Verify all nodes are accessible via index
        const allNodes: SVGNode[] = [];
        const collectNodes = (node: SVGNode) => {
          allNodes.push(node);
          node.children.forEach(collectNodes);
        };
        collectNodes(result.value.root);
        
        expect(allNodes.length).toBe(6);
        allNodes.forEach(node => {
          expect(result.value.nodes.get(node.id)).toBe(node);
        });
      }
    });
    
    it('should prevent duplicate IDs within a document', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><rect /><circle /><path /><g><rect /><circle /></g></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ids = Array.from(result.value.nodes.keys());
        const uniqueIds = new Set(ids);
        
        // No duplicates
        expect(ids.length).toBe(uniqueIds.size);
        expect(ids.length).toBe(7); // svg + 3 children + g + 2 children
      }
    });
  });
  
  describe('Hierarchy preservation', () => {
    it('should maintain parent-child relationships', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><g><rect /></g></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const root = result.value.root;
        const group = root.children[0];
        const rect = group.children[0];
        
        expect(root.parent).toBe(null);
        expect(group.parent).toBe(root);
        expect(rect.parent).toBe(group);
      }
    });
    
    it('should preserve document order', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><rect /><circle /><path /></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.children[0].type).toBe('rect');
        expect(result.value.root.children[1].type).toBe('circle');
        expect(result.value.root.children[2].type).toBe('path');
      }
    });
  });
  
  describe('Error handling', () => {
    it('should return error for malformed XML - unclosed tag', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><rect />');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Unclosed tag');
        expect(result.error.line).toBeGreaterThan(0);
        expect(result.error.column).toBeGreaterThan(0);
      }
    });
    
    it('should return error for mismatched tags', () => {
      const parser = new Parser();
      const result = parser.parse('<svg></rect>');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Mismatched closing tag');
        expect(result.error.line).toBeGreaterThan(0);
      }
    });
    
    it('should return error for invalid attribute syntax', () => {
      const parser = new Parser();
      const result = parser.parse('<rect x=10 />');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('quoted');
        expect(result.error.line).toBeGreaterThan(0);
      }
    });
    
    it('should return error for unterminated attribute value', () => {
      const parser = new Parser();
      const result = parser.parse('<rect x="10 />');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Unterminated');
        expect(result.error.line).toBeGreaterThan(0);
      }
    });
    
    it('should return error for empty input', () => {
      const parser = new Parser();
      const result = parser.parse('');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('No root element');
      }
    });
    
    it('should return error for content after root element', () => {
      const parser = new Parser();
      const result = parser.parse('<svg /><rect />');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Unexpected content after root element');
      }
    });
  });
  
  describe('Whitespace handling', () => {
    it('should handle whitespace between elements', () => {
      const parser = new Parser();
      const result = parser.parse(`
        <svg>
          <rect />
          <circle />
        </svg>
      `);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.children.length).toBe(2);
      }
    });
    
    it('should handle whitespace in attributes', () => {
      const parser = new Parser();
      const result = parser.parse('<rect   x = "10"   y = "20"   />');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.attributes.get('x')).toBe('10');
        expect(result.value.root.attributes.get('y')).toBe('20');
      }
    });
  });
  
  describe('Complex SVG documents', () => {
    it('should parse a realistic SVG document', () => {
      const parser = new Parser();
      const svg = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="30" height="30" fill="red" />
          <circle cx="50" cy="50" r="20" fill="blue" />
          <g transform="translate(10, 10)">
            <path d="M 0 0 L 10 10" stroke="black" />
          </g>
        </svg>
      `;
      
      const result = parser.parse(svg);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.type).toBe('svg');
        expect(result.value.root.attributes.get('width')).toBe('100');
        expect(result.value.root.children.length).toBe(3);
        
        const rect = result.value.root.children[0];
        expect(rect.type).toBe('rect');
        expect(rect.attributes.get('fill')).toBe('red');
        
        const circle = result.value.root.children[1];
        expect(circle.type).toBe('circle');
        expect(circle.attributes.get('r')).toBe('20');
        
        const group = result.value.root.children[2];
        expect(group.type).toBe('g');
        expect(group.children.length).toBe(1);
        expect(group.children[0].type).toBe('path');
      }
    });
  });
});
