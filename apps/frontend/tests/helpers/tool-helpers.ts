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
  // First wait for the app and tool palette elements to exist
  await page.waitForSelector('svg-editor-app', { timeout: 10000 });
  
  // Then wait for shadow root and tool button to be available
  // The tool palette is inside the app's shadow DOM
  await page.waitForFunction((tool) => {
    const app = document.querySelector('svg-editor-app');
    if (!app || !app.shadowRoot) return false;
    
    const toolPalette = app.shadowRoot.querySelector('svg-tool-palette');
    if (!toolPalette || !toolPalette.shadowRoot) return false;
    
    const toolButton = toolPalette.shadowRoot.querySelector(`[data-tool="${tool}"]`);
    return toolButton !== null;
  }, toolName, { timeout: 10000 });
  
  // Use page.evaluate to interact with shadow DOM directly
  await page.evaluate((tool) => {
    const app = document.querySelector('svg-editor-app');
    if (!app || !app.shadowRoot) {
      throw new Error('App not found');
    }
    
    const toolPalette = app.shadowRoot.querySelector('svg-tool-palette');
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
    const app = document.querySelector('svg-editor-app');
    if (!app || !app.shadowRoot) return false;
    
    const toolPalette = app.shadowRoot.querySelector('svg-tool-palette');
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
  
  // Wait for state to propagate
  await page.waitForTimeout(300);
  
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
  
  // Wait for primitive creation, setDocument, and canvas re-render (including data-uuid)
  await page.waitForTimeout(400);
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
  
  // Find the last element of the specified type (most recently created) in the content SVG
  const element = canvas.locator(`svg.svg-content ${elementType}`).last();
  
  // Verify the element exists and is visible
  await expect(element).toBeVisible({ timeout: 5000 });
  
  // Verify the element has been added to the document
  const elementCount = await canvas.locator(`svg.svg-content ${elementType}`).count();
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
    const app = document.querySelector('svg-editor-app');
    if (!app || !app.shadowRoot) return null;
    
    const toolPalette = app.shadowRoot.querySelector('svg-tool-palette');
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
  return await canvas.locator(`svg.svg-content ${elementType}`).count();
}

/**
 * Get the number of elements with data-uuid attribute in the canvas
 * This counts only elements that have been properly created with UUIDs
 * 
 * @param page - Playwright page object
 * @param elementType - Type of element to count (e.g., 'rect', 'circle', 'ellipse', 'line')
 * @returns The count of elements with data-uuid of the specified type
 */
export async function getElementCountWithUUID(page: Page, elementType: string): Promise<number> {
  return await page.evaluate((type) => {
    const app = document.querySelector('svg-editor-app');
    if (!app?.shadowRoot) return 0;
    const canvas = app.shadowRoot.querySelector('svg-canvas');
    if (!canvas?.shadowRoot) return 0;
    
    const svg = canvas.shadowRoot.querySelector('svg.svg-content');
    if (!svg) return 0;
    
    const elements = svg.querySelectorAll(`${type}[data-uuid]`);
    return elements.length;
  }, elementType);
}

/**
 * Wait for the count of elements with data-uuid to reach the expected value.
 * Polls until the document state has updated and the canvas has re-rendered
 * with the new element (and its data-uuid) from the registry.
 *
 * @param page - Playwright page object
 * @param elementType - Type of element (e.g., 'rect', 'circle', 'ellipse', 'line')
 * @param expectedCount - Expected count to wait for
 * @param timeoutMs - Max time to wait (default 5000)
 */
export async function waitForElementCountWithUUID(
  page: Page,
  elementType: string,
  expectedCount: number,
  timeoutMs: number = 5000
): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  let count = 0;
  while (Date.now() < deadline) {
    count = await getElementCountWithUUID(page, elementType);
    if (count >= expectedCount) return count;
    await page.waitForTimeout(100);
  }
  return count;
}

/**
 * Get the UUID of the last created element of a specific type
 * 
 * @param page - Playwright page object
 * @param elementType - Type of element (e.g., 'rect', 'circle', 'ellipse', 'line')
 * @returns The data-uuid of the last element, or null if not found
 */
export async function getLastElementUUID(page: Page, elementType: string): Promise<string | null> {
  return await page.evaluate((type) => {
    const app = document.querySelector('svg-editor-app');
    if (!app?.shadowRoot) return null;
    const canvas = app.shadowRoot.querySelector('svg-canvas');
    if (!canvas?.shadowRoot) return null;
    
    const svg = canvas.shadowRoot.querySelector('svg.svg-content');
    if (!svg) return null;
    
    const elements = svg.querySelectorAll(`${type}[data-uuid]`);
    if (elements.length === 0) return null;
    
    const lastElement = elements[elements.length - 1];
    return lastElement.getAttribute('data-uuid');
  }, elementType);
}
