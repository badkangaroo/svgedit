/**
 * Element Selection E2E Tests
 * 
 * Verifies the functionality of selecting elements in the SVG editor,
 * including single selection, multi-selection, and synchronization across panels.
 */

import { test, expect } from '@playwright/test';
import {
  selectElement,
  selectMultipleElements,
  verifySelectionSync,
  getSelectedElements
} from '../../helpers/selection-helpers';
import { loadTestSVG, waitForEditorReady } from '../../helpers/svg-helpers';

test.describe('Element Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
    await loadTestSVG(page);
  });

  test('should select element on canvas click', async ({ page }) => {
    // Select the rectangle
    await selectElement(page, 'test-rect');
    
    // Verify it is the only selected element
    const selectedIds = await getSelectedElements(page);
    expect(selectedIds).toHaveLength(1);
    expect(selectedIds).toContain('test-rect');
  });

  test('should synchronize selection across all panels', async ({ page }) => {
    // Select the circle
    await selectElement(page, 'test-circle');
    
    // Verify sync using the helper
    await verifySelectionSync(page, ['test-circle']);
    
    // Additional explicit checks
    // 1. Check Canvas (selection outline)
    const canvas = page.locator('svg-canvas');
    await expect(canvas.locator('.selection-outline')).toBeVisible();
    
    // 2. Check Hierarchy Panel
    const hierarchy = page.locator('svg-hierarchy-panel');
    const selectedNode = hierarchy.locator('[data-node-id="test-circle"]');
    await expect(selectedNode).toHaveClass(/selected/);
    
    // 3. Check Attribute Inspector
    const inspector = page.locator('svg-attribute-inspector');
    // Assuming the inspector shows the tag name or ID of the selected element
    // This selector might need adjustment based on actual implementation
    await expect(inspector).toBeVisible();
  });

  test('should support multi-select with Ctrl key', async ({ page }) => {
    // Select rectangle and circle
    await selectMultipleElements(page, ['test-rect', 'test-circle']);
    
    // Verify both are selected
    const selectedIds = await getSelectedElements(page);
    expect(selectedIds).toHaveLength(2);
    expect(selectedIds).toContain('test-rect');
    expect(selectedIds).toContain('test-circle');
    
    // Verify sync
    await verifySelectionSync(page, ['test-rect', 'test-circle']);
  });

  test('should clear selection on empty canvas click', async ({ page }) => {
    // First select an element
    await selectElement(page, 'test-rect');
    expect(await getSelectedElements(page)).toHaveLength(1);
    
    // Click on empty space in canvas (0,0 is usually safe if elements are offset)
    const canvas = page.locator('svg-canvas');
    // We need to click on the canvas container, but not on an element.
    // The test SVG has elements starting at 50,50 or 100,100.
    // Clicking at 10,10 should be safe.
    await canvas.click({ position: { x: 10, y: 10 } });
    
    // Verify selection is cleared
    const selectedIds = await getSelectedElements(page);
    expect(selectedIds).toHaveLength(0);
    
    // Verify visuals are cleared
    await expect(canvas.locator('.selection-outline')).not.toBeVisible();
  });

  test('should show selection highlights correctly', async ({ page }) => {
    // Select the ellipse
    await selectElement(page, 'test-ellipse');
    
    // Verify selection outline exists
    const canvas = page.locator('svg-canvas');
    const outline = canvas.locator('.selection-outline');
    await expect(outline).toBeVisible();
    
    // Verify handles exist (resize handles)
    const handles = canvas.locator('.selection-handle');
    // A standard selection box usually has 4 corner handles + maybe 4 edge handles
    // Expect at least 4 handles
    expect(await handles.count()).toBeGreaterThanOrEqual(4);
  });
});
