/**
 * Fast-check arbitraries (generators) for property-based testing.
 * 
 * This module provides generators for creating random test data including
 * SVG documents, nodes, commands, matrices, and path commands.
 * 
 * @module tests/properties/arbitraries
 */

import fc from 'fast-check';
import type {
  SVGDocument,
  SVGNode,
  SVGElementType
} from '../../src/types/index.js';
import type { Matrix, PathCommand } from '../../src/geometry/index.js';

/**
 * Generate a random SVG element type.
 */
export function arbitraryElementType(): fc.Arbitrary<SVGElementType> {
  return fc.constantFrom(
    'svg',
    'rect',
    'circle',
    'ellipse',
    'line',
    'path',
    'g',
    'text'
  );
}

/**
 * Generate a random attribute map.
 * 
 * @param maxAttributes - Maximum number of attributes to generate
 */
export function arbitraryAttributes(maxAttributes: number = 5): fc.Arbitrary<Map<string, string>> {
  return fc.array(
    fc.tuple(
      fc.constantFrom('x', 'y', 'width', 'height', 'fill', 'stroke', 'cx', 'cy', 'r', 'class', 'id'),
      fc.oneof(
        fc.integer({ min: 0, max: 1000 }).map(n => n.toString()),
        fc.constantFrom('red', 'blue', 'green', 'black', 'white', 'none'),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`)
      )
    ),
    { maxLength: maxAttributes }
  ).map(pairs => new Map(pairs));
}

/**
 * Generate a random SVG node without children.
 * 
 * @param depth - Current depth in the tree (for limiting recursion)
 */
export function arbitraryLeafNode(depth: number = 0): fc.Arbitrary<SVGNode> {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }).map(s => `node_${s}`),
    type: arbitraryElementType(),
    attributes: arbitraryAttributes(),
    children: fc.constant([]),
    parent: fc.constant(null)
  });
}

/**
 * Generate a random SVG node with possible children.
 * 
 * @param maxDepth - Maximum tree depth
 * @param maxChildren - Maximum children per node
 */
export function arbitrarySVGNode(
  maxDepth: number = 3,
  maxChildren: number = 5
): fc.Arbitrary<SVGNode> {
  return fc.letrec(tie => ({
    node: fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }).map(s => `node_${s}`),
      type: arbitraryElementType(),
      attributes: arbitraryAttributes(),
      children: fc.oneof(
        fc.constant([]),
        fc.array(tie('node') as fc.Arbitrary<SVGNode>, { maxLength: maxChildren })
      ),
      parent: fc.constant(null)
    })
  })).node as fc.Arbitrary<SVGNode>;
}

/**
 * Generate a simple SVG node tree (limited depth for performance).
 */
export function arbitrarySimpleNode(): fc.Arbitrary<SVGNode> {
  return fc.oneof(
    // Leaf nodes (70% probability)
    { weight: 7, arbitrary: arbitraryLeafNode() },
    // Nodes with 1-2 children (30% probability)
    {
      weight: 3,
      arbitrary: fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }).map(s => `node_${s}`),
        type: fc.constantFrom('g', 'svg'),
        attributes: arbitraryAttributes(2),
        children: fc.array(arbitraryLeafNode(), { minLength: 0, maxLength: 2 }),
        parent: fc.constant(null)
      })
    }
  );
}

/**
 * Build a node index from a node tree.
 */
function buildNodeIndex(node: SVGNode, index: Map<string, SVGNode> = new Map()): Map<string, SVGNode> {
  index.set(node.id, node);
  for (const child of node.children) {
    child.parent = node;
    buildNodeIndex(child, index);
  }
  return index;
}

/**
 * Ensure all node IDs are unique in a tree.
 */
function ensureUniqueIds(node: SVGNode, usedIds: Set<string> = new Set(), counter: { value: number } = { value: 0 }): void {
  // If ID is already used, generate a new one
  if (usedIds.has(node.id)) {
    node.id = `node_${counter.value++}`;
  }
  usedIds.add(node.id);
  
  // Recursively process children
  for (const child of node.children) {
    ensureUniqueIds(child, usedIds, counter);
  }
}

/**
 * Generate a random SVG document.
 * 
 * @param maxNodes - Maximum number of nodes in the document
 */
export function arbitraryDocument(maxNodes: number = 10): fc.Arbitrary<SVGDocument> {
  return arbitrarySimpleNode().map(root => {
    // Ensure root is an svg element
    root.type = 'svg';
    root.id = 'root';
    
    // Ensure all IDs are unique
    ensureUniqueIds(root);
    
    // Build node index
    const nodes = buildNodeIndex(root);
    
    return {
      root,
      nodes,
      version: 1
    };
  });
}

/**
 * Generate a random 2D transformation matrix.
 */
export function arbitraryMatrix(): fc.Arbitrary<Matrix> {
  return fc.tuple(
    fc.float({ min: -10, max: 10, noNaN: true }),
    fc.float({ min: -10, max: 10, noNaN: true }),
    fc.float({ min: -10, max: 10, noNaN: true }),
    fc.float({ min: -10, max: 10, noNaN: true }),
    fc.float({ min: -100, max: 100, noNaN: true }),
    fc.float({ min: -100, max: 100, noNaN: true })
  ) as fc.Arbitrary<Matrix>;
}

/**
 * Generate an invertible transformation matrix.
 * 
 * Ensures the determinant is non-zero so the matrix can be inverted.
 */
export function arbitraryInvertibleMatrix(): fc.Arbitrary<Matrix> {
  return arbitraryMatrix().filter(([a, b, c, d]) => {
    const det = a * d - b * c;
    return Math.abs(det) > 0.01; // Avoid near-singular matrices (increased threshold)
  });
}

/**
 * Generate a random point.
 */
export function arbitraryPoint(): fc.Arbitrary<{ x: number; y: number }> {
  return fc.record({
    x: fc.float({ min: -1000, max: 1000, noNaN: true }),
    y: fc.float({ min: -1000, max: 1000, noNaN: true })
  });
}

/**
 * Generate a random path command type.
 */
export function arbitraryPathCommandType(): fc.Arbitrary<PathCommand['type']> {
  return fc.constantFrom('M', 'L', 'C', 'Q', 'Z');
}

/**
 * Generate a random path command.
 */
export function arbitraryPathCommand(): fc.Arbitrary<PathCommand> {
  return fc.oneof(
    // Move command
    fc.record({
      type: fc.constant('M' as const),
      points: fc.tuple(
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true })
      ).map(([x, y]) => [x, y]),
      absolute: fc.boolean()
    }),
    // Line command
    fc.record({
      type: fc.constant('L' as const),
      points: fc.tuple(
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true })
      ).map(([x, y]) => [x, y]),
      absolute: fc.boolean()
    }),
    // Cubic bezier command
    fc.record({
      type: fc.constant('C' as const),
      points: fc.tuple(
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true })
      ).map(points => Array.from(points)),
      absolute: fc.boolean()
    }),
    // Quadratic bezier command
    fc.record({
      type: fc.constant('Q' as const),
      points: fc.tuple(
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true })
      ).map(points => Array.from(points)),
      absolute: fc.boolean()
    }),
    // Close path command
    fc.record({
      type: fc.constant('Z' as const),
      points: fc.constant([]),
      absolute: fc.constant(true)
    })
  );
}

/**
 * Generate a valid path (starts with M command).
 */
export function arbitraryPath(): fc.Arbitrary<PathCommand[]> {
  return fc.tuple(
    // First command must be a Move
    fc.record({
      type: fc.constant('M' as const),
      points: fc.tuple(
        fc.float({ min: -100, max: 100, noNaN: true }),
        fc.float({ min: -100, max: 100, noNaN: true })
      ).map(([x, y]) => [x, y]),
      absolute: fc.constant(true)
    }),
    // Followed by other commands
    fc.array(arbitraryPathCommand(), { maxLength: 10 })
  ).map(([first, rest]) => [first, ...rest]);
}

/**
 * Generate a simple SVG string for parsing tests.
 */
export function arbitrarySVGString(): fc.Arbitrary<string> {
  return fc.oneof(
    // Simple rect
    fc.record({
      x: fc.integer({ min: 0, max: 100 }),
      y: fc.integer({ min: 0, max: 100 }),
      width: fc.integer({ min: 1, max: 100 }),
      height: fc.integer({ min: 1, max: 100 })
    }).map(({ x, y, width, height }) => 
      `<svg><rect x="${x}" y="${y}" width="${width}" height="${height}"/></svg>`
    ),
    // Simple circle
    fc.record({
      cx: fc.integer({ min: 0, max: 100 }),
      cy: fc.integer({ min: 0, max: 100 }),
      r: fc.integer({ min: 1, max: 50 })
    }).map(({ cx, cy, r }) => 
      `<svg><circle cx="${cx}" cy="${cy}" r="${r}"/></svg>`
    ),
    // Nested group
    fc.constant('<svg><g><rect x="10" y="10" width="50" height="50"/></g></svg>')
  );
}

/**
 * Generate a small positive integer (useful for indices, counts, etc.).
 */
export function arbitrarySmallInt(): fc.Arbitrary<number> {
  return fc.integer({ min: 0, max: 10 });
}

/**
 * Generate a tolerance value for geometric comparisons.
 */
export function arbitraryTolerance(): fc.Arbitrary<number> {
  return fc.float({ min: 0.001, max: 1, noNaN: true });
}
