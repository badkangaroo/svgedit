/**
 * History manager for tracking command execution and providing undo/redo functionality.
 * 
 * This module implements the history management system that tracks all executed commands
 * and provides undo/redo capabilities. It maintains two stacks:
 * - Undo stack: Commands that have been executed and can be undone
 * - Redo stack: Commands that have been undone and can be redone
 * 
 * @module commands/history
 */

import type { Command, CommandError } from './command.js';
import type { SVGDocument } from '../types/document.js';
import type { Result } from '../types/result.js';
import { ErrorCode } from '../types/result.js';

/**
 * Interface for the history manager that tracks command execution and provides undo/redo.
 * 
 * The history manager:
 * - Executes commands and adds them to the undo stack
 * - Provides undo functionality by reversing commands
 * - Provides redo functionality by re-executing undone commands
 * - Clears the redo stack when new commands are executed
 * - Maintains the current document state
 * 
 * @example
 * ```typescript
 * const history = new HistoryManager(initialDocument);
 * 
 * // Execute a command
 * const result = history.execute(createCommand);
 * if (result.ok) {
 *   console.log('Command executed');
 * }
 * 
 * // Undo the command
 * if (history.canUndo()) {
 *   const undoResult = history.undo();
 *   console.log('Command undone');
 * }
 * 
 * // Redo the command
 * if (history.canRedo()) {
 *   const redoResult = history.redo();
 *   console.log('Command redone');
 * }
 * ```
 */
export interface HistoryManager {
  /**
   * Execute a command and add it to the undo stack.
   * 
   * This method:
   * - Executes the command on the current document
   * - Adds the command to the undo stack if execution succeeds
   * - Clears the redo stack (new commands invalidate redo history)
   * - Updates the current document state
   * 
   * @param command - The command to execute
   * @returns Result containing the updated document or an error
   */
  execute(command: Command): Result<SVGDocument, CommandError>;
  
  /**
   * Undo the most recent command from the undo stack.
   * 
   * This method:
   * - Pops the most recent command from the undo stack
   * - Executes the command's undo() method
   * - Adds the command to the redo stack if undo succeeds
   * - Updates the current document state
   * 
   * @returns Result containing the restored document or an error
   */
  undo(): Result<SVGDocument, CommandError>;
  
  /**
   * Redo the most recent undone command from the redo stack.
   * 
   * This method:
   * - Pops the most recent command from the redo stack
   * - Re-executes the command
   * - Adds the command back to the undo stack if execution succeeds
   * - Updates the current document state
   * 
   * @returns Result containing the updated document or an error
   */
  redo(): Result<SVGDocument, CommandError>;
  
  /**
   * Check if there are commands that can be undone.
   * 
   * @returns true if the undo stack is not empty, false otherwise
   */
  canUndo(): boolean;
  
  /**
   * Check if there are commands that can be redone.
   * 
   * @returns true if the redo stack is not empty, false otherwise
   */
  canRedo(): boolean;
  
  /**
   * Clear all history (both undo and redo stacks).
   * 
   * This is useful when starting a new document or when you want to
   * prevent users from undoing past a certain point.
   */
  clear(): void;
  
  /**
   * Get the current document state.
   * 
   * @returns The current document
   */
  getCurrentDocument(): SVGDocument;
  
  /**
   * Get the history of executed commands (for debugging/inspection).
   * 
   * @returns Array of commands in the undo stack (oldest to newest)
   */
  getHistory(): Command[];
}

/**
 * Implementation of the HistoryManager interface.
 * 
 * This class manages the undo/redo stacks and tracks the current document state.
 * It ensures that:
 * - All document changes go through commands
 * - Every change is reversible
 * - History can be replayed deterministically
 * - State transitions are explicit and traceable
 * 
 * Key behaviors:
 * - Executing a command adds it to the undo stack and clears the redo stack
 * - Undoing a command moves it from the undo stack to the redo stack
 * - Redoing a command moves it from the redo stack back to the undo stack
 * - The redo stack is cleared whenever a new command is executed
 * 
 * @example
 * ```typescript
 * const document = parser.parse('<svg></svg>');
 * const history = new HistoryManagerImpl(document.value);
 * 
 * // Execute commands
 * history.execute(new CreateElementCommand('rect', attrs, parentId));
 * history.execute(new UpdateAttributeCommand(nodeId, 'fill', 'blue'));
 * 
 * // Undo both commands
 * history.undo(); // Undoes update
 * history.undo(); // Undoes create
 * 
 * // Redo both commands
 * history.redo(); // Redoes create
 * history.redo(); // Redoes update
 * ```
 */
