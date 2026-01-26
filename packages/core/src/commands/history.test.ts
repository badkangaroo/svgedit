/**
 * Unit tests for the HistoryManager.
 * 
 * These tests verify that the history manager correctly:
 * - Tracks executed commands in the undo stack
 * - Undoes commands and moves them to the redo stack
 * - Redoes commands and moves them back to the undo stack
 * - Clears the redo stack when new commands are executed
 * - Handles edge cases like empty stacks and failed operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryManagerImpl } from './history.js';
import { CreateElementCommand } from './create.js';
import { UpdateAttributeCommand } from './update.js';
import { DeleteElementCommand } from './delete.js';
import { BatchCommand } from './batch.js';
import type { SVGDocument } from '../types/document.js';
import type { SVGNode } from '../types/node.js';

/**
 * Helper function to create a minimal test document.
 */
function createTestDocument(): SVGDocument {
  const root: SVGNode = {
    id: 'root',
    type: 'svg',
    attributes: new Map([
      ['width', '800'],
      ['height', '600'],
    ]),
    children: [],
    parent: null,
  };
  
  return {
    root,
    nodes: new Map([['root', root]]),
    version: 1,
  };
}

describe('HistoryManager', () => {
  let document: SVGDocument;
  let history: HistoryManagerImpl;
  
  beforeEach(() => {
    document = createTestDocument();
    history = new HistoryManagerImpl(document);
  });
  
  describe('Initial state', () => {
    it('should start with empty undo and redo stacks', () => {
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
      expect(history.getHistory()).toEqual([]);
    });
    
    it('should store the initial document', () => {
      const currentDoc = history.getCurrentDocument();
      expect(currentDoc).toBe(document);
      expect(currentDoc.version).toBe(1);
    });
  });
  
  describe('Command execution', () => {
    it('should execute a command and add it to the undo stack', () => {
      const command = new CreateElementCommand(
        'rect',
        new Map([['x', '10'], ['y', '20']]),
        'root'
      );
      
      const result = history.execute(command);
      
      expect(result.ok).toBe(true);
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
      expect(history.getHistory()).toHaveLength(1);
    });
    
    it('should update the current document after execution', () => {
      const command = new CreateElementCommand(
        'rect',
        new Map([['x', '10'], ['y', '20']]),
        'root'
      );
      
      const result = history.execute(command);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const currentDoc = history.getCurrentDocument();
        expect(currentDoc.version).toBeGreaterThan(document.version);
        expect(currentDoc.root.children).toHaveLength(1);
      }
    });
    
    it('should execute multiple commands in sequence', () => {
      const cmd1 = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'root'
      );
      const cmd2 = new CreateElementCommand(
        'circle',
        new Map([['cx', '50']]),
        'root'
      );
      const cmd3 = new CreateElementCommand(
        'path',
        new Map([['d', 'M 0 0']]),
        'root'
      );
      
      history.execute(cmd1);
      history.execute(cmd2);
      history.execute(cmd3);
      
      expect(history.canUndo()).toBe(true);
      expect(history.getHistory()).toHaveLength(3);
      expect(history.getCurrentDocument().root.children).toHaveLength(3);
    });
    
    it('should not add failed commands to the undo stack', () => {
      const command = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'invalid-parent-id' // Invalid parent
      );
      
      const result = history.execute(command);
      
      expect(result.ok).toBe(false);
      expect(history.canUndo()).toBe(false);
      expect(history.getHistory()).toHaveLength(0);
    });
    
    it('should not modify document when command fails', () => {
      const initialVersion = document.version;
      const command = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'invalid-parent-id'
      );
      
      history.execute(command);
      
      const currentDoc = history.getCurrentDocument();
      expect(currentDoc.version).toBe(initialVersion);
      expect(currentDoc.root.children).toHaveLength(0);
    });
  });
  
  describe('Undo functionality', () => {
    it('should undo a command and move it to the redo stack', () => {
      const command = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'root'
      );
      
      history.execute(command);
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
      
      const result = history.undo();
      
      expect(result.ok).toBe(true);
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);
    });
    
    it('should restore the document to its previous state', () => {
      const initialVersion = document.version;
      const command = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'root'
      );
      
      history.execute(command);
      const afterExecute = history.getCurrentDocument();
      expect(afterExecute.root.children).toHaveLength(1);
      
      history.undo();
      const afterUndo = history.getCurrentDocument();
      expect(afterUndo.root.children).toHaveLength(0);
      expect(afterUndo.version).toBeGreaterThan(initialVersion);
    });
    
    it('should undo multiple commands in reverse order', () => {
      const cmd1 = new CreateElementCommand(
        'rect',
        new Map([['id', 'rect1']]),
        'root'
      );
      const cmd2 = new CreateElementCommand(
        'circle',
        new Map([['id', 'circle1']]),
        'root'
      );
      
      history.execute(cmd1);
      const rectId = cmd1.getCreatedNodeId()!;
      history.execute(cmd2);
      
      expect(history.getCurrentDocument().root.children).toHaveLength(2);
      
      // Undo second command (circle)
      history.undo();
      expect(history.getCurrentDocument().root.children).toHaveLength(1);
      expect(history.getCurrentDocument().nodes.has(rectId)).toBe(true);
      
      // Undo first command (rect)
      history.undo();
      expect(history.getCurrentDocument().root.children).toHaveLength(0);
    });
    
    it('should return error when undo stack is empty', () => {
      const result = history.undo();
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Nothing to undo');
      }
    });
    
    it('should keep command on undo stack if undo fails', () => {
      const command = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'root'
      );
      
      history.execute(command);
      const createdId = command.getCreatedNodeId()!;
      
      // Manually remove the created node to make undo fail
      const currentDoc = history.getCurrentDocument();
      const newNodes = new Map(currentDoc.nodes);
      newNodes.delete(createdId);
      const brokenDoc = { ...currentDoc, nodes: newNodes };
      
      // Create a new history with the broken document
      const brokenHistory = new HistoryManagerImpl(brokenDoc);
      brokenHistory['undoStack'] = [command];
      
      const result = brokenHistory.undo();
      
      expect(result.ok).toBe(false);
      expect(brokenHistory.canUndo()).toBe(true); // Command should still be on stack
    });
  });
  
  describe('Redo functionality', () => {
    it('should redo a command and move it back to the undo stack', () => {
      const command = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'root'
      );
      
      history.execute(command);
      history.undo();
      
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);
      
      const result = history.redo();
      
      expect(result.ok).toBe(true);
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
    });
    
    it('should restore the document to the redone state', () => {
      const command = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'root'
      );
      
      history.execute(command);
      const afterExecute = history.getCurrentDocument();
      expect(afterExecute.root.children).toHaveLength(1);
      
      history.undo();
      expect(history.getCurrentDocument().root.children).toHaveLength(0);
      
      history.redo();
      const afterRedo = history.getCurrentDocument();
      expect(afterRedo.root.children).toHaveLength(1);
    });
    
    it('should redo multiple commands in order', () => {
      const cmd1 = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'root'
      );
      const cmd2 = new CreateElementCommand(
        'circle',
        new Map([['cx', '50']]),
        'root'
      );
      
      history.execute(cmd1);
      history.execute(cmd2);
      history.undo();
      history.undo();
      
      expect(history.getCurrentDocument().root.children).toHaveLength(0);
      
      // Redo first command (rect)
      history.redo();
      expect(history.getCurrentDocument().root.children).toHaveLength(1);
      
      // Redo second command (circle)
      history.redo();
      expect(history.getCurrentDocument().root.children).toHaveLength(2);
    });
    
    it('should return error when redo stack is empty', () => {
      const result = history.redo();
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Nothing to redo');
      }
    });
    
    it('should keep command on redo stack if redo fails', () => {
      const command = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'root'
      );
      
      history.execute(command);
      history.undo();
      
      // Manually break the document to make redo fail
      const currentDoc = history.getCurrentDocument();
      const brokenDoc = { ...currentDoc, nodes: new Map() }; // Remove all nodes
      
      const brokenHistory = new HistoryManagerImpl(brokenDoc);
      brokenHistory['redoStack'] = [command];
      
      const result = brokenHistory.redo();
      
      expect(result.ok).toBe(false);
      expect(brokenHistory.canRedo()).toBe(true); // Command should still be on stack
    });
  });
  
  describe('Redo invalidation', () => {
    it('should clear redo stack when a new command is executed', () => {
      const cmd1 = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'root'
      );
      const cmd2 = new CreateElementCommand(
        'circle',
        new Map([['cx', '50']]),
        'root'
      );
      
      // Execute, undo, then execute a new command
      history.execute(cmd1);
      history.undo();
      expect(history.canRedo()).toBe(true);
      
      history.execute(cmd2);
      expect(history.canRedo()).toBe(false);
    });
    
    it('should clear redo stack even with multiple undone commands', () => {
      const cmd1 = new CreateElementCommand('rect', new Map(), 'root');
      const cmd2 = new CreateElementCommand('circle', new Map(), 'root');
      const cmd3 = new CreateElementCommand('path', new Map([['d', 'M 0 0']]), 'root');
      const cmd4 = new CreateElementCommand('line', new Map(), 'root');
      
      // Execute three commands, undo all three
      history.execute(cmd1);
      history.execute(cmd2);
      history.execute(cmd3);
      history.undo();
      history.undo();
      history.undo();
      
      expect(history.canRedo()).toBe(true);
      expect(history.canUndo()).toBe(false);
      
      // Execute a new command - should clear all redo history
      history.execute(cmd4);
      
      expect(history.canRedo()).toBe(false);
      expect(history.canUndo()).toBe(true);
      expect(history.getHistory()).toHaveLength(1);
    });
  });
  
  describe('Complex undo/redo sequences', () => {
    it('should handle multiple undo/redo cycles', () => {
      const command = new CreateElementCommand(
        'rect',
        new Map([['x', '10']]),
        'root'
      );
      
      // Execute
      history.execute(command);
      expect(history.getCurrentDocument().root.children).toHaveLength(1);
      
      // Undo
      history.undo();
      expect(history.getCurrentDocument().root.children).toHaveLength(0);
      
      // Redo
      history.redo();
      expect(history.getCurrentDocument().root.children).toHaveLength(1);
      
      // Undo again
      history.undo();
      expect(history.getCurrentDocument().root.children).toHaveLength(0);
      
      // Redo again
      history.redo();
      expect(history.getCurrentDocument().root.children).toHaveLength(1);
    });
    
    it('should work with different command types', () => {
      // Create a rect
      const createCmd = new CreateElementCommand(
        'rect',
        new Map([['x', '10'], ['fill', 'red']]),
        'root'
      );
      history.execute(createCmd);
      const rectId = createCmd.getCreatedNodeId()!;
      
      // Update its fill attribute
      const updateCmd = new UpdateAttributeCommand(rectId, 'fill', 'blue');
      history.execute(updateCmd);
      
      // Delete the rect
      const deleteCmd = new DeleteElementCommand(rectId);
      history.execute(deleteCmd);
      
      expect(history.getCurrentDocument().root.children).toHaveLength(0);
      
      // Undo delete
      history.undo();
      expect(history.getCurrentDocument().root.children).toHaveLength(1);
      expect(history.getCurrentDocument().nodes.get(rectId)?.attributes.get('fill')).toBe('blue');
      
      // Undo update
      history.undo();
      expect(history.getCurrentDocument().nodes.get(rectId)?.attributes.get('fill')).toBe('red');
      
      // Undo create
      history.undo();
      expect(history.getCurrentDocument().root.children).toHaveLength(0);
      
      // Redo all
      history.redo(); // Create
      history.redo(); // Update
      history.redo(); // Delete
      expect(history.getCurrentDocument().root.children).toHaveLength(0);
    });
    
    it('should work with batch commands', () => {
      const batch = new BatchCommand([
        new CreateElementCommand('rect', new Map([['x', '10']]), 'root'),
        new CreateElementCommand('circle', new Map([['cx', '50']]), 'root'),
        new CreateElementCommand('path', new Map([['d', 'M 0 0']]), 'root'),
      ]);
      
      history.execute(batch);
      expect(history.getCurrentDocument().root.children).toHaveLength(3);
      
      history.undo();
      expect(history.getCurrentDocument().root.children).toHaveLength(0);
      
      history.redo();
      expect(history.getCurrentDocument().root.children).toHaveLength(3);
    });
  });
  
  describe('Clear functionality', () => {
    it('should clear both undo and redo stacks', () => {
      const cmd1 = new CreateElementCommand('rect', new Map(), 'root');
      const cmd2 = new CreateElementCommand('circle', new Map(), 'root');
      
      history.execute(cmd1);
      history.execute(cmd2);
      history.undo();
      
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(true);
      
      history.clear();
      
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
      expect(history.getHistory()).toHaveLength(0);
    });
    
    it('should not affect the current document', () => {
      const command = new CreateElementCommand('rect', new Map(), 'root');
      
      history.execute(command);
      const docBeforeClear = history.getCurrentDocument();
      
      history.clear();
      const docAfterClear = history.getCurrentDocument();
      
      expect(docAfterClear).toBe(docBeforeClear);
      expect(docAfterClear.root.children).toHaveLength(1);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle empty batch commands', () => {
      const batch = new BatchCommand([]);
      
      const result = history.execute(batch);
      
      expect(result.ok).toBe(true);
      expect(history.canUndo()).toBe(true);
      
      const undoResult = history.undo();
      expect(undoResult.ok).toBe(true);
    });
    
    it('should handle rapid execute/undo/redo sequences', () => {
      const command = new CreateElementCommand('rect', new Map(), 'root');
      
      for (let i = 0; i < 10; i++) {
        history.execute(command);
        history.undo();
        history.redo();
        history.undo();
      }
      
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);
    });
    
    it('should maintain correct state after failed command execution', () => {
      const validCmd = new CreateElementCommand('rect', new Map(), 'root');
      const invalidCmd = new CreateElementCommand('rect', new Map(), 'invalid-id');
      
      history.execute(validCmd);
      const beforeFailed = history.getCurrentDocument();
      
      history.execute(invalidCmd);
      const afterFailed = history.getCurrentDocument();
      
      expect(afterFailed).toBe(beforeFailed);
      expect(history.getHistory()).toHaveLength(1);
    });
  });
  
  describe('getHistory', () => {
    it('should return a copy of the undo stack', () => {
      const cmd1 = new CreateElementCommand('rect', new Map(), 'root');
      const cmd2 = new CreateElementCommand('circle', new Map(), 'root');
      
      history.execute(cmd1);
      history.execute(cmd2);
      
      const historyArray = history.getHistory();
      expect(historyArray).toHaveLength(2);
      
      // Modifying the returned array should not affect the internal stack
      historyArray.pop();
      expect(history.getHistory()).toHaveLength(2);
    });
    
    it('should return commands in order from oldest to newest', () => {
      const cmd1 = new CreateElementCommand('rect', new Map(), 'root');
      const cmd2 = new CreateElementCommand('circle', new Map(), 'root');
      const cmd3 = new CreateElementCommand('path', new Map([['d', 'M 0 0']]), 'root');
      
      history.execute(cmd1);
      history.execute(cmd2);
      history.execute(cmd3);
      
      const historyArray = history.getHistory();
      expect(historyArray[0]).toBe(cmd1);
      expect(historyArray[1]).toBe(cmd2);
      expect(historyArray[2]).toBe(cmd3);
    });
  });
});
