/**
 * Drag Helper Functions for Playwright Tests
 * 
 * These helpers provide utilities for testing drag-to-move functionality
 * in the SVG editor, allowing elements to be repositioned on the canvas.
 */

import { Page, expect } from '@playwright/test';

/**
 * Drag an element by delta coordinates
 * 
 * This function performs a drag operation on an element in the canvas,
 * moving it by the specified delta values. It handles finding the element,
 * calculating the drag path, and performing the mouse operations.
 * 
 * @param page - Playwright page object
 * @param elementId - ID of the element to drag
 * @param deltaX - Horizontal distance to drag (positive = right, negative = left)
 * @param deltaY - Vertical distance to drag (positive = down, negative = up)
 */
export async function dragElement(
  page: Page,
  elementId: string,
  deltaX: number,
  deltaY: number
): Promise<void> {
  const canvas = page.locator('svg-canvas');
  
  // Try to find element by ID, data-original-id, or data-uuid in the content SVG
  const element = canvas.locator(
    `svg.svg-content [id="${elementId}"], svg.svg-content [data-original-id="${elementId}"], svg.svg-content [data-uuid="${elementId}"]`
  ).first();
  
  // Get the element's bounding box
  const box = await element.boundingBox();
  if (!box) {
    throw new Error(`Element ${elementId} not found or not visible`);
  }
  
  // Calculate the center point of the element as the drag start point
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  
  // Calculate the end point
  const endX = startX + deltaX;
  const endY = startY + deltaY;
  
  // Perform the drag operation
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  
  // Wait a bit for selection/drag initialization
  await page.waitForTimeout(50);
  
  // Move with steps for smoother drag simulation
  await page.mouse.move(endX, endY, { steps: 10 });
  
  await page.mouse.up();
  
  // Wait for the drag operation to complete and state to update
  await page.waitForTimeout(200);
}

/**
 * Get element position coordinates
 * 
 * This function retrieves the position of an element in the SVG document.
 * It handles different element types (rect, circle, ellipse, line, etc.)
 * and returns the appropriate position coordinates.
 * 
 * @param page - Playwright page object
 * @param elementId - ID of the element to get position for
 * @returns Object with x and y coordinates
 */
export async function getElementPosition(
  page: Page,
  elementId: string
): Promise<{ x: number; y: number }> {
  return await page.evaluate((id) => {
    // Find the element in the document
    const doc = (window as any).documentState?.svgDocument.get();
    if (!doc) {
      throw new Error('Document not found');
    }
    
    // Try to find by ID, data-original-id, or data-uuid
    let element = doc.getElementById(id);
    if (!element) {
      element = doc.querySelector(`[data-original-id="${id}"]`);
    }
    if (!element) {
      element = doc.querySelector(`[data-uuid="${id}"]`);
    }
    
    if (!element) {
      throw new Error(`Element ${id} not found`);
    }
    
    const tagName = element.tagName.toLowerCase();
    
    // Handle different element types
    if (tagName === 'rect' || tagName === 'image') {
      const x = element.getAttribute('x');
      const y = element.getAttribute('y');
      return { 
        x: parseFloat(x || '0'), 
        y: parseFloat(y || '0') 
      };
    } else if (tagName === 'circle') {
      const cx = element.getAttribute('cx');
      const cy = element.getAttribute('cy');
      return { 
        x: parseFloat(cx || '0'), 
        y: parseFloat(cy || '0') 
      };
    } else if (tagName === 'ellipse') {
      const cx = element.getAttribute('cx');
      const cy = element.getAttribute('cy');
      return { 
        x: parseFloat(cx || '0'), 
        y: parseFloat(cy || '0') 
      };
    } else if (tagName === 'line') {
      const x1 = element.getAttribute('x1');
      const y1 = element.getAttribute('y1');
      return { 
        x: parseFloat(x1 || '0'), 
        y: parseFloat(y1 || '0') 
      };
    } else if (tagName === 'text') {
      const x = element.getAttribute('x');
      const y = element.getAttribute('y');
      return { 
        x: parseFloat(x || '0'), 
        y: parseFloat(y || '0') 
      };
    } else if (tagName === 'g' || tagName === 'path' || tagName === 'polygon' || tagName === 'polyline') {
      // For groups and paths, try to get transform translate values
      const transform = element.getAttribute('transform');
      if (transform) {
        const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (translateMatch) {
          return {
            x: parseFloat(translateMatch[1]),
            y: parseFloat(translateMatch[2])
          };
        }
      }
      // Default to 0,0 if no transform
      return { x: 0, y: 0 };
    }
    
    // Default fallback
    return { x: 0, y: 0 };
  }, elementId);
}

/**
 * Verify element moved to expected position
 * 
 * This function checks that an element has been moved to the expected position
 * within a specified tolerance. It's useful for verifying drag operations.
 * 
 * @param page - Playwright page object
 * @param elementId - ID of the element to verify
 * @param expectedX - Expected X coordinate
 * @param expectedY - Expected Y coordinate
 * @param tolerance - Allowed difference from expected position (default: 1)
 */
export async function verifyElementMoved(
  page: Page,
  elementId: string,
  expectedX: number,
  expectedY: number,
  tolerance: number = 1
): Promise<void> {
  const position = await getElementPosition(page, elementId);
  
  // Check X coordinate is within tolerance
  expect(Math.abs(position.x - expectedX)).toBeLessThan(tolerance);
  
  // Check Y coordinate is within tolerance
  expect(Math.abs(position.y - expectedY)).toBeLessThan(tolerance);
}
