/**
 * Delete element command for removing SVG elements from the document.
 * 
 * This command removes an SVG element and all its children from the document,
 * storing the deleted subtree to enable undo functionality.
 * 
 * @module commands/delete
 */

import type { Command, CommandError } from './command.js';
import type { SVGDocument } from '../types/document.js';
import type { SVGNode } from '../types/node.js';
import type { Result } from '../types/result.js';
import { ErrorCode } from '../types/result.js';
import { validateNodeExists } from './validation.js';

/**
 * Command to delete an SVG element and all its children from the document.
 * 
 * This command:
 * - Removes the specified node from its parent's children array
 * - Removes the node and all its descendants from the document's node index
 * - Stores the deleted subtree and its position for undo
 * - Prevents deletion of the root node
 * 
 * The command can be undone to restore the deleted element and all its children
 * to their original position in the document tree.
 * 
 * @example
 * ```typescript
 * // Delete a node
 * const cmd = new DeleteElementCommand('node_5');
 * 
 * const result = cmd.execute(document);
 * if (result.ok) {
 *   console.log('Deleted node and all its children');
 *   
 *   // Later, undo the deletion
 *   const undoResult = cmd.undo(result.value);
 *   // Node and children are restored
 * }
 * ```
 */
export class DeleteElementCommand implements Command {
  private nodeId: string;
  private deletedNode?: SVGNode;
  private parentId?: string;
  private indexInParent?: number;
  private executed: boolean = false;
  
