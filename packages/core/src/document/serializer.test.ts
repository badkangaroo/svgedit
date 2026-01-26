/**
 * Unit tests for SVG Serializer
 */

import { describe, it, expect } from 'vitest';
import { Serializer } from './serializer.js';
import type { SVGDocument } from '../types/document.js';
import type { SVGNode } from '../types/node.js';

describe('Serializer', () => {
  describe('Basic serialization', () => {
    it('should serialize a simple self-closing element', () => {
      const node: SVGNode = {
        id: 'node_1',
        type: 'rect',
        attributes: new Map([
          ['x', '10'],
          ['y', '20'],
          ['width', '100'],
          ['height', '50']
        ]),
        children: [],
        parent: null
      };
      
      const document: SVGDocument = {
        root: node,
        nodes: new Map([['node_1', node]]),
        version: 0
      };
      
      const serializer = new Serializer();
      const result = serializer.serialize(document);
      
      // Should be a self-closing tag with sorted attributes
      expect(result).toBe('<rect height="50" width="100" x="10" y="20" />\n');
    });
    
    it('should serialize an element with children', () => {
      const child: SVGNode = {
        id: 'node_2',
        type: 'circle',
        attributes: new Map([
          ['cx', '50'],
          ['cy', '50'],
          ['r', '25']
        ]),
        children: [],
        parent: null as any // Will be set below
      };
      
      const root: SVGNode = {
        id: 'node_1',
        type: 'svg',
        attributes: new Map([
          ['width', '100'],
          ['height', '100']
        ]),
        children: [child],
        parent: null
      };
      
      child.parent = root;
      
      const document: SVGDocument = {
        root,
        nodes: new Map([
          ['node_1', root],
          ['node_2', child]
        ]),
        version: 0
      };
      
      const serializer = new Serializer();
      const result = serializer.serialize(document);
      
      expect(result).toBe(
        '<svg height="100" width="100">\n' +
        '  <circle cx="50" cy="50" r="25" />\n' +
        '</svg>\n'
      );
    });
    
    it('should serialize nested elements with proper indentation', () => {
      const rect: SVGNode = {
        id: 'node_3',
        type: 'rect',
        attributes: new Map([['x', '0'], ['y', '0']]),
        children: [],
        parent: null as any
      };
      
      const group: SVGNode = {
        id: 'node_2',
        type: 'g',
        attributes: new Map([['id', 'group1']]),
        children: [rect],
        parent: null as any
      };
      
      rect.parent = group;
      
      const root: SVGNode = {
        id: 'node_1',
        type: 'svg',
        attributes: new Map(),
        children: [group],
        parent: null
      };
      
      group.parent = root;
      
      const document: SVGDocument = {
        root,
        nodes: new Map([
          ['node_1', root],
          ['node_2', group],
          ['node_3', rect]
        ]),
        version: 0
      };
      
      const serializer = new Serializer();
      const result = serializer.serialize(document);
      
      expect(result).toBe(
        '<svg>\n' +
        '  <g id="group1">\n' +
        '    <rect x="0" y="0" />\n' +
        '  </g>\n' +
        '</svg>\n'
      );
    });
  });
  
  describe('Attribute handling', () => {
    it('should sort attributes alphabetically for deterministic output', () => {
      const node: SVGNode = {
        id: 'node_1',
        type: 'rect',
        attributes: new Map([
          ['y', '20'],
          ['width', '100'],
          ['x', '10'],
          ['height', '50']
        ]),
        children: [],
        parent: null
      };
      
      const document: SVGDocument = {
        root: node,
        nodes: new Map([['node_1', node]]),
        version: 0
      };
      
      const serializer = new Serializer({ sortAttributes: true });
      const result = serializer.serialize(document);
      
      // Attributes should be in alphabetical order
      expect(result).toBe('<rect height="50" width="100" x="10" y="20" />\n');
    });
    
    it('should escape special characters in attribute values', () => {
      const node: SVGNode = {
        id: 'node_1',
        type: 'text',
        attributes: new Map([
          ['data', 'value with "quotes" & <brackets>']
        ]),
        children: [],
        parent: null
      };
      
      const document: SVGDocument = {
        root: node,
        nodes: new Map([['node_1', node]]),
        version: 0
      };
      
      const serializer = new Serializer();
      const result = serializer.serialize(document);
      
      expect(result).toContain('data="value with &quot;quotes&quot; &amp; &lt;brackets&gt;"');
    });
    
    it('should handle empty attributes map', () => {
      const node: SVGNode = {
        id: 'node_1',
        type: 'g',
        attributes: new Map(),
        children: [],
        parent: null
      };
      
      const document: SVGDocument = {
        root: node,
        nodes: new Map([['node_1', node]]),
        version: 0
      };
      
      const serializer = new Serializer();
      const result = serializer.serialize(document);
      
      expect(result).toBe('<g />\n');
    });
  });
  
  describe('Formatting options', () => {
    it('should support compact output without pretty printing', () => {
      const child: SVGNode = {
        id: 'node_2',
        type: 'rect',
        attributes: new Map([['x', '0']]),
        children: [],
        parent: null as any
      };
      
      const root: SVGNode = {
        id: 'node_1',
        type: 'svg',
        attributes: new Map(),
        children: [child],
        parent: null
      };
      
      child.parent = root;
      
      const document: SVGDocument = {
        root,
        nodes: new Map([
          ['node_1', root],
          ['node_2', child]
        ]),
        version: 0
      };
      
      const serializer = new Serializer({ prettyPrint: false });
      const result = serializer.serialize(document);
      
      // No newlines or indentation
      expect(result).toBe('<svg><rect x="0" /></svg>');
    });
    
    it('should support custom indentation', () => {
      const child: SVGNode = {
        id: 'node_2',
        type: 'rect',
        attributes: new Map(),
        children: [],
        parent: null as any
      };
      
      const root: SVGNode = {
        id: 'node_1',
        type: 'svg',
        attributes: new Map(),
        children: [child],
        parent: null
      };
      
      child.parent = root;
      
      const document: SVGDocument = {
        root,
        nodes: new Map([
          ['node_1', root],
          ['node_2', child]
        ]),
        version: 0
      };
      
      const serializer = new Serializer({ indent: '\t' });
      const result = serializer.serialize(document);
      
      expect(result).toBe('<svg>\n\t<rect />\n</svg>\n');
    });
  });
  
  describe('Deterministic output', () => {
    it('should produce identical output for multiple serializations', () => {
      const node: SVGNode = {
        id: 'node_1',
        type: 'rect',
        attributes: new Map([
          ['y', '20'],
          ['x', '10'],
          ['width', '100']
        ]),
        children: [],
        parent: null
      };
      
      const document: SVGDocument = {
        root: node,
        nodes: new Map([['node_1', node]]),
        version: 0
      };
      
      const serializer = new Serializer();
      const result1 = serializer.serialize(document);
      const result2 = serializer.serialize(document);
      const result3 = serializer.serialize(document);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
});
