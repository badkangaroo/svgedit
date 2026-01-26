/**
 * Create element command for adding new SVG elements to the document.
 * 
 * This command creates a new SVG element with the specified type and attributes,
 * adds it to a parent node, and assigns it a stable unique ID.
 * 
 * @module commands/create
 */

import type { Command, CommandError } from './command.js';
import type { SVGDocument } from '../types/document.js';
import type { SVGNode, SVGElementType } from '../types/node.js';
import type { Result } from '../types/result.js';
import { ErrorCode } from '../types/result.js';
import {
  validateParentNode,
  validateElementType,
  validateInsertIndex,
  combineValidations,
} from './validation.js';
import { addChildNode, removeChildNode } from '../document/immutable-updates.js';

/**
 * Command to create a new SVG element and add it to the document.
 * 
 * This command:
 * - Generates a stable unique ID for the new element
 * - Creates a new node with the specified type and attributes
 * - Adds the node to the specified parent's children array
 * - Updates the document's node index
 * - Supports optional insert index for positioning
 * 
 * The command can be undone to remove the created element.
 * 
 * @example
 * ```typescript
 * // Create a rectangle element
 * const cmd = new CreateElementCommand(
 *   'rect',
 *   new Map([
 *     ['x', '10'],
 *     ['y', '20'],
 *     ['width', '100'],
 *     ['height', '50'],
 *     ['fill', 'blue']
 *   ]),
 *   'parent-node-id'
 * );
 * 
 * const result = cmd.execute(document);
 * if (result.ok) {
 *   console.log('Created element with ID:', cmd.getCreatedNodeId());
 * }
 * ```
 */
export class CreateElementCommand implements Command {
  private elementType: SVGElementType;
  private attributes: Map<string, string>;
  private parentId: string;
  private insertIndex?: number;
  private createdNodeId?: string;
  private executed: boolean = false;
  
  /**
   * Create a new CreateElementCommand.
   * 
   * @param elementType - The type of SVG element to create (e.g., 'rect', 'circle', 'path')
   * @param attributes - Map of attribute name-value pairs for the new element
   * @param parentId - The ID of the parent node to add the element to
   * @param insertIndex - Optional index at which to insert the element (defaults to end)
   */
  constructor(
    elementType: SVGElementType,
    attributes: Map<string, string>,
    parentId: string,
    insertIndex?: number
  ) {
    this.elementType = elementType;
    this.attributes = attributes;
    this.parentId = parentId;
    this.insertIndex = insertIndex;
  }
  
  /**
   * Get the ID of the created node (only available after execute() succeeds).
   * 
   * @returns The ID of the created node, or undefined if not yet executed
   */
  getCreatedNodeId(): string | undefined {
    return this.createdNodeId;
  }
  
  /**
   * Check if the command can be executed on the given document.
   * 
   * Validates:
   * - Element type is valid
   * - Parent node exists
   * - Insert index is valid (if provided)
   * 
   * @param document - The document to validate against
   * @returns true if the command can be executed, false otherwise
   */
  canExecute(document: SVGDocument): boolean {
    const validation = combineValidations([
      validateElementType(this.elementType),
      validateParentNode(document, this.parentId),
      validateInsertIndex(document, this.parentId, this.insertIndex),
    ]);
    
    return validation.valid;
  }
  
  /**
   * Check if the command can be undone.
   * 
   * @param document - The document to validate against
   * @returns true if the command has been executed and can be undone
   */
  canUndo(document: SVGDocument): boolean {
    if (!this.executed || !this.createdNodeId) {
      return false;
    }
    
    // Verify the created node still exists in the document
    return document.nodes.has(this.createdNodeId);
  }
  
  /**
   * Execute the command, creating a new element and adding it to the document.
   * 
   * This method:
   * 1. Validates the command can be executed
   * 2. Generates a stable unique ID for the new element
   * 3. Creates a new SVGNode with the specified type and attributes
   * 4. Adds the node to the parent's children array at the specified index
   * 5. Updates the document's node index
   * 6. Increments the document version
   * 
   * @param document - The current document state
   * @returns Result containing the updated document or an error
   */
  execute(document: SVGDocument): Result<SVGDocument, CommandError> {
    // Validate preconditions
    const validation = combineValidations([
      validateElementType(this.elementType),
      validateParentNode(document, this.parentId),
      validateInsertIndex(document, this.parentId, this.insertIndex),
    ]);
    
    if (!validation.valid) {
      return { ok: false, error: validation.error };
    }
    
    // Generate a stable unique ID for the new element
    const newId = this.generateStableId(document);
    this.createdNodeId = newId;
    
    // Get the parent node
    const parent = document.nodes.get(this.parentId);
    if (!parent) {
      // This should not happen due to validation, but handle it anyway
      return {
        ok: false,
        error: {
          code: ErrorCode.NODE_NOT_FOUND,
          message: `Parent node with ID "${this.parentId}" not found`,
          nodeId: this.parentId,
        },
      };
    }
    
    // Create the new node
    const newNode: SVGNode = {
      id: newId,
      type: this.elementType,
      attributes: new Map(this.attributes),
      children: [],
      parent, // Will be updated by addChildNode
    };
    
    // Add the node to the parent using immutable update
    const updatedDocument = addChildNode(
      document,
      this.parentId,
      newNode,
      this.insertIndex
    );
    
    // Mark as executed
    this.executed = true;
    
    return { ok: true, value: updatedDocument };
  }
  
  /**
   * Undo the command, removing the created element from the document.
   * 
   * This method:
   * 1. Validates the command can be undone
   * 2. Removes the created node from its parent's children array
   * 3. Removes the node from the document's node index
   * 4. Increments the document version
   * 
   * @param document - The current document state (after execute)
   * @returns Result containing the restored document or an error
   */
  undo(document: SVGDocument): Result<SVGDocument, CommandError> {
    if (!this.executed || !this.createdNodeId) {
      return {
        ok: false,
        error: {
          code: ErrorCode.COMMAND_NOT_EXECUTED,
          message: 'Cannot undo a command that has not been executed',
        },
      };
    }
    
    // Verify the created node still exists
    if (!document.nodes.has(this.createdNodeId)) {
      return {
        ok: false,
        error: {
          code: ErrorCode.NODE_NOT_FOUND,
          message: `Created node with ID "${this.createdNodeId}" not found in document`,
          nodeId: this.createdNodeId,
        },
      };
    }
    
    // Remove the created node using immutable update
    const updatedDocument = removeChildNode(document, this.createdNodeId);
    
    // Mark as not executed (can be re-executed)
    this.executed = false;
    
    return { ok: true, value: updatedDocument };
  }
  
  /**
   * Generate a stable unique ID for the new element.
   * Uses a counter-based approach to ensure uniqueness.
   * 
   * @param document - The current document
   * @returns A unique ID string
   */
  private generateStableId(document: SVGDocument): string {
    // Find the highest existing node number
    let maxCounter = 0;
    
    for (const nodeId of document.nodes.keys()) {
      const match = nodeId.match(/^node_(\d+)$/);
      if (match && match[1]) {
        const counter = parseInt(match[1], 10);
        if (counter > maxCounter) {
          maxCounter = counter;
        }
      }
    }
    
    // Generate the next ID
    return `node_${maxCounter + 1}`;
  }
}
