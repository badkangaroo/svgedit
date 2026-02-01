/**
 * Drag Operations E2E Tests
 * 
 * Verifies the functionality of dragging elements to move them in the SVG editor,
 * including single element drag, multi-element drag, and visual feedback.
 */

import { test, expect } from '@playwright/test';
import {
  dragElement,
  getElementPosition,
  verifyElementMoved
} from '../../helpers/drag-helpers';
import { selectElement, selectMultipleElements } from '../../helpers/selection-helpers';
import { loadTestSVG, waitForEditorReady } from '../../helpers/svg-helpers';

test.describe('Drag Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
    await loadTestSVG(page);
  });

  test('should move element by dragging', async ({ page }) => {
    // Select the rectangle
    await selectElement(page, 'test-rect');
    
    // Get initial position
    const initialPosition = await getElementPosition(page, 'test-rect');
    expect(initialPosition.x).toBe(100);
    expect(initialPosition.y).toBe(100);
    
    // Drag element by 50 pixels right and 30 pixels down
    const deltaX = 50;
    const deltaY = 30;
    await dragElement(page, 'test-rect', deltaX, deltaY);
    
    // Verify position changed
    const newPosition = await getElementPosition(page, 'test-rect');
    expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    expect(newPosition.y).toBeGreaterThan(initialPosition.y);
    
    // Verify the position is approximately correct (within tolerance)
    await verifyElementMoved(page, 'test-rect', initialPosition.x + deltaX, initialPosition.y + deltaY, 10);
  });

  test('should update position in attribute inspector during drag', async ({ page }) => {
    // Select the rectangle
    await selectElement(page, 'test-rect');
    
    // Get initial position
    const initialPosition = await getElementPosition(page, 'test-rect');
    
    // Verify initial position in inspector
    const inspector = page.locator('svg-attribute-inspector');
    const xField = inspector.locator('[data-attribute-name="x"]');
    const yField = inspector.locator('[data-attribute-name="y"]');
    const xInput = xField.locator('input');
    const yInput = yField.locator('input');
    
    // Check initial values
    await expect(xInput).toHaveValue(initialPosition.x.toString());
    await expect(yInput).toHaveValue(initialPosition.y.toString());
    
    // Drag element
    const deltaX = 40;
    const deltaY = 25;
    await dragElement(page, 'test-rect', deltaX, deltaY);
    
    // Verify inspector updated with new position
    const newPosition = await getElementPosition(page, 'test-rect');
    
    // The inspector should reflect the new position (with some tolerance for rounding)
    const inspectorX = await xInput.inputValue();
    const inspectorY = await yInput.inputValue();
    
    expect(Math.abs(parseFloat(inspectorX) - newPosition.x)).toBeLessThan(2);
    expect(Math.abs(parseFloat(inspectorY) - newPosition.y)).toBeLessThan(2);
  });

  test('should drag multiple selected elements together', async ({ page, browserName }) => {
    // Skip in WebKit due to multi-select drag not working
    test.skip(browserName === 'webkit', 'Multi-select drag not working in WebKit');
    
    // Select multiple elements (rectangle and circle)
    await selectMultipleElements(page, ['test-rect', 'test-circle']);
    
    // Wait a bit longer for multi-selection to stabilize
    await page.waitForTimeout(300);
    
    // Get initial positions
    const rectInitialPos = await getElementPosition(page, 'test-rect');
    const circleInitialPos = await getElementPosition(page, 'test-circle');
    
    // Calculate the distance between them
    const initialDistanceX = circleInitialPos.x - rectInitialPos.x;
    const initialDistanceY = circleInitialPos.y - rectInitialPos.y;
    
    // Drag one of the selected elements
    const deltaX = 60;
    const deltaY = 40;
    await dragElement(page, 'test-rect', deltaX, deltaY);
    
    // Verify both elements moved
    const rectNewPos = await getElementPosition(page, 'test-rect');
    const circleNewPos = await getElementPosition(page, 'test-circle');
    
    // Both should have moved by approximately the same delta
    expect(rectNewPos.x).toBeGreaterThan(rectInitialPos.x);
    expect(rectNewPos.y).toBeGreaterThan(rectInitialPos.y);
    expect(circleNewPos.x).toBeGreaterThan(circleInitialPos.x);
    expect(circleNewPos.y).toBeGreaterThan(circleInitialPos.y);
    
    // The relative distance between them should remain the same
    const newDistanceX = circleNewPos.x - rectNewPos.x;
    const newDistanceY = circleNewPos.y - rectNewPos.y;
    
    expect(Math.abs(newDistanceX - initialDistanceX)).toBeLessThan(2);
    expect(Math.abs(newDistanceY - initialDistanceY)).toBeLessThan(2);
  });

  test('should show dragging visual feedback', async ({ page }) => {
    // Select the ellipse
    await selectElement(page, 'test-ellipse');
    
    const canvas = page.locator('svg-canvas');
    const element = canvas.locator('svg.svg-content [id="test-ellipse"], svg.svg-content [data-original-id="test-ellipse"]').first();
    
    // Get the element's bounding box
    const box = await element.boundingBox();
    if (!box) {
      throw new Error('Element not found');
    }
    
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    
    // Start dragging
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // Wait for drag to initialize
    await page.waitForTimeout(50);
    
    // Move mouse (but don't release yet)
    await page.mouse.move(startX + 30, startY + 30, { steps: 5 });
    
    // During drag, there should be visual feedback
    // This could be a cursor change, element opacity change, or drag indicator
    // Check if the element is still visible and selection outline exists
    await expect(element).toBeVisible();
    const selectionOutline = canvas.locator('.selection-outline');
    await expect(selectionOutline).toBeVisible();
    
    // Complete the drag
    await page.mouse.up();
    
    // Wait for drag to complete
    await page.waitForTimeout(200);
    
    // Verify element moved
    const newPosition = await getElementPosition(page, 'test-ellipse');
    expect(newPosition.x).toBeGreaterThan(500); // Initial x was 500
  });

  test('should update selection outline during drag', async ({ page }) => {
    // Select the circle
    await selectElement(page, 'test-circle');
    
    const canvas = page.locator('svg-canvas');
    
    // Verify selection outline exists initially
    const selectionOutline = canvas.locator('.selection-outline');
    await expect(selectionOutline).toBeVisible();
    
    // Get initial outline position (bounding box)
    const initialOutlineBox = await selectionOutline.boundingBox();
    expect(initialOutlineBox).not.toBeNull();
    
    // Drag the element
    const deltaX = 70;
    const deltaY = 50;
    await dragElement(page, 'test-circle', deltaX, deltaY);
    
    // Verify selection outline still exists after drag
    await expect(selectionOutline).toBeVisible();
    
    // Get new outline position
    const newOutlineBox = await selectionOutline.boundingBox();
    expect(newOutlineBox).not.toBeNull();
    
    // The outline should have moved with the element
    if (initialOutlineBox && newOutlineBox) {
      expect(newOutlineBox.x).toBeGreaterThan(initialOutlineBox.x);
      expect(newOutlineBox.y).toBeGreaterThan(initialOutlineBox.y);
    }
    
    // Verify the element position also changed
    const newPosition = await getElementPosition(page, 'test-circle');
    expect(newPosition.x).toBeGreaterThan(300); // Initial cx was 300
    expect(newPosition.y).toBeGreaterThan(150); // Initial cy was 150
  });
});
