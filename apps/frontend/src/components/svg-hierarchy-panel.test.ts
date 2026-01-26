/**
 * Unit tests for SVG Hierarchy Panel Component
 * 
 * Tests the hierarchy panel's ability to:
 * - Display document tree structure
 * - Subscribe to document state updates
 * - Implement expand/collapse functionality
 * - Highlight selected nodes
 * - Handle user interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import './svg-hierarchy-panel';
import { documentState, documentStateUpdater } from '../state/document-state';
import { selectionManager } from '../state/selection-manager';
import type { DocumentNode } from '../types';

describe('SVGHierarchyPanel', () => {
  let panel: HTMLElement;

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

  describe('Component Rendering', () => {
    it('should render with shadow DOM', () => {
      expect(panel.shadowRoot).toBeTruthy();
    });

    it('should display header with title', () => {
      const header = panel.shadowRoot!.querySelector('.hierarchy-header');
      expect(header).toBeTruthy();
      expect(header!.textContent).toContain('Document Structure');
    });

    it('should display empty state when no document is loaded', () => {
      const emptyState = panel.shadowRoot!.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState!.textContent).toContain('No elements in document');
    });
  });

  describe('Document Tree Display', () => {
    it('should display a simple tree with one node', async () => {
      // Create a simple document tree
      const tree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map([['width', '100'], ['height', '50']]),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
      ];

      // Update document state
      documentStateUpdater.updateDocumentTree(tree);

      // Wait for reactive update
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that the node is displayed
      const treeNodes = panel.shadowRoot!.querySelectorAll('.tree-node');
      expect(treeNodes.length).toBe(1);

      const nodeContent = panel.shadowRoot!.querySelector('.node-content');
      expect(nodeContent).toBeTruthy();
      expect(nodeContent!.textContent).toContain('rect');
      expect(nodeContent!.textContent).toContain('rect1');
    });

    it('should display a tree with multiple nodes', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
        {
          id: 'circle1',
          type: 'element',
          tagName: 'circle',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'circle') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const treeNodes = panel.shadowRoot!.querySelectorAll('.tree-node');
      expect(treeNodes.length).toBe(2);
    });

    it('should display nested tree structure', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'g1',
          type: 'element',
          tagName: 'g',
          attributes: new Map(),
          children: [
            {
              id: 'rect1',
              type: 'element',
              tagName: 'rect',
              attributes: new Map(),
              children: [],
              element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
            },
            {
              id: 'circle1',
              type: 'element',
              tagName: 'circle',
              attributes: new Map(),
              children: [],
              element: document.createElementNS('http://www.w3.org/2000/svg', 'circle') as SVGElement,
            },
          ],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should have parent node
      const parentNode = panel.shadowRoot!.querySelector('[data-node-id="g1"]');
      expect(parentNode).toBeTruthy();

      // Should have children container (collapsed by default)
      const childrenContainer = parentNode!.querySelector('.node-children');
      expect(childrenContainer).toBeTruthy();
      expect(childrenContainer!.classList.contains('expanded')).toBe(false);
    });

    it('should display appropriate icons for different element types', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
        {
          id: 'circle1',
          type: 'element',
          tagName: 'circle',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'circle') as SVGElement,
        },
        {
          id: 'g1',
          type: 'element',
          tagName: 'g',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const icons = panel.shadowRoot!.querySelectorAll('.node-icon');
      expect(icons.length).toBe(3);
      // Icons should be different for different element types
      expect(icons[0].textContent).not.toBe(icons[1].textContent);
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should expand node when toggle is clicked', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'g1',
          type: 'element',
          tagName: 'g',
          attributes: new Map(),
          children: [
            {
              id: 'rect1',
              type: 'element',
              tagName: 'rect',
              attributes: new Map(),
              children: [],
              element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
            },
          ],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Find the expand toggle
      const toggle = panel.shadowRoot!.querySelector('.expand-toggle');
      expect(toggle).toBeTruthy();
      expect(toggle!.classList.contains('expanded')).toBe(false);

      // Click the toggle
      (toggle as HTMLElement).click();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that node is expanded
      const childrenContainer = panel.shadowRoot!.querySelector('.node-children');
      expect(childrenContainer!.classList.contains('expanded')).toBe(true);

      // Check that toggle is rotated
      const toggleAfter = panel.shadowRoot!.querySelector('.expand-toggle');
      expect(toggleAfter!.classList.contains('expanded')).toBe(true);
    });

    it('should collapse node when toggle is clicked again', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'g1',
          type: 'element',
          tagName: 'g',
          attributes: new Map(),
          children: [
            {
              id: 'rect1',
              type: 'element',
              tagName: 'rect',
              attributes: new Map(),
              children: [],
              element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
            },
          ],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const toggle = panel.shadowRoot!.querySelector('.expand-toggle') as HTMLElement;

      // Expand
      toggle.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Collapse
      const toggleAfterExpand = panel.shadowRoot!.querySelector('.expand-toggle') as HTMLElement;
      toggleAfterExpand.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that node is collapsed
      const childrenContainer = panel.shadowRoot!.querySelector('.node-children');
      expect(childrenContainer!.classList.contains('expanded')).toBe(false);
    });

    it('should not show toggle for nodes without children', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      const toggle = panel.shadowRoot!.querySelector('.expand-toggle');
      expect(toggle!.classList.contains('empty')).toBe(true);
    });

    it('should expand all nodes with expandAll method', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'g1',
          type: 'element',
          tagName: 'g',
          attributes: new Map(),
          children: [
            {
              id: 'g2',
              type: 'element',
              tagName: 'g',
              attributes: new Map(),
              children: [
                {
                  id: 'rect1',
                  type: 'element',
                  tagName: 'rect',
                  attributes: new Map(),
                  children: [],
                  element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
                },
              ],
              element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
            },
          ],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Call expandAll
      (panel as any).expandAll();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that all nodes are expanded
      const expandedToggles = panel.shadowRoot!.querySelectorAll('.expand-toggle.expanded');
      expect(expandedToggles.length).toBe(2); // g1 and g2
    });

    it('should collapse all nodes with collapseAll method', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'g1',
          type: 'element',
          tagName: 'g',
          attributes: new Map(),
          children: [
            {
              id: 'rect1',
              type: 'element',
              tagName: 'rect',
              attributes: new Map(),
              children: [],
              element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
            },
          ],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Expand first
      (panel as any).expandAll();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Then collapse all
      (panel as any).collapseAll();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that no nodes are expanded
      const expandedToggles = panel.shadowRoot!.querySelectorAll('.expand-toggle.expanded');
      expect(expandedToggles.length).toBe(0);
    });
  });

  describe('Selection Highlighting', () => {
    it('should highlight selected node', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select the node
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that node is highlighted
      const nodeContent = panel.shadowRoot!.querySelector('.node-content[data-node-id="rect1"]');
      expect(nodeContent!.classList.contains('selected')).toBe(true);
    });

    it('should highlight multiple selected nodes', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
        {
          id: 'circle1',
          type: 'element',
          tagName: 'circle',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'circle') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select multiple nodes
      selectionManager.select(['rect1', 'circle1']);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that both nodes are highlighted
      const selectedNodes = panel.shadowRoot!.querySelectorAll('.node-content.selected');
      expect(selectedNodes.length).toBe(2);
    });

    it('should remove highlight when selection is cleared', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select and then clear
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 0));

      selectionManager.clearSelection();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that no nodes are highlighted
      const selectedNodes = panel.shadowRoot!.querySelectorAll('.node-content.selected');
      expect(selectedNodes.length).toBe(0);
    });

    it('should auto-expand parent nodes when child is selected', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'g1',
          type: 'element',
          tagName: 'g',
          attributes: new Map(),
          children: [
            {
              id: 'rect1',
              type: 'element',
              tagName: 'rect',
              attributes: new Map(),
              children: [],
              element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
            },
          ],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select child node (parent is collapsed)
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that parent is expanded
      const childrenContainer = panel.shadowRoot!.querySelector('.node-children');
      expect(childrenContainer!.classList.contains('expanded')).toBe(true);
    });
  });

  describe('User Interactions', () => {
    it('should select node when clicked', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Click the node
      const nodeContent = panel.shadowRoot!.querySelector('.node-content') as HTMLElement;
      nodeContent.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that node is selected
      expect(selectionManager.getSelectedIds().has('rect1')).toBe(true);
    });

    it('should toggle selection with Ctrl+click', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
        {
          id: 'circle1',
          type: 'element',
          tagName: 'circle',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'circle') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select first node
      const node1 = panel.shadowRoot!.querySelector('.node-content[data-node-id="rect1"]') as HTMLElement;
      node1.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Ctrl+click second node
      const node2 = panel.shadowRoot!.querySelector('.node-content[data-node-id="circle1"]') as HTMLElement;
      const ctrlClickEvent = new MouseEvent('click', { ctrlKey: true, bubbles: true });
      node2.dispatchEvent(ctrlClickEvent);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that both nodes are selected
      expect(selectionManager.getSelectedIds().has('rect1')).toBe(true);
      expect(selectionManager.getSelectedIds().has('circle1')).toBe(true);
    });

    it('should replace selection with normal click', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
        {
          id: 'circle1',
          type: 'element',
          tagName: 'circle',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'circle') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select first node
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Click second node (without Ctrl)
      const node2 = panel.shadowRoot!.querySelector('.node-content[data-node-id="circle1"]') as HTMLElement;
      node2.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that only second node is selected
      expect(selectionManager.getSelectedIds().has('rect1')).toBe(false);
      expect(selectionManager.getSelectedIds().has('circle1')).toBe(true);
    });
  });

  describe('Reactive Updates', () => {
    it('should update tree when document changes', async () => {
      const tree1: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree1);
      await new Promise(resolve => setTimeout(resolve, 0));

      let treeNodes = panel.shadowRoot!.querySelectorAll('.tree-node');
      expect(treeNodes.length).toBe(1);

      // Update with new tree
      const tree2: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
        {
          id: 'circle1',
          type: 'element',
          tagName: 'circle',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'circle') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree2);
      await new Promise(resolve => setTimeout(resolve, 0));

      treeNodes = panel.shadowRoot!.querySelectorAll('.tree-node');
      expect(treeNodes.length).toBe(2);
    });

    it('should update highlights when selection changes', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
        {
          id: 'circle1',
          type: 'element',
          tagName: 'circle',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'circle') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select first node
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 0));

      let selectedNodes = panel.shadowRoot!.querySelectorAll('.node-content.selected');
      expect(selectedNodes.length).toBe(1);
      expect(selectedNodes[0].getAttribute('data-node-id')).toBe('rect1');

      // Change selection to second node
      selectionManager.select(['circle1']);
      await new Promise(resolve => setTimeout(resolve, 0));

      selectedNodes = panel.shadowRoot!.querySelectorAll('.node-content.selected');
      expect(selectedNodes.length).toBe(1);
      expect(selectedNodes[0].getAttribute('data-node-id')).toBe('circle1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tree gracefully', async () => {
      documentStateUpdater.updateDocumentTree([]);
      await new Promise(resolve => setTimeout(resolve, 0));

      const emptyState = panel.shadowRoot!.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('should handle deeply nested tree', async () => {
      const tree: DocumentNode[] = [
        {
          id: 'g1',
          type: 'element',
          tagName: 'g',
          attributes: new Map(),
          children: [
            {
              id: 'g2',
              type: 'element',
              tagName: 'g',
              attributes: new Map(),
              children: [
                {
                  id: 'g3',
                  type: 'element',
                  tagName: 'g',
                  attributes: new Map(),
                  children: [
                    {
                      id: 'rect1',
                      type: 'element',
                      tagName: 'rect',
                      attributes: new Map(),
                      children: [],
                      element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
                    },
                  ],
                  element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
                },
              ],
              element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
            },
          ],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should render without errors
      const treeNodes = panel.shadowRoot!.querySelectorAll('.tree-node');
      expect(treeNodes.length).toBeGreaterThan(0);
    });

    it('should handle nodes without IDs', async () => {
      const tree: DocumentNode[] = [
        {
          id: '',
          type: 'element',
          tagName: 'rect',
          attributes: new Map(),
          children: [],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement,
        },
      ];

      documentStateUpdater.updateDocumentTree(tree);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should render without errors
      const treeNodes = panel.shadowRoot!.querySelectorAll('.tree-node');
      expect(treeNodes.length).toBe(1);
    });
  });
});
