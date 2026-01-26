/**
 * @svg-edit/core - Headless SVG manipulation engine
 * 
 * A framework-agnostic TypeScript library for SVG document manipulation
 * with command pattern, undo/redo support, and mathematical utilities.
 * 
 * ## Features
 * 
 * - **Document Model**: Parse and serialize SVG documents with stable node IDs
 * - **Command Pattern**: All modifications through reversible commands
 * - **Undo/Redo**: Full history management with deterministic replay
 * - **Geometry**: Matrix transformations, bounding boxes, path manipulation
 * - **Query Engine**: Efficient node lookup by ID, type, and attributes
 * - **Framework Independent**: Works in Node.js and browsers without DOM dependencies
 * 
 * ## Quick Start
 * 
 * ```typescript
 * import {
 *   Parser,
 *   Serializer,
 *   CreateElementCommand,
 *   HistoryManagerImpl,
 *   QueryEngine
 * } from '@svg-edit/core';
 * 
 * // Parse SVG
 * const parser = new Parser();
 * const result = parser.parse('<svg><rect x="10" y="20" width="100" height="50"/></svg>');
 * 
 * if (result.ok) {
 *   const document = result.value;
 *   
 *   // Create a history manager
 *   const history = new HistoryManagerImpl(document);
 *   
 *   // Add a new circle using a command
 *   const createCircle = new CreateElementCommand(
 *     'circle',
 *     new Map([['cx', '50'], ['cy', '50'], ['r', '25']]),
 *     document.root.id
 *   );
 *   
 *   const cmdResult = history.execute(createCircle);
 *   if (cmdResult.ok) {
 *     const updatedDoc = cmdResult.value;
 *     
 *     // Query for all circles
 *     const queryEngine = new QueryEngine();
 *     const circles = queryEngine.queryByType(updatedDoc, 'circle');
 *     console.log(`Found ${circles.length} circles`);
 *     
 *     // Undo the change
 *     const undoResult = history.undo();
 *     
 *     // Serialize back to SVG
 *     const serializer = new Serializer();
 *     const svg = serializer.serialize(undoResult.value);
 *   }
 * }
 * ```
 * 
 * ## Error Handling
 * 
 * All operations that can fail return a `Result<T, E>` type:
 * 
 * ```typescript
 * const result = parser.parse(svgText);
 * if (result.ok) {
 *   // Success - use result.value
 *   const document = result.value;
 * } else {
 *   // Error - use result.error
 *   console.error(result.error.message);
 * }
 * ```
 * 
 * ## Command Pattern
 * 
 * All document modifications must go through commands:
 * 
 * ```typescript
 * // Create element
 * const createCmd = new CreateElementCommand('rect', attributes, parentId);
 * 
 * // Delete element
 * const deleteCmd = new DeleteElementCommand(nodeId);
 * 
 * // Update attribute
 * const updateCmd = new UpdateAttributeCommand(nodeId, 'fill', 'red');
 * 
 * // Batch multiple commands
 * const batchCmd = new BatchCommand([createCmd, updateCmd]);
 * 
 * // Execute through history manager
 * const result = history.execute(batchCmd);
 * ```
 * 
 * ## Geometry Operations
 * 
 * ```typescript
 * import { compose, translate, rotate, bboxRect } from '@svg-edit/core';
 * 
 * // Create transformation matrix
 * const matrix = compose(
 *   translate(10, 20),
 *   rotate(Math.PI / 4)
 * );
 * 
 * // Calculate bounding box
 * const bbox = bboxRect(10, 20, 100, 50);
 * console.log(bbox); // { x: 10, y: 20, width: 100, height: 50 }
 * ```
 * 
 * ## Path Manipulation
 * 
 * ```typescript
 * import { parsePath, normalizePath, simplifyPath } from '@svg-edit/core';
 * 
 * // Parse path data
 * const commands = parsePath('M 10 10 L 20 20 L 30 30');
 * 
 * // Normalize to absolute coordinates
 * const normalized = normalizePath(commands);
 * 
 * // Simplify path
 * const simplified = simplifyPath(normalized, 0.1);
 * ```
 * 
 * @packageDocumentation
 */

// Export all public types
export * from './types/index.js';

// Export document parsing and serialization
export { Parser } from './document/parser.js';
export { Serializer, type SerializerOptions } from './document/serializer.js';

// Export immutable update utilities
export {
  updateNode,
  updateNodeAttribute,
  removeNodeAttribute,
  addChildNode,
  removeChildNode,
  moveNode,
  cloneNode
} from './document/immutable-updates.js';

// Export query engine
export { QueryEngine, HierarchyIndex, type Selector } from './query/index.js';

// Export command system
export type { Command, CommandError } from './commands/index.js';
export {
  CreateElementCommand,
  DeleteElementCommand,
  UpdateAttributeCommand,
  BatchCommand,
  HistoryManagerImpl,
  type HistoryManager,
  validateNodeExists,
  validateParentNode,
  validateAttributeName,
  validateAttributeValue,
  validateElementType,
  validateInsertIndex,
  combineValidations,
  type ValidationResult,
  validateNumericAttribute,
  validateLengthAttribute,
  validateColorAttribute,
  validateEnumAttribute,
  validateAttributeType,
  type AttributeValidationResult,
} from './commands/index.js';

// Export geometry utilities
export {
  identity,
  compose,
  inverse,
  applyToPoint,
  translate,
  scale,
  rotate,
  decompose,
  type Matrix,
  type Point,
  type MatrixError,
  type TransformComponents,
  bboxRect,
  bboxCircle,
  bboxEllipse,
  bboxLine,
  bboxPath,
  bboxGroup,
  bboxTransform,
  type BoundingBox,
  parsePath,
  serializePath,
  normalizePath,
  simplifyPath,
  splitPath,
  mergePath,
  type PathCommand,
} from './geometry/index.js';
