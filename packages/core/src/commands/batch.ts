/**
 * Batch command for grouping multiple commands into a single undo/redo unit.
 * 
 * This command allows multiple sub-commands to be executed as a single atomic operation,
 * ensuring that complex multi-step operations can be undone and redone together.
 * 
 * @module commands/batch
 */

import type { Command, CommandError } from './command.js';
import type { SVGDocument } from '../types/document.js';
import type { Result } from '../types/result.js';
import { ErrorCode } from '../types/result.js';

/**
 * Command to execute multiple sub-commands as a single atomic operation.
 * 
 * This command:
 * - Executes all sub-commands in order
 * - Stops execution on the first failure
 * - Undoes all executed sub-commands in reverse order
 * - Provides atomic undo/redo for complex operations
 * 
 * The batch command is useful for operations that require multiple steps,
 * such as:
 * - Creating multiple related elements
 * - Moving a group of elements
 * - Applying multiple attribute changes
 * - Complex transformations that involve multiple commands
 * 
 * @example
 * ```typescript
 * // Create a batch command to add multiple rectangles
 * const batch = new BatchCommand([
 *   new CreateElementCommand('rect', new Map([['x', '0'], ['y', '0']]), 'parent-id'),
 *   new CreateElementCommand('rect', new Map([['x', '10'], ['y', '10']]), 'parent-id'),
 *   new CreateElementCommand('rect', new Map([['x', '20'], ['y', '20']]), 'parent-id'),
 * ]);
 * 
 * const result = batch.execute(document);
 * if (result.ok) {
 *   console.log('Created 3 rectangles');
 *   
 *   // Later, undo all 3 creations at once
 *   const undoResult = batch.undo(result.value);
 *   // All 3 rectangles are removed
 * }
 * ```
 */
export class BatchCommand implements Command {
  private commands: Command[];
  private executedCommands: Command[] = [];
  private executed: boolean = false;
  
  /**
   * Create a new BatchCommand.
   * 
   * @param commands - Array of sub-commands to execute in order
   */
  constructor(commands: Command[]) {
    this.commands = commands;
  }
  
  /**
   * Check if the command can be executed on the given document.
   * 
   * Validates that all sub-commands can be executed.
   * Note: This only checks the first command's preconditions, as subsequent
   * commands may depend on earlier commands' effects.
   * 
   * @param document - The document to validate against
   * @returns true if the batch can be executed, false otherwise
   */
  canExecute(document: SVGDocument): boolean {
    // Empty batch is valid but does nothing
    if (this.commands.length === 0) {
      return true;
    }
    
    // Check if the first command can be executed
    // We can't check all commands because later commands may depend on earlier ones
    const firstCommand = this.commands[0];
    return firstCommand ? firstCommand.canExecute(document) : true;
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
    
    // Empty batch is valid
    if (this.executedCommands.length === 0) {
      return true;
    }
    
    // Check if all executed commands can be undone
    // We need to check in reverse order since we'll undo in reverse
    for (let i = this.executedCommands.length - 1; i >= 0; i--) {
      const command = this.executedCommands[i];
      if (!command || !command.canUndo(document)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Execute the batch command, running all sub-commands in order.
   * 
   * This method:
   * 1. Executes each sub-command in the order they were provided
   * 2. Passes the updated document from each command to the next
   * 3. Stops execution on the first failure
   * 4. Tracks which commands were successfully executed for undo
   * 
   * If any sub-command fails:
   * - Execution stops immediately
   * - An error is returned
   * - The document is left in a partially modified state
   * - Only successfully executed commands can be undone
   * 
   * @param document - The current document state
   * @returns Result containing the updated document or an error
   */
  execute(document: SVGDocument): Result<SVGDocument, CommandError> {
    // Reset execution state
    this.executedCommands = [];
    
    // Handle empty batch
    if (this.commands.length === 0) {
      this.executed = true;
      return { ok: true, value: document };
    }
    
    let currentDocument = document;
    
    // Execute each command in order
    for (let i = 0; i < this.commands.length; i++) {
      const command = this.commands[i];
      if (!command) {
        continue; // Skip undefined commands (shouldn't happen)
      }
      
      const result = command.execute(currentDocument);
      
      if (!result.ok) {
        // Command failed - return error
        // Note: executedCommands contains only the commands that succeeded
        this.executed = true; // Mark as executed so partial undo is possible
        return {
          ok: false,
          error: {
            code: result.error.code,
            message: `Batch command failed at sub-command ${i + 1}: ${result.error.message}`,
            nodeId: result.error.nodeId,
            context: {
              ...(result.error.context as object | undefined),
              subCommandIndex: i,
              totalCommands: this.commands.length,
              executedCommands: this.executedCommands.length,
            },
          },
        };
      }
      
      // Command succeeded - update document and track execution
      currentDocument = result.value;
      this.executedCommands.push(command);
    }
    
    // All commands executed successfully
    this.executed = true;
    return { ok: true, value: currentDocument };
  }
  
  /**
   * Undo the batch command, reversing all executed sub-commands in reverse order.
   * 
   * This method:
   * 1. Validates the command can be undone
   * 2. Undoes each executed sub-command in reverse order
   * 3. Passes the updated document from each undo to the next
   * 4. Stops on the first undo failure
   * 
   * The reverse order ensures that dependencies between commands are respected.
   * For example, if command A creates a node and command B modifies it,
   * undoing B before A ensures the node exists when B is undone.
   * 
   * If any sub-command undo fails:
   * - Undo stops immediately
   * - An error is returned
   * - The document is left in a partially restored state
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
          message: 'Cannot undo a batch command that has not been executed',
        },
      };
    }
    
    // Handle empty batch
    if (this.executedCommands.length === 0) {
      this.executed = false;
      return { ok: true, value: document };
    }
    
    let currentDocument = document;
    
    // Undo each command in reverse order
    for (let i = this.executedCommands.length - 1; i >= 0; i--) {
      const command = this.executedCommands[i];
      if (!command) {
        continue; // Skip undefined commands (shouldn't happen)
      }
      
      const result = command.undo(currentDocument);
      
      if (!result.ok) {
        // Undo failed - return error
        return {
          ok: false,
          error: {
            code: result.error.code,
            message: `Batch command undo failed at sub-command ${i + 1}: ${result.error.message}`,
            nodeId: result.error.nodeId,
            context: {
              ...(result.error.context as object | undefined),
              subCommandIndex: i,
              totalCommands: this.executedCommands.length,
              remainingUndos: i,
            },
          },
        };
      }
      
      // Undo succeeded - update document
      currentDocument = result.value;
    }
    
    // All commands undone successfully
    this.executed = false;
    return { ok: true, value: currentDocument };
  }
}
