import { describe, it, expect } from 'vitest';
import type { SVGDocument, ParseError } from './document.js';
import type { SVGNode } from './node.js';

describe('SVGDocument type', () => {
  it('should create a basic document', () => {
    const root: SVGNode = {
      id: 'root',
      type: 'svg',
      attributes: new Map([['width', '100'], ['height', '100']]),
      children: [],
      parent: null
    };
    
    const document: SVGDocument = {
      root: root,
      nodes: new Map([['root', root]]),
      version: 0
    };
    
    expect(document.root).toBe(root);
    expect(document.nodes.size).toBe(1);
    expect(document.nodes.get('root')).toBe(root);
    expect(document.version).toBe(0);
  });
  
  it('should support multiple nodes in the index', () => {
    const root: SVGNode = {
      id: 'root',
      type: 'svg',
      attributes: new Map(),
      children: [],
      parent: null
    };
    
    const child1: SVGNode = {
      id: 'child1',
      type: 'rect',
      attributes: new Map(),
      children: [],
      parent: root
    };
    
    const child2: SVGNode = {
      id: 'child2',
      type: 'circle',
      attributes: new Map(),
      children: [],
      parent: root
    };
    
    root.children.push(child1, child2);
    
    const document: SVGDocument = {
      root: root,
      nodes: new Map([
        ['root', root],
        ['child1', child1],
        ['child2', child2]
      ]),
      version: 0
    };
    
    expect(document.nodes.size).toBe(3);
    expect(document.nodes.get('child1')).toBe(child1);
    expect(document.nodes.get('child2')).toBe(child2);
  });
  
  it('should track version changes', () => {
    const root: SVGNode = {
      id: 'root',
      type: 'svg',
      attributes: new Map(),
      children: [],
      parent: null
    };
    
    const document: SVGDocument = {
      root: root,
      nodes: new Map([['root', root]]),
      version: 0
    };
    
    // Simulate a version increment
    const updatedDocument: SVGDocument = {
      ...document,
      version: document.version + 1
    };
    
    expect(document.version).toBe(0);
    expect(updatedDocument.version).toBe(1);
  });
});

describe('ParseError type', () => {
  it('should create a parse error with location info', () => {
    const error: ParseError = {
      message: 'Unexpected token',
      line: 5,
      column: 12
    };
    
    expect(error.message).toBe('Unexpected token');
    expect(error.line).toBe(5);
    expect(error.column).toBe(12);
  });
});
