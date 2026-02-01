import { test, expect } from '@playwright/test';
import { 
  dragElement, 
  getElementPosition, 
  verifyElementMoved 
} from '../../helpers/drag-helpers';
import { 
  drawPrimitive, 
  getLastElementUUID 
} from '../../helpers/tool-helpers';
import { 
  waitForEditorReady, 
  initializeNewDocument,
  selectElementById
} from '../../helpers/svg-helpers';

test.describe('Drag Helpers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
    await initializeNewDocument(page);
  });

  test('should drag element by ID', async ({ page }) => {
    // Manually create an element with a known ID for testing
    await page.evaluate(() => {
      const doc = (window as any).documentState.svgDocument.get();
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-drag-rect');
      rect.setAttribute('data-uuid', 'test-uuid-1'); // Add data-uuid
      rect.setAttribute('x', '100');
      rect.setAttribute('y', '100');
      rect.setAttribute('width', '50');
      rect.setAttribute('height', '50');
      rect.setAttribute('fill', 'blue');
      doc.appendChild(rect);
      
      // Update state
      (window as any).documentStateUpdater.setDocument(
        doc,
        (window as any).documentState.hierarchyTree.get(),
        (window as any).svgSerializer.serialize(doc, { keepUUID: true }) // Keep UUID
      );
    });

    // Wait for render
    await page.waitForTimeout(1000);

    const element = page.locator('svg-canvas').locator('svg.svg-content [id="test-drag-rect"]');
    await expect(element).toBeVisible();

    const initialPos = await getElementPosition(page, 'test-drag-rect');
    expect(initialPos).toEqual({ x: 100, y: 100 });

    // Drag by 50, 50
    await dragElement(page, 'test-drag-rect', 50, 50);

    // Verify position
    await verifyElementMoved(page, 'test-drag-rect', 150, 150);
  });

  test('should drag element by UUID', async ({ page }) => {
    // Draw a rectangle using tool
    await drawPrimitive(page, 'rectangle', 200, 200, 300, 300);
    
    // Wait for creation
    await page.waitForTimeout(500);

    // Get its UUID
    const uuid = await getLastElementUUID(page, 'rect');
    expect(uuid).toBeTruthy();

    if (!uuid) throw new Error('UUID not found');

    // Manually select it first to ensure it's ready (though drag should handle it)
    // We need to find the ID to select it via helper
    const id = await page.evaluate((uid) => {
        const doc = (window as any).documentState.svgDocument.get();
        const el = doc.querySelector(`[data-uuid="${uid}"]`);
        return el ? el.id : null;
    }, uuid);
    
    if (id) {
        await selectElementById(page, id);
    }

    // Get initial position
    const initialPos = await getElementPosition(page, uuid);
    expect(Math.abs(initialPos.x - 200)).toBeLessThan(1);
    expect(Math.abs(initialPos.y - 200)).toBeLessThan(1);

    // Drag by 50, 50
    await dragElement(page, uuid, 50, 50);

    // Verify position
    await verifyElementMoved(page, uuid, 250, 250);
  });
});
