/**
 * Unit tests for BatchCommand.
 * 
 * Tests the batch command functionality including:
 * - Executing multiple commands in order
 * - Undoing commands in reverse order
 * - Handling failures during execution
 * - Edge cases (empty batch, single command, etc.)
 */

import { describe, it, expect } from 'vitest';
import { BatchCommand } from './batch.js';
import { CreateElementCommand } from './create.js';
import { DeleteElementCommand } from './delete.js';
import { UpdateAttributeCommand } from './update.js';
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

describe('BatchCommand', () => {
  describe('execute()', () => {
    it('should execute all sub-commands in order', () => {
      const doc = createTestDocument();
      
      // Create a batch that adds 3 rectangles
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0'], ['width', '10'], ['height', '10']]),
          'root'
        ),
        new CreateElementCommand(
          'rect',
          new Map([['x', '20'], ['y', '20'], ['width', '10'], ['height', '10']]),
          'root'
        ),
        new CreateElementCommand(
          'rect',
          new Map([['x', '40'], ['y', '40'], ['width', '10'], ['height', '10']]),
          'root'
        ),
      ]);
      
      const result = batch.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const newDoc = result.value;
        expect(newDoc.root.children.length).toBe(3);
        expect(newDoc.root.children[0].type).toBe('rect');
        expect(newDoc.root.children[1].type).toBe('rect');
        expect(newDoc.root.children[2].type).toBe('rect');
        expect(newDoc.nodes.size).toBe(4); // root + 3 rects
      }
    });
    
    it('should pass updated document from each command to the next', () => {
      const doc = createTestDocument();
      
      // Create a rect, then update its attribute
      const createCmd = new CreateElementCommand(
        'rect',
        new Map([['x', '0'], ['y', '0']]),
        'root'
      );
      
      const batch = new BatchCommand([createCmd]);
      const createResult = batch.execute(doc);
      
      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const createdNodeId = createCmd.getCreatedNodeId();
        expect(createdNodeId).toBeDefined();
        
        // Now create a batch that updates the created node
        const batch2 = new BatchCommand([
          new UpdateAttributeCommand(createdNodeId!, 'fill', 'red'),
          new UpdateAttributeCommand(createdNodeId!, 'stroke', 'blue'),
        ]);
        
        const updateResult = batch2.execute(createResult.value);
        expect(updateResult.ok).toBe(true);
        if (updateResult.ok) {
          const node = updateResult.value.nodes.get(createdNodeId!);
          expect(node?.attributes.get('fill')).toBe('red');
          expect(node?.attributes.get('stroke')).toBe('blue');
        }
      }
    });
    
    it('should stop on first failure and return error', () => {
      const doc = createTestDocument();
      
      // Create a batch with an invalid command in the middle
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'root'
        ),
        new DeleteElementCommand('non-existent-node'), // This will fail
        new CreateElementCommand(
          'circle',
          new Map([['cx', '50'], ['cy', '50'], ['r', '25']]),
          'root'
        ),
      ]);
      
      const result = batch.execute(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Batch command failed at sub-command 2');
        expect(result.error.context).toMatchObject({
          subCommandIndex: 1,
          totalCommands: 3,
          executedCommands: 1, // Only the first command executed
          rolledBack: true,
        });
      }
    });
    
    it('should handle empty batch', () => {
      const doc = createTestDocument();
      const batch = new BatchCommand([]);
      
      const result = batch.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(doc);
        expect(result.value.version).toBe(doc.version);
      }
    });
    
    it('should handle batch with single command', () => {
      const doc = createTestDocument();
      
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'root'
        ),
      ]);
      
      const result = batch.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.root.children.length).toBe(1);
        expect(result.value.root.children[0].type).toBe('rect');
      }
    });
  });
  
  describe('undo()', () => {
    it('should undo all executed sub-commands in reverse order', () => {
      const doc = createTestDocument();
      
      // Create a batch that adds 3 rectangles
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'root'
        ),
        new CreateElementCommand(
          'rect',
          new Map([['x', '20'], ['y', '20']]),
          'root'
        ),
        new CreateElementCommand(
          'rect',
          new Map([['x', '40'], ['y', '40']]),
          'root'
        ),
      ]);
      
      const executeResult = batch.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const executedDoc = executeResult.value;
        expect(executedDoc.root.children.length).toBe(3);
        
        // Undo the batch
        const undoResult = batch.undo(executedDoc);
        expect(undoResult.ok).toBe(true);
        
        if (undoResult.ok) {
          const undoneDoc = undoResult.value;
          expect(undoneDoc.root.children.length).toBe(0);
          expect(undoneDoc.nodes.size).toBe(1); // Only root remains
        }
      }
    });
    
    it('should restore document to original state', () => {
      const doc = createTestDocument();
      const originalVersion = doc.version;
      const originalNodeCount = doc.nodes.size;
      
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'root'
        ),
        new CreateElementCommand(
          'circle',
          new Map([['cx', '50'], ['cy', '50'], ['r', '25']]),
          'root'
        ),
      ]);
      
      const executeResult = batch.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const undoResult = batch.undo(executeResult.value);
        expect(undoResult.ok).toBe(true);
        
        if (undoResult.ok) {
          const undoneDoc = undoResult.value;
          expect(undoneDoc.root.children.length).toBe(0);
          expect(undoneDoc.nodes.size).toBe(originalNodeCount);
          // Version will be different due to operations
          expect(undoneDoc.version).toBeGreaterThan(originalVersion);
        }
      }
    });
    
    it('should handle undo of empty batch', () => {
      const doc = createTestDocument();
      const batch = new BatchCommand([]);
      
      const executeResult = batch.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const undoResult = batch.undo(executeResult.value);
        expect(undoResult.ok).toBe(true);
        
        if (undoResult.ok) {
          expect(undoResult.value).toEqual(executeResult.value);
        }
      }
    });
    
    it('should return error when undoing non-executed batch', () => {
      const doc = createTestDocument();
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'root'
        ),
      ]);
      
      const result = batch.undo(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('COMMAND_NOT_EXECUTED');
        expect(result.error.message).toContain('has not been executed');
      }
    });
    
    it('should handle partial execution followed by undo', () => {
      const doc = createTestDocument();
      
      // Create a batch that will fail on the second command
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'root'
        ),
        new DeleteElementCommand('non-existent-node'), // This will fail
      ]);
      
      const executeResult = batch.execute(doc);
      expect(executeResult.ok).toBe(false);
      
      // Execution should be atomic; no changes should be applied
      expect(doc.root.children.length).toBe(0);
      expect(batch.canUndo(doc)).toBe(false);
    });
  });
  
  describe('canExecute()', () => {
    it('should return true for valid batch', () => {
      const doc = createTestDocument();
      
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'root'
        ),
      ]);
      
      expect(batch.canExecute(doc)).toBe(true);
    });
    
    it('should return true for empty batch', () => {
      const doc = createTestDocument();
      const batch = new BatchCommand([]);
      
      expect(batch.canExecute(doc)).toBe(true);
    });
    
    it('should return false if first command cannot execute', () => {
      const doc = createTestDocument();
      
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'non-existent-parent'
        ),
      ]);
      
      expect(batch.canExecute(doc)).toBe(false);
    });
  });
  
  describe('canUndo()', () => {
    it('should return true after successful execution', () => {
      const doc = createTestDocument();
      
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'root'
        ),
      ]);
      
      const result = batch.execute(doc);
      expect(result.ok).toBe(true);
      
      if (result.ok) {
        expect(batch.canUndo(result.value)).toBe(true);
      }
    });
    
    it('should return false before execution', () => {
      const doc = createTestDocument();
      
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'root'
        ),
      ]);
      
      expect(batch.canUndo(doc)).toBe(false);
    });
    
    it('should return false after undo', () => {
      const doc = createTestDocument();
      
      const batch = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'root'
        ),
      ]);
      
      const executeResult = batch.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const undoResult = batch.undo(executeResult.value);
        expect(undoResult.ok).toBe(true);
        
        if (undoResult.ok) {
          expect(batch.canUndo(undoResult.value)).toBe(false);
        }
      }
    });
  });
  
  describe('complex scenarios', () => {
    it('should handle create-update-delete sequence', () => {
      const doc = createTestDocument();
      
      const createCmd = new CreateElementCommand(
        'rect',
        new Map([['x', '0'], ['y', '0']]),
        'root'
      );
      
      // First create the element
      const createResult = createCmd.execute(doc);
      expect(createResult.ok).toBe(true);
      
      if (createResult.ok) {
        const nodeId = createCmd.getCreatedNodeId()!;
        
        // Now create a batch that updates and then deletes
        const batch = new BatchCommand([
          new UpdateAttributeCommand(nodeId, 'fill', 'red'),
          new UpdateAttributeCommand(nodeId, 'stroke', 'blue'),
          new DeleteElementCommand(nodeId),
        ]);
        
        const batchResult = batch.execute(createResult.value);
        expect(batchResult.ok).toBe(true);
        
        if (batchResult.ok) {
          // Node should be deleted
          expect(batchResult.value.nodes.has(nodeId)).toBe(false);
          
          // Undo should restore everything in reverse order:
          // 1. Undo delete (restore node)
          // 2. Undo stroke update (remove stroke attribute)
          // 3. Undo fill update (remove fill attribute)
          const undoResult = batch.undo(batchResult.value);
          expect(undoResult.ok).toBe(true);
          
          if (undoResult.ok) {
            // Node should be back, but attributes should be undone too
            // So the node should have only the original attributes (x, y)
            const restoredNode = undoResult.value.nodes.get(nodeId);
            expect(restoredNode).toBeDefined();
            expect(restoredNode?.attributes.get('x')).toBe('0');
            expect(restoredNode?.attributes.get('y')).toBe('0');
            // fill and stroke should not be present after full undo
            expect(restoredNode?.attributes.has('fill')).toBe(false);
            expect(restoredNode?.attributes.has('stroke')).toBe(false);
          }
        }
      }
    });
    
    it('should handle nested batch-like operations', () => {
      const doc = createTestDocument();
      
      // Create multiple elements
      const batch1 = new BatchCommand([
        new CreateElementCommand(
          'rect',
          new Map([['x', '0'], ['y', '0']]),
          'root'
        ),
        new CreateElementCommand(
          'circle',
          new Map([['cx', '50'], ['cy', '50'], ['r', '25']]),
          'root'
        ),
      ]);
      
      const result1 = batch1.execute(doc);
      expect(result1.ok).toBe(true);
      
      if (result1.ok) {
        // Create more elements
        const batch2 = new BatchCommand([
          new CreateElementCommand(
            'ellipse',
            new Map([['cx', '100'], ['cy', '100']]),
            'root'
          ),
          new CreateElementCommand(
            'line',
            new Map([['x1', '0'], ['y1', '0'], ['x2', '100'], ['y2', '100']]),
            'root'
          ),
        ]);
        
        const result2 = batch2.execute(result1.value);
        expect(result2.ok).toBe(true);
        
        if (result2.ok) {
          expect(result2.value.root.children.length).toBe(4);
          
          // Undo second batch
          const undo2 = batch2.undo(result2.value);
          expect(undo2.ok).toBe(true);
          
          if (undo2.ok) {
            expect(undo2.value.root.children.length).toBe(2);
            
            // Undo first batch
            const undo1 = batch1.undo(undo2.value);
            expect(undo1.ok).toBe(true);
            
            if (undo1.ok) {
              expect(undo1.value.root.children.length).toBe(0);
            }
          }
        }
      }
    });
  });
});
