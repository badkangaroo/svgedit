/**
 * Unit tests for CreateElementCommand.
 * 
 * Tests the creation of new SVG elements with various configurations,
 * including edge cases and error conditions.
 */

import { describe, it, expect } from 'vitest';
import { CreateElementCommand } from './create.js';
import type { SVGDocument } from '../types/document.js';
import type { SVGNode } from '../types/node.js';
import { ErrorCode } from '../types/result.js';

/**
 * Helper function to create a minimal test document.
 */
function createTestDocument(): SVGDocument {
  const root: SVGNode = {
    id: 'node_1',
    type: 'svg',
    attributes: new Map([
      ['width', '800'],
      ['height', '600'],
    ]),
    children: [],
    parent: null,
  };
  
  const nodes = new Map<string, SVGNode>();
  nodes.set(root.id, root);
  
  return {
    root,
    nodes,
    version: 0,
  };
}

/**
 * Helper function to create a document with a group element.
 */
function createDocumentWithGroup(): SVGDocument {
  const root: SVGNode = {
    id: 'node_1',
    type: 'svg',
    attributes: new Map(),
    children: [],
    parent: null,
  };
  
  const group: SVGNode = {
    id: 'node_2',
    type: 'g',
    attributes: new Map([['id', 'my-group']]),
    children: [],
    parent: root,
  };
  
  root.children.push(group);
  
  const nodes = new Map<string, SVGNode>();
  nodes.set(root.id, root);
  nodes.set(group.id, group);
  
  return {
    root,
    nodes,
    version: 0,
  };
}

