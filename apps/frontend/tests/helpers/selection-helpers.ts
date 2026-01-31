/**
 * Selection Helper Functions for Playwright Tests
 * 
 * These helpers provide utilities for testing element selection functionality
 * across the SVG editor's canvas, hierarchy panel, and attribute inspector.
 */

import { Page, expect } from '@playwright/test';

/**
 * Select an element by ID in the canvas
 * 
 * @param page - Playwright page object
 * @param elementId - ID of the element to select
 */
export async function selectElement(page: Page, elementId: string): Promise<void> {
  const canvas = page.locator('svg-canvas');
  // Try finding by ID first, then by data-original-id (for imported SVGs)
  const element = canvas.locator(`svg [id="${elementId}"], svg [data-original-id="${elementId}"]`).first();
  await element.click();
  
  // Wait for selection to propagate
  await page.waitForTimeout(100);
}


/**
 * Select multiple elements with Ctrl+Click
 * 
 * @param page - Playwright page object
 * @param elementIds - Array of element IDs to select
 */
export async function selectMultipleElements(page: Page, elementIds: string[]): Promise<void> {
  if (elementIds.length === 0) {
    return;
  }
  
  const canvas = page.locator('svg-canvas');
  
  for (let i = 0; i < elementIds.length; i++) {
    const element = canvas.locator(`svg [id="${elementIds[i]}"], svg [data-original-id="${elementIds[i]}"]`).first();
    
    if (i === 0) {
      // First element: regular click
      await element.click();
    } else {
      // Subsequent elements: Ctrl+Click for multi-select
      await element.click({ modifiers: ['Control'] });
    }
    
    // Small delay between selections
    await page.waitForTimeout(50);
  }
  
  // Wait for final selection to propagate
  await page.waitForTimeout(100);
}

/**
 * Verify selection is synchronized across all panels
 * 
 * @param page - Playwright page object
 * @param elementIds - Array of element IDs that should be selected
 */
export async function verifySelectionSync(
  page: Page, 
  elementIds: string[]
): Promise<void> {
  // Resolve internal IDs for the given elementIds (which might be original IDs)
  const resolvedIds = await page.evaluate((ids) => {
    const doc = (window as any).documentState?.svgDocument.get();
    if (!doc) return ids;
    return ids.map((id: string) => {
      const el = doc.querySelector(`[data-original-id="${id}"]`) || doc.getElementById(id);
      return el ? el.id : id;
    });
  }, elementIds);

  // Verify canvas selection - check for selection outlines
  const canvas = page.locator('svg-canvas');
  const selectionOutlines = canvas.locator('.selection-outline');
  const outlineCount = await selectionOutlines.count();
  expect(outlineCount).toBe(elementIds.length);
  
  // Verify hierarchy selection using resolved IDs
  const hierarchy = page.locator('svg-hierarchy-panel');
  for (const id of resolvedIds) {
    const node = hierarchy.locator(`[data-node-id="${id}"]`);
    await expect(node).toHaveClass(/selected/);
  }
  
  // Verify inspector (only for single selection)
  if (elementIds.length === 1) {
    const inspector = page.locator('svg-attribute-inspector');
    // Inspector might take time to update or animate
    await expect(inspector.locator('.element-info, .element-tag')).toBeVisible();
  }
}

/**
 * Get currently selected element IDs
 * 
 * @param page - Playwright page object
 * @returns Array of selected element IDs
 */
export async function getSelectedElements(page: Page): Promise<string[]> {
  // Use the exposed documentState to get selected elements directly
  // This handles the case where IDs are rewritten by the parser
  return await page.evaluate(() => {
    const { documentState } = (window as any);
    if (!documentState) return [];
    
    const selectedElements = documentState.selectedElements.get();
    return selectedElements.map((el: any) => el.getAttribute('data-original-id') || el.id);
  });
}
