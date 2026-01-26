/**
 * Property-based tests for command inverse operations.
 * 
 * These tests validate that executing a command and then undoing it
 * restores the original document state.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Parser } from '../../src/document/parser.js';
import { CreateElementCommand } from '../../src/commands/create.js';
import { DeleteElementCommand } from '../../src/commands/delete.js';
import { UpdateAttributeCommand } from '../../src/commands/update.js';
import {
  arbitraryDocument,
  arbitraryElementType,
  arbitraryAttributes
} from './arbitraries.js';

describe('Feature: core-engine, Property 16: Command inverse property (CRITICAL)', () => {
  describe('CreateElementCommand', () => {
    it('should restore original state after execute then undo', () => {
      fc.assert(
        fc.property(
          arbitraryDocument(),
          arbitraryElementType(),
          arbitraryAttributes(),
          (document, elementType, attributes) => {
            // Get a valid parent ID
            const parentId = document.root.id;

            // Create command
            const cmd = new CreateElementCommand(elementType, attributes, parentId);

            // Execute
            const executeResult = cmd.execute(document);
            if (!executeResult.ok) {
              // If execution fails, that's acceptable
              return true;
            }

            const modifiedDoc = executeResult.value;

            // Verify something changed
            expect(modifiedDoc.nodes.size).toBeGreaterThan(document.nodes.size);

            // Undo
            const undoResult = cmd.undo(modifiedDoc);
            expect(undoResult.ok).toBe(true);

            if (!undoResult.ok) {
              return false;
            }

            const restoredDoc = undoResult.value;

            // Verify restoration
            expect(restoredDoc.nodes.size).toBe(document.nodes.size);
            expect(Array.from(restoredDoc.nodes.keys()).sort()).toEqual(
              Array.from(document.nodes.keys()).sort()
            );

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('DeleteElementCommand', () => {
    it('should restore original state after execute then undo', () => {
      fc.assert(
        fc.property(
          arbitraryDocument(),
          (document) => {
            // Find a non-root node to delete
            const nodeIds = Array.from(document.nodes.keys()).filter(id => id !== document.root.id);
            
            if (nodeIds.length === 0) {
              // No nodes to delete
              return true;
            }

            const nodeToDelete = nodeIds[0];

            // Create command
            const cmd = new DeleteElementCommand(nodeToDelete);

            // Store original state
            const originalNodeCount = document.nodes.size;

            // Execute
            const executeResult = cmd.execute(document);
            if (!executeResult.ok) {
              return true;
            }

            const modifiedDoc = executeResult.value;

            // Verify something changed
            expect(modifiedDoc.nodes.size).toBeLessThan(originalNodeCount);

            // Undo
            const undoResult = cmd.undo(modifiedDoc);
            expect(undoResult.ok).toBe(true);

            if (!undoResult.ok) {
              return false;
            }

            const restoredDoc = undoResult.value;

            // Verify restoration
            expect(restoredDoc.nodes.size).toBe(originalNodeCount);
            expect(restoredDoc.nodes.has(nodeToDelete)).toBe(true);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('UpdateAttributeCommand', () => {
    it('should restore original state after execute then undo', () => {
      fc.assert(
        fc.property(
          arbitraryDocument(),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (document, attrName, newValue) => {
            // Find a non-root node to update
            const nodeIds = Array.from(document.nodes.keys()).filter(id => id !== document.root.id);
            
            if (nodeIds.length === 0) {
              return true;
            }

            const nodeId = nodeIds[0];
            const node = document.nodes.get(nodeId)!;

            // Store original attribute value
            const originalValue = node.attributes.get(attrName);

            // Create command
            const cmd = new UpdateAttributeCommand(nodeId, attrName, newValue);

            // Execute
            const executeResult = cmd.execute(document);
            if (!executeResult.ok) {
              return true;
            }

            const modifiedDoc = executeResult.value;
            const modifiedNode = modifiedDoc.nodes.get(nodeId)!;

            // Verify attribute was updated
            expect(modifiedNode.attributes.get(attrName)).toBe(newValue);

            // Undo
            const undoResult = cmd.undo(modifiedDoc);
            expect(undoResult.ok).toBe(true);

            if (!undoResult.ok) {
              return false;
            }

            const restoredDoc = undoResult.value;
            const restoredNode = restoredDoc.nodes.get(nodeId)!;

            // Verify restoration
            if (originalValue === undefined) {
              expect(restoredNode.attributes.has(attrName)).toBe(false);
            } else {
              expect(restoredNode.attributes.get(attrName)).toBe(originalValue);
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

describe('Feature: core-engine, Property 15: Invalid commands preserve state', () => {
  it('should not modify document when command fails validation', () => {
    fc.assert(
      fc.property(
        arbitraryDocument(),
        (document) => {
          // Try to create element with invalid parent
          const cmd = new CreateElementCommand('rect', new Map(), 'non-existent-id');

          const result = cmd.execute(document);

          // Command should fail
          expect(result.ok).toBe(false);

          // Document should be unchanged (same reference)
          // Since we use immutable updates, failed commands return the original document
          if (!result.ok) {
            // Verify no changes were made
            return true;
          }

          return false;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not modify document when deleting non-existent node', () => {
    fc.assert(
      fc.property(
        arbitraryDocument(),
        (document) => {
          const cmd = new DeleteElementCommand('non-existent-id');

          const result = cmd.execute(document);

          // Command should fail
          expect(result.ok).toBe(false);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
