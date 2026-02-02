/**
 * SVG Parser Tests
 * 
 * Unit tests for the SVG parser functionality.
 * Tests parsing valid SVG, error handling, ID generation, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SVGParser, parseSVG } from './svg-parser';

describe('SVGParser', () => {
  let parser: SVGParser;
  
  beforeEach(() => {
    parser = new SVGParser();
  });
  
  describe('Valid SVG parsing', () => {
    it('should parse a simple SVG element', () => {
      const svgText = '<svg width="100" height="100"></svg>';
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      expect(result.document).not.toBeNull();
      expect(result.tree).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      
      const rootNode = result.tree[0];
      expect(rootNode.type).toBe('svg');
      expect(rootNode.tagName).toBe('svg');
      expect(rootNode.attributes.get('width')).toBe('100');
      expect(rootNode.attributes.get('height')).toBe('100');
    });
    
    it('should parse SVG with nested elements', () => {
      const svgText = `
        <svg width="200" height="200">
          <rect x="10" y="10" width="50" height="50" fill="red"/>
          <circle cx="100" cy="100" r="30" fill="blue"/>
        </svg>
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      expect(result.tree).toHaveLength(1);
      
      const rootNode = result.tree[0];
      expect(rootNode.children).toHaveLength(2);
      
      const rect = rootNode.children[0];
      expect(rect.type).toBe('rect');
      expect(rect.attributes.get('x')).toBe('10');
      expect(rect.attributes.get('fill')).toBe('red');
      
      const circle = rootNode.children[1];
      expect(circle.type).toBe('circle');
      expect(circle.attributes.get('cx')).toBe('100');
      expect(circle.attributes.get('fill')).toBe('blue');
    });
    
    it('should parse deeply nested SVG structure', () => {
      const svgText = `
        <svg>
          <g id="group1">
            <g id="group2">
              <rect x="0" y="0" width="10" height="10"/>
            </g>
          </g>
        </svg>
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      const rootNode = result.tree[0];
      expect(rootNode.children).toHaveLength(1);
      
      const group1 = rootNode.children[0];
      expect(group1.type).toBe('g');
      expect(group1.children).toHaveLength(1);
      
      const group2 = group1.children[0];
      expect(group2.type).toBe('g');
      expect(group2.children).toHaveLength(1);
      
      const rect = group2.children[0];
      expect(rect.type).toBe('rect');
    });
    
    it('should parse SVG with various element types', () => {
      const svgText = `
        <svg>
          <rect x="0" y="0" width="10" height="10"/>
          <circle cx="50" cy="50" r="20"/>
          <ellipse cx="100" cy="100" rx="30" ry="20"/>
          <line x1="0" y1="0" x2="100" y2="100"/>
          <path d="M 10 10 L 20 20"/>
          <text x="10" y="10">Hello</text>
          <g></g>
        </svg>
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      const rootNode = result.tree[0];
      expect(rootNode.children).toHaveLength(7);
      
      expect(rootNode.children[0].type).toBe('rect');
      expect(rootNode.children[1].type).toBe('circle');
      expect(rootNode.children[2].type).toBe('ellipse');
      expect(rootNode.children[3].type).toBe('line');
      expect(rootNode.children[4].type).toBe('path');
      expect(rootNode.children[5].type).toBe('text');
      expect(rootNode.children[6].type).toBe('g');
    });
    
    it('should parse SVG with namespaced attributes', () => {
      const svgText = `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <rect x="0" y="0" width="10" height="10"/>
        </svg>
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      const rootNode = result.tree[0];
      expect(rootNode.attributes.has('xmlns')).toBe(true);
    });
  });
  
  describe('ID generation', () => {
    it('should assign unique IDs to all elements', () => {
      const svgText = `
        <svg>
          <rect x="0" y="0" width="10" height="10"/>
          <circle cx="50" cy="50" r="20"/>
          <g>
            <rect x="0" y="0" width="5" height="5"/>
          </g>
        </svg>
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      const rootNode = result.tree[0];
      
      // Collect all IDs
      const ids = new Set<string>();
      const collectIds = (node: any) => {
        ids.add(node.id);
        node.children.forEach(collectIds);
      };
      collectIds(rootNode);
      
      // All IDs should be unique (svg + rect + circle + g + rect inside g = 5)
      expect(ids.size).toBe(5);
    });
    
    it('should preserve original IDs as data attributes', () => {
      const svgText = `
        <svg>
          <rect id="my-rect" x="0" y="0" width="10" height="10"/>
        </svg>
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      const rootNode = result.tree[0];
      const rect = rootNode.children[0];
      
      // Should have a new generated ID
      expect(rect.id).toMatch(/^svg-node-\d+$/);
      
      // Original ID should be preserved
      expect(rect.attributes.get('data-original-id')).toBe('my-rect');
    });
    
    it('should generate sequential IDs', () => {
      const svgText = `
        <svg>
          <rect x="0" y="0" width="10" height="10"/>
          <circle cx="50" cy="50" r="20"/>
        </svg>
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      const rootNode = result.tree[0];
      
      expect(rootNode.id).toBe('svg-node-1');
      expect(rootNode.children[0].id).toBe('svg-node-2');
      expect(rootNode.children[1].id).toBe('svg-node-3');
    });
    
    it('should reset ID counter for each parse', () => {
      const svgText = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      
      const result1 = parser.parse(svgText);
      const result2 = parser.parse(svgText);
      
      expect(result1.tree[0].id).toBe('svg-node-1');
      expect(result2.tree[0].id).toBe('svg-node-1');
    });
  });
  
  describe('Attribute handling', () => {
    it('should extract all attributes', () => {
      const svgText = `
        <svg width="100" height="200" viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
        </svg>
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      const rootNode = result.tree[0];
      
      expect(rootNode.attributes.get('width')).toBe('100');
      expect(rootNode.attributes.get('height')).toBe('200');
      expect(rootNode.attributes.get('viewBox')).toBe('0 0 100 200');
      expect(rootNode.attributes.has('xmlns')).toBe(true);
    });
    
    it('should handle attributes with special characters', () => {
      const svgText = `
        <svg>
          <path d="M 10,10 L 20,20 Z" stroke-width="2" stroke-dasharray="5,5"/>
        </svg>
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      const path = result.tree[0].children[0];
      
      expect(path.attributes.get('d')).toBe('M 10,10 L 20,20 Z');
      expect(path.attributes.get('stroke-width')).toBe('2');
      expect(path.attributes.get('stroke-dasharray')).toBe('5,5');
    });
    
    it('should handle empty attributes', () => {
      const svgText = '<svg><rect x="" y="0" width="10" height="10"/></svg>';
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      const rect = result.tree[0].children[0];
      expect(rect.attributes.get('x')).toBe('');
    });
  });
  
  describe('Error handling', () => {
    it('should return error for invalid XML', () => {
      const svgText = '<svg><rect></svg>'; // Unclosed rect tag
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(false);
      expect(result.document).toBeNull();
      expect(result.tree).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const error = result.errors[0];
      expect(error.severity).toBe('error');
      expect(error.message).toBeTruthy();
      expect(error.line).toBeGreaterThan(0);
      expect(error.column).toBeGreaterThan(0);
    });
    
    it('should return error for non-SVG root element', () => {
      const svgText = '<div></div>';
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('svg');
    });
    
    it('should return error for malformed attributes', () => {
      const svgText = '<svg width="100" height=></svg>';
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should return error for unclosed tags', () => {
      const svgText = '<svg><rect x="0" y="0" width="10" height="10"></svg>';
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should provide line and column information in errors', () => {
      const svgText = '<svg><invalid></svg>';
      const result = parser.parse(svgText);
      
      // Even if parsing succeeds (browser-dependent), we should have valid line/column
      if (!result.success) {
        const error = result.errors[0];
        expect(typeof error.line).toBe('number');
        expect(typeof error.column).toBe('number');
        expect(error.line).toBeGreaterThan(0);
        expect(error.column).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Edge cases', () => {
    it('should handle empty SVG', () => {
      const svgText = '<svg></svg>';
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      expect(result.tree).toHaveLength(1);
      expect(result.tree[0].children).toHaveLength(0);
    });
    
    it('should handle SVG with whitespace', () => {
      const svgText = `
        
        <svg>
          
          <rect x="0" y="0" width="10" height="10"/>
          
        </svg>
        
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      expect(result.tree[0].children).toHaveLength(1);
    });
    
    it('should handle SVG with comments', () => {
      const svgText = `
        <svg>
          <!-- This is a comment -->
          <rect x="0" y="0" width="10" height="10"/>
        </svg>
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      // Comments are not included in children
      expect(result.tree[0].children).toHaveLength(1);
    });
    
    it('should handle self-closing tags', () => {
      const svgText = `
        <svg>
          <rect x="0" y="0" width="10" height="10"/>
          <circle cx="50" cy="50" r="20"/>
        </svg>
      `;
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      expect(result.tree[0].children).toHaveLength(2);
    });
    
    it('should handle empty string', () => {
      const svgText = '';
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should handle very large SVG documents', () => {
      // Generate a large SVG with many elements
      let svgText = '<svg>';
      for (let i = 0; i < 1000; i++) {
        svgText += `<rect x="${i}" y="${i}" width="10" height="10"/>`;
      }
      svgText += '</svg>';
      
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      expect(result.tree[0].children).toHaveLength(1000);
    });
  });
  
  describe('Element reference', () => {
    it('should maintain reference to original SVG element', () => {
      const svgText = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      const rootNode = result.tree[0];
      const rect = rootNode.children[0];
      
      // In jsdom, elements might be Element instead of SVGElement
      expect(rect.element).toBeInstanceOf(Element);
      expect(rect.element.tagName.toLowerCase()).toBe('rect');
    });
    
    it('should allow accessing element properties', () => {
      const svgText = '<svg><rect x="10" y="20" width="30" height="40"/></svg>';
      const result = parser.parse(svgText);
      
      expect(result.success).toBe(true);
      const rect = result.tree[0].children[0];
      
      expect(rect.element.getAttribute('x')).toBe('10');
      expect(rect.element.getAttribute('y')).toBe('20');
    });
  });
  
  describe('data-uuid handling', () => {
    it('should assign data-uuid to elements that do not have it', () => {
      const svgText = `
        <svg width="100" height="100">
          <rect x="10" y="10" width="50" height="50"/>
          <circle cx="50" cy="50" r="20"/>
        </svg>
      `;
      const result = parser.parse(svgText);
      expect(result.success).toBe(true);
      expect(result.document).not.toBeNull();

      const rect = result.document!.querySelector('rect');
      const circle = result.document!.querySelector('circle');
      expect(rect).not.toBeNull();
      expect(circle).not.toBeNull();
      expect(rect!.hasAttribute('data-uuid')).toBe(true);
      expect(circle!.hasAttribute('data-uuid')).toBe(true);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(rect!.getAttribute('data-uuid')).toMatch(uuidRegex);
      expect(circle!.getAttribute('data-uuid')).toMatch(uuidRegex);
    });

    it('should preserve existing data-uuid when present on elements', () => {
      const existingUuid = '123e4567-e89b-12d3-a456-426614174000';
      const svgText = `
        <svg width="100" height="100">
          <rect x="10" y="10" width="50" height="50" data-uuid="${existingUuid}"/>
        </svg>
      `;
      const result = parser.parse(svgText);
      expect(result.success).toBe(true);
      expect(result.document).not.toBeNull();

      const rect = result.document!.querySelector('rect');
      expect(rect).not.toBeNull();
      expect(rect!.getAttribute('data-uuid')).toBe(existingUuid);
    });

    it('should ensure parsed document DOM has data-uuid on all content elements', () => {
      const svgText = `
        <svg width="100" height="100">
          <g id="group1">
            <rect x="0" y="0" width="10" height="10"/>
          </g>
        </svg>
      `;
      const result = parser.parse(svgText);
      expect(result.success).toBe(true);
      expect(result.document).not.toBeNull();

      const root = result.document!;
      const gEl = root.querySelector('g');
      const rectEl = root.querySelector('rect');
      expect(root.hasAttribute('data-uuid')).toBe(true);
      expect(gEl).not.toBeNull();
      expect(rectEl).not.toBeNull();
      expect(gEl!.hasAttribute('data-uuid')).toBe(true);
      expect(rectEl!.hasAttribute('data-uuid')).toBe(true);
      const withUuid = root.querySelectorAll('[data-uuid]');
      expect(withUuid.length).toBe(2);
    });
  });

  describe('Convenience function', () => {
    it('should work with parseSVG convenience function', () => {
      const svgText = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      const result = parseSVG(svgText);
      
      expect(result.success).toBe(true);
      expect(result.tree).toHaveLength(1);
    });
  });
  
  describe('Worker parsing', () => {
    it('should support parseInWorker method', async () => {
      const svgText = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      const result = await parser.parseInWorker(svgText);
      
      expect(result.success).toBe(true);
      expect(result.tree).toHaveLength(1);
    });
  });
});
