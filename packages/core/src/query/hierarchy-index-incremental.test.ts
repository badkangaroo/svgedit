import { describe, it, expect } from 'vitest';
import { HierarchyIndex } from './hierarchy-index.js';
import type { SVGDocument, SVGNode } from '../types/index.js';

/**
 * Integration tests demonstrating incremental index updates in real-world scenarios.
 * These tests show how the index can be updated efficiently without rebuilding.
 */

/**
 * Helper function to create a test SVG node.
 */
function createNode(
  id: string,
  type: 'svg' | 'rect' | 'circle' | 'g' = 'rect',
  children: SVGNode[] = []
): SVGNode {
  const node: SVGNode = {
    id,
    type,
    attributes: new Map(),
    children,
    parent: null
  };

  // Set parent references for children
  for (const child of children) {
    child.parent = node;
  }

  return node;
}

/**
 * Helper function to create a test SVG document.
 */
function createDocument(root: SVGNode): SVGDocument {
  const nodes = new Map<string, SVGNode>();
  
  // Recursively add all nodes to the map
  function addNode(node: SVGNode): void {
    nodes.set(node.id, node);
    for (const child of node.children) {
      addNode(child);
    }
  }
  
  addNode(root);

  return {
    root,
    nodes,
    version: 1
  };
}

