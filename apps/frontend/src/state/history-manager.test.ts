/**
 * Unit tests for HistoryManager
 * 
 * Tests the undo/redo functionality including:
 * - Push operations to undo stack
 * - Undo operations
 * - Redo operations
 * - Stack size limits
 * - Clear functionality
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryManager } from './history-manager';
import { Operation } from '../types';

describe('HistoryManager', () => {
  let historyManager: HistoryManager;

  beforeEach(() => {
    historyManager = new HistoryManager(50);
  });

  describe('constructor', () => {
    it('should create a history manager with default max stack size of 50', () => {
      const manager = new HistoryManager();
      expect(manager.getMaxStackSize()).toBe(50);
    });

    it('should create a history manager with custom max stack size', () => {
      const manager = new HistoryManager(100);
      expect(manager.getMaxStackSize()).toBe(100);
    });

    it('should throw error if max stack size is less than 1', () => {
      expect(() => new HistoryManager(0)).toThrow('maxStackSize must be at least 1');
      expect(() => new HistoryManager(-1)).toThrow('maxStackSize must be at least 1');
    });

    it('should start with empty stacks', () => {
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(false);
      expect(historyManager.getUndoCount()).toBe(0);
      expect(historyManager.getRedoCount()).toBe(0);
    });
  });

  describe('push', () => {
    it('should add operation to undo stack', () => {
      const operation = createMockOperation('test');
      historyManager.push(operation);

      expect(historyManager.canUndo()).toBe(true);
      expect(historyManager.getUndoCount()).toBe(1);
    });

    it('should clear redo stack when pushing new operation', () => {
      const op1 = createMockOperation('op1');
      const op2 = createMockOperation('op2');
      const op3 = createMockOperation('op3');

      // Push and undo to populate redo stack
      historyManager.push(op1);
      historyManager.push(op2);
      historyManager.undo();

      expect(historyManager.canRedo()).toBe(true);
      expect(historyManager.getRedoCount()).toBe(1);

      // Push new operation should clear redo stack
      historyManager.push(op3);

      expect(historyManager.canRedo()).toBe(false);
      expect(historyManager.getRedoCount()).toBe(0);
    });

    it('should maintain multiple operations in order', () => {
      const op1 = createMockOperation('op1');
      const op2 = createMockOperation('op2');
      const op3 = createMockOperation('op3');

      historyManager.push(op1);
      historyManager.push(op2);
      historyManager.push(op3);

      expect(historyManager.getUndoCount()).toBe(3);
      expect(historyManager.peekUndo()).toBe(op3);
    });

    it('should trim oldest operations when exceeding max stack size', () => {
      const manager = new HistoryManager(3);
      const op1 = createMockOperation('op1');
      const op2 = createMockOperation('op2');
      const op3 = createMockOperation('op3');
      const op4 = createMockOperation('op4');

      manager.push(op1);
      manager.push(op2);
      manager.push(op3);
      manager.push(op4);

      // Should only keep the 3 most recent operations
      expect(manager.getUndoCount()).toBe(3);
      expect(manager.peekUndo()).toBe(op4);

      // Undo should get op4, op3, op2 (op1 was trimmed)
      manager.undo();
      expect(manager.peekUndo()).toBe(op3);
      manager.undo();
      expect(manager.peekUndo()).toBe(op2);
    });

    it('should maintain at least 50 operations in history', () => {
      // Push 60 operations
      for (let i = 0; i < 60; i++) {
        historyManager.push(createMockOperation(`op${i}`));
      }

      // Should keep exactly 50 (the most recent ones)
      expect(historyManager.getUndoCount()).toBe(50);
    });
  });

  describe('undo', () => {
    it('should execute undo function of the operation', () => {
      const undoFn = vi.fn();
      const operation: Operation = {
        type: 'create',
        timestamp: Date.now(),
        undo: undoFn,
        redo: vi.fn(),
        description: 'test',
      };

      historyManager.push(operation);
      historyManager.undo();

      expect(undoFn).toHaveBeenCalledTimes(1);
    });

    it('should move operation from undo stack to redo stack', () => {
      const operation = createMockOperation('test');
      historyManager.push(operation);

      expect(historyManager.getUndoCount()).toBe(1);
      expect(historyManager.getRedoCount()).toBe(0);

      historyManager.undo();

      expect(historyManager.getUndoCount()).toBe(0);
      expect(historyManager.getRedoCount()).toBe(1);
    });

    it('should throw error when undo stack is empty', () => {
      expect(() => historyManager.undo()).toThrow('Nothing to undo');
    });

    it('should undo operations in reverse order', () => {
      const calls: string[] = [];
      const op1 = createMockOperationWithCallback('op1', calls);
      const op2 = createMockOperationWithCallback('op2', calls);
      const op3 = createMockOperationWithCallback('op3', calls);

      historyManager.push(op1);
      historyManager.push(op2);
      historyManager.push(op3);

      historyManager.undo();
      historyManager.undo();
      historyManager.undo();

      expect(calls).toEqual(['undo-op3', 'undo-op2', 'undo-op1']);
    });

    it('should update canUndo and canRedo correctly', () => {
      const operation = createMockOperation('test');
      historyManager.push(operation);

      expect(historyManager.canUndo()).toBe(true);
      expect(historyManager.canRedo()).toBe(false);

      historyManager.undo();

      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(true);
    });
  });

  describe('redo', () => {
    it('should execute redo function of the operation', () => {
      const redoFn = vi.fn();
      const operation: Operation = {
        type: 'create',
        timestamp: Date.now(),
        undo: vi.fn(),
        redo: redoFn,
        description: 'test',
      };

      historyManager.push(operation);
      historyManager.undo();
      historyManager.redo();

      expect(redoFn).toHaveBeenCalledTimes(1);
    });

    it('should move operation from redo stack to undo stack', () => {
      const operation = createMockOperation('test');
      historyManager.push(operation);
      historyManager.undo();

      expect(historyManager.getUndoCount()).toBe(0);
      expect(historyManager.getRedoCount()).toBe(1);

      historyManager.redo();

      expect(historyManager.getUndoCount()).toBe(1);
      expect(historyManager.getRedoCount()).toBe(0);
    });

    it('should throw error when redo stack is empty', () => {
      expect(() => historyManager.redo()).toThrow('Nothing to redo');
    });

    it('should redo operations in forward order', () => {
      const calls: string[] = [];
      const op1 = createMockOperationWithCallback('op1', calls);
      const op2 = createMockOperationWithCallback('op2', calls);
      const op3 = createMockOperationWithCallback('op3', calls);

      historyManager.push(op1);
      historyManager.push(op2);
      historyManager.push(op3);

      historyManager.undo();
      historyManager.undo();
      historyManager.undo();

      calls.length = 0; // Clear calls

      historyManager.redo();
      historyManager.redo();
      historyManager.redo();

      expect(calls).toEqual(['redo-op1', 'redo-op2', 'redo-op3']);
    });

    it('should update canUndo and canRedo correctly', () => {
      const operation = createMockOperation('test');
      historyManager.push(operation);
      historyManager.undo();

      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(true);

      historyManager.redo();

      expect(historyManager.canUndo()).toBe(true);
      expect(historyManager.canRedo()).toBe(false);
    });
  });

  describe('undo/redo round-trip', () => {
    it('should restore state after undo then redo', () => {
      let value = 0;
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => { value = 0; },
        redo: () => { value = 42; },
        description: 'set value',
      };

      value = 42; // Initial state after operation
      historyManager.push(operation);

      historyManager.undo();
      expect(value).toBe(0);

      historyManager.redo();
      expect(value).toBe(42);
    });

    it('should handle multiple undo/redo cycles', () => {
      let value = 0;
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: () => { value -= 1; },
        redo: () => { value += 1; },
        description: 'increment',
      };

      historyManager.push(operation);
      value = 1;

      // Cycle 1
      historyManager.undo();
      expect(value).toBe(0);
      historyManager.redo();
      expect(value).toBe(1);

      // Cycle 2
      historyManager.undo();
      expect(value).toBe(0);
      historyManager.redo();
      expect(value).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear both undo and redo stacks', () => {
      const op1 = createMockOperation('op1');
      const op2 = createMockOperation('op2');

      historyManager.push(op1);
      historyManager.push(op2);
      historyManager.undo();

      expect(historyManager.getUndoCount()).toBe(1);
      expect(historyManager.getRedoCount()).toBe(1);

      historyManager.clear();

      expect(historyManager.getUndoCount()).toBe(0);
      expect(historyManager.getRedoCount()).toBe(0);
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(false);
    });

    it('should allow pushing new operations after clear', () => {
      historyManager.push(createMockOperation('op1'));
      historyManager.clear();

      const operation = createMockOperation('op2');
      historyManager.push(operation);

      expect(historyManager.getUndoCount()).toBe(1);
      expect(historyManager.canUndo()).toBe(true);
    });
  });

  describe('peek methods', () => {
    it('should peek at undo stack without removing operation', () => {
      const operation = createMockOperation('test');
      historyManager.push(operation);

      const peeked = historyManager.peekUndo();

      expect(peeked).toBe(operation);
      expect(historyManager.getUndoCount()).toBe(1);
    });

    it('should peek at redo stack without removing operation', () => {
      const operation = createMockOperation('test');
      historyManager.push(operation);
      historyManager.undo();

      const peeked = historyManager.peekRedo();

      expect(peeked).toBe(operation);
      expect(historyManager.getRedoCount()).toBe(1);
    });

    it('should return undefined when peeking empty undo stack', () => {
      expect(historyManager.peekUndo()).toBeUndefined();
    });

    it('should return undefined when peeking empty redo stack', () => {
      expect(historyManager.peekRedo()).toBeUndefined();
    });
  });

  describe('operation types', () => {
    it('should handle create operations', () => {
      const operation: Operation = {
        type: 'create',
        timestamp: Date.now(),
        undo: vi.fn(),
        redo: vi.fn(),
        description: 'create element',
      };

      historyManager.push(operation);
      historyManager.undo();

      expect(operation.undo).toHaveBeenCalled();
    });

    it('should handle delete operations', () => {
      const operation: Operation = {
        type: 'delete',
        timestamp: Date.now(),
        undo: vi.fn(),
        redo: vi.fn(),
        description: 'delete element',
      };

      historyManager.push(operation);
      historyManager.undo();

      expect(operation.undo).toHaveBeenCalled();
    });

    it('should handle move operations', () => {
      const operation: Operation = {
        type: 'move',
        timestamp: Date.now(),
        undo: vi.fn(),
        redo: vi.fn(),
        description: 'move element',
      };

      historyManager.push(operation);
      historyManager.undo();

      expect(operation.undo).toHaveBeenCalled();
    });

    it('should handle attribute operations', () => {
      const operation: Operation = {
        type: 'attribute',
        timestamp: Date.now(),
        undo: vi.fn(),
        redo: vi.fn(),
        description: 'change attribute',
      };

      historyManager.push(operation);
      historyManager.undo();

      expect(operation.undo).toHaveBeenCalled();
    });

    it('should handle batch operations', () => {
      const operation: Operation = {
        type: 'batch',
        timestamp: Date.now(),
        undo: vi.fn(),
        redo: vi.fn(),
        description: 'batch operations',
      };

      historyManager.push(operation);
      historyManager.undo();

      expect(operation.undo).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid push operations', () => {
      for (let i = 0; i < 100; i++) {
        historyManager.push(createMockOperation(`op${i}`));
      }

      expect(historyManager.getUndoCount()).toBe(50);
    });

    it('should handle alternating undo/redo', () => {
      const operation = createMockOperation('test');
      historyManager.push(operation);

      for (let i = 0; i < 10; i++) {
        historyManager.undo();
        historyManager.redo();
      }

      expect(historyManager.getUndoCount()).toBe(1);
      expect(historyManager.getRedoCount()).toBe(0);
    });

    it('should handle push after partial undo', () => {
      const op1 = createMockOperation('op1');
      const op2 = createMockOperation('op2');
      const op3 = createMockOperation('op3');
      const op4 = createMockOperation('op4');

      historyManager.push(op1);
      historyManager.push(op2);
      historyManager.push(op3);

      historyManager.undo(); // Undo op3

      historyManager.push(op4); // Should clear redo stack

      expect(historyManager.getUndoCount()).toBe(3); // op1, op2, op4
      expect(historyManager.getRedoCount()).toBe(0);
    });

    it('should maintain correct state with single operation', () => {
      const operation = createMockOperation('single');
      historyManager.push(operation);

      expect(historyManager.canUndo()).toBe(true);
      expect(historyManager.canRedo()).toBe(false);

      historyManager.undo();

      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(true);

      historyManager.redo();

      expect(historyManager.canUndo()).toBe(true);
      expect(historyManager.canRedo()).toBe(false);
    });
  });
});

// Helper functions

function createMockOperation(description: string): Operation {
  return {
    type: 'create',
    timestamp: Date.now(),
    undo: vi.fn(),
    redo: vi.fn(),
    description,
  };
}

function createMockOperationWithCallback(
  description: string,
  calls: string[]
): Operation {
  return {
    type: 'create',
    timestamp: Date.now(),
    undo: () => calls.push(`undo-${description}`),
    redo: () => calls.push(`redo-${description}`),
    description,
  };
}