  /**
   * Create a new DeleteElementCommand.
   * 
   * @param nodeId - The ID of the node to delete
   */
  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }
  
  /**
   * Check if the command can be executed on the given document.
   * 
   * Validates:
   * - Node exists in the document
   * - Node is not the root node (root cannot be deleted)
   * - Node has a parent
   * 
   * @param document - The document to validate against
   * @returns true if the command can be executed, false otherwise
   */
  canExecute(document: SVGDocument): boolean {
    const validation = validateNodeExists(document, this.nodeId);
    if (!validation.valid) {
      return false;
    }
    
    const node = document.nodes.get(this.nodeId);
    if (!node) {
      return false;
    }
    
    // Cannot delete the root node
    if (node.id === document.root.id) {
      return false;
    }
    
    // Node must have a parent to be deleted
    if (!node.parent) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if the command can be undone.
   * 
   * @param document - The document to validate against
   * @returns true if the command has been executed and can be undone
   */
  canUndo(document: SVGDocument): boolean {
    if (!this.executed || !this.deletedNode || !this.parentId) {
      return false;
    }
    
    // Verify the parent still exists in the document
    return document.nodes.has(this.parentId);
  }
  
  /**
   * Execute the command, removing the node and all its children from the document.
   * 
   * This method:
   * 1. Validates the command can be executed
   * 2. Stores the node, its parent ID, and its position for undo
   * 3. Removes the node from its parent's children array
   * 4. Removes the node and all descendants from the document's node index
   * 5. Increments the document version
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
    
    // Cannot delete the root node
    if (node.id === document.root.id) {
      return {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Cannot delete the root node',
          nodeId: this.nodeId,
        },
      };
    }
    
    // Node must have a parent
    if (!node.parent) {
      return {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: `Node with ID "${this.nodeId}" has no parent`,
          nodeId: this.nodeId,
        },
      };
    }
    
    const parent = node.parent;
    
    // Store information needed for undo
    this.deletedNode = this.cloneNodeDeep(node);
    this.parentId = parent.id;
    this.indexInParent = parent.children.findIndex(child => child.id === this.nodeId);
    
    // Remove node from parent's children array
    const newChildren = parent.children.filter(child => child.id !== this.nodeId);
    const updatedParent = {
      ...parent,
      children: newChildren
    };
    
    // Remove node and all descendants from the nodes map
    const newNodes = new Map(document.nodes);
    this.removeNodeAndDescendants(node, newNodes);
    newNodes.set(parent.id, updatedParent);
    
    // Update root reference if the parent is the root
    const newRoot = parent.id === document.root.id ? updatedParent : document.root;
    
    const updatedDocument: SVGDocument = {
      ...document,
      root: newRoot,
      nodes: newNodes,
      version: document.version + 1
    };
    
    // Mark as executed
    this.executed = true;
    
    return { ok: true, value: updatedDocument };
  }
  
  /**
   * Undo the command, restoring the deleted node and all its children to their original position.
   * 
   * This method:
   * 1. Validates the command can be undone
   * 2. Restores the deleted node to its original parent at its original index
   * 3. Restores the node and all descendants to the document's node index
   * 4. Increments the document version
   * 
   * @param document - The current document state (after execute)
   * @returns Result containing the restored document or an error
   */
  undo(document: SVGDocument): Result<SVGDocument, CommandError> {
    if (!this.executed || !this.deletedNode || !this.parentId || this.indexInParent === undefined) {
      return {
        ok: false,
        error: {
          code: ErrorCode.COMMAND_NOT_EXECUTED,
          message: 'Cannot undo a command that has not been executed',
        },
      };
    }
    
    // Verify the parent still exists
    const parent = document.nodes.get(this.parentId);
    if (!parent) {
      return {
        ok: false,
        error: {
          code: ErrorCode.NODE_NOT_FOUND,
          message: `Parent node with ID "${this.parentId}" not found`,
          nodeId: this.parentId,
        },
      };
    }
    
    // Update the deleted node's parent reference
    const restoredNode = {
      ...this.deletedNode,
      parent
    };
    
    // Insert the node back into the parent's children array at its original index
    const newChildren = [...parent.children];
    newChildren.splice(this.indexInParent, 0, restoredNode);
    
    const updatedParent = {
      ...parent,
      children: newChildren
    };
    
    // Restore node and all descendants to the nodes map
    const newNodes = new Map(document.nodes);
    this.addNodeAndDescendants(restoredNode, newNodes);
    newNodes.set(parent.id, updatedParent);
    
    // Update root reference if the parent is the root
    const newRoot = parent.id === document.root.id ? updatedParent : document.root;
    
    const updatedDocument: SVGDocument = {
      ...document,
      root: newRoot,
      nodes: newNodes,
      version: document.version + 1
    };
    
    // Mark as not executed (can be re-executed)
    this.executed = false;
    
    return { ok: true, value: updatedDocument };
  }
  
  /**
   * Deep clone a node and all its descendants.
   * This creates a complete copy of the subtree for storage during undo.
   * 
   * @param node - The node to clone
   * @returns A deep clone of the node and all its children
   */
  private cloneNodeDeep(node: SVGNode): SVGNode {
    const clonedChildren = node.children.map(child => this.cloneNodeDeep(child));
    
    const clonedNode: SVGNode = {
      id: node.id,
      type: node.type,
      attributes: new Map(node.attributes),
      children: clonedChildren,
      parent: null // Parent will be set during undo
    };
    
    // Update parent references for cloned children
    for (const child of clonedChildren) {
      child.parent = clonedNode;
    }
    
    return clonedNode;
  }
  
  /**
   * Recursively remove a node and all its descendants from the nodes map.
   * 
   * @param node - The node to remove
   * @param nodes - The nodes map to remove from
   */
  private removeNodeAndDescendants(node: SVGNode, nodes: Map<string, SVGNode>): void {
    nodes.delete(node.id);
    
    for (const child of node.children) {
      this.removeNodeAndDescendants(child, nodes);
    }
  }
  
  /**
   * Recursively add a node and all its descendants to the nodes map.
   * 
   * @param node - The node to add
   * @param nodes - The nodes map to add to
   */
  private addNodeAndDescendants(node: SVGNode, nodes: Map<string, SVGNode>): void {
    nodes.set(node.id, node);
    
    for (const child of node.children) {
      this.addNodeAndDescendants(child, nodes);
    }
  }
}
