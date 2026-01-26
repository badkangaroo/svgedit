import { describe, it, expect } from 'vitest';
import { Parser } from '../document/parser.js';
import { QueryEngine } from './selector.js';
import { HierarchyIndex } from './hierarchy-index.js';

describe('QueryEngine Integration', () => {
  it('should query nodes by ID from a parsed document', () => {
    const parser = new Parser();
    const queryEngine = new QueryEngine();

    const svgText = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect x="10" y="10" width="50" height="50" fill="red" />
        <circle cx="100" cy="100" r="30" fill="blue" />
        <g>
          <rect x="150" y="150" width="40" height="40" fill="green" />
        </g>
      </svg>
    `;

    const result = parser.parse(svgText);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const document = result.value;

    // Query the root node
    const rootNode = queryEngine.queryById(document, document.root.id);
    expect(rootNode).toBe(document.root);
    expect(rootNode?.type).toBe('svg');

    // Query child nodes
    const firstChild = document.root.children[0];
    const foundFirstChild = queryEngine.queryById(document, firstChild.id);
    expect(foundFirstChild).toBe(firstChild);
    expect(foundFirstChild?.type).toBe('rect');

    const secondChild = document.root.children[1];
    const foundSecondChild = queryEngine.queryById(document, secondChild.id);
    expect(foundSecondChild).toBe(secondChild);
    expect(foundSecondChild?.type).toBe('circle');

    // Query nested nodes
    const groupNode = document.root.children[2];
    const foundGroup = queryEngine.queryById(document, groupNode.id);
    expect(foundGroup).toBe(groupNode);
    expect(foundGroup?.type).toBe('g');

    const nestedRect = groupNode.children[0];
    const foundNestedRect = queryEngine.queryById(document, nestedRect.id);
    expect(foundNestedRect).toBe(nestedRect);
    expect(foundNestedRect?.type).toBe('rect');

    // Query non-existent node
    const notFound = queryEngine.queryById(document, 'non_existent_id');
    expect(notFound).toBeNull();
  });

  it('should handle complex documents with many nodes', () => {
    const parser = new Parser();
    const queryEngine = new QueryEngine();

    // Create a document with multiple levels of nesting
    const svgText = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <g id="layer1">
          <rect x="0" y="0" width="10" height="10" />
          <g id="sublayer1">
            <circle cx="5" cy="5" r="2" />
            <ellipse cx="10" cy="10" rx="3" ry="2" />
          </g>
        </g>
        <g id="layer2">
          <path d="M 0 0 L 10 10" />
          <line x1="0" y1="0" x2="10" y2="10" />
        </g>
      </svg>
    `;

    const result = parser.parse(svgText);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const document = result.value;

    // Verify all nodes are queryable
    for (const [id, node] of document.nodes) {
      const found = queryEngine.queryById(document, id);
      expect(found).toBe(node);
      expect(found?.id).toBe(id);
    }

    // Verify the document has the expected structure
    expect(document.nodes.size).toBeGreaterThan(5);
  });
});

