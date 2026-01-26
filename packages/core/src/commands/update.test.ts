/**
 * Unit tests for UpdateAttributeCommand.
 * 
 * Tests cover:
 * - Updating existing attributes
 * - Creating new attributes
 * - Undo functionality for both cases
 * - Error handling for invalid nodes
 * - Edge cases (updating to same value, etc.)
 */

import { describe, it, expect } from 'vitest';
import { UpdateAttributeCommand } from './update.js';
import type { SVGDocument, SVGNode } from '../types/index.js';
import { ErrorCode } from '../types/result.js';

/**
 * Helper function to create a test document with a simple structure.
 */
function createTestDocument(): SVGDocument {
  const rootNode: SVGNode = {
    id: 'root',
    type: 'svg',
    attributes: new Map([
      ['width', '100'],
      ['height', '100'],
    ]),
    children: [],
    parent: null,
  };
  
  const rectNode: SVGNode = {
    id: 'node_1',
    type: 'rect',
    attributes: new Map([
      ['x', '10'],
      ['y', '20'],
      ['width', '50'],
      ['height', '30'],
      ['fill', 'red'],
    ]),
    children: [],
    parent: rootNode,
  };
  
  rootNode.children = [rectNode];
  
  return {
    root: rootNode,
    nodes: new Map([
      ['root', rootNode],
      ['node_1', rectNode],
    ]),
    version: 1,
  };
}

