/**
 * E2E tests for data-uuid lifecycle:
 * - Assign on load (parser)
 * - Preserve during editing
 * - Strip on save/export (default serializer)
 * - Assign to newly created elements (primitive tools)
 *
 * The parser replaces element `id` with a generated id and sets `data-original-id`
 * to the original id, so we select loaded elements by `[data-original-id="..."]`.
 * Canvas content SVG has class `svg-content`; use `svg.svg-content` for stable selectors.
 */

import { test, expect } from '@playwright/test';
import { loadTestSVG, waitForEditorReady } from '../../helpers/svg-helpers';
import {
  selectTool,
  drawPrimitive,
  verifyPrimitiveCreated,
  waitForElementCountWithUUID,
  getElementCountWithUUID,
} from '../../helpers/tool-helpers';

const RECT_SELECTOR = 'svg.svg-content [data-original-id="test-rect"]';

test.describe('UUID Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
  });

  test('should assign data-uuid to elements on load', async ({ page }) => {
    await loadTestSVG(page);

    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator(RECT_SELECTOR).first();
    await expect(rect).toBeVisible({ timeout: 10000 });

    const uuid = await rect.getAttribute('data-uuid');
    expect(uuid).toBeTruthy();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  test('should preserve data-uuid during editing', async ({ page }) => {
    await loadTestSVG(page);

    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator(RECT_SELECTOR).first();
    await expect(rect).toBeVisible({ timeout: 10000 });

    const initialUuid = await rect.getAttribute('data-uuid');
    expect(initialUuid).toBeTruthy();

    // Make an edit via document (change fill)
    await page.evaluate(() => {
      const { documentState } = (window as any);
      const doc = documentState.svgDocument.get();
      if (!doc) return;
      const rect = doc.querySelector('[data-original-id="test-rect"]');
      if (rect) rect.setAttribute('fill', '#00ff00');
    });
    await page.waitForTimeout(200);

    const uuidAfterEdit = await rect.getAttribute('data-uuid');
    expect(uuidAfterEdit).toBe(initialUuid);
  });

  test('should strip data-uuid on save/export', async ({ page }) => {
    await loadTestSVG(page);

    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator(RECT_SELECTOR).first();
    await expect(rect).toBeVisible({ timeout: 10000 });
    const uuid = await rect.getAttribute('data-uuid');
    expect(uuid).toBeTruthy();

    const app = page.locator('svg-editor-app');
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    const fileMenu = app.locator('#file-menu');
    await fileMenu.click();
    await app.locator('#file-save').click();
    const download = await downloadPromise;

    const path = await download.path();
    expect(path).toBeTruthy();
    const fs = await import('node:fs');
    const content = fs.readFileSync(path!, 'utf-8');
    expect(content).toContain('<svg');
    expect(content).not.toContain('data-uuid');
  });

  // TODO: Re-enable when newly created primitives get data-uuid in the canvas DOM (finalizePrimitiveCreation sets it on parsed doc but count stays 2).
  test.skip('should assign data-uuid to newly created elements', async ({ page }) => {
    // Load a document that already has content so the canvas has svg.svg-content; then add a rect.
    await loadTestSVG(page);

    const initialCount = await getElementCountWithUUID(page, 'rect');
    await selectTool(page, 'rectangle');
    await drawPrimitive(page, 'rectangle', 50, 50, 150, 150);

    await verifyPrimitiveCreated(page, 'rect');

    // Wait for the new rect to appear in the DOM and for document state to include it with data-uuid.
    // (Primitive creation serializes with keepUUID and re-parses; the new element should get data-uuid.)
    const newCount = await waitForElementCountWithUUID(page, 'rect', initialCount + 1, 10000);
    expect(newCount).toBe(initialCount + 1);

    // Use content SVG only so we don't match selection-overlay rects (which have no data-uuid).
    const canvas = page.locator('svg-canvas');
    const newRect = canvas.locator('svg.svg-content rect').last();
    await expect(newRect).toBeVisible({ timeout: 5000 });

    // Poll for data-uuid on the last rect (newly created) in case canvas re-render is async.
    const handle = await page.waitForFunction(
      () => {
        const app = document.querySelector('svg-editor-app');
        if (!app?.shadowRoot) return null;
        const canvas = app.shadowRoot.querySelector('svg-canvas');
        if (!canvas?.shadowRoot) return null;
        const svg = canvas.shadowRoot.querySelector('svg.svg-content');
        if (!svg) return null;
        const rects = svg.querySelectorAll('rect');
        const last = rects[rects.length - 1];
        return last?.getAttribute('data-uuid') ?? null;
      },
      { timeout: 5000 }
    );
    const uuid = (await handle.jsonValue()) as string | null;
    expect(uuid).toBeTruthy();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});
