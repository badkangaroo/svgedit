/**
 * Editor Controller
 * 
 * Provides high-level editing operations that integrate with the history manager
 * and ensure all views are updated after undo/redo operations.
 * 
 * Requirements: 9.2, 9.3
 */

import { historyManager } from './history-manager';
import { documentState, documentStateUpdater } from './document-state';
import { selectionManager } from './selection-manager';
import type { Operation } from '../types';

/**
 * EditorController class provides high-level editing operations
 * 
 * This controller acts as a bridge between the history manager and the UI,
 * ensuring that undo/redo operations properly update all synchronized views.
 * 
 * The controller:
 * - Wraps the history manager's undo/redo methods
 * - Ensures view synchronization after operations
 * - Provides a clean API for the UI to trigger undo/redo
 */
export class EditorController {
  /**
   * Undo the most recent operation
   * Updates all views after the undo operation completes
   * 
   * @throws Error if there are no operations to undo
   */
  undo(): void {
    if (!historyManager.canUndo()) {
      throw new Error('Nothing to undo');
    }

    // Execute the undo operation
    // The operation's undo() function will update the document state
    historyManager.undo();

    // Trigger view synchronization
    // The reactive signals will automatically update subscribed components,
    // but we ensure selection is properly synced across all views
    this.syncViews();
  }

  /**
   * Redo the most recently undone operation
   * Updates all views after the redo operation completes
   * 
   * @throws Error if there are no operations to redo
   */
  redo(): void {
    if (!historyManager.canRedo()) {
      throw new Error('Nothing to redo');
    }

    // Execute the redo operation
    // The operation's redo() function will update the document state
    historyManager.redo();

    // Trigger view synchronization
    this.syncViews();
  }

  /**
   * Check if undo is available
   * @returns true if there are operations that can be undone
   */
  canUndo(): boolean {
    return historyManager.canUndo();
  }

  /**
   * Check if redo is available
   * @returns true if there are operations that can be redone
   */
  canRedo(): boolean {
    return historyManager.canRedo();
  }

  /**
   * Push a new operation to the history
   * This is a convenience method that wraps the history manager
   * 
   * @param operation The operation to add to history
   */
  pushOperation(operation: Operation): void {
    historyManager.push(operation);
  }

  /**
   * Clear the undo/redo history
   * This is useful when loading a new document
   */
  clearHistory(): void {
    historyManager.clear();
  }

  /**
   * Get the description of the operation that would be undone
   * @returns The description or undefined if no undo is available
   */
  getUndoDescription(): string | undefined {
    const operation = historyManager.peekUndo();
    return operation?.description;
  }

  /**
   * Get the description of the operation that would be redone
   * @returns The description or undefined if no redo is available
   */
  getRedoDescription(): string | undefined {
    const operation = historyManager.peekRedo();
    return operation?.description;
  }

  /**
   * Synchronize all views after an undo/redo operation
   * 
   * This method ensures that all views (canvas, hierarchy, raw SVG, inspector)
   * are properly updated after an undo/redo operation.
   * 
   * The reactive signal system handles most of the synchronization automatically,
   * but we explicitly trigger selection synchronization to ensure consistency.
   */
  private syncViews(): void {
    // The document state signals will automatically notify all subscribed components
    // (canvas, hierarchy, raw SVG panel, attribute inspector) of any changes.
    
    // Explicitly sync selection across all views to ensure consistency
    // This is important because undo/redo operations may change the selection
    selectionManager.syncToAllViews();

    // Note: We don't need to manually update each view because they're all
    // subscribed to the reactive signals in documentState. When an operation's
    // undo() or redo() function updates the document state signals, all views
    // will automatically re-render.
  }
}

/**
 * Global editor controller instance
 * This is the single instance used throughout the application
 */
export const editorController = new EditorController();
