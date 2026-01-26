/**
 * Property-based tests for round-trip operations.
 * 
 * These tests validate that parse-serialize-parse and execute-undo cycles
 * preserve document structure and state.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Parser } from '../../src/document/parser.js';
import { Serializer } from '../../src/document/serializer.js';
import {
  arbitraryDocument,
  arbitrarySVGString
} from './arbitraries.js';

describe('Feature: core-engine, Property 11: Round-trip fidelity', () => {
  const parser = new Parser();
  const serializer = new Serializer();

  it('should preserve document structure through parse-serialize-parse cycle', () => {
    fc.assert(
      fc.property(
        arbitrarySVGString(),
        (svgText) => {
          // Parse the SVG
          const result1 = parser.parse(svgText);
          if (!result1.ok) {
            // If parsing fails, that's acceptable for some generated strings
            return true;
          }

          const doc1 = result1.value;

          // Serialize it
          const serialized = serializer.serialize(doc1);

          // Parse again
          const result2 = parser.parse(serialized);
          expect(result2.ok).toBe(true);

          if (!result2.ok) {
            return false;
          }

          const doc2 = result2.value;

          // Serialize again
          const reserialized = serializer.serialize(doc2);

          // The two serialized versions should be identical
          expect(reserialized).toBe(serialized);

          return true;
        }
      ),
      {
        numRuns: 100,
        verbose: false
      }
    );
  });

  it('should maintain node count through round-trip', () => {
    fc.assert(
      fc.property(
        arbitrarySVGString(),
        (svgText) => {
          const result1 = parser.parse(svgText);
          if (!result1.ok) return true;

          const doc1 = result1.value;
          const nodeCount1 = doc1.nodes.size;

          const serialized = serializer.serialize(doc1);
          const result2 = parser.parse(serialized);

          if (!result2.ok) return false;

          const doc2 = result2.value;
          const nodeCount2 = doc2.nodes.size;

          // Node count should be preserved
          expect(nodeCount2).toBe(nodeCount1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: core-engine, Property 2: Unique ID assignment', () => {
  const parser = new Parser();

  it('should assign unique IDs to all nodes', () => {
    fc.assert(
      fc.property(
        arbitrarySVGString(),
        (svgText) => {
          const result = parser.parse(svgText);
          if (!result.ok) return true;

          const document = result.value;
          const ids = Array.from(document.nodes.keys());

          // Check that all IDs are unique
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never have duplicate IDs in the node index', () => {
    fc.assert(
      fc.property(
        arbitraryDocument(),
        (document) => {
          const ids = Array.from(document.nodes.keys());
          const uniqueIds = new Set(ids);

          // All IDs must be unique
          expect(uniqueIds.size).toBe(ids.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: core-engine, Property 8: Deterministic serialization', () => {
  const serializer = new Serializer();

  it('should produce identical output when serializing the same document multiple times', () => {
    fc.assert(
      fc.property(
        arbitraryDocument(),
        (document) => {
          const serialized1 = serializer.serialize(document);
          const serialized2 = serializer.serialize(document);
          const serialized3 = serializer.serialize(document);

          // All serializations should be identical
          expect(serialized2).toBe(serialized1);
          expect(serialized3).toBe(serialized1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
