/**
 * Unit tests for immutable update utilities.
 * 
 * These tests verify that:
 * 1. Updates return new instances (immutability)
 * 2. Original documents are unchanged
 * 3. Version counter increments on changes
 * 4. Node relationships are maintained correctly
 */

import { describe, it, expect } from 'vitest';
import type { SVGDocument, SVGNode } from '../types/index.js';
import {
  updateNode,
  updateNodeAttribute,
  removeNodeAttribute,
  addChildNode,
  removeChildNode,
  moveNode,
  cloneNode
} from './immutable-updates.js';

/**
 * Helper function to create a test document with a simple structure.
 */
function createTestDocument(): SVGDocument {
  const root: SVGNode = {
    id: 'node_1',
    type: 'svg',
    attributes: new Map([['width', '100'], ['height', '100']]),
    children: [],
    parent: null
  };
  
  const child1: SVGNode = {
    id: 'node_2',
    type: 'rect',
    attributes: new Map([['x', '10'], ['y', '10'], ['width', '50'], ['height', '50']]),
    children: [],
    parent: root
  };
  
  const child2: SVGNode = {
    id: 'node_3',
    type: 'circle',
    attributes: new Map([['cx', '50'], ['cy', '50'], ['r', '25']]),
    children: [],
    parent: root
  };
  
  root.children = [child1, child2];
  
  const nodes = new Map<string, SVGNode>([
    ['node_1', root],
    ['node_2', child1],
    ['node_3', child2]
  ]);
  
  return {
    root,
    nodes,
    version: 0
  };
}

describe('updateNode', () => {
  it('should return a new document instance', () => {
    const doc = createTestDocument();
    const newDoc = updateNode(doc, 'node_2', (node) => ({
      ...node,
      attributes: new Map([...node.attributes, ['fill', 'red']])
    }));
    
    expect(newDoc).not.toBe(doc);
  });
  
  it('should increment version counter', () => {
    const doc = createTestDocument();
    const newDoc = updateNode(doc, 'node_2', (node) => ({
      ...node,
      attributes: new Map([...node.attributes, ['fill', 'red']])
    }));
    
    expect(newDoc.version).toBe(doc.version + 1);
  });
  
  it('should not modify the original document', () => {
    const doc = createTestDocument();
    const originalVersion = doc.version;
    const originalNode = doc.nodes.get('node_2')!;
    const originalAttributesSize = originalNode.attributes.size;
    
    updateNode(doc, 'node_2', (node) => ({
      ...node,
      attributes: new Map([...node.attributes, ['fill', 'red']])
    }));
    
    expect(doc.version).toBe(originalVersion);
    expect(doc.nodes.get('node_2')!.attributes.size).toBe(originalAttributesSize);
  });
  
  it('should update the specified node', () => {
    const doc = createTestDocument();
    const newDoc = updateNode(doc, 'node_2', (node) => ({
      ...node,
      attributes: new Map([...node.attributes, ['fill', 'red']])
    }));
    
    const updatedNode = newDoc.nodes.get('node_2')!;
    expect(updatedNode.attributes.get('fill')).toBe('red');
  });
  
  it('should return original document if node not found', () => {
    const doc = createTestDocument();
    const newDoc = updateNode(doc, 'nonexistent', (node) => ({
      ...node,
      attributes: new Map([...node.attributes, ['fill', 'red']])
    }));
    
    expect(newDoc).toBe(doc);
    expect(newDoc.version).toBe(doc.version);
  });
});

describe('updateNodeAttribute', () => {
  it('should update an existing attribute', () => {
    const doc = createTestDocument();
    const newDoc = updateNodeAttribute(doc, 'node_2', 'x', '20');
    
    const updatedNode = newDoc.nodes.get('node_2')!;
    expect(updatedNode.attributes.get('x')).toBe('20');
  });
  
  it('should add a new attribute', () => {
    const doc = createTestDocument();
    const newDoc = updateNodeAttribute(doc, 'node_2', 'fill', 'blue');
    
    const updatedNode = newDoc.nodes.get('node_2')!;
    expect(updatedNode.attributes.get('fill')).toBe('blue');
  });
  
  it('should increment version counter', () => {
    const doc = createTestDocument();
    const newDoc = updateNodeAttribute(doc, 'node_2', 'fill', 'blue');
    
    expect(newDoc.version).toBe(doc.version + 1);
  });
  
  it('should not modify original document', () => {
    const doc = createTestDocument();
    const originalNode = doc.nodes.get('node_2')!;
    const originalX = originalNode.attributes.get('x');
    
    updateNodeAttribute(doc, 'node_2', 'x', '20');
    
    expect(doc.nodes.get('node_2')!.attributes.get('x')).toBe(originalX);
  });
  
  it('should return original document if node not found', () => {
    const doc = createTestDocument();
    const newDoc = updateNodeAttribute(doc, 'nonexistent', 'fill', 'red');
    
    expect(newDoc).toBe(doc);
  });
});

