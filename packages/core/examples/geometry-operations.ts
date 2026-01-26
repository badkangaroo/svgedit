/**
 * Geometry Operations Example
 * 
 * This example demonstrates geometric operations:
 * - Matrix transformations
 * - Bounding box calculations
 * - Path manipulation
 */

import {
  identity,
  compose,
  translate,
  scale,
  rotate,
  decompose,
  applyToPoint,
  bboxRect,
  bboxCircle,
  bboxTransform,
  parsePath,
  serializePath,
  normalizePath,
  simplifyPath,
  splitPath,
  mergePath,
  type Matrix,
  type Point
} from '../src/index.js';

console.log('=== Matrix Transformations ===\n');

// Create transformation matrices
const translateMatrix = translate(10, 20);
console.log('Translate matrix (10, 20):', translateMatrix);

const scaleMatrix = scale(2, 2);
console.log('Scale matrix (2x):', scaleMatrix);

const rotateMatrix = rotate(Math.PI / 4); // 45 degrees
console.log('Rotate matrix (45°):', rotateMatrix);

// Compose transformations
const combined = compose(
  translate(10, 20),
  compose(rotate(Math.PI / 4), scale(2, 2))
);
console.log('\nCombined transformation:', combined);

// Decompose matrix
const components = decompose(combined);
console.log('\nDecomposed components:');
console.log(`  Translate: (${components.translateX}, ${components.translateY})`);
console.log(`  Scale: (${components.scaleX}, ${components.scaleY})`);
console.log(`  Rotation: ${(components.rotation * 180 / Math.PI).toFixed(2)}°`);

// Apply transformation to a point
const point: Point = { x: 10, y: 10 };
const transformed = applyToPoint(combined, point);
console.log(`\nOriginal point: (${point.x}, ${point.y})`);
console.log(`Transformed point: (${transformed.x.toFixed(2)}, ${transformed.y.toFixed(2)})`);

console.log('\n=== Bounding Boxes ===\n');

// Calculate bounding boxes for different shapes
const rectBBox = bboxRect(10, 20, 100, 50);
console.log('Rectangle bbox:', rectBBox);

const circleBBox = bboxCircle(50, 50, 25);
console.log('Circle bbox:', circleBBox);

// Transform a bounding box
const transformedBBox = bboxTransform(rectBBox, translate(10, 10));
console.log('Transformed bbox:', transformedBBox);

console.log('\n=== Path Manipulation ===\n');

// Parse path data
const pathData = 'M 0 0 L 10 0 L 10 10 L 5 10 L 5 5 L 0 5 Z';
console.log('Original path:', pathData);

const commands = parsePath(pathData);
console.log(`Parsed into ${commands.length} commands`);

// Normalize to absolute coordinates
const normalized = normalizePath(commands);
console.log('\nNormalized (all absolute):');
normalized.forEach((cmd, i) => {
  console.log(`  ${i}: ${cmd.type} ${cmd.points.join(' ')} (absolute: ${cmd.absolute})`);
});

// Simplify path
const simplified = simplifyPath(normalized, 0.1);
console.log(`\nSimplified from ${normalized.length} to ${simplified.length} commands`);

// Serialize back to string
const serialized = serializePath(simplified);
console.log('Serialized:', serialized);

// Split path
const [before, after] = splitPath(normalized, 0.5);
console.log(`\nSplit path at 50%:`);
console.log(`  Before: ${before.length} commands`);
console.log(`  After: ${after.length} commands`);

// Merge paths
const merged = mergePath(before, after);
console.log(`  Merged: ${merged.length} commands`);

console.log('\n=== Complex Path Example ===\n');

// Create a more complex path with curves
const complexPath = 'M 0 0 C 10 10 20 20 30 30 Q 40 40 50 50 L 60 60 Z';
console.log('Complex path:', complexPath);

const complexCommands = parsePath(complexPath);
console.log('Parsed commands:');
complexCommands.forEach((cmd, i) => {
  const pointsStr = cmd.points.length > 0 ? ` [${cmd.points.join(', ')}]` : '';
  console.log(`  ${i}: ${cmd.type}${pointsStr}`);
});

// Normalize and serialize
const normalizedComplex = normalizePath(complexCommands);
const serializedComplex = serializePath(normalizedComplex);
console.log('\nNormalized and serialized:', serializedComplex);

console.log('\n=== Done ===');