export class HistoryManagerImpl implements HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private currentDocument: SVGDocument;
  
  /**
   * Create a new HistoryManager with the given initial document.
   * 
   * @param initialDocument - The initial document state
   */
  constructor(initialDocument: SVGDocument) {
    this.currentDocument = initialDocument;
  }
  
  /**
   * Execute a command and add it to the undo stack.
   * 
   * This method implements Requirement 6.1: "WHEN a Command is executed,
   * THE History_Manager SHALL add it to the undo stack"
   * 
   * It also implements Requirement 6.5: "WHEN a new command is executed
   * after undo operations, THE History_Manager SHALL clear the redo stack"
   * 
   * @param command - The command to execute
   * @returns Result containing the updated document or an error
   */
  execute(command: Command): Result<SVGDocument, CommandError> {
    // Execute the command on the current document
    const result = command.execute(this.currentDocument);
    
    if (result.ok) {
      // Command succeeded - update state
      this.undoStack.push(command);
      this.redoStack = []; // Clear redo stack (Requirement 6.5)
      this.currentDocument = result.value;
    }
    
    return result;
  }
  
  /**
   * Undo the most recent command from the undo stack.
   * 
   * This method implements Requirement 6.2: "WHEN undo is requested,
   * THE History_Manager SHALL pop the most recent command from the undo
   * stack and execute its undo() method"
   * 
   * It also implements Requirement 6.3: "WHEN a command is undone,
   * THE History_Manager SHALL add it to the redo stack"
   * 
   * @returns Result containing the restored document or an error
   */
  undo(): Result<SVGDocument, CommandError> {
    if (this.undoStack.length === 0) {
      return {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Nothing to undo',
        },
      };
    }
    
    // Pop the most recent command from the undo stack
    const command = this.undoStack.pop()!;
    
    // Execute the command's undo() method
    const result = command.undo(this.currentDocument);
    
    if (result.ok) {
      // Undo succeeded - update state
      this.redoStack.push(command); // Add to redo stack (Requirement 6.3)
      this.currentDocument = result.value;
    } else {
      // Undo failed - put the command back on the undo stack
      this.undoStack.push(command);
    }
    
    return result;
  }
  
  /**
   * Redo the most recent undone command from the redo stack.
   * 
   * This method implements Requirement 6.4: "WHEN redo is requested,
   * THE History_Manager SHALL pop the most recent command from the redo
   * stack and re-execute it"
   * 
   * @returns Result containing the updated document or an error
   */
  redo(): Result<SVGDocument, CommandError> {
    if (this.redoStack.length === 0) {
      return {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Nothing to redo',
        },
      };
    }
    
    // Pop the most recent command from the redo stack
    const command = this.redoStack.pop()!;
    
    // Re-execute the command
    const result = command.execute(this.currentDocument);
    
    if (result.ok) {
      // Redo succeeded - update state
      this.undoStack.push(command); // Add back to undo stack
      this.currentDocument = result.value;
    } else {
      // Redo failed - put the command back on the redo stack
      this.redoStack.push(command);
    }
    
    return result;
  }
  
  /**
   * Check if there are commands that can be undone.
   * 
   * @returns true if the undo stack is not empty, false otherwise
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  
  /**
   * Check if there are commands that can be redone.
   * 
   * @returns true if the redo stack is not empty, false otherwise
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  
  /**
   * Clear all history (both undo and redo stacks).
   * 
   * This is useful when starting a new document or when you want to
   * prevent users from undoing past a certain point.
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
  
  /**
   * Get the current document state.
   * 
   * @returns The current document
   */
  getCurrentDocument(): SVGDocument {
    return this.currentDocument;
  }
  
  /**
   * Get the history of executed commands (for debugging/inspection).
   * 
   * Returns a copy of the undo stack to prevent external modification.
   * 
   * @returns Array of commands in the undo stack (oldest to newest)
   */
  getHistory(): Command[] {
    return [...this.undoStack];
  }
}
