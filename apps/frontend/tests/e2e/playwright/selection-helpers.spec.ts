/**
 * Integration Tests for Selection Helper Functions
 * 
 * These tests verify the selection helper functions work correctly
 * with the SVG editor's selection system.
 */

import { test, expect } from '@playwright/test';
import {
  selectElement,
  selectMultipleElements,
  verifySelectionSync,
  getSelectedElements
} from '../../helpers/selection-helpers';
import { loadSVGContent, waitForEditorReady } from '../../helpers/svg-helpers';

// Simple test SVG with known elements
const testSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect id="test-rect" x="100" y="100" width="100" height="100" fill="red"/>
  <circle id="test-circle" cx="300" cy="150" r="50" fill="blue"/>
  <ellipse id="test-ellipse" cx="500" cy="150" rx="60" ry="40" fill="green"/>
</svg>
`.trim();

test.describe('Selection Helpers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
    await loadSVGContent(page, testSVG);
  });

  test('selectElement should select a single element', async ({ page }) => {
    // Select an element
    await selectElement(page, 'test-rect');
    
    // Verify selection using helper which handles ID resolution
    await verifySelectionSync(page, ['test-rect']);
  });

  test('selectMultipleElements should select multiple elements', async ({ page }) => {
    // Select multiple elements
    await selectMultipleElements(page, ['test-rect', 'test-circle']);
    
    // Verify both elements are selected
    const selectedIds = await getSelectedElements(page);
    expect(selectedIds).toContain('test-rect');
    expect(selectedIds).toContain('test-circle');
    expect(selectedIds.length).toBe(2);
  });

  test('selectMultipleElements should handle empty array', async ({ page }) => {
    // Should not throw error with empty array
    await selectMultipleElements(page, []);
    
    // No elements should be selected (or whatever was previously selected remains)
    // This is a no-op test to ensure it doesn't crash
    const selectedIds = await getSelectedElements(page);
    expect(Array.isArray(selectedIds)).toBe(true);
  });

  test('getSelectedElements should return empty array when nothing selected', async ({ page }) => {
    // Clear any selection by clicking empty canvas area
    const canvas = page.locator('svg-canvas');
    const canvasBox = await canvas.boundingBox();
    
    if (canvasBox) {
      // Click in an empty area (top-left corner)
      await canvas.click({ position: { x: 10, y: 10 } });
    }
    
    const selectedIds = await getSelectedElements(page);
    expect(selectedIds.length).toBe(0);
  });

  test('getSelectedElements should return selected element IDs', async ({ page }) => {
    // Select an element
    await selectElement(page, 'test-rect');
    
    // Get selected elements
    const selectedIds = await getSelectedElements(page);
    expect(selectedIds).toContain('test-rect');
    expect(selectedIds.length).toBeGreaterThanOrEqual(1);
  });

  test('verifySelectionSync should verify single element selection', async ({ page }) => {
    // Select an element
    await selectElement(page, 'test-rect');
    
    // Verify synchronization across panels
    await verifySelectionSync(page, ['test-rect']);
  });

  test('verifySelectionSync should verify multi-element selection', async ({ page }) => {
    // Select multiple elements
    await selectMultipleElements(page, ['test-rect', 'test-circle']);
    
    // Verify synchronization across panels
    await verifySelectionSync(page, ['test-rect', 'test-circle']);
  });
});