describe('removeNodeAttribute', () => {
  it('should remove an existing attribute', () => {
    const doc = createTestDocument();
    const newDoc = removeNodeAttribute(doc, 'node_2', 'x');
    
    const updatedNode = newDoc.nodes.get('node_2')!;
    expect(updatedNode.attributes.has('x')).toBe(false);
  });
  
  it('should increment version counter', () => {
    const doc = createTestDocument();
    const newDoc = removeNodeAttribute(doc, 'node_2', 'x');
    
    expect(newDoc.version).toBe(doc.version + 1);
  });
  
  it('should not modify original document', () => {
    const doc = createTestDocument();
    const originalNode = doc.nodes.get('node_2')!;
    const hadAttribute = originalNode.attributes.has('x');
    
    removeNodeAttribute(doc, 'node_2', 'x');
    
    expect(doc.nodes.get('node_2')!.attributes.has('x')).toBe(hadAttribute);
  });
  
  it('should handle removing non-existent attribute gracefully', () => {
    const doc = createTestDocument();
    const newDoc = removeNodeAttribute(doc, 'node_2', 'nonexistent');
    
    expect(newDoc.version).toBe(doc.version + 1);
  });
  
  it('should return original document if node not found', () => {
    const doc = createTestDocument();
    const newDoc = removeNodeAttribute(doc, 'nonexistent', 'x');
    
    expect(newDoc).toBe(doc);
  });
});

describe('addChildNode', () => {
  it('should add a child to the parent', () => {
    const doc = createTestDocument();
    const newChild: SVGNode = {
      id: 'node_4',
      type: 'ellipse',
      attributes: new Map([['cx', '75'], ['cy', '75'], ['rx', '20'], ['ry', '10']]),
      children: [],
      parent: null
    };
    
    const newDoc = addChildNode(doc, 'node_1', newChild);
    
    const parent = newDoc.nodes.get('node_1')!;
    expect(parent.children.length).toBe(3);
    expect(parent.children[2].id).toBe('node_4');
  });
  
  it('should set the parent reference on the child', () => {
    const doc = createTestDocument();
    const newChild: SVGNode = {
      id: 'node_4',
      type: 'ellipse',
      attributes: new Map(),
      children: [],
      parent: null
    };
    
    const newDoc = addChildNode(doc, 'node_1', newChild);
    
    const addedChild = newDoc.nodes.get('node_4')!;
    expect(addedChild.parent).not.toBeNull();
    expect(addedChild.parent!.id).toBe('node_1');
  });
  
  it('should add child at specified index', () => {
    const doc = createTestDocument();
    const newChild: SVGNode = {
      id: 'node_4',
      type: 'ellipse',
      attributes: new Map(),
      children: [],
      parent: null
    };
    
    const newDoc = addChildNode(doc, 'node_1', newChild, 0);
    
    const parent = newDoc.nodes.get('node_1')!;
    expect(parent.children[0].id).toBe('node_4');
    expect(parent.children[1].id).toBe('node_2');
  });
  
  it('should increment version counter', () => {
    const doc = createTestDocument();
    const newChild: SVGNode = {
      id: 'node_4',
      type: 'ellipse',
      attributes: new Map(),
      children: [],
      parent: null
    };
    
    const newDoc = addChildNode(doc, 'node_1', newChild);
    
    expect(newDoc.version).toBe(doc.version + 1);
  });
  
  it('should not modify original document', () => {
    const doc = createTestDocument();
    const originalChildCount = doc.root.children.length;
    const newChild: SVGNode = {
      id: 'node_4',
      type: 'ellipse',
      attributes: new Map(),
      children: [],
      parent: null
    };
    
    addChildNode(doc, 'node_1', newChild);
    
    expect(doc.root.children.length).toBe(originalChildCount);
  });
  
  it('should return original document if parent not found', () => {
    const doc = createTestDocument();
    const newChild: SVGNode = {
      id: 'node_4',
      type: 'ellipse',
      attributes: new Map(),
      children: [],
      parent: null
    };
    
    const newDoc = addChildNode(doc, 'nonexistent', newChild);
    
    expect(newDoc).toBe(doc);
  });
});

