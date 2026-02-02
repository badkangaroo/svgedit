/**
 * Raw SVG Panel E2E Tests
 * 
 * Verifies the functionality of the raw SVG panel, including:
 * - Displaying current SVG markup
 * - Editing raw SVG and updating canvas/hierarchy
 * - Error handling for invalid SVG syntax
 * - Synchronization with attribute inspector and tool palette
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 11.3
 */

import { test, expect } from '@playwright/test';
import { loadTestSVG, waitForEditorReady } from '../../helpers/svg-helpers';
import { selectElement } from '../../helpers/selection-helpers';
import { editAttribute } from '../../helpers/attribute-helpers';
import { selectTool, drawPrimitive } from '../../helpers/tool-helpers';

test.describe('Raw SVG Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
    await loadTestSVG(page);
  });

  test('should display current SVG markup', async ({ page }) => {
    // Get the raw SVG panel
    const app = page.locator('svg-editor-app');
    const rawPanel = app.locator('svg-raw-panel');
    
    // Get the textarea content
    const textarea = rawPanel.locator('textarea.text-editor');
    await expect(textarea).toBeVisible();
    
    const content = await textarea.inputValue();
    
    // Verify it contains SVG markup
    expect(content).toContain('<svg');
    expect(content).toContain('</svg>');
    
    // Verify it contains the test elements
    expect(content).toContain('test-rect');
    expect(content).toContain('test-circle');
  });

  test('should update canvas when raw SVG edited', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    const rawPanel = app.locator('svg-raw-panel');
    const canvas = app.locator('svg-canvas');
    
    // Get current SVG content
    const textarea = rawPanel.locator('textarea.text-editor');
    let content = await textarea.inputValue();
    
    // Add a new circle element to the SVG
    const newCircle = '<circle id="new-circle" cx="500" cy="300" r="40" fill="purple"/>';
    content = content.replace('</svg>', `  ${newCircle}\n</svg>`);
    
    // Update the textarea
    await textarea.fill(content);
    
    // Wait for debounced parsing (300ms + buffer)
    await page.waitForTimeout(500);
    
    // Verify the new circle appears in the canvas (check both id and data-original-id)
    const newCircleElement = canvas.locator('svg [id="new-circle"], svg [data-original-id="new-circle"]').first();
    await expect(newCircleElement).toBeVisible();
    
    // Verify attributes
    await expect(newCircleElement).toHaveAttribute('cx', '500');
    await expect(newCircleElement).toHaveAttribute('cy', '300');
    await expect(newCircleElement).toHaveAttribute('r', '40');
  });

  test('should update hierarchy when raw SVG edited', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    const rawPanel = app.locator('svg-raw-panel');
    const hierarchy = app.locator('svg-hierarchy-panel');
    
    // Get current SVG content
    const textarea = rawPanel.locator('textarea.text-editor');
    let content = await textarea.inputValue();
    
    // Add a new rectangle element
    const newRect = '<rect id="new-rect" x="600" y="400" width="80" height="60" fill="orange"/>';
    content = content.replace('</svg>', `  ${newRect}\n</svg>`);
    
    // Update the textarea
    await textarea.fill(content);
    
    // Wait for parsing and hierarchy update
    await page.waitForTimeout(500);
    
    // Verify the new rectangle appears in the hierarchy
    const hierarchyNode = hierarchy.getByText('new-rect', { exact: false });
    await expect(hierarchyNode).toBeVisible();
  });

  test('should show error for invalid SVG syntax', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    const rawPanel = app.locator('svg-raw-panel');
    
    // Get the textarea
    const textarea = rawPanel.locator('textarea.text-editor');
    
    // Create invalid SVG (missing closing tag)
    const invalidSVG = '<svg xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="50" height="50"></svg>';
    
    // Update with invalid SVG
    await textarea.fill(invalidSVG);
    
    // Wait for parsing
    await page.waitForTimeout(500);
    
    // Verify error container is visible
    const errorContainer = rawPanel.locator('.error-container');
    await expect(errorContainer).toHaveClass(/visible/);
    
    // Verify error message is displayed
    const errorMessage = errorContainer.locator('.error-message');
    await expect(errorMessage).toBeVisible();
  });

  test('should not update document on parse error', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    const rawPanel = app.locator('svg-raw-panel');
    const canvas = app.locator('svg-canvas');
    
    // Get initial element count
    const initialElements = await canvas.locator('svg [id], svg [data-original-id]').count();
    
    // Get the textarea
    const textarea = rawPanel.locator('textarea.text-editor');
    
    // Create invalid SVG
    const invalidSVG = '<svg><invalid-tag></svg>';
    
    // Update with invalid SVG
    await textarea.fill(invalidSVG);
    
    // Wait for parsing
    await page.waitForTimeout(500);
    
    // Verify canvas still has the original elements (document not updated)
    const currentElements = await canvas.locator('svg [id], svg [data-original-id]').count();
    expect(currentElements).toBe(initialElements);
    
    // Verify test elements still exist (check both id and data-original-id)
    const testRect = canvas.locator('svg [id="test-rect"], svg [data-original-id="test-rect"]').first();
    await expect(testRect).toBeVisible();
  });

  test('should update raw SVG when attribute edited', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    const rawPanel = app.locator('svg-raw-panel');
    
    // Select an element
    await selectElement(page, 'test-rect');
    
    // Edit an attribute
    await editAttribute(page, 'fill', '#ff00ff');
    
    // Wait for synchronization
    await page.waitForTimeout(300);
    
    // Get raw SVG content
    const textarea = rawPanel.locator('textarea.text-editor');
    const content = await textarea.inputValue();
    
    // Verify the raw SVG contains the updated attribute
    expect(content).toContain('#ff00ff');
  });

  test('should update raw SVG when element created', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    const rawPanel = app.locator('svg-raw-panel');
    
    // Get initial SVG content
    const textarea = rawPanel.locator('textarea.text-editor');
    const initialContent = await textarea.inputValue();
    
    // Create a new element using the tool palette
    await selectTool(page, 'rectangle');
    await drawPrimitive(page, 'rectangle', 100, 100, 200, 200);
    
    // Wait for the element to be created and raw SVG to update
    await page.waitForTimeout(500);
    
    // Get updated SVG content
    const updatedContent = await textarea.inputValue();
    
    // Verify the content changed
    expect(updatedContent).not.toBe(initialContent);
    
    // Verify it contains a new rect element
    // Count rect elements in both versions
    const initialRectCount = (initialContent.match(/<rect/g) || []).length;
    const updatedRectCount = (updatedContent.match(/<rect/g) || []).length;
    
    expect(updatedRectCount).toBeGreaterThan(initialRectCount);
  });

  test('should assign data-uuid to elements when parsing raw SVG edits', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    const rawPanel = app.locator('svg-raw-panel');
    const canvas = app.locator('svg-canvas');
    
    // Get the textarea
    const textarea = rawPanel.locator('textarea.text-editor');
    let content = await textarea.inputValue();
    
    // Add a new element WITHOUT data-uuid
    const newEllipse = '<ellipse id="new-ellipse" cx="400" cy="200" rx="60" ry="40" fill="cyan"/>';
    content = content.replace('</svg>', `  ${newEllipse}\n</svg>`);
    
    // Update the textarea
    await textarea.fill(content);
    
    // Wait for parsing
    await page.waitForTimeout(500);
    
    // Verify the element exists in canvas (check both id and data-original-id)
    const ellipseElement = canvas.locator('svg [id="new-ellipse"], svg [data-original-id="new-ellipse"]').first();
    await expect(ellipseElement).toBeVisible();
    
    // Verify data-uuid was assigned by the parser
    const hasUUID = await ellipseElement.evaluate((el) => {
      return el.hasAttribute('data-uuid');
    });
    
    expect(hasUUID).toBe(true);
  });

  test('should rebuild Element Registry after successful parse', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    const rawPanel = app.locator('svg-raw-panel');
    
    // Get the textarea
    const textarea = rawPanel.locator('textarea.text-editor');
    let content = await textarea.inputValue();
    
    // Add a new element
    const newLine = '<line id="new-line" x1="100" y1="100" x2="300" y2="300" stroke="black" stroke-width="2"/>';
    content = content.replace('</svg>', `  ${newLine}\n</svg>`);
    
    // Update the textarea
    await textarea.fill(content);
    
    // Wait for parsing
    await page.waitForTimeout(500);
    
    // Wait a bit more for Element Registry to rebuild
    await page.waitForTimeout(200);
    
    // Verify Element Registry can find the new element
    const canSelect = await page.evaluate(() => {
      const { selectionManager, elementRegistry } = (window as any);
      if (!selectionManager || !elementRegistry) return false;
      
      try {
        // Check if element is in registry (by id or data-original-id)
        const element = elementRegistry.getElementById('new-line');
        if (!element) return false;
        
        // Try to select it
        selectionManager.select(['new-line']);
        const selectedIds = (window as any).documentState.selectedIds.get();
        return selectedIds.has('new-line');
      } catch (error) {
        console.error('Selection error:', error);
        return false;
      }
    });
    
    expect(canSelect).toBe(true);
  });

  test('should show rollback button when parse error occurs', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    const rawPanel = app.locator('svg-raw-panel');
    
    // Get the textarea
    const textarea = rawPanel.locator('textarea.text-editor');
    
    // Create invalid SVG
    const invalidSVG = '<svg><broken></svg>';
    
    // Update with invalid SVG
    await textarea.fill(invalidSVG);
    
    // Wait for parsing
    await page.waitForTimeout(500);
    
    // Verify rollback button is visible
    const rollbackButton = rawPanel.locator('#rollback-button');
    await expect(rollbackButton).toBeVisible();
    await expect(rollbackButton).not.toHaveClass(/hidden/);
  });

  test('should restore last valid SVG on rollback', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    const rawPanel = app.locator('svg-raw-panel');
    
    // Get the textarea
    const textarea = rawPanel.locator('textarea.text-editor');
    const validContent = await textarea.inputValue();
    
    // Create invalid SVG
    const invalidSVG = '<svg><invalid></svg>';
    
    // Update with invalid SVG
    await textarea.fill(invalidSVG);
    
    // Wait for parsing
    await page.waitForTimeout(500);
    
    // Click rollback button
    const rollbackButton = rawPanel.locator('#rollback-button');
    await rollbackButton.click();
    
    // Wait for rollback to complete
    await page.waitForTimeout(300);
    
    // Verify content is restored
    const restoredContent = await textarea.inputValue();
    expect(restoredContent).toBe(validContent);
    
    // Verify error is cleared
    const errorContainer = rawPanel.locator('.error-container');
    await expect(errorContainer).not.toHaveClass(/visible/);
  });
});
