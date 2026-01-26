/**
 * Parse-Serialize-Parse Equivalence Tests
 * 
 * Tests that parsing, then serializing, then parsing again produces
 * an equivalent document structure. This validates Requirement 2.6.
 */

import { describe, it, expect } from 'vitest';
import { Parser } from './parser.js';
import { Serializer } from './serializer.js';
import type { SVGNode } from '../types/node.js';

/**
 * Helper to compare two nodes for structural equivalence.
 * Ignores IDs since they will be regenerated on re-parse.
 */
function nodesAreEquivalent(node1: SVGNode, node2: SVGNode): boolean {
  // Check type
  if (node1.type !== node2.type) {
    return false;
  }
  
  // Check attributes
  if (node1.attributes.size !== node2.attributes.size) {
    return false;
  }
  
  for (const [key, value] of node1.attributes) {
    if (node2.attributes.get(key) !== value) {
      return false;
    }
  }
  
  // Check children count
  if (node1.children.length !== node2.children.length) {
    return false;
  }
  
  // Check children recursively
  for (let i = 0; i < node1.children.length; i++) {
    if (!nodesAreEquivalent(node1.children[i], node2.children[i])) {
      return false;
    }
  }
  
  return true;
}

describe('Parse-Serialize-Parse Equivalence', () => {
  const parser = new Parser();
  const serializer = new Serializer();
  
  it('should produce equivalent structure for simple element', () => {
    const svg = '<svg width="100" height="100" />';
    
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
    
    // Documents should be structurally equivalent
    expect(nodesAreEquivalent(doc1.root, doc2.root)).toBe(true);
  });
  
  it('should produce equivalent structure for nested elements', () => {
    const svg = `<svg>
  <g id="group1">
    <rect x="0" y="0" width="50" height="50" />
    <circle cx="25" cy="25" r="10" />
  </g>
</svg>`;
    
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
    
    // Documents should be structurally equivalent
    expect(nodesAreEquivalent(doc1.root, doc2.root)).toBe(true);
  });
  
  it('should preserve all attributes through parse-serialize-parse', () => {
    const svg = '<rect x="10" y="20" width="100" height="50" fill="red" stroke="blue" stroke-width="2" />';
    
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
    
    // All attributes should match
    expect(doc2.root.attributes.size).toBe(doc1.root.attributes.size);
    for (const [key, value] of doc1.root.attributes) {
      expect(doc2.root.attributes.get(key)).toBe(value);
    }
  });
  
  it('should handle attributes with special characters', () => {
    const svg = '<text data="value with &quot;quotes&quot; &amp; &lt;brackets&gt;" />';
    
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
    
    // Attribute values should match
    expect(doc2.root.attributes.get('data')).toBe(doc1.root.attributes.get('data'));
  });
  
  it('should handle deeply nested structures', () => {
    const svg = `<svg>
  <g>
    <g>
      <g>
        <rect x="0" y="0" width="10" height="10" />
      </g>
    </g>
  </g>
</svg>`;
    
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
    
    // Documents should be structurally equivalent
    expect(nodesAreEquivalent(doc1.root, doc2.root)).toBe(true);
  });
  
  it('should handle multiple sibling elements', () => {
    const svg = '<svg><rect x="0" y="0" /><circle cx="10" cy="10" r="5" /><path d="M 0 0 L 10 10" /></svg>';
    
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
    
    // Documents should be structurally equivalent
    expect(nodesAreEquivalent(doc1.root, doc2.root)).toBe(true);
    
    // Verify child order is preserved
    expect(doc2.root.children[0].type).toBe('rect');
    expect(doc2.root.children[1].type).toBe('circle');
    expect(doc2.root.children[2].type).toBe('path');
  });
  
  it('should handle complex SVG with mixed attributes', () => {
    const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="30" height="30" fill="red" />
  <circle cx="50" cy="50" r="20" fill="blue" stroke="black" stroke-width="2" />
  <g transform="translate(10, 10)" opacity="0.5">
    <path d="M 0 0 L 10 10 L 20 0 Z" stroke="green" fill="none" />
  </g>
</svg>`;
    
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
    
    // Documents should be structurally equivalent
    expect(nodesAreEquivalent(doc1.root, doc2.root)).toBe(true);
  });
  
  it('should produce identical serialization after re-parse', () => {
    const svg = '<svg><rect x="10" y="20" width="100" height="50" /></svg>';
    
    // First parse
    const result1 = parser.parse(svg);
    expect(result1.ok).toBe(true);
    if (!result1.ok) return;
    
    const doc1 = result1.value;
    
    // First serialization
    const serialized1 = serializer.serialize(doc1);
    
    // Second parse
    const result2 = parser.parse(serialized1);
    expect(result2.ok).toBe(true);
    if (!result2.ok) return;
    
    const doc2 = result2.value;
    
    // Second serialization
    const serialized2 = serializer.serialize(doc2);
    
    // Serializations should be identical
    expect(serialized2).toBe(serialized1);
  });
  
  it('should handle empty elements', () => {
    const svg = '<svg><g /><g><rect /></g></svg>';
    
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
    
    // Documents should be structurally equivalent
    expect(nodesAreEquivalent(doc1.root, doc2.root)).toBe(true);
  });
  
  it('should handle attributes with various quote styles in input', () => {
    // Input has mixed quotes, but output should normalize
    const svg = `<rect x="10" y='20' width="100" height='50' />`;
    
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
    
    // All attributes should be preserved
    expect(doc2.root.attributes.get('x')).toBe('10');
    expect(doc2.root.attributes.get('y')).toBe('20');
    expect(doc2.root.attributes.get('width')).toBe('100');
    expect(doc2.root.attributes.get('height')).toBe('50');
  });
});
