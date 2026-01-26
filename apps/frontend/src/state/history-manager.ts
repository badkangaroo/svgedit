/**
 * History Manager
 * 
 * Implements undo/redo functionality for the SVG editor.
 * Maintains stacks of operations that can be undone and redone.
 * 
 * Requirements: 9.1, 9.5
 */

import { Operation } from '../types';

/**
 * HistoryManager class manages undo/redo stacks for editing operations
 * 
 * The history manager maintains two stacks:
 * - undoStack: Operations that can be undone
 * - redoStack: Operations that can be redone
 * 
 * When a new operation is pushed:
 * - It's added to the undo stack
 * - The redo stack is cleared (can't redo after a new operation)
 * - If the undo stack exceeds maxStackSize, the oldest operation is removed
 * 
 * When undo is called:
 * - The most recent operation is popped from the undo stack
 * - Its undo() function is executed
 * - The operation is pushed to the redo stack
 * 
 * When redo is called:
 * - The most recent operation is popped from the redo stack
 * - Its redo() function is executed
 * - The operation is pushed back to the undo stack
 */
export class HistoryManager {
  private undoStack: Operation[] = [];
  private redoStack: Operation[] = [];
  private maxStackSize: number;

  /**
   * Create a new HistoryManager
   * @param maxStackSize Maximum number of operations to keep in history (default: 50)
   */
  constructor(maxStackSize: number = 50) {
    if (maxStackSize < 1) {
      throw new Error('maxStackSize must be at least 1');
    }
    this.maxStackSize = maxStackSize;
  }

  /**
   * Push a new operation to the undo stack
   * Clears the redo stack and trims the undo stack if it exceeds maxStackSize
   * 
   * @param operation The operation to add to history
   */
  push(operation: Operation): void {
    // Add operation to undo stack
    this.undoStack.push(operation);

    // Clear redo stack (can't redo after a new operation)
    this.redoStack = [];

    // Trim undo stack if it exceeds max size
    // Remove oldest operations (from the beginning of the array)
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo the most recent operation
   * Moves the operation from undo stack to redo stack and executes its undo function
   * 
   * @throws Error if there are no operations to undo
   */
  undo(): void {
    if (this.undoStack.length === 0) {
      throw new Error('Nothing to undo');
    }

    // Pop from undo stack
    const operation = this.undoStack.pop()!;

    // Execute undo function
    operation.undo();

    // Push to redo stack
    this.redoStack.push(operation);
  }

  /**
   * Redo the most recently undone operation
   * Moves the operation from redo stack to undo stack and executes its redo function
   * 
   * @throws Error if there are no operations to redo
   */
  redo(): void {
    if (this.redoStack.length === 0) {
      throw new Error('Nothing to redo');
    }

    // Pop from redo stack
    const operation = this.redoStack.pop()!;

    // Execute redo function
    operation.redo();

    // Push back to undo stack
    this.undoStack.push(operation);
  }

  /**
   * Clear both undo and redo stacks
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Check if there are operations that can be undone
   * @returns true if undo stack is not empty
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if there are operations that can be redone
   * @returns true if redo stack is not empty
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get the number of operations in the undo stack
   * @returns The number of operations that can be undone
   */
  getUndoCount(): number {
    return this.undoStack.length;
  }

  /**
   * Get the number of operations in the redo stack
   * @returns The number of operations that can be redone
   */
  getRedoCount(): number {
    return this.redoStack.length;
  }

  /**
   * Get the maximum stack size
   * @returns The maximum number of operations kept in history
   */
  getMaxStackSize(): number {
    return this.maxStackSize;
  }

  /**
   * Get the most recent operation without removing it from the stack
   * @returns The most recent operation or undefined if stack is empty
   */
  peekUndo(): Operation | undefined {
    return this.undoStack[this.undoStack.length - 1];
  }

  /**
   * Get the most recent redoable operation without removing it from the stack
   * @returns The most recent redoable operation or undefined if stack is empty
   */
  peekRedo(): Operation | undefined {
    return this.redoStack[this.redoStack.length - 1];
  }
}

/**
 * Create a singleton instance of HistoryManager for use throughout the application
 */
export const historyManager = new HistoryManager(50);