describe('removeChildNode', () => {
  it('should remove the node from its parent', () => {
    const doc = createTestDocument();
    const newDoc = removeChildNode(doc, 'node_2');
    
    const parent = newDoc.nodes.get('node_1')!;
    expect(parent.children.length).toBe(1);
    expect(parent.children[0].id).toBe('node_3');
  });
  
  it('should remove the node from the nodes map', () => {
    const doc = createTestDocument();
    const newDoc = removeChildNode(doc, 'node_2');
    
    expect(newDoc.nodes.has('node_2')).toBe(false);
  });
  
  it('should remove descendants from the nodes map', () => {
    const doc = createTestDocument();
    
    // Add a grandchild
    const grandchild: SVGNode = {
      id: 'node_4',
      type: 'rect',
      attributes: new Map(),
      children: [],
      parent: doc.nodes.get('node_2')!
    };
    
    const child2 = doc.nodes.get('node_2')!;
    child2.children.push(grandchild);
    doc.nodes.set('node_4', grandchild);
    
    const newDoc = removeChildNode(doc, 'node_2');
    
    expect(newDoc.nodes.has('node_2')).toBe(false);
    expect(newDoc.nodes.has('node_4')).toBe(false);
  });
  
  it('should increment version counter', () => {
    const doc = createTestDocument();
    const newDoc = removeChildNode(doc, 'node_2');
    
    expect(newDoc.version).toBe(doc.version + 1);
  });
  
  it('should not modify original document', () => {
    const doc = createTestDocument();
    const originalChildCount = doc.root.children.length;
    const originalNodesSize = doc.nodes.size;
    
    removeChildNode(doc, 'node_2');
    
    expect(doc.root.children.length).toBe(originalChildCount);
    expect(doc.nodes.size).toBe(originalNodesSize);
  });
  
  it('should return original document if node not found', () => {
    const doc = createTestDocument();
    const newDoc = removeChildNode(doc, 'nonexistent');
    
    expect(newDoc).toBe(doc);
  });
  
  it('should return original document if node has no parent', () => {
    const doc = createTestDocument();
    const newDoc = removeChildNode(doc, 'node_1'); // root has no parent
    
    expect(newDoc).toBe(doc);
  });
});

