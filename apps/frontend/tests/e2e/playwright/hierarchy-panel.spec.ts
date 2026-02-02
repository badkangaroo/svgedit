/**
 * Hierarchy Panel E2E Tests
 * 
 * Verifies the functionality of the hierarchy panel including:
 * - Element selection from hierarchy
 * - Node expansion/collapse
 * - Hierarchy updates on element creation/deletion
 * - Virtual scrolling for large documents
 */

import { test, expect } from '@playwright/test';
import {
  selectElement,
  getSelectedElements,
  verifySelectionSync
} from '../../helpers/selection-helpers';
import { 
  loadTestSVG, 
  loadSimpleTestSVG,
  loadSVGContent, 
  waitForEditorReady 
} from '../../helpers/svg-helpers';
import { 
  generateTestSVG, 
  generateLargeSVG 
} from '../../helpers/test-data-generators';
import { selectTool, drawPrimitive } from '../../helpers/tool-helpers';

test.describe('Hierarchy Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging from browser
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('/');
    await page.reload();
    await waitForEditorReady(page);
    await loadTestSVG(page);
  });

  test('hierarchy populates when loading simple SVG', async ({ page }) => {
    await page.reload();
    await waitForEditorReady(page);
    await loadSimpleTestSVG(page);
    const hierarchy = page.locator('svg-hierarchy-panel');
    await expect(hierarchy.locator('.node-content').first()).toBeVisible();
    await expect(hierarchy.getByText('simple-rect')).toBeVisible();
  });

  test('should select element from hierarchy click', async ({ page }) => {
    const hierarchy = page.locator('svg-hierarchy-panel');
    
    // Find the first rect node (test-rect) using locator
    // Note: The text content includes <rect> and #test-rect
    const node = hierarchy.locator('.node-content').filter({ hasText: '<rect>' }).first();
    
    // Click the node
    await node.click();
    
    // Verify element is selected
    const selectedIds = await getSelectedElements(page);
    expect(selectedIds.length).toBeGreaterThan(0);
    expect(selectedIds[0]).toContain('rect');
    
    // Verify canvas shows selection
    const canvas = page.locator('svg-canvas');
    await expect(canvas.locator('.selection-outline')).toBeVisible();
    
    // Verify inspector shows the element
    const inspector = page.locator('svg-attribute-inspector');
    await expect(inspector.locator('.element-info')).toBeVisible();
  });

  test('should expand node on toggle click', async ({ page }) => {
    const hierarchy = page.locator('svg-hierarchy-panel');
    
    // Find the group node
    const groupNode = hierarchy.locator('.node-content').filter({ hasText: '<g>' }).first();
    const toggle = groupNode.locator('.expand-toggle');
    
    // Check if it's already expanded (it shouldn't be initially for this test data)
    // But if it is, we'll collapse it first or just verify it works
    
    // Click to expand
    await toggle.click();
    
    // Verify toggle has expanded class
    await expect(toggle).toHaveClass(/expanded/);
  });

  test('should collapse node on toggle click', async ({ page }) => {
    const hierarchy = page.locator('svg-hierarchy-panel');
    
    // Find the group node
    const groupNode = hierarchy.locator('.node-content').filter({ hasText: '<g>' }).first();
    const toggle = groupNode.locator('.expand-toggle');
    
    // Expand first
    await toggle.click();
    await expect(toggle).toHaveClass(/expanded/);
    
    // Collapse
    await toggle.click();
    await expect(toggle).not.toHaveClass(/expanded/);
  });

  test('should show children when node expanded', async ({ page }) => {
    const hierarchy = page.locator('svg-hierarchy-panel');
    
    // Find the group node
    const groupNode = hierarchy.locator('.node-content').filter({ hasText: '<g>' }).first();
    const toggle = groupNode.locator('.expand-toggle');
    
    // Expand
    await toggle.click();
    
    // Verify children are visible
    // We look for nodes that are inside the children container of the group
    // This is tricky with flattened locators, but we can check for existence of specific child nodes
    // The group contains a rect and a circle
    
    // We can check if the children container is expanded
    // The structure is: .tree-node > .node-content + .node-children
    // We need to find the parent .tree-node of our groupNode
    
    // Alternatively, we can just check if the child nodes are visible. 
    // In the current implementation, .node-children has display: none unless expanded.
    
    // Let's find a child node by its ID or text
    const childRect = hierarchy.locator('.node-content').filter({ hasText: 'group-rect' }).first();
    
    // It should be visible now
    await expect(childRect).toBeVisible();
  });

  test('should update hierarchy when element created', async ({ page }) => {
    const hierarchy = page.locator('svg-hierarchy-panel');
    const initialCount = await hierarchy.locator('.node-content').count();
    
    // Create a new rectangle using the tool palette
    await selectTool(page, 'rectangle');
    await page.waitForTimeout(200);
    
    await drawPrimitive(page, 'rectangle', 50, 50, 150, 150);
    
    // Verify hierarchy has one more node
    // We need to wait for the update
    await expect(async () => {
      const newCount = await hierarchy.locator('.node-content').count();
      expect(newCount).toBe(initialCount + 1);
    }).toPass();
  });

  test('should update hierarchy when element deleted', async ({ page }) => {
    const hierarchy = page.locator('svg-hierarchy-panel');
    const initialCount = await hierarchy.locator('.node-content').count();
    
    // Select an element
    await selectElement(page, 'test-rect');
    
    // Delete the selected element using Delete key
    await page.keyboard.press('Delete');
    
    // Verify hierarchy has one fewer node
    await expect(async () => {
      const newCount = await hierarchy.locator('.node-content').count();
      expect(newCount).toBe(initialCount - 1);
    }).toPass();
  });

  test('should enable virtual scrolling for large documents (>1000 nodes)', async ({ page }) => {
    // Generate a large SVG with 1500 elements
    const largeSVG = generateLargeSVG(1500);
    await loadSVGContent(page, largeSVG);
    
    // Verify performance indicator is shown
    const hierarchy = page.locator('svg-hierarchy-panel');
    const indicator = hierarchy.locator('.performance-indicator');
    
    await expect(indicator).toBeVisible();
    await expect(indicator).toContainText('Virtual scrolling enabled');
    await expect(indicator).toContainText('1500');
  });

  test('should show performance indicator for virtual scrolling', async ({ page }) => {
    // Generate a large SVG with 1200 elements
    const largeSVG = generateLargeSVG(1200);
    await loadSVGContent(page, largeSVG);
    
    const hierarchy = page.locator('svg-hierarchy-panel');
    const indicator = hierarchy.locator('.performance-indicator');
    
    await expect(indicator).toBeVisible();
    await expect(indicator).toContainText('Virtual scrolling enabled');
    await expect(indicator).toContainText('1200');
  });

  test('should scroll to selected node in virtual mode', async ({ page }) => {
    // Generate a large SVG with 1500 elements
    const largeSVG = generateLargeSVG(1500);
    await loadSVGContent(page, largeSVG);
    
    const hierarchy = page.locator('svg-hierarchy-panel');
    
    // Verify virtual scrolling is enabled
    await expect(hierarchy.locator('.performance-indicator')).toBeVisible();
    
    // Select an element far down in the list (e.g., rect-1000)
    // We need to select it via ID, but selectElement helper uses click on canvas usually.
    // Let's use a helper that selects by ID programmatically if possible, or just use the selection manager directly
    
    // We can use the helper selectElement which clicks on canvas.
    // But for 1500 elements, finding it on canvas might be slow or off-screen.
    // Let's use evaluate to select programmatically
    await page.evaluate(() => {
      const { selectionManager } = (window as any);
      // Find ID for rect-1000. generateLargeSVG uses IDs like rect-0, rect-1...
      selectionManager.select(['rect-1000']);
    });
    
    // Verify the selected node exists in the hierarchy (it should be rendered due to selection)
    const selectedNode = hierarchy.locator('.node-content.selected');
    await expect(selectedNode).toBeVisible();
    await expect(selectedNode).toContainText('rect');
  });
});
