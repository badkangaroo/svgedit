import { describe, it, expect } from 'vitest';
import { HierarchyIndex } from './hierarchy-index.js';
import type { SVGDocument, SVGNode } from '../types/index.js';

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

describe('HierarchyIndex', () => {
  describe('constructor and index building', () => {
    it('should build index for a simple document with root only', () => {
      const root = createNode('root', 'svg');
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getParent('root')).toBeNull();
      expect(index.getChildren('root')).toEqual([]);
    });

    it('should build index for a document with one level of children', () => {
      const child1 = createNode('child1', 'rect');
      const child2 = createNode('child2', 'circle');
      const root = createNode('root', 'svg', [child1, child2]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getParent('root')).toBeNull();
      expect(index.getChildren('root')).toEqual(['child1', 'child2']);
      expect(index.getParent('child1')).toBe('root');
      expect(index.getParent('child2')).toBe('root');
      expect(index.getChildren('child1')).toEqual([]);
      expect(index.getChildren('child2')).toEqual([]);
    });

    it('should build index for a deeply nested document', () => {
      const grandchild1 = createNode('grandchild1', 'rect');
      const grandchild2 = createNode('grandchild2', 'circle');
      const child1 = createNode('child1', 'g', [grandchild1, grandchild2]);
      const child2 = createNode('child2', 'rect');
      const root = createNode('root', 'svg', [child1, child2]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      // Root level
      expect(index.getParent('root')).toBeNull();
      expect(index.getChildren('root')).toEqual(['child1', 'child2']);

      // First level
      expect(index.getParent('child1')).toBe('root');
      expect(index.getChildren('child1')).toEqual(['grandchild1', 'grandchild2']);
      expect(index.getParent('child2')).toBe('root');
      expect(index.getChildren('child2')).toEqual([]);

      // Second level
      expect(index.getParent('grandchild1')).toBe('child1');
      expect(index.getChildren('grandchild1')).toEqual([]);
      expect(index.getParent('grandchild2')).toBe('child1');
      expect(index.getChildren('grandchild2')).toEqual([]);
    });

    it('should build index for a complex tree structure', () => {
      // Create a more complex tree:
      //       root
      //      /    \
      //    g1      g2
      //   / \       |
      //  r1  r2    r3
      //            |
      //           r4
      const r4 = createNode('r4', 'rect');
      const r3 = createNode('r3', 'rect', [r4]);
      const r2 = createNode('r2', 'rect');
      const r1 = createNode('r1', 'rect');
      const g2 = createNode('g2', 'g', [r3]);
      const g1 = createNode('g1', 'g', [r1, r2]);
      const root = createNode('root', 'svg', [g1, g2]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      // Verify all parent relationships
      expect(index.getParent('root')).toBeNull();
      expect(index.getParent('g1')).toBe('root');
      expect(index.getParent('g2')).toBe('root');
      expect(index.getParent('r1')).toBe('g1');
      expect(index.getParent('r2')).toBe('g1');
      expect(index.getParent('r3')).toBe('g2');
      expect(index.getParent('r4')).toBe('r3');

      // Verify all children relationships
      expect(index.getChildren('root')).toEqual(['g1', 'g2']);
      expect(index.getChildren('g1')).toEqual(['r1', 'r2']);
      expect(index.getChildren('g2')).toEqual(['r3']);
      expect(index.getChildren('r1')).toEqual([]);
      expect(index.getChildren('r2')).toEqual([]);
      expect(index.getChildren('r3')).toEqual(['r4']);
      expect(index.getChildren('r4')).toEqual([]);
    });
  });

  describe('getParent', () => {
    it('should return null for root node', () => {
      const root = createNode('root', 'svg');
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getParent('root')).toBeNull();
    });

    it('should return parent ID for child nodes', () => {
      const child = createNode('child', 'rect');
      const root = createNode('root', 'svg', [child]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getParent('child')).toBe('root');
    });

    it('should return null for non-existent node', () => {
      const root = createNode('root', 'svg');
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getParent('non-existent')).toBeNull();
    });

    it('should return correct parent for deeply nested nodes', () => {
      const grandchild = createNode('grandchild', 'rect');
      const child = createNode('child', 'g', [grandchild]);
      const root = createNode('root', 'svg', [child]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getParent('grandchild')).toBe('child');
      expect(index.getParent('child')).toBe('root');
    });
  });

  describe('getChildren', () => {
    it('should return empty array for node with no children', () => {
      const child = createNode('child', 'rect');
      const root = createNode('root', 'svg', [child]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getChildren('child')).toEqual([]);
    });

    it('should return array of child IDs for node with children', () => {
      const child1 = createNode('child1', 'rect');
      const child2 = createNode('child2', 'circle');
      const child3 = createNode('child3', 'rect');
      const root = createNode('root', 'svg', [child1, child2, child3]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getChildren('root')).toEqual(['child1', 'child2', 'child3']);
    });

    it('should return empty array for non-existent node', () => {
      const root = createNode('root', 'svg');
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getChildren('non-existent')).toEqual([]);
    });

    it('should preserve child order', () => {
      const children = [
        createNode('child1', 'rect'),
        createNode('child2', 'circle'),
        createNode('child3', 'rect'),
        createNode('child4', 'rect'),
        createNode('child5', 'circle')
      ];
      const root = createNode('root', 'svg', children);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getChildren('root')).toEqual([
        'child1', 'child2', 'child3', 'child4', 'child5'
      ]);
    });
  });

  describe('O(1) lookup performance', () => {
    it('should provide constant-time lookups for large documents', () => {
      // Create a document with many children
      const children: SVGNode[] = [];
      for (let i = 0; i < 1000; i++) {
        children.push(createNode(`child${i}`, 'rect'));
      }
      const root = createNode('root', 'svg', children);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      // Lookups should be fast regardless of position
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        index.getParent('child500');
        index.getChildren('root');
      }
      const end = performance.now();
      const duration = end - start;

      // 100 lookups should complete very quickly (< 10ms)
      expect(duration).toBeLessThan(10);
    });
  });

  describe('edge cases', () => {
    it('should handle document with single root node', () => {
      const root = createNode('root', 'svg');
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getParent('root')).toBeNull();
      expect(index.getChildren('root')).toEqual([]);
    });

    it('should handle node with many children', () => {
      const children: SVGNode[] = [];
      for (let i = 0; i < 100; i++) {
        children.push(createNode(`child${i}`, 'rect'));
      }
      const root = createNode('root', 'svg', children);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      const childIds = index.getChildren('root');
      expect(childIds.length).toBe(100);
      expect(childIds[0]).toBe('child0');
      expect(childIds[99]).toBe('child99');
    });

    it('should handle deeply nested linear chain', () => {
      // Create a chain: root -> n1 -> n2 -> n3 -> n4 -> n5
      let current = createNode('n5', 'rect');
      for (let i = 4; i >= 1; i--) {
        current = createNode(`n${i}`, 'g', [current]);
      }
      const root = createNode('root', 'svg', [current]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      // Verify the chain
      expect(index.getParent('n1')).toBe('root');
      expect(index.getParent('n2')).toBe('n1');
      expect(index.getParent('n3')).toBe('n2');
      expect(index.getParent('n4')).toBe('n3');
      expect(index.getParent('n5')).toBe('n4');

      // Verify children
      expect(index.getChildren('root')).toEqual(['n1']);
      expect(index.getChildren('n1')).toEqual(['n2']);
      expect(index.getChildren('n2')).toEqual(['n3']);
      expect(index.getChildren('n3')).toEqual(['n4']);
      expect(index.getChildren('n4')).toEqual(['n5']);
      expect(index.getChildren('n5')).toEqual([]);
    });
  });

  describe('getAncestors', () => {
    it('should return empty array for root node', () => {
      const root = createNode('root', 'svg');
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getAncestors('root')).toEqual([]);
    });

    it('should return empty array for non-existent node', () => {
      const root = createNode('root', 'svg');
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getAncestors('non-existent')).toEqual([]);
    });

    it('should return single ancestor for direct child of root', () => {
      const child = createNode('child', 'rect');
      const root = createNode('root', 'svg', [child]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getAncestors('child')).toEqual(['root']);
    });

    it('should return ancestors in order from parent to root', () => {
      const grandchild = createNode('grandchild', 'rect');
      const child = createNode('child', 'g', [grandchild]);
      const root = createNode('root', 'svg', [child]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getAncestors('grandchild')).toEqual(['child', 'root']);
    });

    it('should return all ancestors for deeply nested node', () => {
      // Create a chain: root -> n1 -> n2 -> n3 -> n4 -> n5
      let current = createNode('n5', 'rect');
      for (let i = 4; i >= 1; i--) {
        current = createNode(`n${i}`, 'g', [current]);
      }
      const root = createNode('root', 'svg', [current]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getAncestors('n5')).toEqual(['n4', 'n3', 'n2', 'n1', 'root']);
      expect(index.getAncestors('n3')).toEqual(['n2', 'n1', 'root']);
      expect(index.getAncestors('n1')).toEqual(['root']);
    });

    it('should return correct ancestors in complex tree', () => {
      // Create a tree:
      //       root
      //      /    \
      //    g1      g2
      //   / \       |
      //  r1  r2    r3
      //            |
      //           r4
      const r4 = createNode('r4', 'rect');
      const r3 = createNode('r3', 'rect', [r4]);
      const r2 = createNode('r2', 'rect');
      const r1 = createNode('r1', 'rect');
      const g2 = createNode('g2', 'g', [r3]);
      const g1 = createNode('g1', 'g', [r1, r2]);
      const root = createNode('root', 'svg', [g1, g2]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getAncestors('r1')).toEqual(['g1', 'root']);
      expect(index.getAncestors('r2')).toEqual(['g1', 'root']);
      expect(index.getAncestors('r4')).toEqual(['r3', 'g2', 'root']);
      expect(index.getAncestors('g1')).toEqual(['root']);
      expect(index.getAncestors('g2')).toEqual(['root']);
    });

    it('should handle siblings correctly (different ancestors)', () => {
      const child1 = createNode('child1', 'rect');
      const child2 = createNode('child2', 'circle');
      const root = createNode('root', 'svg', [child1, child2]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      // Siblings have the same ancestors
      expect(index.getAncestors('child1')).toEqual(['root']);
      expect(index.getAncestors('child2')).toEqual(['root']);
    });
  });

  describe('getDescendants', () => {
    it('should return empty array for leaf node', () => {
      const child = createNode('child', 'rect');
      const root = createNode('root', 'svg', [child]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getDescendants('child')).toEqual([]);
    });

    it('should return empty array for non-existent node', () => {
      const root = createNode('root', 'svg');
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getDescendants('non-existent')).toEqual([]);
    });

    it('should return direct children for node with one level', () => {
      const child1 = createNode('child1', 'rect');
      const child2 = createNode('child2', 'circle');
      const root = createNode('root', 'svg', [child1, child2]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getDescendants('root')).toEqual(['child1', 'child2']);
    });

    it('should return all descendants in depth-first order', () => {
      const grandchild1 = createNode('grandchild1', 'rect');
      const grandchild2 = createNode('grandchild2', 'circle');
      const child1 = createNode('child1', 'g', [grandchild1, grandchild2]);
      const child2 = createNode('child2', 'rect');
      const root = createNode('root', 'svg', [child1, child2]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      // Depth-first order: child1, then its children, then child2
      expect(index.getDescendants('root')).toEqual([
        'child1', 'grandchild1', 'grandchild2', 'child2'
      ]);
      expect(index.getDescendants('child1')).toEqual(['grandchild1', 'grandchild2']);
    });

    it('should return all descendants for deeply nested tree', () => {
      // Create a chain: root -> n1 -> n2 -> n3 -> n4 -> n5
      let current = createNode('n5', 'rect');
      for (let i = 4; i >= 1; i--) {
        current = createNode(`n${i}`, 'g', [current]);
      }
      const root = createNode('root', 'svg', [current]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getDescendants('root')).toEqual(['n1', 'n2', 'n3', 'n4', 'n5']);
      expect(index.getDescendants('n1')).toEqual(['n2', 'n3', 'n4', 'n5']);
      expect(index.getDescendants('n3')).toEqual(['n4', 'n5']);
      expect(index.getDescendants('n5')).toEqual([]);
    });

    it('should return all descendants in complex tree', () => {
      // Create a tree:
      //       root
      //      /    \
      //    g1      g2
      //   / \       |
      //  r1  r2    r3
      //            |
      //           r4
      const r4 = createNode('r4', 'rect');
      const r3 = createNode('r3', 'rect', [r4]);
      const r2 = createNode('r2', 'rect');
      const r1 = createNode('r1', 'rect');
      const g2 = createNode('g2', 'g', [r3]);
      const g1 = createNode('g1', 'g', [r1, r2]);
      const root = createNode('root', 'svg', [g1, g2]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      // All descendants of root
      expect(index.getDescendants('root')).toEqual([
        'g1', 'r1', 'r2', 'g2', 'r3', 'r4'
      ]);
      
      // Descendants of g1
      expect(index.getDescendants('g1')).toEqual(['r1', 'r2']);
      
      // Descendants of g2
      expect(index.getDescendants('g2')).toEqual(['r3', 'r4']);
      
      // Descendants of r3
      expect(index.getDescendants('r3')).toEqual(['r4']);
      
      // Leaf nodes have no descendants
      expect(index.getDescendants('r1')).toEqual([]);
      expect(index.getDescendants('r4')).toEqual([]);
    });

    it('should handle node with many descendants', () => {
      const children: SVGNode[] = [];
      for (let i = 0; i < 50; i++) {
        children.push(createNode(`child${i}`, 'rect'));
      }
      const root = createNode('root', 'svg', children);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      const descendants = index.getDescendants('root');
      expect(descendants.length).toBe(50);
      expect(descendants[0]).toBe('child0');
      expect(descendants[49]).toBe('child49');
    });

    it('should handle wide and deep tree', () => {
      // Create a tree with multiple levels and branches
      const leaf1 = createNode('leaf1', 'rect');
      const leaf2 = createNode('leaf2', 'rect');
      const branch1 = createNode('branch1', 'g', [leaf1, leaf2]);
      
      const leaf3 = createNode('leaf3', 'rect');
      const branch2 = createNode('branch2', 'g', [leaf3]);
      
      const level1 = createNode('level1', 'g', [branch1, branch2]);
      
      const leaf4 = createNode('leaf4', 'rect');
      const level2 = createNode('level2', 'g', [leaf4]);
      
      const root = createNode('root', 'svg', [level1, level2]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getDescendants('root')).toEqual([
        'level1', 'branch1', 'leaf1', 'leaf2', 'branch2', 'leaf3', 'level2', 'leaf4'
      ]);
      expect(index.getDescendants('level1')).toEqual([
        'branch1', 'leaf1', 'leaf2', 'branch2', 'leaf3'
      ]);
      expect(index.getDescendants('branch1')).toEqual(['leaf1', 'leaf2']);
    });
  });

  describe('ancestors and descendants relationship', () => {
    it('should have inverse relationship for parent-child', () => {
      const child = createNode('child', 'rect');
      const root = createNode('root', 'svg', [child]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      // child's ancestors include root
      expect(index.getAncestors('child')).toContain('root');
      
      // root's descendants include child
      expect(index.getDescendants('root')).toContain('child');
    });

    it('should maintain ancestor-descendant relationship in complex tree', () => {
      const grandchild = createNode('grandchild', 'rect');
      const child = createNode('child', 'g', [grandchild]);
      const root = createNode('root', 'svg', [child]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      // grandchild's ancestors
      const ancestors = index.getAncestors('grandchild');
      expect(ancestors).toEqual(['child', 'root']);
      
      // root's descendants
      const descendants = index.getDescendants('root');
      expect(descendants).toEqual(['child', 'grandchild']);
      
      // Every ancestor of grandchild should have grandchild in its descendants
      for (const ancestorId of ancestors) {
        expect(index.getDescendants(ancestorId)).toContain('grandchild');
      }
    });

    it('should verify no node is its own ancestor or descendant', () => {
      const child = createNode('child', 'rect');
      const root = createNode('root', 'svg', [child]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getAncestors('root')).not.toContain('root');
      expect(index.getAncestors('child')).not.toContain('child');
      expect(index.getDescendants('root')).not.toContain('root');
      expect(index.getDescendants('child')).not.toContain('child');
    });
  });

  describe('edge cases', () => {
    it('should handle document with single root node', () => {
      const root = createNode('root', 'svg');
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      expect(index.getParent('root')).toBeNull();
      expect(index.getChildren('root')).toEqual([]);
    });

    it('should handle node with many children', () => {
      const children: SVGNode[] = [];
      for (let i = 0; i < 100; i++) {
        children.push(createNode(`child${i}`, 'rect'));
      }
      const root = createNode('root', 'svg', children);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      const childIds = index.getChildren('root');
      expect(childIds.length).toBe(100);
      expect(childIds[0]).toBe('child0');
      expect(childIds[99]).toBe('child99');
    });

    it('should handle deeply nested linear chain', () => {
      // Create a chain: root -> n1 -> n2 -> n3 -> n4 -> n5
      let current = createNode('n5', 'rect');
      for (let i = 4; i >= 1; i--) {
        current = createNode(`n${i}`, 'g', [current]);
      }
      const root = createNode('root', 'svg', [current]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      // Verify the chain
      expect(index.getParent('n1')).toBe('root');
      expect(index.getParent('n2')).toBe('n1');
      expect(index.getParent('n3')).toBe('n2');
      expect(index.getParent('n4')).toBe('n3');
      expect(index.getParent('n5')).toBe('n4');

      // Verify children
      expect(index.getChildren('root')).toEqual(['n1']);
      expect(index.getChildren('n1')).toEqual(['n2']);
      expect(index.getChildren('n2')).toEqual(['n3']);
      expect(index.getChildren('n3')).toEqual(['n4']);
      expect(index.getChildren('n4')).toEqual(['n5']);
      expect(index.getChildren('n5')).toEqual([]);
    });
  });

  describe('immutability', () => {
    it('should not modify the original document', () => {
      const child = createNode('child', 'rect');
      const root = createNode('root', 'svg', [child]);
      const doc = createDocument(root);
      
      // Store original state
      const originalRootChildren = doc.root.children.length;
      const originalNodesSize = doc.nodes.size;

      // Create index
      new HierarchyIndex(doc);

      // Verify document is unchanged
      expect(doc.root.children.length).toBe(originalRootChildren);
      expect(doc.nodes.size).toBe(originalNodesSize);
    });

    it('should return new arrays for getChildren (not internal references)', () => {
      const child1 = createNode('child1', 'rect');
      const child2 = createNode('child2', 'circle');
      const root = createNode('root', 'svg', [child1, child2]);
      const doc = createDocument(root);
      const index = new HierarchyIndex(doc);

      const children1 = index.getChildren('root');
      const children2 = index.getChildren('root');

      // Should return equal arrays
      expect(children1).toEqual(children2);
      
      // But they should be different array instances
      expect(children1).not.toBe(children2);
    });
  });

  describe('incremental updates', () => {
    describe('addNode', () => {
      it('should add a single node to the index', () => {
        const child1 = createNode('child1', 'rect');
        const root = createNode('root', 'svg', [child1]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Add a new node
        const newNode = createNode('child2', 'circle');
        index.addNode(newNode, 'root');

        // Verify the new node is in the index
        expect(index.getParent('child2')).toBe('root');
        expect(index.getChildren('child2')).toEqual([]);
        expect(index.getChildren('root')).toEqual(['child1', 'child2']);
      });

      it('should add a node with children to the index', () => {
        const root = createNode('root', 'svg');
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Add a node with children
        const grandchild1 = createNode('grandchild1', 'rect');
        const grandchild2 = createNode('grandchild2', 'circle');
        const newNode = createNode('child1', 'g', [grandchild1, grandchild2]);
        index.addNode(newNode, 'root');

        // Verify the new node and its children are in the index
        expect(index.getParent('child1')).toBe('root');
        expect(index.getChildren('child1')).toEqual(['grandchild1', 'grandchild2']);
        expect(index.getParent('grandchild1')).toBe('child1');
        expect(index.getParent('grandchild2')).toBe('child1');
        expect(index.getChildren('root')).toEqual(['child1']);
      });

      it('should add a deeply nested subtree to the index', () => {
        const root = createNode('root', 'svg');
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Create a deeply nested subtree
        const leaf = createNode('leaf', 'rect');
        const level3 = createNode('level3', 'g', [leaf]);
        const level2 = createNode('level2', 'g', [level3]);
        const level1 = createNode('level1', 'g', [level2]);
        
        index.addNode(level1, 'root');

        // Verify all nodes are indexed correctly
        expect(index.getParent('level1')).toBe('root');
        expect(index.getParent('level2')).toBe('level1');
        expect(index.getParent('level3')).toBe('level2');
        expect(index.getParent('leaf')).toBe('level3');
        expect(index.getChildren('root')).toEqual(['level1']);
        expect(index.getChildren('level1')).toEqual(['level2']);
        expect(index.getChildren('level2')).toEqual(['level3']);
        expect(index.getChildren('level3')).toEqual(['leaf']);
      });

      it('should add multiple nodes to the same parent', () => {
        const root = createNode('root', 'svg');
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Add multiple nodes
        const node1 = createNode('node1', 'rect');
        const node2 = createNode('node2', 'circle');
        const node3 = createNode('node3', 'rect');
        
        index.addNode(node1, 'root');
        index.addNode(node2, 'root');
        index.addNode(node3, 'root');

        // Verify all nodes are in the index
        expect(index.getChildren('root')).toEqual(['node1', 'node2', 'node3']);
        expect(index.getParent('node1')).toBe('root');
        expect(index.getParent('node2')).toBe('root');
        expect(index.getParent('node3')).toBe('root');
      });

      it('should add a node to a non-root parent', () => {
        const child1 = createNode('child1', 'g');
        const root = createNode('root', 'svg', [child1]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Add a node to child1
        const grandchild = createNode('grandchild', 'rect');
        index.addNode(grandchild, 'child1');

        // Verify the node is added correctly
        expect(index.getParent('grandchild')).toBe('child1');
        expect(index.getChildren('child1')).toEqual(['grandchild']);
      });
    });

    describe('removeNode', () => {
      it('should remove a leaf node from the index', () => {
        const child1 = createNode('child1', 'rect');
        const child2 = createNode('child2', 'circle');
        const root = createNode('root', 'svg', [child1, child2]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Remove child1
        index.removeNode('child1');

        // Verify child1 is removed
        expect(index.getParent('child1')).toBeNull();
        expect(index.getChildren('child1')).toEqual([]);
        expect(index.getChildren('root')).toEqual(['child2']);
      });

      it('should remove a node with children from the index', () => {
        const grandchild1 = createNode('grandchild1', 'rect');
        const grandchild2 = createNode('grandchild2', 'circle');
        const child1 = createNode('child1', 'g', [grandchild1, grandchild2]);
        const root = createNode('root', 'svg', [child1]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Remove child1 (which has children)
        index.removeNode('child1');

        // Verify child1 and its children are removed
        expect(index.getParent('child1')).toBeNull();
        expect(index.getChildren('child1')).toEqual([]);
        expect(index.getParent('grandchild1')).toBeNull();
        expect(index.getParent('grandchild2')).toBeNull();
        expect(index.getChildren('root')).toEqual([]);
      });

      it('should remove a deeply nested subtree from the index', () => {
        const leaf = createNode('leaf', 'rect');
        const level3 = createNode('level3', 'g', [leaf]);
        const level2 = createNode('level2', 'g', [level3]);
        const level1 = createNode('level1', 'g', [level2]);
        const root = createNode('root', 'svg', [level1]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Remove level2 (which has nested children)
        index.removeNode('level2');

        // Verify level2 and all its descendants are removed
        expect(index.getParent('level2')).toBeNull();
        expect(index.getParent('level3')).toBeNull();
        expect(index.getParent('leaf')).toBeNull();
        expect(index.getChildren('level1')).toEqual([]);
        
        // Verify level1 is still in the index
        expect(index.getParent('level1')).toBe('root');
      });

      it('should remove the last child of a parent', () => {
        const child = createNode('child', 'rect');
        const root = createNode('root', 'svg', [child]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Remove the only child
        index.removeNode('child');

        // Verify parent has no children
        expect(index.getChildren('root')).toEqual([]);
        expect(index.getParent('child')).toBeNull();
      });

      it('should remove a middle child from a parent with multiple children', () => {
        const child1 = createNode('child1', 'rect');
        const child2 = createNode('child2', 'circle');
        const child3 = createNode('child3', 'rect');
        const root = createNode('root', 'svg', [child1, child2, child3]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Remove the middle child
        index.removeNode('child2');

        // Verify child2 is removed and order is preserved
        expect(index.getChildren('root')).toEqual(['child1', 'child3']);
        expect(index.getParent('child2')).toBeNull();
      });

      it('should handle removing a non-existent node gracefully', () => {
        const root = createNode('root', 'svg');
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Remove a non-existent node (should not throw)
        expect(() => index.removeNode('non-existent')).not.toThrow();
      });
    });

    describe('moveNode', () => {
      it('should move a node to a new parent', () => {
        const child1 = createNode('child1', 'rect');
        const group1 = createNode('group1', 'g');
        const group2 = createNode('group2', 'g');
        const root = createNode('root', 'svg', [group1, group2, child1]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Move child1 from root to group1
        index.moveNode('child1', 'group1');

        // Verify child1 is now under group1
        expect(index.getParent('child1')).toBe('group1');
        expect(index.getChildren('group1')).toEqual(['child1']);
        expect(index.getChildren('root')).toEqual(['group1', 'group2']);
      });

      it('should move a node with children to a new parent', () => {
        const grandchild = createNode('grandchild', 'rect');
        const child1 = createNode('child1', 'g', [grandchild]);
        const group1 = createNode('group1', 'g');
        const root = createNode('root', 'svg', [child1, group1]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Move child1 (with its children) to group1
        index.moveNode('child1', 'group1');

        // Verify child1 is under group1 and grandchild is still under child1
        expect(index.getParent('child1')).toBe('group1');
        expect(index.getParent('grandchild')).toBe('child1');
        expect(index.getChildren('group1')).toEqual(['child1']);
        expect(index.getChildren('child1')).toEqual(['grandchild']);
        expect(index.getChildren('root')).toEqual(['group1']);
      });

      it('should move a node between sibling groups', () => {
        const child = createNode('child', 'rect');
        const group1 = createNode('group1', 'g', [child]);
        const group2 = createNode('group2', 'g');
        const root = createNode('root', 'svg', [group1, group2]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Move child from group1 to group2
        index.moveNode('child', 'group2');

        // Verify child is now under group2
        expect(index.getParent('child')).toBe('group2');
        expect(index.getChildren('group1')).toEqual([]);
        expect(index.getChildren('group2')).toEqual(['child']);
      });

      it('should move a node to a deeply nested parent', () => {
        const child = createNode('child', 'rect');
        const level3 = createNode('level3', 'g');
        const level2 = createNode('level2', 'g', [level3]);
        const level1 = createNode('level1', 'g', [level2]);
        const root = createNode('root', 'svg', [level1, child]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Move child to level3
        index.moveNode('child', 'level3');

        // Verify child is now under level3
        expect(index.getParent('child')).toBe('level3');
        expect(index.getChildren('level3')).toEqual(['child']);
        expect(index.getChildren('root')).toEqual(['level1']);
      });

      it('should preserve child order when moving nodes', () => {
        const child1 = createNode('child1', 'rect');
        const child2 = createNode('child2', 'circle');
        const child3 = createNode('child3', 'rect');
        const group = createNode('group', 'g');
        const root = createNode('root', 'svg', [child1, child2, child3, group]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Move children to group one by one
        index.moveNode('child1', 'group');
        index.moveNode('child3', 'group');

        // Verify order is preserved
        expect(index.getChildren('group')).toEqual(['child1', 'child3']);
        expect(index.getChildren('root')).toEqual(['child2', 'group']);
      });

      it('should handle moving a node to a parent that has no children', () => {
        const child = createNode('child', 'rect');
        const emptyGroup = createNode('emptyGroup', 'g');
        const root = createNode('root', 'svg', [child, emptyGroup]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Move child to empty group
        index.moveNode('child', 'emptyGroup');

        // Verify child is now under emptyGroup
        expect(index.getParent('child')).toBe('emptyGroup');
        expect(index.getChildren('emptyGroup')).toEqual(['child']);
        expect(index.getChildren('root')).toEqual(['emptyGroup']);
      });
    });

    describe('combined operations', () => {
      it('should handle add, move, and remove operations in sequence', () => {
        const child1 = createNode('child1', 'rect');
        const group = createNode('group', 'g');
        const root = createNode('root', 'svg', [child1, group]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Add a new node
        const child2 = createNode('child2', 'circle');
        index.addNode(child2, 'root');
        expect(index.getChildren('root')).toEqual(['child1', 'group', 'child2']);

        // Move child1 to group
        index.moveNode('child1', 'group');
        expect(index.getChildren('group')).toEqual(['child1']);
        expect(index.getChildren('root')).toEqual(['group', 'child2']);

        // Remove child2
        index.removeNode('child2');
        expect(index.getChildren('root')).toEqual(['group']);
        expect(index.getParent('child2')).toBeNull();

        // Verify final state
        expect(index.getParent('child1')).toBe('group');
        expect(index.getParent('group')).toBe('root');
      });

      it('should maintain consistency after multiple operations', () => {
        const root = createNode('root', 'svg');
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Build a tree incrementally
        const group1 = createNode('group1', 'g');
        const group2 = createNode('group2', 'g');
        index.addNode(group1, 'root');
        index.addNode(group2, 'root');

        const rect1 = createNode('rect1', 'rect');
        const rect2 = createNode('rect2', 'rect');
        index.addNode(rect1, 'group1');
        index.addNode(rect2, 'group1');

        // Move rect1 to group2
        index.moveNode('rect1', 'group2');

        // Remove group1
        index.removeNode('group1');

        // Verify final state
        expect(index.getChildren('root')).toEqual(['group2']);
        expect(index.getChildren('group2')).toEqual(['rect1']);
        expect(index.getParent('rect1')).toBe('group2');
        expect(index.getParent('rect2')).toBeNull();
        expect(index.getParent('group1')).toBeNull();
      });
    });

    describe('performance characteristics', () => {
      it('should perform addNode in O(k) time where k is descendants', () => {
        const root = createNode('root', 'svg');
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Create a node with many children
        const children: SVGNode[] = [];
        for (let i = 0; i < 100; i++) {
          children.push(createNode(`child${i}`, 'rect'));
        }
        const group = createNode('group', 'g', children);

        // Add should be fast
        const start = performance.now();
        index.addNode(group, 'root');
        const duration = performance.now() - start;

        // Should complete quickly (< 10ms for 100 nodes)
        expect(duration).toBeLessThan(10);
        expect(index.getChildren('group').length).toBe(100);
      });

      it('should perform removeNode in O(k) time where k is descendants', () => {
        // Create a node with many children
        const children: SVGNode[] = [];
        for (let i = 0; i < 100; i++) {
          children.push(createNode(`child${i}`, 'rect'));
        }
        const group = createNode('group', 'g', children);
        const root = createNode('root', 'svg', [group]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Remove should be fast
        const start = performance.now();
        index.removeNode('group');
        const duration = performance.now() - start;

        // Should complete quickly (< 10ms for 100 nodes)
        expect(duration).toBeLessThan(10);
        expect(index.getChildren('root')).toEqual([]);
      });

      it('should perform moveNode in O(1) time', () => {
        const child = createNode('child', 'rect');
        const group1 = createNode('group1', 'g', [child]);
        const group2 = createNode('group2', 'g');
        const root = createNode('root', 'svg', [group1, group2]);
        const doc = createDocument(root);
        const index = new HierarchyIndex(doc);

        // Move should be very fast (constant time)
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
          index.moveNode('child', i % 2 === 0 ? 'group1' : 'group2');
        }
        const duration = performance.now() - start;

        // 1000 moves should complete quickly (< 20ms)
        expect(duration).toBeLessThan(20);
      });
    });
  });
});