describe('HierarchyIndex Integration', () => {
  it('should build index from a parsed document and provide fast lookups', () => {
    const parser = new Parser();

    const svgText = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect x="10" y="10" width="50" height="50" fill="red" />
        <circle cx="100" cy="100" r="30" fill="blue" />
        <g>
          <rect x="150" y="150" width="40" height="40" fill="green" />
          <circle cx="170" cy="170" r="10" fill="yellow" />
        </g>
      </svg>
    `;

    const result = parser.parse(svgText);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const document = result.value;
    const index = new HierarchyIndex(document);

    // Root should have no parent
    expect(index.getParent(document.root.id)).toBeNull();

    // Root should have 3 children (rect, circle, g)
    const rootChildren = index.getChildren(document.root.id);
    expect(rootChildren.length).toBe(3);

    // First child (rect) should have root as parent
    const firstChild = document.root.children[0];
    expect(index.getParent(firstChild.id)).toBe(document.root.id);
    expect(index.getChildren(firstChild.id)).toEqual([]);

    // Second child (circle) should have root as parent
    const secondChild = document.root.children[1];
    expect(index.getParent(secondChild.id)).toBe(document.root.id);
    expect(index.getChildren(secondChild.id)).toEqual([]);

    // Third child (group) should have root as parent and 2 children
    const groupNode = document.root.children[2];
    expect(index.getParent(groupNode.id)).toBe(document.root.id);
    const groupChildren = index.getChildren(groupNode.id);
    expect(groupChildren.length).toBe(2);

    // Nested elements should have group as parent
    const nestedRect = groupNode.children[0];
    expect(index.getParent(nestedRect.id)).toBe(groupNode.id);
    expect(index.getChildren(nestedRect.id)).toEqual([]);

    const nestedCircle = groupNode.children[1];
    expect(index.getParent(nestedCircle.id)).toBe(groupNode.id);
    expect(index.getChildren(nestedCircle.id)).toEqual([]);
  });

  it('should handle deeply nested documents efficiently', () => {
    const parser = new Parser();

    // Create a document with multiple levels of nesting
    const svgText = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <g id="layer1">
          <rect x="0" y="0" width="10" height="10" />
          <g id="sublayer1">
            <circle cx="5" cy="5" r="2" />
            <g id="subsublayer1">
              <ellipse cx="10" cy="10" rx="3" ry="2" />
              <path d="M 0 0 L 10 10" />
            </g>
          </g>
        </g>
        <g id="layer2">
          <line x1="0" y1="0" x2="10" y2="10" />
          <polyline points="0,0 10,10 20,0" />
        </g>
      </svg>
    `;

    const result = parser.parse(svgText);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const document = result.value;
    const index = new HierarchyIndex(document);

    // Verify all nodes have correct parent-child relationships
    for (const [id, node] of document.nodes) {
      // Check parent relationship
      if (node.parent) {
        expect(index.getParent(id)).toBe(node.parent.id);
      } else {
        expect(index.getParent(id)).toBeNull();
      }

      // Check children relationship
      const childIds = index.getChildren(id);
      expect(childIds.length).toBe(node.children.length);
      
      for (let i = 0; i < node.children.length; i++) {
        expect(childIds[i]).toBe(node.children[i].id);
      }
    }

    // Verify lookups are fast (O(1))
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      for (const [id] of document.nodes) {
        index.getParent(id);
        index.getChildren(id);
      }
    }
    const end = performance.now();
    const duration = end - start;

    // 1000 iterations over all nodes should be fast
    expect(duration).toBeLessThan(100);
  });

  it('should work with QueryEngine for combined queries', () => {
    const parser = new Parser();
    const queryEngine = new QueryEngine();

    const svgText = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <g id="shapes">
          <rect x="0" y="0" width="10" height="10" />
          <circle cx="5" cy="5" r="2" />
        </g>
      </svg>
    `;

    const result = parser.parse(svgText);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const document = result.value;
    const index = new HierarchyIndex(document);

    // Find the group node using QueryEngine
    const groupNode = document.root.children[0];
    const foundGroup = queryEngine.queryById(document, groupNode.id);
    expect(foundGroup).not.toBeNull();

    if (!foundGroup) return;

    // Use HierarchyIndex to get its children
    const childIds = index.getChildren(foundGroup.id);
    expect(childIds.length).toBe(2);

    // Use QueryEngine to get the actual child nodes
    const childNodes = childIds.map(id => queryEngine.queryById(document, id));
    expect(childNodes[0]?.type).toBe('rect');
    expect(childNodes[1]?.type).toBe('circle');

    // Verify parent relationships
    for (const childId of childIds) {
      expect(index.getParent(childId)).toBe(foundGroup.id);
    }
  });
});

describe('HierarchyIndex Ancestors and Descendants Integration', () => {
  it('should query ancestors and descendants from parsed document', () => {
    const parser = new Parser();

    const svgText = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <g id="layer1">
          <rect x="0" y="0" width="10" height="10" />
          <g id="sublayer1">
            <circle cx="5" cy="5" r="2" />
            <ellipse cx="10" cy="10" rx="3" ry="2" />
          </g>
        </g>
        <g id="layer2">
          <path d="M 0 0 L 10 10" />
        </g>
      </svg>
    `;

    const result = parser.parse(svgText);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const document = result.value;
    const index = new HierarchyIndex(document);

    // Get the deeply nested circle
    const layer1 = document.root.children[0];
    const sublayer1 = layer1.children[1];
    const circle = sublayer1.children[0];

    // Test getAncestors - should return path to root
    const ancestors = index.getAncestors(circle.id);
    expect(ancestors.length).toBe(3); // sublayer1, layer1, root
    expect(ancestors[0]).toBe(sublayer1.id);
    expect(ancestors[1]).toBe(layer1.id);
    expect(ancestors[2]).toBe(document.root.id);

    // Test getDescendants - should return all children recursively
    const descendants = index.getDescendants(document.root.id);
    expect(descendants.length).toBeGreaterThan(4); // At least layer1, sublayer1, rect, circle, ellipse, layer2, path
    
    // Root's descendants should include all nodes except root
    expect(descendants).toContain(layer1.id);
    expect(descendants).toContain(sublayer1.id);
    expect(descendants).toContain(circle.id);

    // Layer1's descendants should include sublayer1 and its children
    const layer1Descendants = index.getDescendants(layer1.id);
    expect(layer1Descendants).toContain(sublayer1.id);
    expect(layer1Descendants).toContain(circle.id);
    expect(layer1Descendants.length).toBe(4); // rect, sublayer1, circle, ellipse

    // Leaf nodes should have no descendants
    const circleDescendants = index.getDescendants(circle.id);
    expect(circleDescendants).toEqual([]);
  });

  it('should efficiently query ancestors and descendants in large documents', () => {
    const parser = new Parser();

    // Create a document with many nested levels
    const svgText = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <g id="level1">
          <g id="level2">
            <g id="level3">
              <g id="level4">
                <g id="level5">
                  <rect x="0" y="0" width="10" height="10" />
                  <circle cx="5" cy="5" r="2" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    `;

    const result = parser.parse(svgText);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const document = result.value;
    const index = new HierarchyIndex(document);

    // Find the deepest rect
    let current = document.root.children[0];
    while (current.children.length > 0 && current.children[0].type === 'g') {
      current = current.children[0];
    }
    const deepRect = current.children[0];

    // Test getAncestors - should traverse up the tree efficiently
    const start1 = performance.now();
    const ancestors = index.getAncestors(deepRect.id);
    const duration1 = performance.now() - start1;

    expect(ancestors.length).toBe(6); // level5, level4, level3, level2, level1, root
    expect(duration1).toBeLessThan(5); // Should be very fast

    // Test getDescendants - should traverse down the tree efficiently
    const start2 = performance.now();
    const descendants = index.getDescendants(document.root.id);
    const duration2 = performance.now() - start2;

    expect(descendants.length).toBeGreaterThan(5); // All nested groups and shapes
    expect(duration2).toBeLessThan(5); // Should be very fast
  });

  it('should maintain ancestor-descendant relationships after parsing', () => {
    const parser = new Parser();

    const svgText = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <g id="container">
          <rect x="0" y="0" width="10" height="10" />
          <g id="nested">
            <circle cx="5" cy="5" r="2" />
          </g>
        </g>
      </svg>
    `;

    const result = parser.parse(svgText);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const document = result.value;
    const index = new HierarchyIndex(document);

    const container = document.root.children[0];
    const rect = container.children[0];
    const nested = container.children[1];
    const circle = nested.children[0];

    // Verify ancestor-descendant relationships
    // Circle's ancestors should include nested, container, and root
    const circleAncestors = index.getAncestors(circle.id);
    expect(circleAncestors).toEqual([nested.id, container.id, document.root.id]);

    // Container's descendants should include rect, nested, and circle
    const containerDescendants = index.getDescendants(container.id);
    expect(containerDescendants).toContain(rect.id);
    expect(containerDescendants).toContain(nested.id);
    expect(containerDescendants).toContain(circle.id);
    expect(containerDescendants.length).toBe(3);

    // Root's descendants should include all nodes except root
    const rootDescendants = index.getDescendants(document.root.id);
    expect(rootDescendants).toContain(container.id);
    expect(rootDescendants).toContain(rect.id);
    expect(rootDescendants).toContain(nested.id);
    expect(rootDescendants).toContain(circle.id);
    expect(rootDescendants.length).toBe(4);
  });
});
