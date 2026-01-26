/**
 * Unit tests for DeleteElementCommand.
 * 
 * Tests cover:
 * - Basic deletion of nodes
 * - Deletion of nodes with children (subtree deletion)
 * - Undo functionality to restore deleted nodes
 * - Edge cases (non-existent nodes, root deletion, etc.)
 */

import { describe, it, expect } from 'vitest';
import { DeleteElementCommand } from './delete.js';
import type { SVGDocument, SVGNode } from '../types/index.js';
import { ErrorCode } from '../types/index.js';

/**
 * Helper function to create a test document with a simple structure.
 * 
 * Structure:
 * root (svg)
 *   ├─ node_1 (g)
 *   │   ├─ node_2 (rect)
 *   │   └─ node_3 (circle)
 *   └─ node_4 (rect)
 */
function createTestDocument(): SVGDocument {
  const root: SVGNode = {
    id: 'root',
    type: 'svg',
    attributes: new Map([['width', '100'], ['height', '100']]),
    children: [],
    parent: null
  };
  
  const node1: SVGNode = {
    id: 'node_1',
    type: 'g',
    attributes: new Map(),
    children: [],
    parent: root
  };
  
  const node2: SVGNode = {
    id: 'node_2',
    type: 'rect',
    attributes: new Map([['x', '10'], ['y', '10'], ['width', '20'], ['height', '20']]),
    children: [],
    parent: node1
  };
  
  const node3: SVGNode = {
    id: 'node_3',
    type: 'circle',
    attributes: new Map([['cx', '50'], ['cy', '50'], ['r', '10']]),
    children: [],
    parent: node1
  };
  
  const node4: SVGNode = {
    id: 'node_4',
    type: 'rect',
    attributes: new Map([['x', '60'], ['y', '60'], ['width', '30'], ['height', '30']]),
    children: [],
    parent: root
  };
  
  node1.children = [node2, node3];
  root.children = [node1, node4];
  
  const document: SVGDocument = {
    root,
    nodes: new Map([
      ['root', root],
      ['node_1', node1],
      ['node_2', node2],
      ['node_3', node3],
      ['node_4', node4]
    ]),
    version: 1
  };
  
  return document;
}