describe('HierarchyIndex - Incremental Updates Integration', () => {
  it('should efficiently handle building a document incrementally', () => {
    // Start with an empty document
    const root = createNode('root', 'svg');
    const doc = createDocument(root);
    const index = new HierarchyIndex(doc);

    // Add a toolbar group
    const toolbar = createNode('toolbar', 'g');
    index.addNode(toolbar, 'root');

    // Add toolbar buttons
    const button1 = createNode('button1', 'rect');
    const button2 = createNode('button2', 'rect');
    const button3 = createNode('button3', 'rect');
    index.addNode(button1, 'toolbar');
    index.addNode(button2, 'toolbar');
    index.addNode(button3, 'toolbar');

    // Add a canvas group
    const canvas = createNode('canvas', 'g');
    index.addNode(canvas, 'root');

    // Add shapes to canvas
    const shape1 = createNode('shape1', 'circle');
    const shape2 = createNode('shape2', 'rect');
    index.addNode(shape1, 'canvas');
    index.addNode(shape2, 'canvas');

    // Verify the structure
    expect(index.getChildren('root')).toEqual(['toolbar', 'canvas']);
    expect(index.getChildren('toolbar')).toEqual(['button1', 'button2', 'button3']);
    expect(index.getChildren('canvas')).toEqual(['shape1', 'shape2']);
  });

  it('should handle moving shapes between layers', () => {
    // Create a document with two layers
    const shape1 = createNode('shape1', 'rect');
    const shape2 = createNode('shape2', 'circle');
    const layer1 = createNode('layer1', 'g', [shape1, shape2]);
    const layer2 = createNode('layer2', 'g');
    const root = createNode('root', 'svg', [layer1, layer2]);
    const doc = createDocument(root);
    const index = new HierarchyIndex(doc);

    // Move shape1 from layer1 to layer2
    index.moveNode('shape1', 'layer2');

    // Verify the move
    expect(index.getChildren('layer1')).toEqual(['shape2']);
    expect(index.getChildren('layer2')).toEqual(['shape1']);
    expect(index.getParent('shape1')).toBe('layer2');
  });

  it('should handle deleting a group with all its contents', () => {
    // Create a document with a group containing shapes
    const shape1 = createNode('shape1', 'rect');
    const shape2 = createNode('shape2', 'circle');
    const shape3 = createNode('shape3', 'rect');
    const group = createNode('group', 'g', [shape1, shape2, shape3]);
    const root = createNode('root', 'svg', [group]);
    const doc = createDocument(root);
    const index = new HierarchyIndex(doc);

    // Delete the group (should remove all children too)
    index.removeNode('group');

    // Verify everything is removed
    expect(index.getChildren('root')).toEqual([]);
    expect(index.getParent('group')).toBeNull();
    expect(index.getParent('shape1')).toBeNull();
    expect(index.getParent('shape2')).toBeNull();
    expect(index.getParent('shape3')).toBeNull();
  });

  it('should handle complex editing workflow', () => {
    // Start with a simple document
    const rect1 = createNode('rect1', 'rect');
    const rect2 = createNode('rect2', 'rect');
    const root = createNode('root', 'svg', [rect1, rect2]);
    const doc = createDocument(root);
    const index = new HierarchyIndex(doc);

    // User creates a group
    const group = createNode('group', 'g');
    index.addNode(group, 'root');

    // User moves rect1 into the group
    index.moveNode('rect1', 'group');

    // User adds a new circle to the group
    const circle = createNode('circle1', 'circle');
    index.addNode(circle, 'group');

    // User moves rect2 into the group
    index.moveNode('rect2', 'group');

    // Verify final structure
    expect(index.getChildren('root')).toEqual(['group']);
    expect(index.getChildren('group')).toEqual(['rect1', 'circle1', 'rect2']);
    expect(index.getParent('rect1')).toBe('group');
    expect(index.getParent('rect2')).toBe('group');
    expect(index.getParent('circle1')).toBe('group');

    // User decides to ungroup - moves all children back to root
    index.moveNode('rect1', 'root');
    index.moveNode('circle1', 'root');
    index.moveNode('rect2', 'root');

    // User deletes the empty group
    index.removeNode('group');

    // Verify final structure
    expect(index.getChildren('root')).toEqual(['rect1', 'circle1', 'rect2']);
    expect(index.getParent('group')).toBeNull();
  });

  it('should maintain performance with many incremental updates', () => {
    // Create a document with a root
    const root = createNode('root', 'svg');
    const doc = createDocument(root);
    const index = new HierarchyIndex(doc);

    // Perform many incremental updates
    const start = performance.now();

    // Add 100 nodes
    for (let i = 0; i < 100; i++) {
      const node = createNode(`node${i}`, 'rect');
      index.addNode(node, 'root');
    }

    // Create 10 groups and move 10 nodes into each
    for (let g = 0; g < 10; g++) {
      const group = createNode(`group${g}`, 'g');
      index.addNode(group, 'root');
      
      for (let i = 0; i < 10; i++) {
        const nodeId = `node${g * 10 + i}`;
        index.moveNode(nodeId, `group${g}`);
      }
    }

    // Remove 5 groups
    for (let g = 0; g < 5; g++) {
      index.removeNode(`group${g}`);
    }

    const duration = performance.now() - start;

    // All operations should complete quickly (< 50ms)
    expect(duration).toBeLessThan(50);

    // Verify final structure
    expect(index.getChildren('root').length).toBe(5); // 5 remaining groups
    for (let g = 5; g < 10; g++) {
      expect(index.getChildren(`group${g}`).length).toBe(10);
    }
  });

  it('should handle nested group operations', () => {
    // Create a document with nested groups
    const shape = createNode('shape', 'rect');
    const innerGroup = createNode('innerGroup', 'g', [shape]);
    const middleGroup = createNode('middleGroup', 'g', [innerGroup]);
    const outerGroup = createNode('outerGroup', 'g', [middleGroup]);
    const root = createNode('root', 'svg', [outerGroup]);
    const doc = createDocument(root);
    const index = new HierarchyIndex(doc);

    // Move the inner group to root (flattening the hierarchy)
    index.moveNode('innerGroup', 'root');

    // Verify the structure
    expect(index.getChildren('root')).toEqual(['outerGroup', 'innerGroup']);
    expect(index.getChildren('middleGroup')).toEqual([]);
    expect(index.getChildren('innerGroup')).toEqual(['shape']);
    expect(index.getParent('innerGroup')).toBe('root');

    // Remove the now-empty middle group
    index.removeNode('middleGroup');

    // Verify the structure
    expect(index.getChildren('outerGroup')).toEqual([]);
    expect(index.getParent('middleGroup')).toBeNull();
  });

  it('should handle adding a complex subtree in one operation', () => {
    // Create a simple document
    const root = createNode('root', 'svg');
    const doc = createDocument(root);
    const index = new HierarchyIndex(doc);

    // Create a complex subtree to add
    const leaf1 = createNode('leaf1', 'rect');
    const leaf2 = createNode('leaf2', 'circle');
    const leaf3 = createNode('leaf3', 'rect');
    const branch1 = createNode('branch1', 'g', [leaf1, leaf2]);
    const branch2 = createNode('branch2', 'g', [leaf3]);
    const tree = createNode('tree', 'g', [branch1, branch2]);

    // Add the entire subtree in one operation
    index.addNode(tree, 'root');

    // Verify the entire structure is indexed
    expect(index.getChildren('root')).toEqual(['tree']);
    expect(index.getChildren('tree')).toEqual(['branch1', 'branch2']);
    expect(index.getChildren('branch1')).toEqual(['leaf1', 'leaf2']);
    expect(index.getChildren('branch2')).toEqual(['leaf3']);
    expect(index.getParent('leaf1')).toBe('branch1');
    expect(index.getParent('leaf2')).toBe('branch1');
    expect(index.getParent('leaf3')).toBe('branch2');
  });
});
