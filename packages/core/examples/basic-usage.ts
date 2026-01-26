/**
 * Basic Usage Example
 * 
 * This example demonstrates the fundamental operations of the SVG Edit core library:
 * - Parsing SVG documents
 * - Creating and executing commands
 * - Using the history manager for undo/redo
 * - Querying the document
 * - Serializing back to SVG
 */

import {
  Parser,
  Serializer,
  CreateElementCommand,
  UpdateAttributeCommand,
  DeleteElementCommand,
  HistoryManagerImpl,
  QueryEngine,
  type SVGDocument
} from '../src/index.js';

// Parse an SVG document
const parser = new Parser();
const svgText = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="50" height="50" fill="red"/>
  <circle cx="100" cy="100" r="30" fill="blue"/>
</svg>
`;

const parseResult = parser.parse(svgText);

if (!parseResult.ok) {
  console.error('Failed to parse SVG:', parseResult.error.message);
  process.exit(1);
}

const document = parseResult.value;
console.log('✓ Parsed SVG document');
console.log(`  Root: ${document.root.type}`);
console.log(`  Total nodes: ${document.nodes.size}`);

// Create a history manager for undo/redo
const history = new HistoryManagerImpl(document);
console.log('\n✓ Created history manager');

// Query the document
const queryEngine = new QueryEngine();
const rectangles = queryEngine.queryByType(document, 'rect');
const circles = queryEngine.queryByType(document, 'circle');
console.log(`\n✓ Queried document:`);
console.log(`  Rectangles: ${rectangles.length}`);
console.log(`  Circles: ${circles.length}`);

// Add a new element using a command
console.log('\n→ Adding a new path element...');
const createPath = new CreateElementCommand(
  'path',
  new Map([
    ['d', 'M 150 150 L 180 150 L 180 180 Z'],
    ['fill', 'green']
  ]),
  document.root.id
);

const createResult = history.execute(createPath);
if (!createResult.ok) {
  console.error('Failed to create path:', createResult.error.message);
  process.exit(1);
}

let currentDoc = createResult.value;
console.log('✓ Created path element');
console.log(`  Total nodes: ${currentDoc.nodes.size}`);

// Update an attribute
console.log('\n→ Updating rectangle fill color...');
const rectId = rectangles[0].id;
const updateFill = new UpdateAttributeCommand(rectId, 'fill', 'purple');

const updateResult = history.execute(updateFill);
if (!updateResult.ok) {
  console.error('Failed to update attribute:', updateResult.error.message);
  process.exit(1);
}

currentDoc = updateResult.value;
const updatedRect = queryEngine.queryById(currentDoc, rectId);
console.log('✓ Updated rectangle fill');
console.log(`  New fill: ${updatedRect?.attributes.get('fill')}`);

// Undo the last change
console.log('\n→ Undoing last change...');
const undoResult = history.undo();
if (!undoResult.ok) {
  console.error('Failed to undo:', undoResult.error.message);
  process.exit(1);
}

currentDoc = undoResult.value;
const revertedRect = queryEngine.queryById(currentDoc, rectId);
console.log('✓ Undone attribute update');
console.log(`  Fill reverted to: ${revertedRect?.attributes.get('fill')}`);

// Redo the change
console.log('\n→ Redoing change...');
const redoResult = history.redo();
if (!redoResult.ok) {
  console.error('Failed to redo:', redoResult.error.message);
  process.exit(1);
}

currentDoc = redoResult.value;
console.log('✓ Redone attribute update');

// Delete an element
console.log('\n→ Deleting circle element...');
const circleId = circles[0].id;
const deleteCircle = new DeleteElementCommand(circleId);

const deleteResult = history.execute(deleteCircle);
if (!deleteResult.ok) {
  console.error('Failed to delete circle:', deleteResult.error.message);
  process.exit(1);
}

currentDoc = deleteResult.value;
console.log('✓ Deleted circle element');
console.log(`  Total nodes: ${currentDoc.nodes.size}`);

// Serialize the final document
const serializer = new Serializer();
const finalSvg = serializer.serialize(currentDoc);
console.log('\n✓ Serialized final document:');
console.log(finalSvg);

// Summary
console.log('\n=== Summary ===');
console.log(`Commands executed: ${history.getHistory().length}`);
console.log(`Can undo: ${history.canUndo()}`);
console.log(`Can redo: ${history.canRedo()}`);