describe('DeleteElementCommand', () => {
  describe('execute()', () => {
    it('should delete a leaf node from the document', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_4');
      
      expect(cmd.canExecute(doc)).toBe(true);
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const newDoc = result.value;
        
        // Node should be removed from the document
        expect(newDoc.nodes.has('node_4')).toBe(false);
        
        // Node should be removed from parent's children
        expect(newDoc.root.children.length).toBe(1);
        expect(newDoc.root.children[0].id).toBe('node_1');
        
        // Version should be incremented
        expect(newDoc.version).toBe(2);
        
        // Other nodes should still exist
        expect(newDoc.nodes.has('node_1')).toBe(true);
        expect(newDoc.nodes.has('node_2')).toBe(true);
        expect(newDoc.nodes.has('node_3')).toBe(true);
      }
    });
    
    it('should delete a node and all its children', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_1');
      
      expect(cmd.canExecute(doc)).toBe(true);
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const newDoc = result.value;
        
        // Node and all children should be removed
        expect(newDoc.nodes.has('node_1')).toBe(false);
        expect(newDoc.nodes.has('node_2')).toBe(false);
        expect(newDoc.nodes.has('node_3')).toBe(false);
        
        // Parent should have only one child left
        expect(newDoc.root.children.length).toBe(1);
        expect(newDoc.root.children[0].id).toBe('node_4');
        
        // Version should be incremented
        expect(newDoc.version).toBe(2);
      }
    });
    
    it('should return error when deleting non-existent node', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('non_existent');
      
      expect(cmd.canExecute(doc)).toBe(false);
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.NODE_NOT_FOUND);
        expect(result.error.nodeId).toBe('non_existent');
      }
    });
    
    it('should return error when trying to delete the root node', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('root');
      
      expect(cmd.canExecute(doc)).toBe(false);
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toContain('root');
      }
    });
    
    it('should preserve document state when deletion fails', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('non_existent');
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(false);
      
      // Document should be unchanged
      expect(doc.nodes.size).toBe(5);
      expect(doc.version).toBe(1);
    });
    
    it('should delete a node at the beginning of children array', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_2');
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const newDoc = result.value;
        const parent = newDoc.nodes.get('node_1');
        
        expect(parent).toBeDefined();
        if (parent) {
          expect(parent.children.length).toBe(1);
          expect(parent.children[0].id).toBe('node_3');
        }
      }
    });
    
    it('should delete a node at the end of children array', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_3');
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const newDoc = result.value;
        const parent = newDoc.nodes.get('node_1');
        
        expect(parent).toBeDefined();
        if (parent) {
          expect(parent.children.length).toBe(1);
          expect(parent.children[0].id).toBe('node_2');
        }
      }
    });
  });
  
  describe('undo()', () => {
    it('should restore a deleted leaf node', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_4');
      
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const deletedDoc = executeResult.value;
        
        expect(cmd.canUndo(deletedDoc)).toBe(true);
        
        const undoResult = cmd.undo(deletedDoc);
        
        expect(undoResult.ok).toBe(true);
        if (undoResult.ok) {
          const restoredDoc = undoResult.value;
          
          // Node should be restored
          expect(restoredDoc.nodes.has('node_4')).toBe(true);
          
          // Node should be back in parent's children
          expect(restoredDoc.root.children.length).toBe(2);
          expect(restoredDoc.root.children[1].id).toBe('node_4');
          
          // Attributes should be preserved
          const restoredNode = restoredDoc.nodes.get('node_4');
          expect(restoredNode).toBeDefined();
          if (restoredNode) {
            expect(restoredNode.attributes.get('x')).toBe('60');
            expect(restoredNode.attributes.get('y')).toBe('60');
            expect(restoredNode.attributes.get('width')).toBe('30');
            expect(restoredNode.attributes.get('height')).toBe('30');
          }
          
          // Version should be incremented
          expect(restoredDoc.version).toBe(3);
        }
      }
    });
    
    it('should restore a deleted node and all its children', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_1');
      
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const deletedDoc = executeResult.value;
        const undoResult = cmd.undo(deletedDoc);
        
        expect(undoResult.ok).toBe(true);
        if (undoResult.ok) {
          const restoredDoc = undoResult.value;
          
          // Node and all children should be restored
          expect(restoredDoc.nodes.has('node_1')).toBe(true);
          expect(restoredDoc.nodes.has('node_2')).toBe(true);
          expect(restoredDoc.nodes.has('node_3')).toBe(true);
          
          // Parent should have both children
          expect(restoredDoc.root.children.length).toBe(2);
          expect(restoredDoc.root.children[0].id).toBe('node_1');
          
          // Restored node should have its children
          const restoredNode = restoredDoc.nodes.get('node_1');
          expect(restoredNode).toBeDefined();
          if (restoredNode) {
            expect(restoredNode.children.length).toBe(2);
            expect(restoredNode.children[0].id).toBe('node_2');
            expect(restoredNode.children[1].id).toBe('node_3');
          }
        }
      }
    });
    
    it('should restore node to its original position in children array', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_1');
      
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const deletedDoc = executeResult.value;
        const undoResult = cmd.undo(deletedDoc);
        
        expect(undoResult.ok).toBe(true);
        if (undoResult.ok) {
          const restoredDoc = undoResult.value;
          
          // Node should be at index 0 (its original position)
          expect(restoredDoc.root.children[0].id).toBe('node_1');
          expect(restoredDoc.root.children[1].id).toBe('node_4');
        }
      }
    });
    
    it('should return error when undoing without executing', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_4');
      
      expect(cmd.canUndo(doc)).toBe(false);
      
      const result = cmd.undo(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.COMMAND_NOT_EXECUTED);
      }
    });
    
    it('should return error when parent no longer exists', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_2');
      
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const deletedDoc = executeResult.value;
        
        // Now delete the parent node
        const deleteParentCmd = new DeleteElementCommand('node_1');
        const deleteParentResult = deleteParentCmd.execute(deletedDoc);
        expect(deleteParentResult.ok).toBe(true);
        
        if (deleteParentResult.ok) {
          const noParentDoc = deleteParentResult.value;
          
          // Try to undo the first deletion (parent no longer exists)
          expect(cmd.canUndo(noParentDoc)).toBe(false);
          
          const undoResult = cmd.undo(noParentDoc);
          
          expect(undoResult.ok).toBe(false);
          if (!undoResult.ok) {
            expect(undoResult.error.code).toBe(ErrorCode.NODE_NOT_FOUND);
          }
        }
      }
    });
    
    it('should allow re-execution after undo', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_4');
      
      // Execute
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const deletedDoc = executeResult.value;
        
        // Undo
        const undoResult = cmd.undo(deletedDoc);
        expect(undoResult.ok).toBe(true);
        
        if (undoResult.ok) {
          const restoredDoc = undoResult.value;
          
          // Re-execute
          const reExecuteResult = cmd.execute(restoredDoc);
          expect(reExecuteResult.ok).toBe(true);
          
          if (reExecuteResult.ok) {
            const reDeletedDoc = reExecuteResult.value;
            
            // Node should be deleted again
            expect(reDeletedDoc.nodes.has('node_4')).toBe(false);
          }
        }
      }
    });
  });
  
  describe('canExecute()', () => {
    it('should return true for valid node deletion', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_4');
      
      expect(cmd.canExecute(doc)).toBe(true);
    });
    
    it('should return false for non-existent node', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('non_existent');
      
      expect(cmd.canExecute(doc)).toBe(false);
    });
    
    it('should return false for root node', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('root');
      
      expect(cmd.canExecute(doc)).toBe(false);
    });
  });
  
  describe('canUndo()', () => {
    it('should return true after successful execution', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_4');
      
      const result = cmd.execute(doc);
      expect(result.ok).toBe(true);
      
      if (result.ok) {
        expect(cmd.canUndo(result.value)).toBe(true);
      }
    });
    
    it('should return false before execution', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_4');
      
      expect(cmd.canUndo(doc)).toBe(false);
    });
    
    it('should return false after undo', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_4');
      
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const undoResult = cmd.undo(executeResult.value);
        expect(undoResult.ok).toBe(true);
        
        if (undoResult.ok) {
          expect(cmd.canUndo(undoResult.value)).toBe(false);
        }
      }
    });
  });
  
  describe('execute-undo inverse property', () => {
    it('should restore document to original state after execute then undo', () => {
      const doc = createTestDocument();
      const cmd = new DeleteElementCommand('node_1');
      
      // Store original state
      const originalNodeCount = doc.nodes.size;
      const originalRootChildrenCount = doc.root.children.length;
      const originalVersion = doc.version;
      
      // Execute
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const deletedDoc = executeResult.value;
        
        // Verify deletion occurred
        expect(deletedDoc.nodes.size).toBeLessThan(originalNodeCount);
        
        // Undo
        const undoResult = cmd.undo(deletedDoc);
        expect(undoResult.ok).toBe(true);
        
        if (undoResult.ok) {
          const restoredDoc = undoResult.value;
          
          // Verify restoration
          expect(restoredDoc.nodes.size).toBe(originalNodeCount);
          expect(restoredDoc.root.children.length).toBe(originalRootChildrenCount);
          
          // Version should be incremented twice (execute + undo)
          expect(restoredDoc.version).toBe(originalVersion + 2);
          
          // All original nodes should exist
          expect(restoredDoc.nodes.has('root')).toBe(true);
          expect(restoredDoc.nodes.has('node_1')).toBe(true);
          expect(restoredDoc.nodes.has('node_2')).toBe(true);
          expect(restoredDoc.nodes.has('node_3')).toBe(true);
          expect(restoredDoc.nodes.has('node_4')).toBe(true);
          
          // Hierarchy should be preserved
          const node1 = restoredDoc.nodes.get('node_1');
          expect(node1).toBeDefined();
          if (node1) {
            expect(node1.children.length).toBe(2);
            expect(node1.children[0].id).toBe('node_2');
            expect(node1.children[1].id).toBe('node_3');
          }
        }
      }
    });
  });
});
