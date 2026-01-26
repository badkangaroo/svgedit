import { describe, it, expect } from 'vitest';
import type { SVGNode, SVGElementType, RectNode, CircleNode, PathNode } from './node.js';

describe('SVGNode types', () => {
  it('should create a basic SVG node', () => {
    const node: SVGNode = {
      id: 'node_1',
      type: 'rect',
      attributes: new Map([['x', '10'], ['y', '20']]),
      children: [],
      parent: null
    };
    
    expect(node.id).toBe('node_1');
    expect(node.type).toBe('rect');
    expect(node.attributes.get('x')).toBe('10');
    expect(node.children).toHaveLength(0);
    expect(node.parent).toBeNull();
  });
  
  it('should support discriminated union with RectNode', () => {
    const rectNode: RectNode = {
      id: 'rect_1',
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
    
    expect(rectNode.type).toBe('rect');
    
    // Type narrowing should work
    if (rectNode.type === 'rect') {
      expect(rectNode.attributes.get('width')).toBe('100');
    }
  });
  
  it('should support discriminated union with CircleNode', () => {
    const circleNode: CircleNode = {
      id: 'circle_1',
      type: 'circle',
      attributes: new Map([
        ['cx', '50'],
        ['cy', '50'],
        ['r', '25']
      ]),
      children: [],
      parent: null
    };
    
    expect(circleNode.type).toBe('circle');
  });
  
  it('should support discriminated union with PathNode', () => {
    const pathNode: PathNode = {
      id: 'path_1',
      type: 'path',
      attributes: new Map([
        ['d', 'M 10 10 L 20 20']
      ]),
      children: [],
      parent: null
    };
    
    expect(pathNode.type).toBe('path');
    expect(pathNode.attributes.get('d')).toBe('M 10 10 L 20 20');
  });
  
  it('should support parent-child relationships', () => {
    const parent: SVGNode = {
      id: 'parent_1',
      type: 'g',
      attributes: new Map(),
      children: [],
      parent: null
    };
    
    const child: SVGNode = {
      id: 'child_1',
      type: 'rect',
      attributes: new Map(),
      children: [],
      parent: parent
    };
    
    parent.children.push(child);
    
    expect(parent.children).toHaveLength(1);
    expect(parent.children[0]).toBe(child);
    expect(child.parent).toBe(parent);
  });
  
  it('should support all element types', () => {
    const types: SVGElementType[] = [
      'svg', 'rect', 'circle', 'ellipse', 'line',
      'polyline', 'polygon', 'path', 'text',
      'g', 'defs', 'use'
    ];
    
    types.forEach(type => {
      const node: SVGNode = {
        id: `node_${type}`,
        type: type,
        attributes: new Map(),
        children: [],
        parent: null
      };
      
      expect(node.type).toBe(type);
    });
  });
});
