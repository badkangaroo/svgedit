/**
 * Tool Palette E2E Tests
 * 
 * Verifies the functionality of the tool palette including tool activation,
 * primitive creation, preview during drag, auto-selection, and hierarchy updates.
 */

import { test, expect } from '@playwright/test';
import {
  selectTool,
  drawPrimitive,
  verifyPrimitiveCreated,
  getActiveTool,
  verifyToolActive,
  getElementCount,
  getElementCountWithUUID,
  getLastElementUUID
} from '../../helpers/tool-helpers';
import { waitForEditorReady, initializeNewDocument } from '../../helpers/svg-helpers';

test.describe('Tool Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
    await initializeNewDocument(page);
    
    // Wait a bit more for tool palette to fully initialize
    await page.waitForTimeout(500);
  });

  test('should activate tool on click', async ({ page }) => {
    // Select the rectangle tool
    await selectTool(page, 'rectangle');
    
    // Verify the tool is active
    await verifyToolActive(page, 'rectangle');
    
    // Select another tool (circle)
    await selectTool(page, 'circle');
    
    // Verify the new tool is active
    await verifyToolActive(page, 'circle');
    
    // Verify only one tool is active at a time
    const activeTool = await getActiveTool(page);
    expect(activeTool).toBe('circle');
  });

  test('should create rectangle with drag', async ({ page }) => {
    // Get initial rectangle count
    const initialCount = await getElementCount(page, 'rect');
    
    // Draw a rectangle
    await drawPrimitive(page, 'rectangle', 100, 100, 200, 200);
    
    // Verify rectangle was created
    await verifyPrimitiveCreated(page, 'rect');
    
    // Verify count increased by exactly 1
    const newCount = await getElementCount(page, 'rect');
    expect(newCount).toBe(initialCount + 1);
    
    // Get the UUID of the newly created rectangle
    const canvas = page.locator('svg-canvas');
    const newRect = canvas.locator('svg rect').last();
    
    // Check that the rectangle exists and has dimensions
    await expect(newRect).toBeVisible();
    const width = await newRect.getAttribute('width');
    const height = await newRect.getAttribute('height');
    const uuid = await newRect.getAttribute('data-uuid');
    
    // Width and height should be positive
    expect(parseFloat(width || '0')).toBeGreaterThan(0);
    expect(parseFloat(height || '0')).toBeGreaterThan(0);
    // Verify UUID was assigned
    expect(uuid).toBeTruthy();
  });

  test('should create circle with drag', async ({ page }) => {
    // Get initial circle count
    const initialCount = await getElementCount(page, 'circle');
    
    // Draw a circle
    await drawPrimitive(page, 'circle', 150, 150, 250, 250);
    
    // Verify circle was created
    await verifyPrimitiveCreated(page, 'circle');
    
    // Verify count increased
    const newCount = await getElementCount(page, 'circle');
    expect(newCount).toBe(initialCount + 1);
    
    // Verify the circle has expected attributes
    const canvas = page.locator('svg-canvas');
    const newCircle = canvas.locator('svg circle').last();
    
    // Check that the circle exists and has a radius
    await expect(newCircle).toBeVisible();
    const r = await newCircle.getAttribute('r');
    const uuid = await newCircle.getAttribute('data-uuid');
    
    // Radius should be positive
    expect(parseFloat(r || '0')).toBeGreaterThan(0);
    expect(uuid).toBeTruthy();
  });

  test('should create ellipse with drag', async ({ page }) => {
    // Get initial ellipse count
    const initialCount = await getElementCount(page, 'ellipse');
    
    // Draw an ellipse
    await drawPrimitive(page, 'ellipse', 100, 150, 250, 200);
    
    // Verify ellipse was created
    await verifyPrimitiveCreated(page, 'ellipse');
    
    // Verify count increased
    const newCount = await getElementCount(page, 'ellipse');
    expect(newCount).toBe(initialCount + 1);
    
    // Verify the ellipse has expected attributes
    const canvas = page.locator('svg-canvas');
    const newEllipse = canvas.locator('svg ellipse').last();
    
    // Check that the ellipse exists and has radii
    await expect(newEllipse).toBeVisible();
    const rx = await newEllipse.getAttribute('rx');
    const ry = await newEllipse.getAttribute('ry');
    
    // Radii should be positive
    expect(parseFloat(rx || '0')).toBeGreaterThan(0);
    expect(parseFloat(ry || '0')).toBeGreaterThan(0);
  });

  test('should create line with drag', async ({ page }) => {
    // Get initial line count
    const initialCount = await getElementCount(page, 'line');
    
    // Draw a line
    await drawPrimitive(page, 'line', 100, 100, 300, 200);
    
    // Verify line was created
    await verifyPrimitiveCreated(page, 'line');
    
    // Verify count increased
    const newCount = await getElementCount(page, 'line');
    expect(newCount).toBe(initialCount + 1);
    
    // Verify the line has expected attributes
    const canvas = page.locator('svg-canvas');
    const newLine = canvas.locator('svg line').last();
    
    // Check that the line exists and has coordinates
    await expect(newLine).toBeVisible();
    const x1 = await newLine.getAttribute('x1');
    const y1 = await newLine.getAttribute('y1');
    const x2 = await newLine.getAttribute('x2');
    const y2 = await newLine.getAttribute('y2');
    
    // All coordinates should be defined
    expect(x1).toBeTruthy();
    expect(y1).toBeTruthy();
    expect(x2).toBeTruthy();
    expect(y2).toBeTruthy();
    
    // Line should have length (x1,y1 should differ from x2,y2)
    const hasLength = (x1 !== x2) || (y1 !== y2);
    expect(hasLength).toBe(true);
  });

  test('should show preview during drag', async ({ page }) => {
    // Select rectangle tool
    await selectTool(page, 'rectangle');
    
    const canvas = page.locator('svg-canvas');
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('Canvas not found');
    }
    
    // Get initial element count
    const initialCount = await getElementCount(page, 'rect');
    
    // Start dragging
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // Move mouse to create preview - need significant movement
    await page.mouse.move(startX + 150, startY + 150, { steps: 10 });
    
    // Wait a moment for preview to appear
    await page.waitForTimeout(200);
    
    // Debug: Check what's in the SVG
    const debugInfo = await page.evaluate(() => {
      const canvas = document.querySelector('svg-canvas');
      if (!canvas || !canvas.shadowRoot) return { error: 'No canvas or shadowRoot' };
      
      const svg = canvas.shadowRoot.querySelector('svg.svg-content');
      if (!svg) return { error: 'No svg.svg-content' };
      
      const allRects = svg.querySelectorAll('rect');
      const rectsInfo = Array.from(allRects).map(r => ({
        opacity: r.getAttribute('opacity'),
        strokeDasharray: r.getAttribute('stroke-dasharray'),
        id: r.getAttribute('id'),
        x: r.getAttribute('x'),
        y: r.getAttribute('y')
      }));
      
      return { rectCount: allRects.length, rects: rectsInfo };
    });
    
    // Check for preview element with specific attributes
    // Preview should have opacity="0.5" and stroke-dasharray="4 4"
    const previewInfo = await page.evaluate(() => {
      const canvas = document.querySelector('svg-canvas');
      if (!canvas || !canvas.shadowRoot) return { exists: false, hasOpacity: false, hasDashArray: false };
      
      const svg = canvas.shadowRoot.querySelector('svg.svg-content');
      if (!svg) return { exists: false, hasOpacity: false, hasDashArray: false };
      
      // Look for elements with preview indicators (opacity="0.5" and stroke-dasharray)
      const previewElements = svg.querySelectorAll('[opacity="0.5"][stroke-dasharray]');
      
      if (previewElements.length === 0) {
        return { exists: false, hasOpacity: false, hasDashArray: false };
      }
      
      const preview = previewElements[0];
      return {
        exists: true,
        hasOpacity: preview.getAttribute('opacity') === '0.5',
        hasDashArray: preview.getAttribute('stroke-dasharray') === '4 4',
        tagName: preview.tagName.toLowerCase(),
        uuid: preview.getAttribute('data-uuid')
      };
    });
    
    // Verify preview exists with correct attributes
    expect(previewInfo.exists, `Preview not found. Debug info: ${JSON.stringify(debugInfo)}`).toBe(true);
    expect(previewInfo.hasOpacity).toBe(true);
    expect(previewInfo.hasDashArray).toBe(true);
    expect(previewInfo.tagName).toBe('rect');
    expect(previewInfo.uuid).toBeTruthy();
    
    // Complete the drag
    await page.mouse.up();
    
    // Wait for element to be finalized
    await page.waitForTimeout(200);
    
    // Verify preview is removed and permanent element is created
    const previewAfterDrag = await page.evaluate(() => {
      const canvas = document.querySelector('svg-canvas');
      if (!canvas || !canvas.shadowRoot) return true;
      
      const svg = canvas.shadowRoot.querySelector('svg.svg-content');
      if (!svg) return true;
      
      const previewElements = svg.querySelectorAll('[opacity="0.5"][stroke-dasharray]');
      return previewElements.length > 0;
    });
    
    expect(previewAfterDrag).toBe(false); // Preview should be removed
    
    // Verify permanent element was created
    const finalCount = await getElementCount(page, 'rect');
    expect(finalCount).toBe(initialCount + 1);
  });

  test('should auto-select newly created element', async ({ page }) => {
    // Draw a rectangle
    await drawPrimitive(page, 'rectangle', 100, 100, 200, 200);
    
    // Wait for element creation and selection to complete
    await page.waitForTimeout(1000);
    
    // Check if the element is in the selected elements list
    // This verifies that the auto-selection code was called
    const selectionState = await page.evaluate(() => {
      const { documentState } = (window as any);
      if (!documentState) return { hasState: false };
      
      const selected = documentState.selectedElements.get();
      const doc = documentState.svgDocument.get();
      
      return {
        hasState: true,
        selectedCount: selected?.length || 0,
        selectedIds: selected?.map((el: any) => el.id || el.getAttribute('id')) || [],
        allRectIds: doc ? Array.from(doc.querySelectorAll('rect')).map((r: any) => r.id) : [],
        documentHasElements: !!doc && doc.querySelectorAll('rect').length > 0
      };
    });
    
    // Verify that document state exists and has the created element
    expect(selectionState.hasState).toBe(true);
    expect(selectionState.documentHasElements).toBe(true);
    expect(selectionState.allRectIds?.length).toBeGreaterThan(0);
    
    // The key test: verify that an element is selected (auto-selection happened)
    expect(selectionState.selectedCount).toBeGreaterThan(0);
    
    // Verify the selected element is one of the rectangles
    const selectedId = selectionState.selectedIds[0];
    expect(selectionState.allRectIds).toContain(selectedId);
  });

  test('should update hierarchy panel after creation', async ({ page }) => {
    // Get initial hierarchy state
    const hierarchy = page.locator('svg-hierarchy-panel');
    
    // Count initial nodes (might be 0 or have some default structure)
    const initialNodeCount = await hierarchy.locator('.node-content, [data-node-id]').count();
    
    // Draw a circle
    await drawPrimitive(page, 'circle', 150, 150, 250, 250);
    
    // Wait for hierarchy to update
    await page.waitForTimeout(300);
    
    // Verify hierarchy has more nodes now
    const newNodeCount = await hierarchy.locator('.node-content, [data-node-id]').count();
    expect(newNodeCount).toBeGreaterThan(initialNodeCount);
    
    // Verify the new element appears in hierarchy
    // Look for 'circle' text in the hierarchy
    const circleNode = hierarchy.getByText('circle', { exact: false });
    await expect(circleNode.first()).toBeVisible();
    
    // Verify the new element is selected in hierarchy
    const selectedNode = hierarchy.locator('.node-content.selected, [data-node-id].selected');
    await expect(selectedNode.first()).toBeVisible();
  });
});