describe('UpdateAttributeCommand', () => {
  describe('execute()', () => {
    it('should update an existing attribute', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const updatedNode = result.value.nodes.get('node_1');
        expect(updatedNode?.attributes.get('fill')).toBe('blue');
        expect(result.value.version).toBe(2);
      }
    });
    
    it('should create a new attribute if it does not exist', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'stroke', 'green');
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const updatedNode = result.value.nodes.get('node_1');
        expect(updatedNode?.attributes.get('stroke')).toBe('green');
        expect(updatedNode?.attributes.has('stroke')).toBe(true);
        expect(result.value.version).toBe(2);
      }
    });
    
    it('should update attribute to same value', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'red');
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const updatedNode = result.value.nodes.get('node_1');
        expect(updatedNode?.attributes.get('fill')).toBe('red');
        expect(result.value.version).toBe(2);
      }
    });
    
    it('should return error for non-existent node', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('invalid_id', 'fill', 'blue');
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.NODE_NOT_FOUND);
        expect(result.error.message).toContain('invalid_id');
      }
    });
    
    it('should not modify original document', () => {
      const doc = createTestDocument();
      const originalVersion = doc.version;
      const originalFill = doc.nodes.get('node_1')?.attributes.get('fill');
      
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      cmd.execute(doc);
      
      // Original document should be unchanged
      expect(doc.version).toBe(originalVersion);
      expect(doc.nodes.get('node_1')?.attributes.get('fill')).toBe(originalFill);
    });
    
    it('should update attributes on root node', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('root', 'viewBox', '0 0 100 100');
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const updatedRoot = result.value.nodes.get('root');
        expect(updatedRoot?.attributes.get('viewBox')).toBe('0 0 100 100');
      }
    });
    
    it('should handle empty string values', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', '');
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const updatedNode = result.value.nodes.get('node_1');
        expect(updatedNode?.attributes.get('fill')).toBe('');
      }
    });
    
    it('should handle special characters in attribute values', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'data-custom', 'value with spaces & special <chars>');
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const updatedNode = result.value.nodes.get('node_1');
        expect(updatedNode?.attributes.get('data-custom')).toBe('value with spaces & special <chars>');
      }
    });
  });
  
  describe('undo()', () => {
    it('should restore previous attribute value', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const undoResult = cmd.undo(executeResult.value);
        
        expect(undoResult.ok).toBe(true);
        if (undoResult.ok) {
          const restoredNode = undoResult.value.nodes.get('node_1');
          expect(restoredNode?.attributes.get('fill')).toBe('red');
          expect(undoResult.value.version).toBe(3);
        }
      }
    });
    
    it('should remove attribute if it was newly created', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'stroke', 'green');
      
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        // Verify attribute was created
        expect(executeResult.value.nodes.get('node_1')?.attributes.has('stroke')).toBe(true);
        
        const undoResult = cmd.undo(executeResult.value);
        
        expect(undoResult.ok).toBe(true);
        if (undoResult.ok) {
          const restoredNode = undoResult.value.nodes.get('node_1');
          expect(restoredNode?.attributes.has('stroke')).toBe(false);
          expect(undoResult.value.version).toBe(3);
        }
      }
    });
    
    it('should return error if command has not been executed', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
      const result = cmd.undo(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.COMMAND_NOT_EXECUTED);
      }
    });
    
    it('should return error if node no longer exists', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        // Create a document without the node
        const docWithoutNode: SVGDocument = {
          ...executeResult.value,
          nodes: new Map([['root', executeResult.value.root]]),
        };
        
        const undoResult = cmd.undo(docWithoutNode);
        
        expect(undoResult.ok).toBe(false);
        if (!undoResult.ok) {
          expect(undoResult.error.code).toBe(ErrorCode.NODE_NOT_FOUND);
        }
      }
    });
    
    it('should not modify original document', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const beforeUndoVersion = executeResult.value.version;
        const beforeUndoFill = executeResult.value.nodes.get('node_1')?.attributes.get('fill');
        
        cmd.undo(executeResult.value);
        
        // Document passed to undo should be unchanged
        expect(executeResult.value.version).toBe(beforeUndoVersion);
        expect(executeResult.value.nodes.get('node_1')?.attributes.get('fill')).toBe(beforeUndoFill);
      }
    });
  });
  
  describe('canExecute()', () => {
    it('should return true for valid node', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
      expect(cmd.canExecute(doc)).toBe(true);
    });
    
    it('should return false for non-existent node', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('invalid_id', 'fill', 'blue');
      
      expect(cmd.canExecute(doc)).toBe(false);
    });
  });
  
  describe('canUndo()', () => {
    it('should return true after successful execution', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
      const result = cmd.execute(doc);
      expect(result.ok).toBe(true);
      
      if (result.ok) {
        expect(cmd.canUndo(result.value)).toBe(true);
      }
    });
    
    it('should return false before execution', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
      expect(cmd.canUndo(doc)).toBe(false);
    });
    
    it('should return false if node no longer exists', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
      const result = cmd.execute(doc);
      expect(result.ok).toBe(true);
      
      if (result.ok) {
        // Create a document without the node
        const docWithoutNode: SVGDocument = {
          ...result.value,
          nodes: new Map([['root', result.value.root]]),
        };
        
        expect(cmd.canUndo(docWithoutNode)).toBe(false);
      }
    });
    
    it('should return false after undo', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
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
  
  describe('execute-undo-execute cycle', () => {
    it('should allow re-execution after undo', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
      // Execute
      const executeResult1 = cmd.execute(doc);
      expect(executeResult1.ok).toBe(true);
      
      if (executeResult1.ok) {
        expect(executeResult1.value.nodes.get('node_1')?.attributes.get('fill')).toBe('blue');
        
        // Undo
        const undoResult = cmd.undo(executeResult1.value);
        expect(undoResult.ok).toBe(true);
        
        if (undoResult.ok) {
          expect(undoResult.value.nodes.get('node_1')?.attributes.get('fill')).toBe('red');
          
          // Re-execute
          const executeResult2 = cmd.execute(undoResult.value);
          expect(executeResult2.ok).toBe(true);
          
          if (executeResult2.ok) {
            expect(executeResult2.value.nodes.get('node_1')?.attributes.get('fill')).toBe('blue');
          }
        }
      }
    });
    
    it('should handle multiple undo-redo cycles for new attributes', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'stroke', 'green');
      
      // Execute - create attribute
      const executeResult1 = cmd.execute(doc);
      expect(executeResult1.ok).toBe(true);
      
      if (executeResult1.ok) {
        expect(executeResult1.value.nodes.get('node_1')?.attributes.has('stroke')).toBe(true);
        
        // Undo - remove attribute
        const undoResult = cmd.undo(executeResult1.value);
        expect(undoResult.ok).toBe(true);
        
        if (undoResult.ok) {
          expect(undoResult.value.nodes.get('node_1')?.attributes.has('stroke')).toBe(false);
          
          // Re-execute - create attribute again
          const executeResult2 = cmd.execute(undoResult.value);
          expect(executeResult2.ok).toBe(true);
          
          if (executeResult2.ok) {
            expect(executeResult2.value.nodes.get('node_1')?.attributes.has('stroke')).toBe(true);
            expect(executeResult2.value.nodes.get('node_1')?.attributes.get('stroke')).toBe('green');
          }
        }
      }
    });
  });
  
  describe('immutability', () => {
    it('should maintain immutability through execute and undo', () => {
      const doc = createTestDocument();
      const cmd = new UpdateAttributeCommand('node_1', 'fill', 'blue');
      
      const originalDoc = doc;
      const originalNode = doc.nodes.get('node_1');
      const originalAttributes = originalNode?.attributes;
      
      // Execute
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      // Original document unchanged
      expect(doc).toBe(originalDoc);
      expect(doc.nodes.get('node_1')).toBe(originalNode);
      expect(doc.nodes.get('node_1')?.attributes).toBe(originalAttributes);
      expect(doc.nodes.get('node_1')?.attributes.get('fill')).toBe('red');
      
      if (executeResult.ok) {
        const executedDoc = executeResult.value;
        const executedNode = executedDoc.nodes.get('node_1');
        
        // New document created
        expect(executedDoc).not.toBe(originalDoc);
        expect(executedNode).not.toBe(originalNode);
        expect(executedNode?.attributes).not.toBe(originalAttributes);
        
        // Undo
        const undoResult = cmd.undo(executedDoc);
        expect(undoResult.ok).toBe(true);
        
        // Executed document unchanged
        expect(executedDoc.nodes.get('node_1')?.attributes.get('fill')).toBe('blue');
        
        if (undoResult.ok) {
          // New document created for undo
          expect(undoResult.value).not.toBe(executedDoc);
          expect(undoResult.value.nodes.get('node_1')).not.toBe(executedNode);
        }
      }
    });
  });
});
