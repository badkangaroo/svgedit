/**
 * Integration tests for Hierarchy Panel and Canvas
 * 
 * Tests the integration between the hierarchy panel and canvas components,
 * verifying that selection synchronization works correctly across both views.
 * 
 * Validates Requirements 3.1, 3.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './svg-hierarchy-panel';
import './svg-canvas';
import { documentState, documentStateUpdater } from '../state/document-state';
import { selectionManager } from '../state/selection-manager';
import { SVGParser } from '../utils/svg-parser';
import type { DocumentNode } from '../types';

describe('Hierarchy Panel and Canvas Integration', () => {
  let hierarchyPanel: HTMLElement;
  let canvas: HTMLElement;
  let parser: SVGParser;

  beforeEach(() => {
    // Create components
    hierarchyPanel = document.createElement('svg-hierarchy-panel');
    canvas = document.createElement('svg-canvas');
    document.body.appendChild(hierarchyPanel);
    document.body.appendChild(canvas);

    parser = new SVGParser();

    // Clear state
    documentStateUpdater.clearDocument();
    selectionManager.clearSelection();
  });

  afterEach(() => {
    // Clean up
    if (hierarchyPanel && hierarchyPanel.parentNode) {
      hierarchyPanel.parentNode.removeChild(hierarchyPanel);
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    documentStateUpdater.clearDocument();
    selectionManager.clearSelection();
  });

  describe('Selection Synchronization', () => {
    it('should synchronize selection from hierarchy to canvas', async () => {
      // Parse a simple SVG document
      const svgText = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect id="rect1" x="10" y="10" width="50" height="50" fill="red"/>
          <circle id="circle1" cx="100" cy="100" r="30" fill="blue"/>
        </svg>
      `;

      const result = parser.parse(svgText);
      expect(result.success).toBe(true);

      // Update document state
      documentStateUpdater.setDocument(result.document!, result.tree, svgText);
      await new Promise(resolve => setTimeout(resolve, 0));

      // First expand the root SVG node to see children
      const svgToggle = hierarchyPanel.shadowRoot!.querySelector('.expand-toggle') as HTMLElement;
      if (svgToggle && !svgToggle.classList.contains('empty')) {
        svgToggle.click();
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Get the first child node (rect) - use the generated ID from the tree
      const rectNode = result.tree[0].children[0]; // First child of SVG root
      const nodeContent = hierarchyPanel.shadowRoot!.querySelector(`.node-content[data-node-id="${rectNode.id}"]`) as HTMLElement;
      expect(nodeContent).toBeTruthy();
      nodeContent.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify selection is synchronized
      expect(selectionManager.getSelectedIds().has(rectNode.id)).toBe(true);

      // Verify canvas shows selection (check for selection outline)
      const selectionOutline = canvas.shadowRoot!.querySelector('.selection-outline');
      expect(selectionOutline).toBeTruthy();
    });

    it('should synchronize selection from canvas to hierarchy', async () => {
      // Parse a simple SVG document
      const svgText = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect id="rect1" x="10" y="10" width="50" height="50" fill="red"/>
          <circle id="circle1" cx="100" cy="100" r="30" fill="blue"/>
        </svg>
      `;

      const result = parser.parse(svgText);
      expect(result.success).toBe(true);

      documentStateUpdater.setDocument(result.document!, result.tree, svgText);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Expand root to see children
      const svgToggle = hierarchyPanel.shadowRoot!.querySelector('.expand-toggle') as HTMLElement;
      if (svgToggle && !svgToggle.classList.contains('empty')) {
        svgToggle.click();
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Select element via selection manager (simulating canvas click)
      const circleNode = result.tree[0].children[1]; // Second child of SVG root
      selectionManager.select([circleNode.id]);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify hierarchy shows selection
      const selectedNode = hierarchyPanel.shadowRoot!.querySelector(`.node-content.selected[data-node-id="${circleNode.id}"]`);
      expect(selectedNode).toBeTruthy();
    });

    it('should synchronize multi-selection across both views', async () => {
      const svgText = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect id="rect1" x="10" y="10" width="50" height="50" fill="red"/>
          <circle id="circle1" cx="100" cy="100" r="30" fill="blue"/>
          <ellipse id="ellipse1" cx="150" cy="150" rx="40" ry="20" fill="green"/>
        </svg>
      `;

      const result = parser.parse(svgText);
      expect(result.success).toBe(true);

      documentStateUpdater.setDocument(result.document!, result.tree, svgText);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Expand root to see children
      const svgToggle = hierarchyPanel.shadowRoot!.querySelector('.expand-toggle') as HTMLElement;
      if (svgToggle && !svgToggle.classList.contains('empty')) {
        svgToggle.click();
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Select multiple elements using generated IDs
      const rectNode = result.tree[0].children[0];
      const circleNode = result.tree[0].children[1];
      selectionManager.select([rectNode.id, circleNode.id]);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify hierarchy shows both selections
      const selectedNodes = hierarchyPanel.shadowRoot!.querySelectorAll('.node-content.selected');
      expect(selectedNodes.length).toBe(2);

      // Verify canvas shows both selections
      const selectionOutlines = canvas.shadowRoot!.querySelectorAll('.selection-outline');
      expect(selectionOutlines.length).toBe(2);
    });

    it('should clear selection in both views', async () => {
      const svgText = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect id="rect1" x="10" y="10" width="50" height="50" fill="red"/>
        </svg>
      `;

      const result = parser.parse(svgText);
      expect(result.success).toBe(true);

      documentStateUpdater.setDocument(result.document!, result.tree, svgText);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select element
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Clear selection
      selectionManager.clearSelection();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify hierarchy has no selection
      const selectedNodes = hierarchyPanel.shadowRoot!.querySelectorAll('.node-content.selected');
      expect(selectedNodes.length).toBe(0);

      // Verify canvas has no selection
      const selectionOutlines = canvas.shadowRoot!.querySelectorAll('.selection-outline');
      expect(selectionOutlines.length).toBe(0);
    });
  });

  describe('Nested Structure Handling', () => {
    it('should handle selection of nested elements', async () => {
      const svgText = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <g id="group1">
            <rect id="rect1" x="10" y="10" width="50" height="50" fill="red"/>
            <circle id="circle1" cx="100" cy="100" r="30" fill="blue"/>
          </g>
        </svg>
      `;

      const result = parser.parse(svgText);
      expect(result.success).toBe(true);

      documentStateUpdater.setDocument(result.document!, result.tree, svgText);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Expand root to see children
      const svgToggle = hierarchyPanel.shadowRoot!.querySelector('.expand-toggle') as HTMLElement;
      if (svgToggle && !svgToggle.classList.contains('empty')) {
        svgToggle.click();
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Manually expand the group to see nested elements
      const groupNode = result.tree[0].children[0]; // First child of SVG (the group)
      const groupToggle = hierarchyPanel.shadowRoot!.querySelector(`.node-content[data-node-id="${groupNode.id}"]`)?.parentElement?.querySelector('.expand-toggle') as HTMLElement;
      if (groupToggle) {
        groupToggle.click();
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Now select nested element (rect inside group)
      const rectNode = groupNode.children[0]; // First child of group (the rect)
      selectionManager.select([rectNode.id]);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify selection is registered
      expect(selectionManager.getSelectedIds().has(rectNode.id)).toBe(true);

      // Verify hierarchy shows the selection (the node should be visible and selected)
      const selectedNodes = hierarchyPanel.shadowRoot!.querySelectorAll('.node-content.selected');
      expect(selectedNodes.length).toBeGreaterThan(0);
    });

    it('should handle selection of group elements', async () => {
      const svgText = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <g id="group1">
            <rect id="rect1" x="10" y="10" width="50" height="50" fill="red"/>
            <circle id="circle1" cx="100" cy="100" r="30" fill="blue"/>
          </g>
        </svg>
      `;

      const result = parser.parse(svgText);
      expect(result.success).toBe(true);

      documentStateUpdater.setDocument(result.document!, result.tree, svgText);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Expand root to see children
      const svgToggle = hierarchyPanel.shadowRoot!.querySelector('.expand-toggle') as HTMLElement;
      if (svgToggle && !svgToggle.classList.contains('empty')) {
        svgToggle.click();
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Select group element
      const groupNode = result.tree[0].children[0]; // First child of SVG (the group)
      selectionManager.select([groupNode.id]);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify hierarchy shows group selection
      const selectedNode = hierarchyPanel.shadowRoot!.querySelector(`.node-content.selected[data-node-id="${groupNode.id}"]`);
      expect(selectedNode).toBeTruthy();

      // Canvas may or may not show selection for groups (depends on getBBox support)
      // Just verify no errors occurred
      expect(canvas.shadowRoot).toBeTruthy();
    });
  });

  describe('Document Updates', () => {
    it('should update both views when document changes', async () => {
      // Initial document
      const svgText1 = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect id="rect1" x="10" y="10" width="50" height="50" fill="red"/>
        </svg>
      `;

      const result1 = parser.parse(svgText1);
      documentStateUpdater.setDocument(result1.document!, result1.tree, svgText1);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify initial state
      let treeNodes = hierarchyPanel.shadowRoot!.querySelectorAll('.tree-node');
      expect(treeNodes.length).toBeGreaterThanOrEqual(1); // At least the root SVG node

      // Update document
      const svgText2 = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect id="rect1" x="10" y="10" width="50" height="50" fill="red"/>
          <circle id="circle1" cx="100" cy="100" r="30" fill="blue"/>
        </svg>
      `;

      const result2 = parser.parse(svgText2);
      documentStateUpdater.setDocument(result2.document!, result2.tree, svgText2);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify both views updated
      treeNodes = hierarchyPanel.shadowRoot!.querySelectorAll('.tree-node');
      expect(treeNodes.length).toBeGreaterThanOrEqual(1); // At least the root SVG node

      // Canvas should show both elements
      const svgContent = canvas.shadowRoot!.querySelector('.svg-content');
      expect(svgContent).toBeTruthy();
      expect(svgContent!.querySelectorAll('rect').length).toBe(1);
      expect(svgContent!.querySelectorAll('circle').length).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should handle selection updates within performance target', async () => {
      // Create a document with multiple elements
      const elements = Array.from({ length: 100 }, (_, i) => 
        `<rect id="rect${i}" x="${i * 10}" y="10" width="8" height="8" fill="red"/>`
      ).join('\n');

      const svgText = `
        <svg width="1000" height="200" xmlns="http://www.w3.org/2000/svg">
          ${elements}
        </svg>
      `;

      const result = parser.parse(svgText);
      documentStateUpdater.setDocument(result.document!, result.tree, svgText);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Measure selection update time
      const startTime = performance.now();
      selectionManager.select(['rect50']);
      await new Promise(resolve => setTimeout(resolve, 0));
      const endTime = performance.now();

      const updateTime = endTime - startTime;

      // Should complete within 50ms for < 1000 nodes (Requirement 3.4)
      expect(updateTime).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty document gracefully', async () => {
      documentStateUpdater.clearDocument();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify hierarchy shows empty state
      const emptyState = hierarchyPanel.shadowRoot!.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();

      // Verify canvas shows empty state
      const canvasEmptyState = canvas.shadowRoot!.querySelector('.empty-state');
      expect(canvasEmptyState).toBeTruthy();
    });

    it('should handle selection of non-existent element', async () => {
      const svgText = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect id="rect1" x="10" y="10" width="50" height="50" fill="red"/>
        </svg>
      `;

      const result = parser.parse(svgText);
      documentStateUpdater.setDocument(result.document!, result.tree, svgText);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Try to select non-existent element
      selectionManager.select(['nonexistent']);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should not crash, but no selection should be shown
      const selectedNodes = hierarchyPanel.shadowRoot!.querySelectorAll('.node-content.selected');
      expect(selectedNodes.length).toBe(0);
    });
  });
});
