/**
 * Comprehensive tests for stable ID generation
 * 
 * This test file specifically validates Requirements 1.2 and 3.1:
 * - Requirement 1.2: Parser SHALL assign a Stable_ID to each node
 * - Requirement 3.1: Document_Model SHALL assign unique Stable_ID when node is created
 */

import { describe, it, expect } from 'vitest';
import { Parser } from '../../src/document/parser.js';
import type { SVGNode } from '../../src/types/node.js';

describe('Stable ID Generation (Requirements 1.2, 3.1)', () => {
  describe('IDGenerator class', () => {
    it('should use counter-based approach', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><rect /><circle /></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // IDs should follow sequential counter pattern
        expect(result.value.root.id).toMatch(/^node_\d+$/);
        expect(result.value.root.children[0].id).toMatch(/^node_\d+$/);
        expect(result.value.root.children[1].id).toMatch(/^node_\d+$/);
        
        // Extract counter values
        const rootCounter = parseInt(result.value.root.id.split('_')[1]);
        const child1Counter = parseInt(result.value.root.children[0].id.split('_')[1]);
        const child2Counter = parseInt(result.value.root.children[1].id.split('_')[1]);
        
        // Counters should be sequential
        expect(child1Counter).toBe(rootCounter + 1);
        expect(child2Counter).toBe(rootCounter + 2);
      }
    });
    
    it('should reset counter for each parse operation', () => {
      const parser = new Parser();
      
      const result1 = parser.parse('<svg />');
      const result2 = parser.parse('<svg />');
      
      expect(result1.ok && result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        // Both should start from the same counter value
        expect(result1.value.root.id).toBe(result2.value.root.id);
      }
    });
  });
  
  describe('Unique ID assignment', () => {
    it('should assign unique IDs to all nodes in simple document', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><rect /><circle /><path /></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const allIds = collectAllIds(result.value.root);
        const uniqueIds = new Set(allIds);
        
        expect(allIds.length).toBe(uniqueIds.size);
        expect(allIds.length).toBe(4); // svg + 3 children
      }
    });
    
    it('should assign unique IDs to all nodes in complex nested document', () => {
      const parser = new Parser();
      const result = parser.parse(`
        <svg>
          <defs>
            <linearGradient />
          </defs>
          <g>
            <rect />
            <circle />
            <g>
              <path />
              <polygon />
            </g>
          </g>
        </svg>
      `);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const allIds = collectAllIds(result.value.root);
        const uniqueIds = new Set(allIds);
        
        // All IDs must be unique
        expect(allIds.length).toBe(uniqueIds.size);
        expect(allIds.length).toBe(9); // svg + defs + linearGradient + 2 groups + 4 shapes
      }
    });
    
    it('should prevent duplicate IDs within a single document', () => {
      const parser = new Parser();
      const result = parser.parse(`
        <svg>
          <rect />
          <rect />
          <rect />
          <g>
            <rect />
            <rect />
          </g>
        </svg>
      `);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const allIds = collectAllIds(result.value.root);
        const uniqueIds = new Set(allIds);
        
        // Even with multiple elements of same type, all IDs must be unique
        expect(allIds.length).toBe(uniqueIds.size);
        expect(allIds.length).toBe(7); // svg + g + 5 rects
      }
    });
  });
  
  describe('Node index (Map<string, SVGNode>)', () => {
    it('should build complete node index during parsing', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><g><rect /><circle /></g></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Index should contain all nodes
        expect(result.value.nodes.size).toBe(4); // svg + g + rect + circle
        
        // Verify index is a Map
        expect(result.value.nodes instanceof Map).toBe(true);
      }
    });
    
    it('should map IDs to correct node references', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><rect /><circle /></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const root = result.value.root;
        const rect = root.children[0];
        const circle = root.children[1];
        
        // Index should map IDs to exact node references
        expect(result.value.nodes.get(root.id)).toBe(root);
        expect(result.value.nodes.get(rect.id)).toBe(rect);
        expect(result.value.nodes.get(circle.id)).toBe(circle);
      }
    });
    
    it('should include all nodes regardless of nesting depth', () => {
      const parser = new Parser();
      const result = parser.parse(`
        <svg>
          <g>
            <g>
              <g>
                <rect />
              </g>
            </g>
          </g>
        </svg>
      `);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should have 5 nodes: svg + 3 groups + rect
        expect(result.value.nodes.size).toBe(5);
        
        // Verify all nodes are accessible
        const allNodes: SVGNode[] = [];
        const collectNodes = (node: SVGNode) => {
          allNodes.push(node);
          node.children.forEach(collectNodes);
        };
        collectNodes(result.value.root);
        
        expect(allNodes.length).toBe(5);
        
        // All collected nodes should be in the index
        allNodes.forEach(node => {
          expect(result.value.nodes.has(node.id)).toBe(true);
          expect(result.value.nodes.get(node.id)).toBe(node);
        });
      }
    });
    
    it('should enable O(1) lookup by ID', () => {
      const parser = new Parser();
      const result = parser.parse(`
        <svg>
          <rect />
          <circle />
          <path />
          <g>
            <ellipse />
            <line />
          </g>
        </svg>
      `);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Get a deeply nested node's ID
        const ellipse = result.value.root.children[3].children[0];
        const ellipseId = ellipse.id;
        
        // Should be able to look it up directly without traversal
        const foundNode = result.value.nodes.get(ellipseId);
        expect(foundNode).toBe(ellipse);
        expect(foundNode?.type).toBe('ellipse');
      }
    });
    
    it('should maintain index consistency with tree structure', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><g><rect /></g><circle /></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Count nodes in tree
        const treeNodes: SVGNode[] = [];
        const collectNodes = (node: SVGNode) => {
          treeNodes.push(node);
          node.children.forEach(collectNodes);
        };
        collectNodes(result.value.root);
        
        // Index size should match tree node count
        expect(result.value.nodes.size).toBe(treeNodes.length);
        
        // Every node in tree should be in index
        treeNodes.forEach(node => {
          expect(result.value.nodes.get(node.id)).toBe(node);
        });
        
        // Every node in index should be in tree
        const indexNodes = Array.from(result.value.nodes.values());
        indexNodes.forEach(indexNode => {
          expect(treeNodes).toContain(indexNode);
        });
      }
    });
  });
  
  describe('Integration with requirements', () => {
    it('should satisfy Requirement 1.2: Parser assigns Stable_ID to each node', () => {
      const parser = new Parser();
      const result = parser.parse('<svg><rect /><circle /><path /></svg>');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Every node must have an ID
        const checkNodeHasId = (node: SVGNode): boolean => {
          if (!node.id || typeof node.id !== 'string' || node.id.length === 0) {
            return false;
          }
          return node.children.every(checkNodeHasId);
        };
        
        expect(checkNodeHasId(result.value.root)).toBe(true);
      }
    });
    
    it('should satisfy Requirement 3.1: Document_Model assigns unique Stable_ID', () => {
      const parser = new Parser();
      const result = parser.parse(`
        <svg>
          <g><rect /></g>
          <g><circle /></g>
          <g><path /></g>
        </svg>
      `);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const allIds = collectAllIds(result.value.root);
        const uniqueIds = new Set(allIds);
        
        // All IDs must be unique (no duplicates)
        expect(allIds.length).toBe(uniqueIds.size);
        
        // All IDs must be stable (non-empty strings)
        allIds.forEach(id => {
          expect(typeof id).toBe('string');
          expect(id.length).toBeGreaterThan(0);
        });
      }
    });
  });
});

/**
 * Helper function to collect all node IDs from a tree
 */
function collectAllIds(node: SVGNode): string[] {
  const ids = [node.id];
  node.children.forEach(child => {
    ids.push(...collectAllIds(child));
  });
  return ids;
}
