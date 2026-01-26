/**
 * Tests for EditorController
 * 
 * Validates undo/redo functionality and view synchronization.
 * Requirements: 9.2, 9.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorController, editorController } from './editor-controller';
import { historyManager } from './history-manager';
import { documentState, documentStateUpdater } from './document-state';
import { selectionManager } from './selection-manager';
import type { Operation } from '../types';

describe('EditorController', () => {
  let controller: EditorController;

  beforeEach(() => {
    // Create a fresh controller for each test
    controller = new EditorController();
    
    // Clear history before each test
    historyManager.clear();
    
    // Clear document state
    documentStateUpdater.clearDocument();
  });

  describe('undo()', () => {
    it('should execute the undo operation from history manager', () => {
      // Create a mock operation
      let value = 0;
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => { value = 10; },
        redo: () => { value = 20; },
        description: 'Test operation',
      };

      // Apply the operation
      value = 20;
      historyManager.push(operation);

      // Undo should restore the value
      controller.undo();
      expect(value).toBe(10);
    });

    it('should throw error when nothing to undo', () => {
      expect(() => controller.undo()).toThrow('Nothing to undo');
    });

    it('should sync all views after undo', () => {
      // Spy on selectionManager.syncToAllViews
      const syncSpy = vi.spyOn(selectionManager, 'syncToAllViews');

      // Create and push an operation
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Test operation',
      };
      historyManager.push(operation);

      // Undo and verify sync was called
      controller.undo();
      expect(syncSpy).toHaveBeenCalled();

      syncSpy.mockRestore();
    });

    it('should update document state through operation', () => {
      // Create an operation that modifies document state
      const initialSVG = '<svg></svg>';
      const modifiedSVG = '<svg><rect/></svg>';
      
      documentStateUpdater.updateRawSVG(modifiedSVG);

      const operation: Operation = {
        type: 'create',
        timestamp: Date.now(),
        undo: () => {
          documentStateUpdater.updateRawSVG(initialSVG);
        },
        redo: () => {
          documentStateUpdater.updateRawSVG(modifiedSVG);
        },
        description: 'Create rectangle',
      };

      historyManager.push(operation);

      // Undo should restore initial state
      controller.undo();
      expect(documentState.rawSVG.get()).toBe(initialSVG);
    });
  });

  describe('redo()', () => {
    it('should execute the redo operation from history manager', () => {
      // Create a mock operation
      let value = 0;
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => { value = 10; },
        redo: () => { value = 20; },
        description: 'Test operation',
      };

      // Apply and undo the operation
      value = 20;
      historyManager.push(operation);
      historyManager.undo();
      expect(value).toBe(10);

      // Redo should reapply the value
      controller.redo();
      expect(value).toBe(20);
    });

    it('should throw error when nothing to redo', () => {
      expect(() => controller.redo()).toThrow('Nothing to redo');
    });

    it('should sync all views after redo', () => {
      // Spy on selectionManager.syncToAllViews
      const syncSpy = vi.spyOn(selectionManager, 'syncToAllViews');

      // Create, push, and undo an operation
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Test operation',
      };
      historyManager.push(operation);
      historyManager.undo();

      // Redo and verify sync was called
      controller.redo();
      expect(syncSpy).toHaveBeenCalled();

      syncSpy.mockRestore();
    });

    it('should update document state through operation', () => {
      // Create an operation that modifies document state
      const initialSVG = '<svg></svg>';
      const modifiedSVG = '<svg><rect/></svg>';
      
      documentStateUpdater.updateRawSVG(modifiedSVG);

      const operation: Operation = {
        type: 'create',
        timestamp: Date.now(),
        undo: () => {
          documentStateUpdater.updateRawSVG(initialSVG);
        },
        redo: () => {
          documentStateUpdater.updateRawSVG(modifiedSVG);
        },
        description: 'Create rectangle',
      };

      historyManager.push(operation);
      controller.undo();

      // Redo should restore modified state
      controller.redo();
      expect(documentState.rawSVG.get()).toBe(modifiedSVG);
    });
  });

  describe('canUndo()', () => {
    it('should return false when history is empty', () => {
      expect(controller.canUndo()).toBe(false);
    });

    it('should return true when operations exist in history', () => {
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Test operation',
      };
      historyManager.push(operation);

      expect(controller.canUndo()).toBe(true);
    });

    it('should return false after undoing all operations', () => {
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Test operation',
      };
      historyManager.push(operation);
      controller.undo();

      expect(controller.canUndo()).toBe(false);
    });
  });

  describe('canRedo()', () => {
    it('should return false when nothing has been undone', () => {
      expect(controller.canRedo()).toBe(false);
    });

    it('should return true after undoing an operation', () => {
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Test operation',
      };
      historyManager.push(operation);
      controller.undo();

      expect(controller.canRedo()).toBe(true);
    });

    it('should return false after redoing all operations', () => {
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Test operation',
      };
      historyManager.push(operation);
      controller.undo();
      controller.redo();

      expect(controller.canRedo()).toBe(false);
    });
  });

  describe('pushOperation()', () => {
    it('should add operation to history', () => {
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Test operation',
      };

      controller.pushOperation(operation);
      expect(controller.canUndo()).toBe(true);
    });

    it('should clear redo stack when pushing new operation', () => {
      const operation1: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Operation 1',
      };
      const operation2: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Operation 2',
      };

      controller.pushOperation(operation1);
      controller.undo();
      expect(controller.canRedo()).toBe(true);

      controller.pushOperation(operation2);
      expect(controller.canRedo()).toBe(false);
    });
  });

  describe('clearHistory()', () => {
    it('should clear both undo and redo stacks', () => {
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Test operation',
      };

      controller.pushOperation(operation);
      controller.undo();

      expect(controller.canUndo()).toBe(false);
      expect(controller.canRedo()).toBe(true);

      controller.clearHistory();

      expect(controller.canUndo()).toBe(false);
      expect(controller.canRedo()).toBe(false);
    });
  });

  describe('getUndoDescription()', () => {
    it('should return undefined when no undo is available', () => {
      expect(controller.getUndoDescription()).toBeUndefined();
    });

    it('should return description of the operation that would be undone', () => {
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Change fill color',
      };

      controller.pushOperation(operation);
      expect(controller.getUndoDescription()).toBe('Change fill color');
    });
  });

  describe('getRedoDescription()', () => {
    it('should return undefined when no redo is available', () => {
      expect(controller.getRedoDescription()).toBeUndefined();
    });

    it('should return description of the operation that would be redone', () => {
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Change fill color',
      };

      controller.pushOperation(operation);
      controller.undo();
      expect(controller.getRedoDescription()).toBe('Change fill color');
    });
  });

  describe('undo/redo round-trip', () => {
    it('should restore state after undo then redo', () => {
      let value = 0;
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => { value = 0; },
        redo: () => { value = 100; },
        description: 'Set value to 100',
      };

      // Apply operation
      value = 100;
      controller.pushOperation(operation);

      // Undo
      controller.undo();
      expect(value).toBe(0);

      // Redo
      controller.redo();
      expect(value).toBe(100);
    });

    it('should handle multiple operations in sequence', () => {
      const values: number[] = [];
      
      // Create 3 operations
      for (let i = 1; i <= 3; i++) {
        const operation: Operation = {
          type: 'attribute',
          timestamp: Date.now(),
          undo: () => { values.pop(); },
          redo: () => { values.push(i); },
          description: `Add ${i}`,
        };
        values.push(i);
        controller.pushOperation(operation);
      }

      expect(values).toEqual([1, 2, 3]);

      // Undo all
      controller.undo();
      controller.undo();
      controller.undo();
      expect(values).toEqual([]);

      // Redo all
      controller.redo();
      controller.redo();
      controller.redo();
      expect(values).toEqual([1, 2, 3]);
    });
  });

  describe('integration with document state', () => {
    it('should update all views when document state changes', () => {
      // Create an operation that changes selection
      const initialSelection = new Set<string>();
      const newSelection = new Set(['element-1', 'element-2']);

      documentStateUpdater.select([]);

      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {
          documentStateUpdater.select([]);
        },
        redo: () => {
          documentStateUpdater.select(['element-1', 'element-2']);
        },
        description: 'Select elements',
      };

      // Apply operation
      documentStateUpdater.select(['element-1', 'element-2']);
      controller.pushOperation(operation);

      // Verify state
      expect(documentState.selectedIds.get()).toEqual(newSelection);

      // Undo
      controller.undo();
      expect(documentState.selectedIds.get()).toEqual(initialSelection);

      // Redo
      controller.redo();
      expect(documentState.selectedIds.get()).toEqual(newSelection);
    });

    it('should handle complex document modifications', () => {
      // Simulate creating an element
      const initialTree: any[] = [];
      const newTree: any[] = [{ id: 'rect-1', type: 'rect' }];

      documentStateUpdater.updateDocumentTree(initialTree);

      const operation: Operation = {
        type: 'create',
        timestamp: Date.now(),
        undo: () => {
          documentStateUpdater.updateDocumentTree(initialTree);
        },
        redo: () => {
          documentStateUpdater.updateDocumentTree(newTree);
        },
        description: 'Create rectangle',
      };

      // Apply operation
      documentStateUpdater.updateDocumentTree(newTree);
      controller.pushOperation(operation);

      // Verify state
      expect(documentState.documentTree.get()).toEqual(newTree);

      // Undo
      controller.undo();
      expect(documentState.documentTree.get()).toEqual(initialTree);

      // Redo
      controller.redo();
      expect(documentState.documentTree.get()).toEqual(newTree);
    });
  });

  describe('global editorController instance', () => {
    it('should be a singleton instance', () => {
      expect(editorController).toBeInstanceOf(EditorController);
    });

    it('should be usable for undo/redo operations', () => {
      historyManager.clear();

      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => {},
        redo: () => {},
        description: 'Test operation',
      };

      editorController.pushOperation(operation);
      expect(editorController.canUndo()).toBe(true);

      editorController.undo();
      expect(editorController.canUndo()).toBe(false);
      expect(editorController.canRedo()).toBe(true);

      editorController.redo();
      expect(editorController.canUndo()).toBe(true);
      expect(editorController.canRedo()).toBe(false);
    });
  });
});