describe('moveNode', () => {
  it('should move node to new parent', () => {
    const doc = createTestDocument();
    
    // Add a group to move node_2 into
    const group: SVGNode = {
      id: 'node_4',
      type: 'g',
      attributes: new Map(),
      children: [],
      parent: doc.root
    };
    doc.root.children.push(group);
    doc.nodes.set('node_4', group);
    
    const newDoc = moveNode(doc, 'node_2', 'node_4');
    
    const oldParent = newDoc.nodes.get('node_1')!;
    const newParent = newDoc.nodes.get('node_4')!;
    const movedNode = newDoc.nodes.get('node_2')!;
    
    expect(oldParent.children.length).toBe(2); // node_3 and node_4
    expect(newParent.children.length).toBe(1);
    expect(newParent.children[0].id).toBe('node_2');
    expect(movedNode.parent!.id).toBe('node_4');
  });
  
  it('should move node to specific index in new parent', () => {
    const doc = createTestDocument();
    
    // Add a group with existing children
    const group: SVGNode = {
      id: 'node_4',
      type: 'g',
      attributes: new Map(),
      children: [],
      parent: doc.root
    };
    
    const groupChild: SVGNode = {
      id: 'node_5',
      type: 'rect',
      attributes: new Map(),
      children: [],
      parent: group
    };
    
    group.children.push(groupChild);
    doc.root.children.push(group);
    doc.nodes.set('node_4', group);
    doc.nodes.set('node_5', groupChild);
    
    const newDoc = moveNode(doc, 'node_2', 'node_4', 0);
    
    const newParent = newDoc.nodes.get('node_4')!;
    expect(newParent.children[0].id).toBe('node_2');
    expect(newParent.children[1].id).toBe('node_5');
  });
  
  it('should increment version counter', () => {
    const doc = createTestDocument();
    
    const group: SVGNode = {
      id: 'node_4',
      type: 'g',
      attributes: new Map(),
      children: [],
      parent: doc.root
    };
    doc.root.children.push(group);
    doc.nodes.set('node_4', group);
    
    const newDoc = moveNode(doc, 'node_2', 'node_4');
    
    expect(newDoc.version).toBe(doc.version + 1);
  });
  
  it('should not modify original document', () => {
    const doc = createTestDocument();
    
    const group: SVGNode = {
      id: 'node_4',
      type: 'g',
      attributes: new Map(),
      children: [],
      parent: doc.root
    };
    doc.root.children.push(group);
    doc.nodes.set('node_4', group);
    
    const originalRootChildCount = doc.root.children.length;
    const originalNode2Parent = doc.nodes.get('node_2')!.parent!.id;
    
    moveNode(doc, 'node_2', 'node_4');
    
    expect(doc.root.children.length).toBe(originalRootChildCount);
    expect(doc.nodes.get('node_2')!.parent!.id).toBe(originalNode2Parent);
  });
  
  it('should return original document if node already in target parent', () => {
    const doc = createTestDocument();
    const newDoc = moveNode(doc, 'node_2', 'node_1');
    
    expect(newDoc).toBe(doc);
  });
  
  it('should return original document if node not found', () => {
    const doc = createTestDocument();
    const newDoc = moveNode(doc, 'nonexistent', 'node_1');
    
    expect(newDoc).toBe(doc);
  });
  
  it('should return original document if new parent not found', () => {
    const doc = createTestDocument();
    const newDoc = moveNode(doc, 'node_2', 'nonexistent');
    
    expect(newDoc).toBe(doc);
  });
});

describe('cloneNode', () => {
  it('should create a new node with a new ID', () => {
    const doc = createTestDocument();
    const node = doc.nodes.get('node_2')!;
    
    let counter = 100;
    const cloned = cloneNode(node, () => `node_${++counter}`);
    
    expect(cloned.id).not.toBe(node.id);
    expect(cloned.id).toBe('node_101');
  });
  
  it('should copy all attributes', () => {
    const doc = createTestDocument();
    const node = doc.nodes.get('node_2')!;
    
    let counter = 100;
    const cloned = cloneNode(node, () => `node_${++counter}`);
    
    expect(cloned.attributes.size).toBe(node.attributes.size);
    expect(cloned.attributes.get('x')).toBe(node.attributes.get('x'));
    expect(cloned.attributes.get('y')).toBe(node.attributes.get('y'));
  });
  
  it('should clone all children with new IDs', () => {
    const doc = createTestDocument();
    const root = doc.root;
    
    let counter = 100;
    const cloned = cloneNode(root, () => `node_${++counter}`);
    
    expect(cloned.children.length).toBe(root.children.length);
    expect(cloned.children[0].id).not.toBe(root.children[0].id);
    expect(cloned.children[1].id).not.toBe(root.children[1].id);
  });
  
  it('should set parent references correctly for cloned children', () => {
    const doc = createTestDocument();
    const root = doc.root;
    
    let counter = 100;
    const cloned = cloneNode(root, () => `node_${++counter}`);
    
    expect(cloned.children[0].parent).toBe(cloned);
    expect(cloned.children[1].parent).toBe(cloned);
  });
  
  it('should set parent to null for the cloned root', () => {
    const doc = createTestDocument();
    const node = doc.nodes.get('node_2')!;
    
    let counter = 100;
    const cloned = cloneNode(node, () => `node_${++counter}`);
    
    expect(cloned.parent).toBeNull();
  });
  
  it('should not modify the original node', () => {
    const doc = createTestDocument();
    const node = doc.nodes.get('node_2')!;
    const originalId = node.id;
    const originalAttributesSize = node.attributes.size;
    
    let counter = 100;
    cloneNode(node, () => `node_${++counter}`);
    
    expect(node.id).toBe(originalId);
    expect(node.attributes.size).toBe(originalAttributesSize);
  });
});
