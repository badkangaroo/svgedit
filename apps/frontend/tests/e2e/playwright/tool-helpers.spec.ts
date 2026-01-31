/**
 * Integration Tests for Tool Helper Functions
 * 
 * These tests verify the tool helper functions work correctly
 * with the SVG editor's tool palette and primitive creation system.
 */

import { test, expect } from '@playwright/test';
import {
  selectTool,
  drawPrimitive,
  verifyPrimitiveCreated,
  getActiveTool,
  verifyToolActive,
  getElementCount
} from '../../helpers/tool-helpers';
import { waitForEditorReady } from '../../helpers/svg-helpers';

test.describe('Tool Helpers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
  });

  test.describe('selectTool', () => {
    test('should select rectangle tool', async ({ page }) => {
      await selectTool(page, 'rectangle');
      
      // Verify tool is active
      const activeTool = await getActiveTool(page);
      expect(activeTool).toBe('rectangle');
    });

    test('should select circle tool', async ({ page }) => {
      await selectTool(page, 'circle');
      
      const activeTool = await getActiveTool(page);
      expect(activeTool).toBe('circle');
    });

    test('should select ellipse tool', async ({ page }) => {
      await selectTool(page, 'ellipse');
      
      const activeTool = await getActiveTool(page);
      expect(activeTool).toBe('ellipse');
    });

    test('should select line tool', async ({ page }) => {
      await selectTool(page, 'line');
      
      const activeTool = await getActiveTool(page);
      expect(activeTool).toBe('line');
    });

    test('should select path tool', async ({ page }) => {
      await selectTool(page, 'path');
      
      const activeTool = await getActiveTool(page);
      expect(activeTool).toBe('path');
    });

    test('should switch between tools', async ({ page }) => {
      // Select rectangle tool
      await selectTool(page, 'rectangle');
      expect(await getActiveTool(page)).toBe('rectangle');
      
      // Switch to circle tool
      await selectTool(page, 'circle');
      expect(await getActiveTool(page)).toBe('circle');
      
      // Switch back to select tool
      await selectTool(page, 'select');
      expect(await getActiveTool(page)).toBe('select');
    });
  });

  test.describe('getActiveTool', () => {
    test('should return select tool by default', async ({ page }) => {
      const activeTool = await getActiveTool(page);
      expect(activeTool).toBe('select');
    });

    test('should return correct tool after selection', async ({ page }) => {
      await selectTool(page, 'rectangle');
      const activeTool = await getActiveTool(page);
      expect(activeTool).toBe('rectangle');
    });
  });

  test.describe('verifyToolActive', () => {
    test('should verify select tool is active by default', async ({ page }) => {
      await verifyToolActive(page, 'select');
    });

    test('should verify tool is active after selection', async ({ page }) => {
      await selectTool(page, 'circle');
      await verifyToolActive(page, 'circle');
    });
  });

  test.describe('drawPrimitive', () => {
    test('should draw a rectangle', async ({ page }) => {
      const initialCount = await getElementCount(page, 'rect');
      
      await drawPrimitive(page, 'rectangle', 100, 100, 200, 200);
      
      const finalCount = await getElementCount(page, 'rect');
      expect(finalCount).toBe(initialCount + 1);
    });

    test('should draw a circle', async ({ page }) => {
      const initialCount = await getElementCount(page, 'circle');
      
      await drawPrimitive(page, 'circle', 150, 150, 250, 250);
      
      const finalCount = await getElementCount(page, 'circle');
      expect(finalCount).toBe(initialCount + 1);
    });

    test('should draw an ellipse', async ({ page }) => {
      const initialCount = await getElementCount(page, 'ellipse');
      
      await drawPrimitive(page, 'ellipse', 200, 100, 350, 200);
      
      const finalCount = await getElementCount(page, 'ellipse');
      expect(finalCount).toBe(initialCount + 1);
    });

    test('should draw a line', async ({ page }) => {
      const initialCount = await getElementCount(page, 'line');
      
      await drawPrimitive(page, 'line', 50, 50, 300, 300);
      
      const finalCount = await getElementCount(page, 'line');
      expect(finalCount).toBe(initialCount + 1);
    });

    test('should draw multiple primitives', async ({ page }) => {
      // Draw first rectangle
      await drawPrimitive(page, 'rectangle', 50, 50, 100, 100);
      
      // Draw second rectangle
      await drawPrimitive(page, 'rectangle', 150, 150, 200, 200);
      
      // Verify both were created
      const rectCount = await getElementCount(page, 'rect');
      expect(rectCount).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('verifyPrimitiveCreated', () => {
    test('should verify rectangle was created', async ({ page }) => {
      await drawPrimitive(page, 'rectangle', 100, 100, 200, 200);
      await verifyPrimitiveCreated(page, 'rect');
    });

    test('should verify circle was created', async ({ page }) => {
      await drawPrimitive(page, 'circle', 150, 150, 250, 250);
      await verifyPrimitiveCreated(page, 'circle');
    });

    test('should verify ellipse was created', async ({ page }) => {
      await drawPrimitive(page, 'ellipse', 200, 100, 350, 200);
      await verifyPrimitiveCreated(page, 'ellipse');
    });

    test('should verify line was created', async ({ page }) => {
      await drawPrimitive(page, 'line', 50, 50, 300, 300);
      await verifyPrimitiveCreated(page, 'line');
    });
  });

  test.describe('getElementCount', () => {
    test('should return 0 for empty canvas', async ({ page }) => {
      const rectCount = await getElementCount(page, 'rect');
      expect(rectCount).toBe(0);
    });

    test('should count elements correctly', async ({ page }) => {
      // Draw two rectangles
      await drawPrimitive(page, 'rectangle', 50, 50, 100, 100);
      await drawPrimitive(page, 'rectangle', 150, 150, 200, 200);
      
      const rectCount = await getElementCount(page, 'rect');
      expect(rectCount).toBe(2);
    });

    test('should count different element types separately', async ({ page }) => {
      // Draw a rectangle and a circle
      await drawPrimitive(page, 'rectangle', 50, 50, 100, 100);
      await drawPrimitive(page, 'circle', 150, 150, 250, 250);
      
      const rectCount = await getElementCount(page, 'rect');
      const circleCount = await getElementCount(page, 'circle');
      
      expect(rectCount).toBe(1);
      expect(circleCount).toBe(1);
    });
  });

  test.describe('Integration Tests', () => {
    test('should create primitive and verify it appears in hierarchy', async ({ page }) => {
      // Draw a rectangle
      await drawPrimitive(page, 'rectangle', 100, 100, 200, 200);
      
      // Verify it was created
      await verifyPrimitiveCreated(page, 'rect');
      
      // Verify it appears in hierarchy panel
      const hierarchy = page.locator('svg-hierarchy-panel');
      const rectNode = hierarchy.getByText('rect', { exact: false });
      await expect(rectNode.first()).toBeVisible();
    });

    test('should auto-select newly created element', async ({ page }) => {
      // Draw a circle
      await drawPrimitive(page, 'circle', 150, 150, 250, 250);
      
      // Verify the circle is selected (selection outline should be visible)
      const canvas = page.locator('svg-canvas');
      const selectionOutline = canvas.locator('.selection-outline');
      await expect(selectionOutline).toBeVisible();
    });

    test('should update raw SVG panel after creation', async ({ page }) => {
      // Draw an ellipse
      await drawPrimitive(page, 'ellipse', 200, 100, 350, 200);
      
      // Verify raw SVG panel contains the ellipse
      const rawPanel = page.locator('svg-raw-panel');
      const rawContent = await rawPanel.textContent();
      expect(rawContent).toContain('ellipse');
    });
  });
});
