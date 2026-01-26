import { describe, it, expect } from 'vitest';
import { QueryEngine } from './selector.js';
import type { SVGDocument, SVGNode } from '../types/index.js';

describe('QueryEngine', () => {
  describe('queryById', () => {
    it('should return the node with the given ID', () => {
      // Create a simple document with a few nodes
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rectNode: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([
          ['x', '10'],
          ['y', '20'],
          ['width', '100'],
          ['height', '50']
        ]),
        children: [],
        parent: rootNode
      };

      const circleNode: SVGNode = {
        id: 'circle_1',
        type: 'circle',
        attributes: new Map([
          ['cx', '50'],
          ['cy', '50'],
          ['r', '25']
        ]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rectNode, circleNode];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rectNode],
          ['circle_1', circleNode]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Test finding existing nodes
      const foundRect = queryEngine.queryById(document, 'rect_1');
      expect(foundRect).toBe(rectNode);
      expect(foundRect?.type).toBe('rect');

      const foundCircle = queryEngine.queryById(document, 'circle_1');
      expect(foundCircle).toBe(circleNode);
      expect(foundCircle?.type).toBe('circle');

      const foundRoot = queryEngine.queryById(document, 'root');
      expect(foundRoot).toBe(rootNode);
      expect(foundRoot?.type).toBe('svg');
    });

    it('should return null for non-existent ID', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([['root', rootNode]]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Test finding non-existent node
      const notFound = queryEngine.queryById(document, 'non_existent');
      expect(notFound).toBeNull();
    });

    it('should return null for empty string ID', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([['root', rootNode]]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Test with empty string
      const notFound = queryEngine.queryById(document, '');
      expect(notFound).toBeNull();
    });

    it('should work with empty document', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([['root', rootNode]]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Should find root
      const foundRoot = queryEngine.queryById(document, 'root');
      expect(foundRoot).toBe(rootNode);

      // Should not find other nodes
      const notFound = queryEngine.queryById(document, 'other');
      expect(notFound).toBeNull();
    });

    it('should handle documents with many nodes', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const nodes = new Map<string, SVGNode>([['root', rootNode]]);

      // Create 100 nodes
      for (let i = 0; i < 100; i++) {
        const node: SVGNode = {
          id: `node_${i}`,
          type: 'rect',
          attributes: new Map(),
          children: [],
          parent: rootNode
        };
        rootNode.children.push(node);
        nodes.set(`node_${i}`, node);
      }

      const document: SVGDocument = {
        root: rootNode,
        nodes,
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Test finding nodes at different positions
      const firstNode = queryEngine.queryById(document, 'node_0');
      expect(firstNode?.id).toBe('node_0');

      const middleNode = queryEngine.queryById(document, 'node_50');
      expect(middleNode?.id).toBe('node_50');

      const lastNode = queryEngine.queryById(document, 'node_99');
      expect(lastNode?.id).toBe('node_99');

      // Test non-existent node
      const notFound = queryEngine.queryById(document, 'node_100');
      expect(notFound).toBeNull();
    });
  });

  describe('queryByType', () => {
    it('should return all nodes of the specified type', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([['x', '10']]),
        children: [],
        parent: rootNode
      };

      const rect2: SVGNode = {
        id: 'rect_2',
        type: 'rect',
        attributes: new Map([['x', '20']]),
        children: [],
        parent: rootNode
      };

      const circle1: SVGNode = {
        id: 'circle_1',
        type: 'circle',
        attributes: new Map([['cx', '50']]),
        children: [],
        parent: rootNode
      };

      const path1: SVGNode = {
        id: 'path_1',
        type: 'path',
        attributes: new Map([['d', 'M 0 0 L 10 10']]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1, rect2, circle1, path1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1],
          ['rect_2', rect2],
          ['circle_1', circle1],
          ['path_1', path1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for rectangles
      const rectangles = queryEngine.queryByType(document, 'rect');
      expect(rectangles).toHaveLength(2);
      expect(rectangles).toContain(rect1);
      expect(rectangles).toContain(rect2);

      // Query for circles
      const circles = queryEngine.queryByType(document, 'circle');
      expect(circles).toHaveLength(1);
      expect(circles[0]).toBe(circle1);

      // Query for paths
      const paths = queryEngine.queryByType(document, 'path');
      expect(paths).toHaveLength(1);
      expect(paths[0]).toBe(path1);

      // Query for svg elements
      const svgs = queryEngine.queryByType(document, 'svg');
      expect(svgs).toHaveLength(1);
      expect(svgs[0]).toBe(rootNode);
    });

    it('should return empty array when no nodes match the type', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map(),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for circles (none exist)
      const circles = queryEngine.queryByType(document, 'circle');
      expect(circles).toHaveLength(0);
      expect(circles).toEqual([]);

      // Query for paths (none exist)
      const paths = queryEngine.queryByType(document, 'path');
      expect(paths).toHaveLength(0);
    });

    it('should work with nested elements', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const group1: SVGNode = {
        id: 'group_1',
        type: 'g',
        attributes: new Map(),
        children: [],
        parent: rootNode
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map(),
        children: [],
        parent: group1
      };

      const rect2: SVGNode = {
        id: 'rect_2',
        type: 'rect',
        attributes: new Map(),
        children: [],
        parent: group1
      };

      group1.children = [rect1, rect2];
      rootNode.children = [group1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['group_1', group1],
          ['rect_1', rect1],
          ['rect_2', rect2]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for rectangles (should find both nested ones)
      const rectangles = queryEngine.queryByType(document, 'rect');
      expect(rectangles).toHaveLength(2);
      expect(rectangles).toContain(rect1);
      expect(rectangles).toContain(rect2);

      // Query for groups
      const groups = queryEngine.queryByType(document, 'g');
      expect(groups).toHaveLength(1);
      expect(groups[0]).toBe(group1);
    });

    it('should handle empty document', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([['root', rootNode]]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for rectangles (none exist)
      const rectangles = queryEngine.queryByType(document, 'rect');
      expect(rectangles).toHaveLength(0);

      // Query for svg (should find root)
      const svgs = queryEngine.queryByType(document, 'svg');
      expect(svgs).toHaveLength(1);
      expect(svgs[0]).toBe(rootNode);
    });
  });

  describe('queryByAttribute', () => {
    it('should return all nodes with the specified attribute', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([
          ['x', '10'],
          ['fill', 'red']
        ]),
        children: [],
        parent: rootNode
      };

      const rect2: SVGNode = {
        id: 'rect_2',
        type: 'rect',
        attributes: new Map([
          ['x', '20'],
          ['fill', 'blue']
        ]),
        children: [],
        parent: rootNode
      };

      const circle1: SVGNode = {
        id: 'circle_1',
        type: 'circle',
        attributes: new Map([
          ['cx', '50'],
          ['fill', 'red']
        ]),
        children: [],
        parent: rootNode
      };

      const path1: SVGNode = {
        id: 'path_1',
        type: 'path',
        attributes: new Map([
          ['d', 'M 0 0 L 10 10']
        ]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1, rect2, circle1, path1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1],
          ['rect_2', rect2],
          ['circle_1', circle1],
          ['path_1', path1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for nodes with 'fill' attribute (any value)
      const filledNodes = queryEngine.queryByAttribute(document, 'fill');
      expect(filledNodes).toHaveLength(3);
      expect(filledNodes).toContain(rect1);
      expect(filledNodes).toContain(rect2);
      expect(filledNodes).toContain(circle1);

      // Query for nodes with 'x' attribute
      const xNodes = queryEngine.queryByAttribute(document, 'x');
      expect(xNodes).toHaveLength(2);
      expect(xNodes).toContain(rect1);
      expect(xNodes).toContain(rect2);

      // Query for nodes with 'd' attribute
      const dNodes = queryEngine.queryByAttribute(document, 'd');
      expect(dNodes).toHaveLength(1);
      expect(dNodes[0]).toBe(path1);
    });

    it('should return nodes matching both attribute name and value', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([
          ['fill', 'red']
        ]),
        children: [],
        parent: rootNode
      };

      const rect2: SVGNode = {
        id: 'rect_2',
        type: 'rect',
        attributes: new Map([
          ['fill', 'blue']
        ]),
        children: [],
        parent: rootNode
      };

      const circle1: SVGNode = {
        id: 'circle_1',
        type: 'circle',
        attributes: new Map([
          ['fill', 'red']
        ]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1, rect2, circle1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1],
          ['rect_2', rect2],
          ['circle_1', circle1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for nodes with fill='red'
      const redNodes = queryEngine.queryByAttribute(document, 'fill', 'red');
      expect(redNodes).toHaveLength(2);
      expect(redNodes).toContain(rect1);
      expect(redNodes).toContain(circle1);

      // Query for nodes with fill='blue'
      const blueNodes = queryEngine.queryByAttribute(document, 'fill', 'blue');
      expect(blueNodes).toHaveLength(1);
      expect(blueNodes[0]).toBe(rect2);

      // Query for nodes with fill='green' (none exist)
      const greenNodes = queryEngine.queryByAttribute(document, 'fill', 'green');
      expect(greenNodes).toHaveLength(0);
    });

    it('should return empty array when no nodes have the attribute', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([
          ['x', '10'],
          ['y', '20']
        ]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for non-existent attribute
      const filledNodes = queryEngine.queryByAttribute(document, 'fill');
      expect(filledNodes).toHaveLength(0);
      expect(filledNodes).toEqual([]);
    });

    it('should work with nested elements', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const group1: SVGNode = {
        id: 'group_1',
        type: 'g',
        attributes: new Map([
          ['transform', 'translate(10, 20)']
        ]),
        children: [],
        parent: rootNode
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([
          ['fill', 'red'],
          ['transform', 'rotate(45)']
        ]),
        children: [],
        parent: group1
      };

      const rect2: SVGNode = {
        id: 'rect_2',
        type: 'rect',
        attributes: new Map([
          ['fill', 'blue']
        ]),
        children: [],
        parent: group1
      };

      group1.children = [rect1, rect2];
      rootNode.children = [group1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['group_1', group1],
          ['rect_1', rect1],
          ['rect_2', rect2]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for nodes with 'transform' attribute
      const transformedNodes = queryEngine.queryByAttribute(document, 'transform');
      expect(transformedNodes).toHaveLength(2);
      expect(transformedNodes).toContain(group1);
      expect(transformedNodes).toContain(rect1);

      // Query for nodes with 'fill' attribute
      const filledNodes = queryEngine.queryByAttribute(document, 'fill');
      expect(filledNodes).toHaveLength(2);
      expect(filledNodes).toContain(rect1);
      expect(filledNodes).toContain(rect2);
    });

    it('should handle empty document', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([['root', rootNode]]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for any attribute (none exist)
      const nodes = queryEngine.queryByAttribute(document, 'fill');
      expect(nodes).toHaveLength(0);
    });

    it('should handle empty string attribute name', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map([
          ['fill', 'red']
        ]),
        children: [],
        parent: null
      };

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([['root', rootNode]]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for empty string attribute (should not match)
      const nodes = queryEngine.queryByAttribute(document, '');
      expect(nodes).toHaveLength(0);
    });

    it('should handle empty string attribute value', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([
          ['data-empty', '']
        ]),
        children: [],
        parent: rootNode
      };

      const rect2: SVGNode = {
        id: 'rect_2',
        type: 'rect',
        attributes: new Map([
          ['data-empty', 'not-empty']
        ]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1, rect2];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1],
          ['rect_2', rect2]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for nodes with data-empty='' (empty string value)
      const emptyNodes = queryEngine.queryByAttribute(document, 'data-empty', '');
      expect(emptyNodes).toHaveLength(1);
      expect(emptyNodes[0]).toBe(rect1);

      // Query for nodes with data-empty attribute (any value)
      const allNodes = queryEngine.queryByAttribute(document, 'data-empty');
      expect(allNodes).toHaveLength(2);
    });
  });

  describe('integration - combining query methods', () => {
    it('should allow combining different query methods', () => {
      // Create a document with various elements
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([
          ['fill', 'red'],
          ['x', '10']
        ]),
        children: [],
        parent: rootNode
      };

      const rect2: SVGNode = {
        id: 'rect_2',
        type: 'rect',
        attributes: new Map([
          ['fill', 'blue'],
          ['x', '20']
        ]),
        children: [],
        parent: rootNode
      };

      const circle1: SVGNode = {
        id: 'circle_1',
        type: 'circle',
        attributes: new Map([
          ['fill', 'red'],
          ['cx', '50']
        ]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1, rect2, circle1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1],
          ['rect_2', rect2],
          ['circle_1', circle1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Find all rectangles
      const allRects = queryEngine.queryByType(document, 'rect');
      expect(allRects).toHaveLength(2);

      // Find all red elements
      const redElements = queryEngine.queryByAttribute(document, 'fill', 'red');
      expect(redElements).toHaveLength(2);

      // Manually combine: find red rectangles (intersection)
      const redRects = allRects.filter(rect => 
        redElements.some(red => red.id === rect.id)
      );
      expect(redRects).toHaveLength(1);
      expect(redRects[0]).toBe(rect1);

      // Find a specific element by ID
      const specificRect = queryEngine.queryById(document, 'rect_2');
      expect(specificRect).toBe(rect2);
      expect(specificRect?.type).toBe('rect');
      expect(specificRect?.attributes.get('fill')).toBe('blue');
    });
  });

  describe('query (multi-criteria)', () => {
    it('should find nodes by type only', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([['x', '10']]),
        children: [],
        parent: rootNode
      };

      const rect2: SVGNode = {
        id: 'rect_2',
        type: 'rect',
        attributes: new Map([['x', '20']]),
        children: [],
        parent: rootNode
      };

      const circle1: SVGNode = {
        id: 'circle_1',
        type: 'circle',
        attributes: new Map([['cx', '50']]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1, rect2, circle1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1],
          ['rect_2', rect2],
          ['circle_1', circle1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      const rectangles = queryEngine.query(document, { type: 'rect' });
      expect(rectangles).toHaveLength(2);
      expect(rectangles).toContain(rect1);
      expect(rectangles).toContain(rect2);
    });

    it('should find nodes by ID only', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map(),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      const result = queryEngine.query(document, { id: 'rect_1' });
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(rect1);
    });

    it('should find nodes by attribute only', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([['fill', 'red']]),
        children: [],
        parent: rootNode
      };

      const circle1: SVGNode = {
        id: 'circle_1',
        type: 'circle',
        attributes: new Map([['fill', 'red']]),
        children: [],
        parent: rootNode
      };

      const path1: SVGNode = {
        id: 'path_1',
        type: 'path',
        attributes: new Map([['stroke', 'blue']]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1, circle1, path1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1],
          ['circle_1', circle1],
          ['path_1', path1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      const redNodes = queryEngine.query(document, {
        attribute: { name: 'fill', value: 'red' }
      });
      expect(redNodes).toHaveLength(2);
      expect(redNodes).toContain(rect1);
      expect(redNodes).toContain(circle1);
    });

    it('should find nodes by type AND attribute', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([['fill', 'red']]),
        children: [],
        parent: rootNode
      };

      const rect2: SVGNode = {
        id: 'rect_2',
        type: 'rect',
        attributes: new Map([['fill', 'blue']]),
        children: [],
        parent: rootNode
      };

      const circle1: SVGNode = {
        id: 'circle_1',
        type: 'circle',
        attributes: new Map([['fill', 'red']]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1, rect2, circle1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1],
          ['rect_2', rect2],
          ['circle_1', circle1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Find red rectangles
      const redRects = queryEngine.query(document, {
        type: 'rect',
        attribute: { name: 'fill', value: 'red' }
      });
      expect(redRects).toHaveLength(1);
      expect(redRects[0]).toBe(rect1);

      // Find blue rectangles
      const blueRects = queryEngine.query(document, {
        type: 'rect',
        attribute: { name: 'fill', value: 'blue' }
      });
      expect(blueRects).toHaveLength(1);
      expect(blueRects[0]).toBe(rect2);

      // Find red circles
      const redCircles = queryEngine.query(document, {
        type: 'circle',
        attribute: { name: 'fill', value: 'red' }
      });
      expect(redCircles).toHaveLength(1);
      expect(redCircles[0]).toBe(circle1);
    });

    it('should find nodes by ID AND type', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map(),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Find rect_1 with correct type
      const result1 = queryEngine.query(document, {
        id: 'rect_1',
        type: 'rect'
      });
      expect(result1).toHaveLength(1);
      expect(result1[0]).toBe(rect1);

      // Try to find rect_1 with wrong type
      const result2 = queryEngine.query(document, {
        id: 'rect_1',
        type: 'circle'
      });
      expect(result2).toHaveLength(0);
    });

    it('should find nodes by ID AND attribute', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([['fill', 'red']]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Find rect_1 with correct attribute
      const result1 = queryEngine.query(document, {
        id: 'rect_1',
        attribute: { name: 'fill', value: 'red' }
      });
      expect(result1).toHaveLength(1);
      expect(result1[0]).toBe(rect1);

      // Try to find rect_1 with wrong attribute value
      const result2 = queryEngine.query(document, {
        id: 'rect_1',
        attribute: { name: 'fill', value: 'blue' }
      });
      expect(result2).toHaveLength(0);

      // Try to find rect_1 with non-existent attribute
      const result3 = queryEngine.query(document, {
        id: 'rect_1',
        attribute: { name: 'stroke' }
      });
      expect(result3).toHaveLength(0);
    });

    it('should find nodes by all three criteria', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([['fill', 'red']]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Find with all criteria matching
      const result1 = queryEngine.query(document, {
        id: 'rect_1',
        type: 'rect',
        attribute: { name: 'fill', value: 'red' }
      });
      expect(result1).toHaveLength(1);
      expect(result1[0]).toBe(rect1);

      // Try with wrong type
      const result2 = queryEngine.query(document, {
        id: 'rect_1',
        type: 'circle',
        attribute: { name: 'fill', value: 'red' }
      });
      expect(result2).toHaveLength(0);

      // Try with wrong attribute
      const result3 = queryEngine.query(document, {
        id: 'rect_1',
        type: 'rect',
        attribute: { name: 'fill', value: 'blue' }
      });
      expect(result3).toHaveLength(0);
    });

    it('should return empty array when no nodes match', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([['fill', 'red']]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Query for non-existent type
      const result1 = queryEngine.query(document, { type: 'circle' });
      expect(result1).toHaveLength(0);

      // Query for non-existent ID
      const result2 = queryEngine.query(document, { id: 'non_existent' });
      expect(result2).toHaveLength(0);

      // Query for non-existent attribute
      const result3 = queryEngine.query(document, {
        attribute: { name: 'stroke' }
      });
      expect(result3).toHaveLength(0);
    });

    it('should handle attribute without value', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([['fill', 'red']]),
        children: [],
        parent: rootNode
      };

      const rect2: SVGNode = {
        id: 'rect_2',
        type: 'rect',
        attributes: new Map([['fill', 'blue']]),
        children: [],
        parent: rootNode
      };

      const circle1: SVGNode = {
        id: 'circle_1',
        type: 'circle',
        attributes: new Map([['stroke', 'black']]),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1, rect2, circle1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1],
          ['rect_2', rect2],
          ['circle_1', circle1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Find all rectangles with 'fill' attribute (any value)
      const rectsWithFill = queryEngine.query(document, {
        type: 'rect',
        attribute: { name: 'fill' }
      });
      expect(rectsWithFill).toHaveLength(2);
      expect(rectsWithFill).toContain(rect1);
      expect(rectsWithFill).toContain(rect2);
    });

    it('should work with empty selector', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map(),
        children: [],
        parent: rootNode
      };

      rootNode.children = [rect1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['rect_1', rect1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Empty selector should return all nodes
      const allNodes = queryEngine.query(document, {});
      expect(allNodes).toHaveLength(2);
      expect(allNodes).toContain(rootNode);
      expect(allNodes).toContain(rect1);
    });

    it('should handle complex nested structures', () => {
      const rootNode: SVGNode = {
        id: 'root',
        type: 'svg',
        attributes: new Map(),
        children: [],
        parent: null
      };

      const group1: SVGNode = {
        id: 'group_1',
        type: 'g',
        attributes: new Map([['class', 'container']]),
        children: [],
        parent: rootNode
      };

      const rect1: SVGNode = {
        id: 'rect_1',
        type: 'rect',
        attributes: new Map([
          ['fill', 'red'],
          ['class', 'shape']
        ]),
        children: [],
        parent: group1
      };

      const rect2: SVGNode = {
        id: 'rect_2',
        type: 'rect',
        attributes: new Map([
          ['fill', 'blue'],
          ['class', 'shape']
        ]),
        children: [],
        parent: group1
      };

      const circle1: SVGNode = {
        id: 'circle_1',
        type: 'circle',
        attributes: new Map([
          ['fill', 'red'],
          ['class', 'shape']
        ]),
        children: [],
        parent: group1
      };

      group1.children = [rect1, rect2, circle1];
      rootNode.children = [group1];

      const document: SVGDocument = {
        root: rootNode,
        nodes: new Map([
          ['root', rootNode],
          ['group_1', group1],
          ['rect_1', rect1],
          ['rect_2', rect2],
          ['circle_1', circle1]
        ]),
        version: 1
      };

      const queryEngine = new QueryEngine();

      // Find all shapes (any type with class='shape')
      const shapes = queryEngine.query(document, {
        attribute: { name: 'class', value: 'shape' }
      });
      expect(shapes).toHaveLength(3);

      // Find red shapes
      const redShapes = queryEngine.query(document, {
        attribute: { name: 'fill', value: 'red' }
      });
      expect(redShapes).toHaveLength(2);
      expect(redShapes).toContain(rect1);
      expect(redShapes).toContain(circle1);

      // Find red rectangles with class='shape'
      const redRectShapes = queryEngine.query(document, {
        type: 'rect',
        attribute: { name: 'fill', value: 'red' }
      });
      expect(redRectShapes).toHaveLength(1);
      expect(redRectShapes[0]).toBe(rect1);
    });
  });
});
