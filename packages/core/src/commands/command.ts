import type { SVGDocument } from '../types/document.js';
import type { Result, ErrorCode } from '../types/result.js';

/**
 * Error information for command execution failures.
 * Provides detailed context about what went wrong during command execution or undo.
 */
export interface CommandError {
  /** Error code identifying the type of failure */
  code: ErrorCode;
  
  /** Human-readable error message */
  message: string;
  
  /** Optional node ID related to the error */
  nodeId?: string;
  
  /** Additional context for debugging */
  context?: unknown;
}

/**
 * Base interface for all commands that modify the document.
 * 
 * Commands encapsulate document modifications with full undo/redo support.
 * All document changes must go through commands to ensure:
 * - Every change is reversible (undo)
 * - History can be replayed deterministically
 * - State transitions are explicit and traceable
 * 
 * Commands follow the Command Pattern with these key methods:
 * - execute(): Apply the change to the document
 * - undo(): Reverse the change, restoring previous state
 * - canExecute(): Validate if the command can be executed
 * - canUndo(): Validate if the command can be undone
 * 
 * @example
 * ```typescript
 * const command = new CreateElementCommand('rect', attributes, parentId);
 * 
 * // Check if command can be executed
 * if (command.canExecute(document)) {
 *   // Execute the command
 *   const result = command.execute(document);
 *   
 *   if (result.ok) {
 *     const newDocument = result.value;
 *     
 *     // Later, undo the command
 *     if (command.canUndo(newDocument)) {
 *       const undoResult = command.undo(newDocument);
 *       // Document is restored to original state
 *     }
 *   }
 * }
 * ```
 */
export interface Command {
  /**
   * Execute the command, applying its changes to the document.
   * 
   * This method should:
   * - Validate that the command can be executed
   * - Apply the intended modification to the document
   * - Return a new document instance (immutable update)
   * - Store any information needed for undo
   * 
   * If the command cannot be executed (e.g., node not found, invalid parameters),
   * it should return an error without modifying the document.
   * 
   * @param document - The current document state
   * @returns Result containing the updated document or an error
   * 
   * @see canExecute - Use this to validate before calling execute
   */
  execute(document: SVGDocument): Result<SVGDocument, CommandError>;
  
  /**
   * Undo the command, reversing its changes and restoring the previous document state.
   * 
   * This method should:
   * - Validate that the command has been executed
   * - Reverse the modification made by execute()
   * - Return a new document instance (immutable update)
   * - Restore the document to its exact state before execute() was called
   * 
   * The undo operation must satisfy the inverse property:
   * For any document D, executing then undoing should restore D exactly.
   * 
   * @param document - The current document state (after execute)
   * @returns Result containing the restored document or an error
   * 
   * @see canUndo - Use this to validate before calling undo
   */
  undo(document: SVGDocument): Result<SVGDocument, CommandError>;
  
  /**
   * Check if the command can be executed on the given document.
   * 
   * This method validates preconditions without modifying the document:
   * - Required nodes exist
   * - Parent nodes are valid
   * - Attribute values are valid
   * - Any other command-specific requirements
   * 
   * Use this before calling execute() to avoid errors.
   * 
   * @param document - The document to validate against
   * @returns true if the command can be executed, false otherwise
   */
  canExecute(document: SVGDocument): boolean;
  
  /**
   * Check if the command can be undone on the given document.
   * 
   * This method validates that:
   * - The command has been executed
   * - The document is in a state where undo is possible
   * - Required nodes still exist for undo
   * 
   * Use this before calling undo() to avoid errors.
   * 
   * @param document - The document to validate against
   * @returns true if the command can be undone, false otherwise
   */
  canUndo(document: SVGDocument): boolean;
}
