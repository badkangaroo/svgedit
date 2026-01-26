/**
 * Query Operations Example
 * 
 * This example demonstrates querying the document:
 * - Query by ID
 * - Query by type
 * - Query by attribute
 * - Multi-criteria queries
 * - Hierarchy traversal
 */

import {
  Parser,
  QueryEngine,
  HierarchyIndex,
  type SVGDocument
} from '../src/index.js';

// Create a sample document
const parser = new Parser();
const svgText = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1">
      <stop offset="0%" stop-color="red"/>
      <stop offset="100%" stop-color="blue"/>
    </linearGradient>
  </defs>
  <g id="shapes" class="container">
    <rect id="rect1" x="10" y="10" width="50" height="50" fill="red" class="shape"/>
    <rect id="rect2" x="70" y="10" width="50" height="50" fill="blue" class="shape"/>
    <circle id="circle1" cx="50" cy="100" r="25" fill="red" class="shape"/>
    <circle id="circle2" cx="100" cy="100" r="25" fill="green" class="shape"/>
  </g>
  <g id="paths" class="container">
    <path id="path1" d="M 10 150 L 50 150 L 30 180 Z" fill="yellow"/>
    <path id="path2" d="M 70 150 L 110 150 L 90 180 Z" stroke="black" fill="none"/>
  </g>
</svg>
`;

const parseResult = parser.parse(svgText);
if (!parseResult.ok) {
  console.error('Failed to parse SVG:', parseResult.error.message);
  process.exit(1);
}

const document = parseResult.value;
console.log('✓ Parsed SVG document');
console.log(`  Total nodes: ${document.nodes.size}\n`);

const queryEngine = new QueryEngine();

console.log('=== Query by ID ===\n');

const rect1 = queryEngine.queryById(document, 'rect1');
if (rect1) {
  console.log(`Found rect1:`);
  console.log(`  Type: ${rect1.type}`);
  console.log(`  Fill: ${rect1.attributes.get('fill')}`);
  console.log(`  Class: ${rect1.attributes.get('class')}`);
}

console.log('\n=== Query by Type ===\n');

const rectangles = queryEngine.queryByType(document, 'rect');
console.log(`Found ${rectangles.length} rectangles:`);
rectangles.forEach(rect => {
  console.log(`  - ${rect.id}: fill=${rect.attributes.get('fill')}`);
});

const circles = queryEngine.queryByType(document, 'circle');
console.log(`\nFound ${circles.length} circles:`);
circles.forEach(circle => {
  console.log(`  - ${circle.id}: fill=${circle.attributes.get('fill')}`);
});

const paths = queryEngine.queryByType(document, 'path');
console.log(`\nFound ${paths.length} paths:`);
paths.forEach(path => {
  console.log(`  - ${path.id}`);
});

console.log('\n=== Query by Attribute ===\n');

// Find all elements with fill='red'
const redElements = queryEngine.queryByAttribute(document, 'fill', 'red');
console.log(`Found ${redElements.length} red elements:`);
redElements.forEach(el => {
  console.log(`  - ${el.id} (${el.type})`);
});

// Find all elements with class='shape'
const shapes = queryEngine.queryByAttribute(document, 'class', 'shape');
console.log(`\nFound ${shapes.length} elements with class='shape':`);
shapes.forEach(el => {
  console.log(`  - ${el.id} (${el.type})`);
});

// Find all elements with a 'stroke' attribute (any value)
const strokedElements = queryEngine.queryByAttribute(document, 'stroke');
console.log(`\nFound ${strokedElements.length} elements with stroke:`);
strokedElements.forEach(el => {
  console.log(`  - ${el.id}: stroke=${el.attributes.get('stroke')}`);
});

console.log('\n=== Multi-Criteria Queries ===\n');

// Find red rectangles
const redRects = queryEngine.query(document, {
  type: 'rect',
  attribute: { name: 'fill', value: 'red' }
});
console.log(`Found ${redRects.length} red rectangles:`);
redRects.forEach(rect => {
  console.log(`  - ${rect.id}`);
});

// Find circles with class='shape'
const shapeCircles = queryEngine.query(document, {
  type: 'circle',
  attribute: { name: 'class', value: 'shape' }
});
console.log(`\nFound ${shapeCircles.length} circles with class='shape':`);
shapeCircles.forEach(circle => {
  console.log(`  - ${circle.id}: fill=${circle.attributes.get('fill')}`);
});

// Find all shapes (any type) with fill='red'
const redShapes = queryEngine.query(document, {
  attribute: { name: 'fill', value: 'red' }
});
console.log(`\nFound ${redShapes.length} red shapes (any type):`);
redShapes.forEach(shape => {
  console.log(`  - ${shape.id} (${shape.type})`);
});

console.log('\n=== Hierarchy Traversal ===\n');

const hierarchyIndex = new HierarchyIndex(document);

// Find parent of rect1
const rect1Node = queryEngine.queryById(document, 'rect1');
if (rect1Node) {
  const parent = hierarchyIndex.getParent(rect1Node.id);
  console.log(`Parent of rect1: ${parent?.id} (${parent?.type})`);
  
  // Find all children of the parent
  if (parent) {
    const siblings = hierarchyIndex.getChildren(parent.id);
    console.log(`\nSiblings of rect1 (children of ${parent.id}):`);
    siblings.forEach(sibling => {
      console.log(`  - ${sibling.id} (${sibling.type})`);
    });
  }
}

// Find all ancestors of rect1
if (rect1Node) {
  const ancestors = hierarchyIndex.getAncestors(rect1Node.id);
  console.log(`\nAncestors of rect1:`);
  ancestors.forEach(ancestor => {
    console.log(`  - ${ancestor.id} (${ancestor.type})`);
  });
}

// Find all descendants of the shapes group
const shapesGroup = queryEngine.queryById(document, 'shapes');
if (shapesGroup) {
  const descendants = hierarchyIndex.getDescendants(shapesGroup.id);
  console.log(`\nDescendants of shapes group:`);
  descendants.forEach(desc => {
    console.log(`  - ${desc.id} (${desc.type})`);
  });
}

console.log('\n=== Complex Query Example ===\n');

// Find all rectangles in the 'shapes' group with fill='red'
const shapesGroupNode = queryEngine.queryById(document, 'shapes');
if (shapesGroupNode) {
  const shapesDescendants = hierarchyIndex.getDescendants(shapesGroupNode.id);
  const redRectsInShapes = shapesDescendants.filter(node => 
    node.type === 'rect' && node.attributes.get('fill') === 'red'
  );
  
  console.log(`Red rectangles in shapes group:`);
  redRectsInShapes.forEach(rect => {
    console.log(`  - ${rect.id}`);
  });
}

console.log('\n=== Done ===');
