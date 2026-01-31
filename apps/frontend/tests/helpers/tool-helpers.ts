/**
 * Tool Helper Functions for Playwright Tests
 * 
 * These helpers provide utilities for testing tool palette functionality
 * and primitive creation in the SVG editor.
 * 
 * KNOWN ISSUES:
 * - The tool palette's shadow root may take time to initialize after page load.
 *   Tests should call waitForEditorReady() before using these helpers.
 * - Some tests may timeout if the tool palette is not fully rendered.
 *   Consider increasing timeout values or adding explicit waits.
 */

import { Page, expect } from '@playwright/test';

/**
 * Select a tool from the palette
 * 
 * This function clicks on a tool button in the tool palette to activate it.
 * It handles shadow DOM piercing and waits for the tool to become active.
 * 
 * @param page - Playwright page object
 * @param toolName - Name of the tool to select (e.g., 'select', 'rectangle', 'circle', 'ellipse', 'line', 'path', 'text', 'group')
 */
export async function selectTool(page: Page, toolName: string): Promise<void> {
  // Wait for tool palette to be present and have shadow root with the tool button
  await page.waitForFunction((tool) => {
    const toolPalette = document.querySelector('svg-tool-palette');
    if (!toolPalette || !toolPalette.shadowRoot) return false;
    const toolButton = toolPalette.shadowRoot.querySelector(`[data-tool="${tool}"]`);
    return toolButton !== null;
  }, toolName, { timeout: 10000 });
  
  // Use page.evaluate to interact with shadow DOM directly
  await page.evaluate((tool) => {
    const toolPalette = document.querySelector('svg-tool-palette');
    if (!toolPalette || !toolPalette.shadowRoot) {
      throw new Error('Tool palette not found');
    }
    
    const toolButton = toolPalette.shadowRoot.querySelector(`[data-tool="${tool}"]`) as HTMLElement;
    if (!toolButton) {
      throw new Error(`Tool button "${tool}" not found`);
    }
    
    toolButton.click();
  }, toolName);
  
  // Wait for the tool to become active
  await page.waitForTimeout(150);
  
  // Verify the tool is now active
  const isActive = await page.evaluate((tool) => {
    const toolPalette = document.querySelector('svg-tool-palette');
    if (!toolPalette || !toolPalette.shadowRoot) return false;
    
    const toolButton = toolPalette.shadowRoot.querySelector(`[data-tool="${tool}"]`);
    return toolButton?.classList.contains('active') || false;
  }, toolName);
  
  if (!isActive) {
    throw new Error(`Tool "${toolName}" did not become active`);
  }
}

/**
 * Draw a primitive on the canvas
 * 
 * This function selects a tool and then performs a drag operation on the canvas
 * to create a primitive shape. Coordinates are relative to the canvas element.
 * 
 * @param page - Playwright page object
 * @param toolName - Name of the tool to use (e.g., 'rectangle', 'circle', 'ellipse', 'line')
 * @param startX - Starting X coordinate relative to canvas
 * @param startY - Starting Y coordinate relative to canvas
 * @param endX - Ending X coordinate relative to canvas
 * @param endY - Ending Y coordinate relative to canvas
 */
export async function drawPrimitive(
  page: Page,
  toolName: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): Promise<void> {
  // First, select the tool
  await selectTool(page, toolName);
  
  // Get the canvas bounding box
  const canvas = page.locator('svg-canvas');
  const canvasBox = await canvas.boundingBox();
  
  if (!canvasBox) {
    throw new Error('Canvas not found or not visible');
  }
  
  // Calculate absolute coordinates
  const absStartX = canvasBox.x + startX;
  const absStartY = canvasBox.y + startY;
  const absEndX = canvasBox.x + endX;
  const absEndY = canvasBox.y + endY;
  
  // Perform the drag operation
  await page.mouse.move(absStartX, absStartY);
  await page.mouse.down();
  await page.mouse.move(absEndX, absEndY, { steps: 10 }); // Use steps for smoother drag
  await page.mouse.up();
  
  // Wait for the primitive to be created and rendered
  await page.waitForTimeout(200);
}

/**
 * Verify a primitive was created
 * 
 * This function checks that a new element of the specified type exists in the canvas.
 * It verifies the element is visible and has been added to the SVG document.
 * 
 * @param page - Playwright page object
 * @param elementType - Type of element to verify (e.g., 'rect', 'circle', 'ellipse', 'line', 'path', 'text')
 */
export async function verifyPrimitiveCreated(
  page: Page,
  elementType: string
): Promise<void> {
  const canvas = page.locator('svg-canvas');
  
  // Find the last element of the specified type (most recently created)
  const element = canvas.locator(`svg ${elementType}`).last();
  
  // Verify the element exists and is visible
  await expect(element).toBeVisible({ timeout: 5000 });
  
  // Verify the element has been added to the document
  const elementCount = await canvas.locator(`svg ${elementType}`).count();
  expect(elementCount).toBeGreaterThan(0);
}

/**
 * Get the currently active tool
 * 
 * This function returns the name of the currently active tool in the palette.
 * 
 * @param page - Playwright page object
 * @returns The name of the active tool, or null if no tool is active
 */
export async function getActiveTool(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const toolPalette = document.querySelector('svg-tool-palette');
    if (!toolPalette || !toolPalette.shadowRoot) return null;
    
    const activeButton = toolPalette.shadowRoot.querySelector('.tool-button.active');
    return activeButton?.getAttribute('data-tool') || null;
  });
}

/**
 * Verify tool is active
 * 
 * This function checks that a specific tool is currently active in the palette.
 * 
 * @param page - Playwright page object
 * @param toolName - Name of the tool to verify
 */
export async function verifyToolActive(page: Page, toolName: string): Promise<void> {
  const activeTool = await getActiveTool(page);
  expect(activeTool).toBe(toolName);
}

/**
 * Get the number of elements of a specific type in the canvas
 * 
 * @param page - Playwright page object
 * @param elementType - Type of element to count (e.g., 'rect', 'circle', 'ellipse', 'line')
 * @returns The count of elements of the specified type
 */
export async function getElementCount(page: Page, elementType: string): Promise<number> {
  const canvas = page.locator('svg-canvas');
  return await canvas.locator(`svg ${elementType}`).count();
}
