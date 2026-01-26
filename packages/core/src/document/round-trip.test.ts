/**
 * Round-trip tests for Parser and Serializer
 * 
 * Validates that parsing then serializing produces consistent output.
 */

import { describe, it, expect } from 'vitest';
import { Parser } from './parser.js';
import { Serializer } from './serializer.js';

describe('Round-trip: Parse -> Serialize', () => {
  it('should handle a simple SVG element', () => {
    const svg = '<svg width="100" height="100" />';
    
    const parser = new Parser();
    const result = parser.parse(svg);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const serializer = new Serializer();
    const serialized = serializer.serialize(result.value);
    
    // Should produce valid SVG (attributes may be reordered)
    expect(serialized).toContain('<svg');
    expect(serialized).toContain('width="100"');
    expect(serialized).toContain('height="100"');
  });
  
  it('should handle nested elements', () => {
    const svg = `<svg>
  <g id="group1">
    <rect x="0" y="0" width="50" height="50" />
    <circle cx="25" cy="25" r="10" />
  </g>
</svg>`;
    
    const parser = new Parser();
    const result = parser.parse(svg);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const document = result.value;
    
    // Verify structure
    expect(document.root.type).toBe('svg');
    expect(document.root.children.length).toBe(1);
    expect(document.root.children[0].type).toBe('g');
    expect(document.root.children[0].children.length).toBe(2);
    
    const serializer = new Serializer();
    const serialized = serializer.serialize(document);
    
    // Should contain all elements
    expect(serialized).toContain('<svg>');
    expect(serialized).toContain('<g');
    expect(serialized).toContain('id="group1"');
    expect(serialized).toContain('<rect');
    expect(serialized).toContain('<circle');
  });
  
  it('should preserve attributes through round-trip', () => {
    const svg = '<rect x="10" y="20" width="100" height="50" fill="red" stroke="blue" />';
    
    const parser = new Parser();
    const parseResult = parser.parse(svg);
    
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const document = parseResult.value;
    
    // Verify all attributes were parsed
    const attrs = document.root.attributes;
    expect(attrs.get('x')).toBe('10');
    expect(attrs.get('y')).toBe('20');
    expect(attrs.get('width')).toBe('100');
    expect(attrs.get('height')).toBe('50');
    expect(attrs.get('fill')).toBe('red');
    expect(attrs.get('stroke')).toBe('blue');
    
    const serializer = new Serializer();
    const serialized = serializer.serialize(document);
    
    // All attributes should be in the output
    expect(serialized).toContain('x="10"');
    expect(serialized).toContain('y="20"');
    expect(serialized).toContain('width="100"');
    expect(serialized).toContain('height="50"');
    expect(serialized).toContain('fill="red"');
    expect(serialized).toContain('stroke="blue"');
  });
  
  it('should handle parse -> serialize -> parse cycle', () => {
    const svg = `<svg width="200" height="200">
  <rect x="10" y="10" width="50" height="50" />
</svg>`;
    
    const parser = new Parser();
    const serializer = new Serializer();
    
    // First parse
    const result1 = parser.parse(svg);
    expect(result1.ok).toBe(true);
    if (!result1.ok) return;
    
    const doc1 = result1.value;
    
    // Serialize
    const serialized = serializer.serialize(doc1);
    
    // Second parse
    const result2 = parser.parse(serialized);
    expect(result2.ok).toBe(true);
    if (!result2.ok) return;
    
    const doc2 = result2.value;
    
    // Documents should have same structure
    expect(doc2.root.type).toBe(doc1.root.type);
    expect(doc2.root.children.length).toBe(doc1.root.children.length);
    
    // Attributes should match
    expect(doc2.root.attributes.get('width')).toBe(doc1.root.attributes.get('width'));
    expect(doc2.root.attributes.get('height')).toBe(doc1.root.attributes.get('height'));
    
    // Child attributes should match
    const child1 = doc1.root.children[0];
    const child2 = doc2.root.children[0];
    expect(child2.type).toBe(child1.type);
    expect(child2.attributes.get('x')).toBe(child1.attributes.get('x'));
    expect(child2.attributes.get('y')).toBe(child1.attributes.get('y'));
  });
  
  it('should produce deterministic output on repeated serialization', () => {
    const svg = '<svg><rect x="0" y="0" /><circle cx="10" cy="10" r="5" /></svg>';
    
    const parser = new Parser();
    const result = parser.parse(svg);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const serializer = new Serializer();
    const serialized1 = serializer.serialize(result.value);
    const serialized2 = serializer.serialize(result.value);
    const serialized3 = serializer.serialize(result.value);
    
    // All serializations should be identical
    expect(serialized1).toBe(serialized2);
    expect(serialized2).toBe(serialized3);
  });
  
  it('should handle deeply nested structures', () => {
    const svg = `<svg>
  <g>
    <g>
      <g>
        <rect x="0" y="0" />
      </g>
    </g>
  </g>
</svg>`;
    
    const parser = new Parser();
    const result = parser.parse(svg);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const document = result.value;
    
    // Navigate to the deepest rect
    let current = document.root;
    expect(current.type).toBe('svg');
    expect(current.children.length).toBe(1);
    
    current = current.children[0];
    expect(current.type).toBe('g');
    expect(current.children.length).toBe(1);
    
    current = current.children[0];
    expect(current.type).toBe('g');
    expect(current.children.length).toBe(1);
    
    current = current.children[0];
    expect(current.type).toBe('g');
    expect(current.children.length).toBe(1);
    
    current = current.children[0];
    expect(current.type).toBe('rect');
    
    const serializer = new Serializer();
    const serialized = serializer.serialize(document);
    
    // Should maintain nesting
    expect(serialized).toContain('<svg>');
    expect(serialized).toContain('<g>');
    expect(serialized).toContain('<rect');
  });
  
  it('should escape special characters when serializing', () => {
    // Create a document with special characters in attributes
    const svg = '<text data="value with quotes and &lt;brackets&gt;" />';
    
    const parser = new Parser();
    const result = parser.parse(svg);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const document = result.value;
    
    // Manually set an attribute with special characters to test escaping
    document.root.attributes.set('test', 'value with "quotes" & <brackets>');
    
    const serializer = new Serializer();
    const serialized = serializer.serialize(document);
    
    // Serializer should escape special characters
    expect(serialized).toContain('test="value with &quot;quotes&quot; &amp; &lt;brackets&gt;"');
  });
});
