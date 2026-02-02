/**
 * Unit tests for SVG Serializer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SVGSerializer, serializeSVG } from './svg-serializer';

describe('SVGSerializer', () => {
  let serializer: SVGSerializer;
  
  beforeEach(() => {
    serializer = new SVGSerializer();
  });
  
  describe('Basic serialization', () => {
    it('should serialize a simple self-closing element', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      svg.setAttribute('x', '10');
      svg.setAttribute('y', '20');
      svg.setAttribute('width', '100');
      svg.setAttribute('height', '50');
      
      const result = serializer.serialize(svg);
      
      // Should be a self-closing tag with sorted attributes
      expect(result).toBe('<rect height="50" width="100" x="10" y="20" />\n');
    });
    
    it('should serialize an element with children', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100');
      svg.setAttribute('height', '100');
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '50');
      circle.setAttribute('r', '25');
      
      svg.appendChild(circle);
      
      const result = serializer.serialize(svg);
      
      expect(result).toBe(
        '<svg height="100" width="100">\n' +
        '  <circle cx="50" cy="50" r="25" />\n' +
        '</svg>\n'
      );
    });
    
    it('should serialize nested elements with proper indentation', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('id', 'group1');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      
      group.appendChild(rect);
      svg.appendChild(group);
      
      const result = serializer.serialize(svg);
      
      expect(result).toBe(
        '<svg>\n' +
        '  <g id="group1">\n' +
        '    <rect x="0" y="0" />\n' +
        '  </g>\n' +
        '</svg>\n'
      );
    });
    
    it('should serialize element with text content', () => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '10');
      text.setAttribute('y', '20');
      text.textContent = 'Hello World';
      
      const result = serializer.serialize(text);
      
      expect(result).toBe('<text x="10" y="20">Hello World</text>\n');
    });
  });
  
  describe('Attribute handling', () => {
    it('should sort attributes alphabetically for deterministic output', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('y', '20');
      rect.setAttribute('width', '100');
      rect.setAttribute('x', '10');
      rect.setAttribute('height', '50');
      
      const result = serializer.serialize(rect);
      
      // Attributes should be in alphabetical order
      expect(result).toBe('<rect height="50" width="100" x="10" y="20" />\n');
    });
    
    it('should escape special characters in attribute values', () => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('data', 'value with "quotes" & <brackets>');
      
      const result = serializer.serialize(text);
      
      expect(result).toContain('data="value with &quot;quotes&quot; &amp; &lt;brackets&gt;"');
    });
    
    it('should handle elements with no attributes', () => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const result = serializer.serialize(g);
      
      expect(result).toBe('<g />\n');
    });
    
    it('should not sort attributes when sortAttributes is false', () => {
      const serializer = new SVGSerializer({ sortAttributes: false });
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('y', '20');
      rect.setAttribute('x', '10');
      
      const result = serializer.serialize(rect);
      
      // Attributes should be in the order they were set
      expect(result).toBe('<rect y="20" x="10" />\n');
    });
  });
  
  describe('Editor attribute cleanup', () => {
    it('should remove data-uuid by default', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('data-uuid', '123e4567-e89b-12d3-a456-426614174000');
      rect.setAttribute('x', '10');
      
      const result = serializer.serialize(rect);
      
      // data-uuid should be removed by default
      expect(result).toBe('<rect x="10" />\n');
      expect(result).not.toContain('data-uuid');
    });
    
    it('should preserve data-uuid when keepUUID is true', () => {
      const serializer = new SVGSerializer({ keepUUID: true });
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('data-uuid', '123e4567-e89b-12d3-a456-426614174000');
      rect.setAttribute('x', '10');
      
      const result = serializer.serialize(rect);
      
      // data-uuid should be preserved
      expect(result).toBe('<rect data-uuid="123e4567-e89b-12d3-a456-426614174000" x="10" />\n');
      expect(result).toContain('data-uuid');
    });
    
    it('should remove generated IDs (svg-node-*)', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'svg-node-123');
      rect.setAttribute('x', '10');
      
      const result = serializer.serialize(rect);
      
      // Generated ID should be removed
      expect(result).toBe('<rect x="10" />\n');
      expect(result).not.toContain('svg-node-123');
    });
    
    it('should restore original IDs when data-original-id exists', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'svg-node-123');
      rect.setAttribute('data-original-id', 'my-rect');
      rect.setAttribute('x', '10');
      
      const result = serializer.serialize(rect);
      
      // Original ID should be restored, generated ID and data-original-id removed
      expect(result).toBe('<rect id="my-rect" x="10" />\n');
      expect(result).not.toContain('svg-node-123');
      expect(result).not.toContain('data-original-id');
    });
    
    it('should preserve user-defined IDs', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'my-custom-id');
      rect.setAttribute('x', '10');
      
      const result = serializer.serialize(rect);
      
      // User-defined ID should be preserved
      expect(result).toBe('<rect id="my-custom-id" x="10" />\n');
    });
    
    it('should remove editor-specific data attributes', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '10');
      rect.setAttribute('data-selected', 'true');
      rect.setAttribute('data-hovered', 'true');
      
      const result = serializer.serialize(rect);
      
      // Editor-specific attributes should be removed
      expect(result).toBe('<rect x="10" />\n');
      expect(result).not.toContain('data-selected');
      expect(result).not.toContain('data-hovered');
    });
    
    it('should clean up nested elements recursively', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'svg-node-1');
      
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('id', 'svg-node-2');
      group.setAttribute('data-original-id', 'my-group');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'svg-node-3');
      rect.setAttribute('data-selected', 'true');
      
      group.appendChild(rect);
      svg.appendChild(group);
      
      const result = serializer.serialize(svg);
      
      // All editor-specific attributes should be cleaned up
      expect(result).not.toContain('svg-node-');
      expect(result).not.toContain('data-original-id');
      expect(result).not.toContain('data-selected');
      expect(result).toContain('id="my-group"');
    });
    
    it('should not clean up attributes when cleanupEditorAttributes is false', () => {
      const serializer = new SVGSerializer({ cleanupEditorAttributes: false });
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'svg-node-123');
      rect.setAttribute('data-selected', 'true');
      
      const result = serializer.serialize(rect);
      
      // Editor attributes should be preserved
      expect(result).toContain('svg-node-123');
      expect(result).toContain('data-selected');
    });
  });
  
  describe('Formatting options', () => {
    it('should support compact output without pretty printing', () => {
      const serializer = new SVGSerializer({ prettyPrint: false });
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '0');
      
      svg.appendChild(rect);
      
      const result = serializer.serialize(svg);
      
      // No newlines or indentation
      expect(result).toBe('<svg><rect x="0" /></svg>');
    });
    
    it('should support custom indentation', () => {
      const serializer = new SVGSerializer({ indent: '\t' });
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      
      svg.appendChild(rect);
      
      const result = serializer.serialize(svg);
      
      expect(result).toBe('<svg>\n\t<rect />\n</svg>\n');
    });
    
    it('should support 4-space indentation', () => {
      const serializer = new SVGSerializer({ indent: '    ' });
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      
      svg.appendChild(rect);
      
      const result = serializer.serialize(svg);
      
      expect(result).toBe('<svg>\n    <rect />\n</svg>\n');
    });
  });
  
  describe('Text content handling', () => {
    it('should escape special characters in text content', () => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.textContent = 'Text with <brackets> & ampersands';
      
      const result = serializer.serialize(text);
      
      expect(result).toContain('Text with &lt;brackets&gt; &amp; ampersands');
    });
    
    it('should handle empty text elements', () => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      
      const result = serializer.serialize(text);
      
      expect(result).toBe('<text />\n');
    });
    
    it('should handle whitespace-only text content', () => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.textContent = '   ';
      
      const result = serializer.serialize(text);
      
      // Whitespace-only content should be treated as empty
      expect(result).toBe('<text />\n');
    });
  });
  
  describe('Deterministic output', () => {
    it('should produce identical output for multiple serializations', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('y', '20');
      rect.setAttribute('x', '10');
      rect.setAttribute('width', '100');
      
      const result1 = serializer.serialize(rect);
      const result2 = serializer.serialize(rect);
      const result3 = serializer.serialize(rect);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
  
  describe('Convenience function', () => {
    it('should serialize using the convenience function', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      
      const result = serializeSVG(rect);
      
      expect(result).toBe('<rect x="10" y="20" />\n');
    });
  });
  
  describe('Complex SVG documents', () => {
    it('should serialize a complete SVG document', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', '200');
      svg.setAttribute('height', '200');
      svg.setAttribute('viewBox', '0 0 200 200');
      
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      linearGradient.setAttribute('id', 'grad1');
      defs.appendChild(linearGradient);
      svg.appendChild(defs);
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '10');
      rect.setAttribute('width', '180');
      rect.setAttribute('height', '180');
      rect.setAttribute('fill', 'url(#grad1)');
      svg.appendChild(rect);
      
      const result = serializer.serialize(svg);
      
      expect(result).toContain('<svg');
      expect(result).toContain('<defs>');
      expect(result).toContain('<lineargradient'); // Tag names are lowercase
      expect(result).toContain('<rect');
      expect(result).toContain('fill="url(#grad1)"');
    });
    
    it('should handle deeply nested structures', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      let current: SVGElement = svg;
      for (let i = 0; i < 5; i++) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('id', `group-${i}`);
        current.appendChild(g);
        current = g;
      }
      
      const result = serializer.serialize(svg);
      
      // Should have proper nesting and indentation
      expect(result).toContain('group-0');
      expect(result).toContain('group-4');
      expect(result.split('\n').length).toBeGreaterThan(10); // Multiple lines due to nesting
    });
  });
  
  describe('Edge cases', () => {
    it('should handle elements with mixed case tag names', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      // Force uppercase (though SVG elements are typically lowercase)
      Object.defineProperty(element, 'tagName', { value: 'RECT', configurable: true });
      
      const result = serializer.serialize(element);
      
      // Should convert to lowercase
      expect(result).toContain('<rect');
    });
    
    it('should not modify the original element', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'svg-node-123');
      rect.setAttribute('data-selected', 'true');
      
      serializer.serialize(rect);
      
      // Original element should still have editor attributes
      expect(rect.getAttribute('id')).toBe('svg-node-123');
      expect(rect.getAttribute('data-selected')).toBe('true');
    });
  });
});
