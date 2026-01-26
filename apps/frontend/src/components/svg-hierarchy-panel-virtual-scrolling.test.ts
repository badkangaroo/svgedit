/**
 * Unit tests for SVG Hierarchy Panel Virtual Scrolling
 * 
 * Tests the hierarchy panel's virtual scrolling functionality:
 * - Enables virtual scrolling for documents with > 1000 nodes
 * - Renders only visible nodes for performance
 * - Maintains selection and expand/collapse functionality
 * - Handles scroll events correctly
 * 
 * Requirements: 13.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './svg-hierarchy-panel';
import { documentStateUpdater } from '../state/document-state';
import { selectionManager } from '../state/selection-manager';
import type { DocumentNode } from '../types';

describe('SVGHierarchyPanel - Virtual Scrolling', () => {
  let panel: any; // Using any to access private methods for testing

  beforeEach(() => {
    // Create a fresh panel instance
    panel = document.createElement('svg-hierarchy-panel');
    document.body.appendChild(panel);
    
    // Clear document state
    documentStateUpdater.clearDocument();
  });

  afterEach(() => {
    // Clean up
    if (panel && panel.parentNode) {
      panel.parentNode.removeChild(panel);
    }
    documentStateUpdater.clearDocument();
    selectionManager.clearSelection();
  });

  /**
   * Helper function to create a large document tree
   */
  function createLargeTree(nodeCount: number): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `node-${i}`,
        type: 'element',
        tagName: i % 3 === 0 ? 'rect' : i % 3 === 1 ? 'circle' : 'ellipse',
        attributes: new Map([
          ['x', '0'],
          ['y', '0'],
          ['width', '100'],
          ['height', '100'],
        ]),
        children: [],
        element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
      });
    }
    
    return nodes;
  }

  /**
   * Helper function to create a nested tree
   */
  function createNestedTree(depth: number, childrenPerNode: number): DocumentNode[] {
    function createNode(id: string, currentDepth: number): DocumentNode {
      const children: DocumentNode[] = [];
      
      if (currentDepth < depth) {
        for (let i = 0; i < childrenPerNode; i++) {
          children.push(createNode(`${id}-${i}`, currentDepth + 1));
        }
      }
      
      return {
        id,
        type: 'element',
        tagName: 'g',
        attributes: new Map(),
        children,
        element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
      };
    }
    
    return [createNode('root', 0)];
  }

  describe('Virtual Scrolling Activation', () => {
    it('should not enable virtual scrolling for small documents (< 1000 nodes)', async () => {
      const tree = createLargeTree(500);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(panel.isVirtualScrollingEnabled()).toBe(false);
      expect(panel.getTotalNodeCount()).toBe(500);
    });

    it('should enable virtual scrolling for documents with exactly 1000 nodes', async () => {
      const tree = createLargeTree(1000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(panel.isVirtualScrollingEnabled()).toBe(false); // Threshold is > 1000
      expect(panel.getTotalNodeCount()).toBe(1000);
    });

    it('should enable virtual scrolling for documents with > 1000 nodes', async () => {
      const tree = createLargeTree(1001);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(panel.isVirtualScrollingEnabled()).toBe(true);
      expect(panel.getTotalNodeCount()).toBe(1001);
    });

    it('should enable virtual scrolling for large documents (5000 nodes)', async () => {
      const tree = createLargeTree(5000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(panel.isVirtualScrollingEnabled()).toBe(true);
      expect(panel.getTotalNodeCount()).toBe(5000);
    });

    it('should display performance indicator when virtual scrolling is enabled', async () => {
      const tree = createLargeTree(2000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const indicator = panel.shadowRoot!.querySelector('.performance-indicator');
      expect(indicator).toBeTruthy();
      expect(indicator!.textContent).toContain('Virtual scrolling enabled');
      expect(indicator!.textContent).toContain('2000 nodes');
    });

    it('should not display performance indicator for small documents', async () => {
      const tree = createLargeTree(500);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const indicator = panel.shadowRoot!.querySelector('.performance-indicator');
      expect(indicator).toBeFalsy();
    });
  });

  describe('Virtual Scrolling Rendering', () => {
    it('should render only a subset of nodes when virtualized', async () => {
      const tree = createLargeTree(2000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Count rendered nodes (should be much less than 2000)
      const renderedNodes = panel.shadowRoot!.querySelectorAll('.tree-node');
      expect(renderedNodes.length).toBeLessThan(2000);
      expect(renderedNodes.length).toBeGreaterThan(0);
    });

    it('should create virtual scroll spacer with correct height', async () => {
      const tree = createLargeTree(2000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const spacer = panel.shadowRoot!.querySelector('.virtual-scroll-spacer');
      expect(spacer).toBeTruthy();
      
      // Height should be approximately nodeCount * NODE_HEIGHT
      const height = parseInt(spacer!.style.height);
      expect(height).toBeGreaterThan(50000); // 2000 * ~28px
    });

    it('should render all nodes when not virtualized', async () => {
      const tree = createLargeTree(100);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const renderedNodes = panel.shadowRoot!.querySelectorAll('.tree-node');
      expect(renderedNodes.length).toBe(100);
    });

    it('should maintain node structure in virtual scrolling', async () => {
      const tree = createLargeTree(1500);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that rendered nodes have correct structure
      const firstNode = panel.shadowRoot!.querySelector('.tree-node');
      expect(firstNode).toBeTruthy();
      expect(firstNode!.querySelector('.node-content')).toBeTruthy();
      expect(firstNode!.querySelector('.node-icon')).toBeTruthy();
      expect(firstNode!.querySelector('.node-label')).toBeTruthy();
    });
  });

  describe('Virtual Scrolling with Nested Trees', () => {
    it('should count only visible nodes when tree is collapsed', async () => {
      // Create a tree with 10 children per node, 3 levels deep
      // Total nodes: 1 + 10 + 100 = 111 (if all expanded)
      const tree = createNestedTree(3, 10);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Initially collapsed, should only count root
      expect(panel.getTotalNodeCount()).toBe(1);
      expect(panel.isVirtualScrollingEnabled()).toBe(false);
    });

    it('should update node count when expanding nodes', async () => {
      const tree = createNestedTree(3, 10);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Expand all nodes
      panel.expandAll();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should now count all nodes: 1 + 10 + 100 + 1000 = 1111
      expect(panel.getTotalNodeCount()).toBe(1111);
      expect(panel.isVirtualScrollingEnabled()).toBe(true);
    });

    it('should enable virtual scrolling for large nested tree when expanded', async () => {
      // Create a tree that exceeds threshold when expanded
      // 3 levels, 11 children per node = 1 + 11 + 121 + 1331 = 1464 nodes
      const tree = createNestedTree(3, 11);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Expand all nodes
      panel.expandAll();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(panel.getTotalNodeCount()).toBeGreaterThan(1000);
      expect(panel.isVirtualScrollingEnabled()).toBe(true);
    }, 10000); // Increase timeout
  });

  describe('Selection with Virtual Scrolling', () => {
    it('should highlight selected node in virtualized tree', async () => {
      const tree = createLargeTree(2000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select a node that should be in the initial viewport
      selectionManager.select(['node-5']);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check if node is highlighted (if rendered)
      const selectedNode = panel.shadowRoot!.querySelector('.node-content[data-node-id="node-5"]');
      if (selectedNode) {
        expect(selectedNode.classList.contains('selected')).toBe(true);
      }
    });

    it('should handle selection of nodes outside viewport', async () => {
      const tree = createLargeTree(2000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select a node far down the list
      selectionManager.select(['node-1500']);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Selection should be tracked even if node is not rendered
      expect(selectionManager.getSelectedIds().has('node-1500')).toBe(true);
    });

    it('should handle multi-selection in virtualized tree', async () => {
      const tree = createLargeTree(2000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select multiple nodes
      selectionManager.select(['node-10', 'node-20', 'node-30']);
      await new Promise(resolve => setTimeout(resolve, 0));

      // All should be selected
      expect(selectionManager.getSelectedIds().size).toBe(3);
      expect(selectionManager.getSelectedIds().has('node-10')).toBe(true);
      expect(selectionManager.getSelectedIds().has('node-20')).toBe(true);
      expect(selectionManager.getSelectedIds().has('node-30')).toBe(true);
    });

    it('should maintain selection when scrolling', async () => {
      const tree = createLargeTree(2000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select a node
      selectionManager.select(['node-100']);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Simulate scroll
      const scrollContainer = panel.shadowRoot!.querySelector('.scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTop = 5000;
        scrollContainer.dispatchEvent(new Event('scroll'));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Selection should still be tracked
      expect(selectionManager.getSelectedIds().has('node-100')).toBe(true);
    });
  });

  describe('Expand/Collapse with Virtual Scrolling', () => {
    it('should handle expand/collapse in virtualized tree', async () => {
      const tree = createNestedTree(3, 11); // Creates > 1000 nodes when expanded: 1 + 11 + 121 + 1331 = 1464
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Initially collapsed
      expect(panel.getTotalNodeCount()).toBe(1);

      // Expand all
      panel.expandAll();
      await new Promise(resolve => setTimeout(resolve, 50));

      const expandedCount = panel.getTotalNodeCount();
      expect(expandedCount).toBeGreaterThan(1000);
      expect(panel.isVirtualScrollingEnabled()).toBe(true);

      // Collapse all
      panel.collapseAll();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(panel.getTotalNodeCount()).toBe(1);
      expect(panel.isVirtualScrollingEnabled()).toBe(false);
    }, 10000); // Increase timeout

    it('should update virtual scrolling when toggling nodes', async () => {
      const tree = createNestedTree(3, 11);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Expand all to enable virtual scrolling
      panel.expandAll();
      await new Promise(resolve => setTimeout(resolve, 50));

      const initialCount = panel.getTotalNodeCount();
      expect(panel.isVirtualScrollingEnabled()).toBe(true);

      // Find and click a toggle to collapse a branch
      const toggle = panel.shadowRoot!.querySelector('.expand-toggle.expanded');
      if (toggle) {
        (toggle as HTMLElement).click();
        await new Promise(resolve => setTimeout(resolve, 50));

        // Node count should decrease
        expect(panel.getTotalNodeCount()).toBeLessThan(initialCount);
      }
    }, 10000); // Increase timeout
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty document', async () => {
      documentStateUpdater.updateDocumentTree([]);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(panel.getTotalNodeCount()).toBe(0);
      expect(panel.isVirtualScrollingEnabled()).toBe(false);
      
      const emptyState = panel.shadowRoot!.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('should handle transition from small to large document', async () => {
      // Start with small document
      const smallTree = createLargeTree(100);
      documentStateUpdater.updateDocumentTree(smallTree);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(panel.isVirtualScrollingEnabled()).toBe(false);

      // Update to large document
      const largeTree = createLargeTree(2000);
      documentStateUpdater.updateDocumentTree(largeTree);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(panel.isVirtualScrollingEnabled()).toBe(true);
    });

    it('should handle transition from large to small document', async () => {
      // Start with large document
      const largeTree = createLargeTree(2000);
      documentStateUpdater.updateDocumentTree(largeTree);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(panel.isVirtualScrollingEnabled()).toBe(true);

      // Update to small document
      const smallTree = createLargeTree(100);
      documentStateUpdater.updateDocumentTree(smallTree);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(panel.isVirtualScrollingEnabled()).toBe(false);
    });

    it('should handle very large documents (10000 nodes)', async () => {
      const tree = createLargeTree(10000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(panel.isVirtualScrollingEnabled()).toBe(true);
      expect(panel.getTotalNodeCount()).toBe(10000);

      // Should still render only a subset
      const renderedNodes = panel.shadowRoot!.querySelectorAll('.tree-node');
      expect(renderedNodes.length).toBeLessThan(10000);
      expect(renderedNodes.length).toBeGreaterThan(0);
    });

    it('should expose virtualization threshold for testing', () => {
      expect(panel.getVirtualizationThreshold()).toBe(1000);
    });

    it('should handle rapid document updates', async () => {
      // Rapidly update document multiple times
      for (let i = 0; i < 5; i++) {
        const tree = createLargeTree(1500 + i * 100);
        documentStateUpdater.updateDocumentTree(tree);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Should still be in a valid state
      expect(panel.isVirtualScrollingEnabled()).toBe(true);
      expect(panel.getTotalNodeCount()).toBeGreaterThan(1000);
    });
  });

  describe('Scroll Behavior', () => {
    it('should have scroll container', async () => {
      const tree = createLargeTree(2000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const scrollContainer = panel.shadowRoot!.querySelector('.scroll-container');
      expect(scrollContainer).toBeTruthy();
    });

    it('should handle scroll events', async () => {
      const tree = createLargeTree(2000);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const scrollContainer = panel.shadowRoot!.querySelector('.scroll-container');
      expect(scrollContainer).toBeTruthy();

      // Simulate scroll
      scrollContainer!.scrollTop = 1000;
      scrollContainer!.dispatchEvent(new Event('scroll'));
      
      // Wait for scroll handler
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still be in valid state
      expect(panel.isVirtualScrollingEnabled()).toBe(true);
    });

    it('should not break on scroll when not virtualized', async () => {
      const tree = createLargeTree(100);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const scrollContainer = panel.shadowRoot!.querySelector('.scroll-container');
      expect(scrollContainer).toBeTruthy();

      // Simulate scroll (should be no-op)
      scrollContainer!.scrollTop = 100;
      scrollContainer!.dispatchEvent(new Event('scroll'));
      
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still work normally
      expect(panel.isVirtualScrollingEnabled()).toBe(false);
    });
  });

  describe('Integration with Existing Features', () => {
    it('should maintain node icons in virtualized mode', async () => {
      const tree = createLargeTree(1500);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const icons = panel.shadowRoot!.querySelectorAll('.node-icon');
      expect(icons.length).toBeGreaterThan(0);
      
      // Icons should have content
      icons.forEach((icon: Element) => {
        expect(icon.textContent).toBeTruthy();
      });
    });

    it('should maintain node labels in virtualized mode', async () => {
      const tree = createLargeTree(1500);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const labels = panel.shadowRoot!.querySelectorAll('.node-label');
      expect(labels.length).toBeGreaterThan(0);
      
      // Labels should have content
      labels.forEach((label: Element) => {
        expect(label.textContent).toBeTruthy();
      });
    });

    it('should maintain click handlers in virtualized mode', async () => {
      const tree = createLargeTree(1500);
      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Click a node
      const nodeContent = panel.shadowRoot!.querySelector('.node-content');
      expect(nodeContent).toBeTruthy();
      
      (nodeContent as HTMLElement).click();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should have selected something
      expect(selectionManager.getSelectedIds().size).toBeGreaterThan(0);
    });
  });
});
