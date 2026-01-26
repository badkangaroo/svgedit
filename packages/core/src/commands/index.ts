/**
 * Command system for document modifications with undo/redo support.
 * 
 * This module provides the command pattern implementation for all document changes.
 * All modifications to the SVG document must go through commands to ensure:
 * - Full undo/redo support
 * - Deterministic history replay
 * - Atomic operations
 * - State consistency
 * 
 * @module commands
 */

export type { Command, CommandError } from './command.js';
export {
  validateNodeExists,
  validateParentNode,
  validateAttributeName,
  validateAttributeValue,
  validateElementType,
  validateInsertIndex,
  combineValidations,
  type ValidationResult,
} from './validation.js';
export {
  validateNumericAttribute,
  validateLengthAttribute,
  validateColorAttribute,
  validateEnumAttribute,
  validateAttributeType,
  type AttributeValidationResult,
} from './attribute-validation.js';
export { CreateElementCommand } from './create.js';
export { DeleteElementCommand } from './delete.js';
export { UpdateAttributeCommand } from './update.js';
export { BatchCommand } from './batch.js';
export { HistoryManagerImpl, type HistoryManager } from './history.js';
