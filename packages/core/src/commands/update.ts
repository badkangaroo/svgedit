/**
 * Update attribute command for modifying SVG element attributes.
 * 
 * This command updates or creates an attribute on an SVG element,
 * storing the previous value to enable undo functionality.
 * 
 * @module commands/update
 */

import type { Command, CommandError } from './command.js';
import type { SVGDocument } from '../types/document.js';
import type { Result } from '../types/result.js';
import { ErrorCode } from '../types/result.js';
import { validateNodeExists } from './validation.js';
import { updateNodeAttribute, removeNodeAttribute } from '../document/immutable-updates.js';

/**
 * Command to update or create an attribute on an SVG element.
 * 
 * This command:
 * - Updates an existing attribute to a new value
 * - Creates a new attribute if it doesn't exist
 * - Stores the previous value (or undefined if newly created) for undo
 * - Supports full undo to restore the previous state
 * 
 * The command can be undone to:
 * - Restore the previous attribute value (if it existed)
 * - Remove the attribute (if it was newly created)
 * 
 * @example
 * ```typescript
 * // Update an existing attribute
 * const cmd = new UpdateAttributeCommand('node_5', 'fill', 'blue');
 * 
 * const result = cmd.execute(document);
 * if (result.ok) {
 *   console.log('Updated fill attribute to blue');
 *   
 *   // Later, undo the change
 *   const undoResult = cmd.undo(result.value);
 *   // Attribute is restored to its previous value
 * }
 * 
 * // Create a new attribute
 * const cmd2 = new UpdateAttributeCommand('node_5', 'stroke', 'red');
 * const result2 = cmd2.execute(document);
 * // If 'stroke' didn't exist, it's now created
 * 
 * // Undo removes the newly created attribute
 * const undoResult2 = cmd2.undo(result2.value);
 * // 'stroke' attribute is removed
 * ```
 */
export class UpdateAttributeCommand implements Command {
  private nodeId: string;
  private attributeName: string;
  private newValue: string;
  private previousValue?: string;
  private wasNewAttribute: boolean = false;
  private executed: boolean = false;
  
  /**
   * Create a new UpdateAttributeCommand.
   * 
   * @param nodeId - The ID of the node to update
   * @param attributeName - The name of the attribute to update or create
   * @param newValue - The new value for the attribute
   */
  constructor(nodeId: string, attributeName: string, newValue: string) {
    this.nodeId = nodeId;
    this.attributeName = attributeName;
    this.newValue = newValue;
  }
  
  /**
   * Check if the command can be executed on the given document.
   * 
   * Validates:
   * - Node exists in the document
   * 
   * @param document - The document to validate against
   * @returns true if the command can be executed, false otherwise
   */
  canExecute(document: SVGDocument): boolean {
    const validation = validateNodeExists(document, this.nodeId);
    return validation.valid;
  }
  
  /**
   * Check if the command can be undone.
   * 
   * @param document - The document to validate against
   * @returns true if the command has been executed and can be undone
   */
  canUndo(document: SVGDocument): boolean {
    if (!this.executed) {
      return false;
    }
    
    // Verify the node still exists in the document
    return document.nodes.has(this.nodeId);
  }
  
  /**
   * Execute the command, updating or creating the attribute on the node.
   * 
   * This method:
   * 1. Validates the command can be executed
   * 2. Stores the previous attribute value (or undefined if it didn't exist)
   * 3. Updates the attribute to the new value (or creates it if it doesn't exist)
   * 4. Increments the document version
   * 
   * @param document - The current document state
   * @returns Result containing the updated document or an error
   */
  execute(document: SVGDocument): Result<SVGDocument, CommandError> {
    // Validate preconditions
    const validation = validateNodeExists(document, this.nodeId);
    if (!validation.valid) {
      return { ok: false, error: validation.error };
    }
    
    const node = document.nodes.get(this.nodeId);
    if (!node) {
      return {
        ok: false,
        error: {
          code: ErrorCode.NODE_NOT_FOUND,
          message: `Node with ID "${this.nodeId}" not found`,
          nodeId: this.nodeId,
        },
      };
    }
    
    // Store the previous value for undo
    if (node.attributes.has(this.attributeName)) {
      this.previousValue = node.attributes.get(this.attributeName);
      this.wasNewAttribute = false;
    } else {
      this.previousValue = undefined;
      this.wasNewAttribute = true;
    }
    
    // Update the attribute using immutable update
    const updatedDocument = updateNodeAttribute(
      document,
      this.nodeId,
      this.attributeName,
      this.newValue
    );
    
    // Mark as executed
    this.executed = true;
    
    return { ok: true, value: updatedDocument };
  }
  
  /**
   * Undo the command, restoring the previous attribute value or removing the attribute.
   * 
   * This method:
   * 1. Validates the command can be undone
   * 2. If the attribute was newly created, removes it
   * 3. If the attribute existed before, restores its previous value
   * 4. Increments the document version
   * 
   * @param document - The current document state (after execute)
   * @returns Result containing the restored document or an error
   */
  undo(document: SVGDocument): Result<SVGDocument, CommandError> {
    if (!this.executed) {
      return {
        ok: false,
        error: {
          code: ErrorCode.COMMAND_NOT_EXECUTED,
          message: 'Cannot undo a command that has not been executed',
        },
      };
    }
    
    // Verify the node still exists
    if (!document.nodes.has(this.nodeId)) {
      return {
        ok: false,
        error: {
          code: ErrorCode.NODE_NOT_FOUND,
          message: `Node with ID "${this.nodeId}" not found in document`,
          nodeId: this.nodeId,
        },
      };
    }
    
    let updatedDocument: SVGDocument;
    
    if (this.wasNewAttribute) {
      // Remove the attribute if it was newly created
      updatedDocument = removeNodeAttribute(
        document,
        this.nodeId,
        this.attributeName
      );
    } else {
      // Restore the previous value
      updatedDocument = updateNodeAttribute(
        document,
        this.nodeId,
        this.attributeName,
        this.previousValue!
      );
    }
    
    // Mark as not executed (can be re-executed)
    this.executed = false;
    
    return { ok: true, value: updatedDocument };
  }
}