describe('CreateElementCommand', () => {
  describe('Basic element creation', () => {
    it('should create a rectangle element with attributes', () => {
      const doc = createTestDocument();
      const attributes = new Map([
        ['x', '10'],
        ['y', '20'],
        ['width', '100'],
        ['height', '50'],
        ['fill', 'blue'],
      ]);
      
      const cmd = new CreateElementCommand('rect', attributes, 'node_1');
      
      // Verify canExecute returns true
      expect(cmd.canExecute(doc)).toBe(true);
      
      // Execute the command
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const newDoc = result.value;
        
        // Verify document version incremented
        expect(newDoc.version).toBe(1);
        
        // Verify new node was created
        const createdId = cmd.getCreatedNodeId();
        expect(createdId).toBeDefined();
        expect(newDoc.nodes.has(createdId!)).toBe(true);
        
        // Verify node properties
        const createdNode = newDoc.nodes.get(createdId!);
        expect(createdNode).toBeDefined();
        expect(createdNode!.type).toBe('rect');
        expect(createdNode!.attributes.get('x')).toBe('10');
        expect(createdNode!.attributes.get('y')).toBe('20');
        expect(createdNode!.attributes.get('width')).toBe('100');
        expect(createdNode!.attributes.get('height')).toBe('50');
        expect(createdNode!.attributes.get('fill')).toBe('blue');
        
        // Verify node was added to parent's children
        const root = newDoc.nodes.get('node_1');
        expect(root!.children.length).toBe(1);
        expect(root!.children[0].id).toBe(createdId);
        
        // Verify parent reference (check ID since immutable updates create new objects)
        expect(createdNode!.parent?.id).toBe(root!.id);
      }
    });
    
    it('should create a circle element', () => {
      const doc = createTestDocument();
      const attributes = new Map([
        ['cx', '50'],
        ['cy', '50'],
        ['r', '25'],
        ['fill', 'red'],
      ]);
      
      const cmd = new CreateElementCommand('circle', attributes, 'node_1');
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const createdId = cmd.getCreatedNodeId();
        const createdNode = result.value.nodes.get(createdId!);
        
        expect(createdNode!.type).toBe('circle');
        expect(createdNode!.attributes.get('cx')).toBe('50');
        expect(createdNode!.attributes.get('cy')).toBe('50');
        expect(createdNode!.attributes.get('r')).toBe('25');
      }
    });
    
    it('should create a path element', () => {
      const doc = createTestDocument();
      const attributes = new Map([
        ['d', 'M 10 10 L 90 90'],
        ['stroke', 'black'],
        ['fill', 'none'],
      ]);
      
      const cmd = new CreateElementCommand('path', attributes, 'node_1');
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const createdId = cmd.getCreatedNodeId();
        const createdNode = result.value.nodes.get(createdId!);
        
        expect(createdNode!.type).toBe('path');
        expect(createdNode!.attributes.get('d')).toBe('M 10 10 L 90 90');
      }
    });
    
    it('should create an element with no attributes', () => {
      const doc = createTestDocument();
      const cmd = new CreateElementCommand('g', new Map(), 'node_1');
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const createdId = cmd.getCreatedNodeId();
        const createdNode = result.value.nodes.get(createdId!);
        
        expect(createdNode!.type).toBe('g');
        expect(createdNode!.attributes.size).toBe(0);
      }
    });
  });
  
  describe('Insert index positioning', () => {
    it('should insert element at the beginning (index 0)', () => {
      const doc = createDocumentWithGroup();
      
      // Add first element
      const cmd1 = new CreateElementCommand('rect', new Map(), 'node_1');
      const result1 = cmd1.execute(doc);
      expect(result1.ok).toBe(true);
      
      if (result1.ok) {
        const firstId = cmd1.getCreatedNodeId();
        
        // Add second element at index 0
        const cmd2 = new CreateElementCommand('circle', new Map(), 'node_1', 0);
        const result2 = cmd2.execute(result1.value);
        
        expect(result2.ok).toBe(true);
        if (result2.ok) {
          const secondId = cmd2.getCreatedNodeId();
          const root = result2.value.nodes.get('node_1');
          
          // Second element should be first in children array
          expect(root!.children[0].id).toBe(secondId);
          expect(root!.children[1].id).toBe('node_2'); // Original group
          expect(root!.children[2].id).toBe(firstId);
        }
      }
    });
    
    it('should insert element at a specific index', () => {
      const doc = createDocumentWithGroup();
      
      // Add two elements
      const cmd1 = new CreateElementCommand('rect', new Map(), 'node_1');
      const result1 = cmd1.execute(doc);
      expect(result1.ok).toBe(true);
      
      if (result1.ok) {
        const cmd2 = new CreateElementCommand('circle', new Map(), 'node_1');
        const result2 = cmd2.execute(result1.value);
        expect(result2.ok).toBe(true);
        
        if (result2.ok) {
          const firstId = cmd1.getCreatedNodeId();
          const secondId = cmd2.getCreatedNodeId();
          
          // Insert element at index 1 (between group and first element)
          const cmd3 = new CreateElementCommand('ellipse', new Map(), 'node_1', 1);
          const result3 = cmd3.execute(result2.value);
          
          expect(result3.ok).toBe(true);
          if (result3.ok) {
            const thirdId = cmd3.getCreatedNodeId();
            const root = result3.value.nodes.get('node_1');
            
            expect(root!.children[0].id).toBe('node_2'); // Original group
            expect(root!.children[1].id).toBe(thirdId); // Newly inserted
            expect(root!.children[2].id).toBe(firstId);
            expect(root!.children[3].id).toBe(secondId);
          }
        }
      }
    });
    
    it('should append element when index is undefined', () => {
      const doc = createDocumentWithGroup();
      
      const cmd = new CreateElementCommand('rect', new Map(), 'node_1');
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const createdId = cmd.getCreatedNodeId();
        const root = result.value.nodes.get('node_1');
        
        // Should be appended after the group
        expect(root!.children.length).toBe(2);
        expect(root!.children[1].id).toBe(createdId);
      }
    });
    
    it('should append element when index equals children length', () => {
      const doc = createDocumentWithGroup();
      
      const cmd = new CreateElementCommand('rect', new Map(), 'node_1', 1);
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const createdId = cmd.getCreatedNodeId();
        const root = result.value.nodes.get('node_1');
        
        expect(root!.children.length).toBe(2);
        expect(root!.children[1].id).toBe(createdId);
      }
    });
  });
  
  describe('Nested element creation', () => {
    it('should create element as child of a group', () => {
      const doc = createDocumentWithGroup();
      
      const cmd = new CreateElementCommand('rect', new Map(), 'node_2');
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const createdId = cmd.getCreatedNodeId();
        const group = result.value.nodes.get('node_2');
        
        expect(group!.children.length).toBe(1);
        expect(group!.children[0].id).toBe(createdId);
        
        const createdNode = result.value.nodes.get(createdId!);
        expect(createdNode!.parent?.id).toBe(group!.id);
      }
    });
  });
  
  describe('Stable ID generation', () => {
    it('should generate unique IDs for multiple elements', () => {
      const doc = createTestDocument();
      
      const cmd1 = new CreateElementCommand('rect', new Map(), 'node_1');
      const result1 = cmd1.execute(doc);
      expect(result1.ok).toBe(true);
      
      if (result1.ok) {
        const cmd2 = new CreateElementCommand('circle', new Map(), 'node_1');
        const result2 = cmd2.execute(result1.value);
        expect(result2.ok).toBe(true);
        
        if (result2.ok) {
          const id1 = cmd1.getCreatedNodeId();
          const id2 = cmd2.getCreatedNodeId();
          
          expect(id1).not.toBe(id2);
          expect(result2.value.nodes.has(id1!)).toBe(true);
          expect(result2.value.nodes.has(id2!)).toBe(true);
        }
      }
    });
    
    it('should generate IDs that follow the node_N pattern', () => {
      const doc = createTestDocument();
      
      const cmd = new CreateElementCommand('rect', new Map(), 'node_1');
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const createdId = cmd.getCreatedNodeId();
        expect(createdId).toMatch(/^node_\d+$/);
      }
    });
  });
  
  describe('Error handling', () => {
    it('should return error for invalid parent ID', () => {
      const doc = createTestDocument();
      
      const cmd = new CreateElementCommand('rect', new Map(), 'invalid-id');
      
      expect(cmd.canExecute(doc)).toBe(false);
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.INVALID_PARENT);
        expect(result.error.message).toContain('invalid-id');
      }
    });
    
    it('should return error for invalid element type', () => {
      const doc = createTestDocument();
      
      // @ts-expect-error Testing invalid element type
      const cmd = new CreateElementCommand('invalid-type', new Map(), 'node_1');
      
      expect(cmd.canExecute(doc)).toBe(false);
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toContain('invalid-type');
      }
    });
    
    it('should return error for negative insert index', () => {
      const doc = createTestDocument();
      
      const cmd = new CreateElementCommand('rect', new Map(), 'node_1', -1);
      
      expect(cmd.canExecute(doc)).toBe(false);
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toContain('non-negative');
      }
    });
    
    it('should return error for insert index out of bounds', () => {
      const doc = createTestDocument();
      
      const cmd = new CreateElementCommand('rect', new Map(), 'node_1', 10);
      
      expect(cmd.canExecute(doc)).toBe(false);
      
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toContain('out of bounds');
      }
    });
  });
  
  describe('Undo functionality', () => {
    it('should undo element creation', () => {
      const doc = createTestDocument();
      const cmd = new CreateElementCommand('rect', new Map(), 'node_1');
      
      // Execute the command
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const newDoc = executeResult.value;
        const createdId = cmd.getCreatedNodeId();
        
        // Verify element was created
        expect(newDoc.nodes.has(createdId!)).toBe(true);
        expect(newDoc.root.children.length).toBe(1);
        
        // Verify canUndo returns true
        expect(cmd.canUndo(newDoc)).toBe(true);
        
        // Undo the command
        const undoResult = cmd.undo(newDoc);
        expect(undoResult.ok).toBe(true);
        
        if (undoResult.ok) {
          const restoredDoc = undoResult.value;
          
          // Verify element was removed
          expect(restoredDoc.nodes.has(createdId!)).toBe(false);
          expect(restoredDoc.root.children.length).toBe(0);
          
          // Verify version incremented
          expect(restoredDoc.version).toBe(2);
        }
      }
    });
    
    it('should return error when undoing before execution', () => {
      const doc = createTestDocument();
      const cmd = new CreateElementCommand('rect', new Map(), 'node_1');
      
      expect(cmd.canUndo(doc)).toBe(false);
      
      const result = cmd.undo(doc);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.COMMAND_NOT_EXECUTED);
      }
    });
    
    it('should return error when undoing after node is deleted', () => {
      const doc = createTestDocument();
      const cmd = new CreateElementCommand('rect', new Map(), 'node_1');
      
      const executeResult = cmd.execute(doc);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const createdId = cmd.getCreatedNodeId();
        
        // Manually remove the node from the document
        const modifiedDoc = {
          ...executeResult.value,
          nodes: new Map(executeResult.value.nodes),
        };
        modifiedDoc.nodes.delete(createdId!);
        
        expect(cmd.canUndo(modifiedDoc)).toBe(false);
        
        const undoResult = cmd.undo(modifiedDoc);
        
        expect(undoResult.ok).toBe(false);
        if (!undoResult.ok) {
          expect(undoResult.error.code).toBe(ErrorCode.NODE_NOT_FOUND);
        }
      }
    });
  });
  
  describe('Execute-undo-execute cycle', () => {
    it('should allow re-execution after undo', () => {
      const doc = createTestDocument();
      const cmd = new CreateElementCommand('rect', new Map(), 'node_1');
      
      // Execute
      const result1 = cmd.execute(doc);
      expect(result1.ok).toBe(true);
      
      if (result1.ok) {
        const firstId = cmd.getCreatedNodeId();
        
        // Undo
        const result2 = cmd.undo(result1.value);
        expect(result2.ok).toBe(true);
        
        if (result2.ok) {
          // Verify node was removed
          expect(result2.value.nodes.has(firstId!)).toBe(false);
          
          // Execute again
          const result3 = cmd.execute(result2.value);
          expect(result3.ok).toBe(true);
          
          if (result3.ok) {
            const secondId = cmd.getCreatedNodeId();
            
            // Since the document state is the same as before the first execute,
            // the ID generation will produce the same ID
            expect(secondId).toBe(firstId);
            expect(result3.value.nodes.has(secondId!)).toBe(true);
            
            // Verify the node was recreated with the same properties
            const recreatedNode = result3.value.nodes.get(secondId!);
            expect(recreatedNode!.type).toBe('rect');
          }
        }
      }
    });
  });
  
  describe('Immutability', () => {
    it('should not modify the original document', () => {
      const doc = createTestDocument();
      const originalVersion = doc.version;
      const originalChildrenCount = doc.root.children.length;
      const originalNodesSize = doc.nodes.size;
      
      const cmd = new CreateElementCommand('rect', new Map(), 'node_1');
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      
      // Original document should be unchanged
      expect(doc.version).toBe(originalVersion);
      expect(doc.root.children.length).toBe(originalChildrenCount);
      expect(doc.nodes.size).toBe(originalNodesSize);
    });
    
    it('should not modify attributes map passed to constructor', () => {
      const doc = createTestDocument();
      const attributes = new Map([['fill', 'blue']]);
      const originalSize = attributes.size;
      
      const cmd = new CreateElementCommand('rect', attributes, 'node_1');
      const result = cmd.execute(doc);
      
      expect(result.ok).toBe(true);
      
      // Original attributes map should be unchanged
      expect(attributes.size).toBe(originalSize);
      
      // Modifying the original map should not affect the created node
      attributes.set('stroke', 'red');
      
      if (result.ok) {
        const createdId = cmd.getCreatedNodeId();
        const createdNode = result.value.nodes.get(createdId!);
        expect(createdNode!.attributes.has('stroke')).toBe(false);
      }
    });
  });
});
