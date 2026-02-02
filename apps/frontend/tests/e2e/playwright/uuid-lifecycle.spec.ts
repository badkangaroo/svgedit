/**
 * UUID Lifecycle E2E Tests
 * 
 * Verifies that data-uuid attributes are correctly handled throughout the editor lifecycle:
 * - Assigned by parser on load
 * - Preserved in-memory during editing
 * - Stripped on save/export (clean SVG output)
 */

import { test, expect } from '@playwright/test';
import { loadTestSVG, waitForEditorReady } from '../../helpers/svg-helpers';

test.describe('UUID Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
  });

  test('should assign data-uuid to elements on load', async ({ page }) => {
    // Load a test SVG
    await loadTestSVG(page);
    
    // Verify elements have data-uuid in the DOM
    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator('svg [id="test-rect"]').first();
    
    // Check if data-uuid attribute exists
    const uuid = await rect.getAttribute('data-uuid');
    expect(uuid).toBeTruthy();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test('should preserve data-uuid during editing', async ({ page }) => {
    // Load a test SVG
    await loadTestSVG(page);
    
    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator('svg [id="test-rect"]').first();
    
    // Get the initial UUID
    const initialUuid = await rect.getAttribute('data-uuid');
    expect(initialUuid).toBeTruthy();
    
    // Make an edit to the element
    await page.evaluate(() => {
      const { documentState } = (window as any);
      const doc = documentState.svgDocument.get();
      const rect = doc.getElementById('test-rect');
      if (rect) {
        rect.setAttribute('fill', 'blue');
        
        // Trigger update
        const { documentStateUpdater, SVGSerializer } = (window as any);
        if (documentStateUpdater && SVGSerializer) {
          const serializer = new SVGSerializer();
          // Use keepUUID: true for internal updates
          const newRawSVG = serializer.serialize(doc, { keepUUID: true });
          documentStateUpdater.updateRawSVG(newRawSVG);
        }
      }
    });
    
    // Wait for the change to propagate
    await page.waitForTimeout(200);
    
    // Verify UUID is still the same
    const newUuid = await rect.getAttribute('data-uuid');
    expect(newUuid).toBe(initialUuid);
  });

  test('should strip data-uuid on save/export', async ({ page }) => {
    // Load a test SVG
    await loadTestSVG(page);
    
    // Verify elements have data-uuid in the DOM
    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator('svg [id="test-rect"]').first();
    const uuid = await rect.getAttribute('data-uuid');
    expect(uuid).toBeTruthy();
    
    const app = page.locator('svg-editor-app');
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 3000 });
    
    // Open file menu and save
    const fileMenu = app.locator('#file-menu');
    await fileMenu.click();
    
    const fileSave = app.locator('#file-save');
    await fileSave.click();
    
    // Verify download occurred
    const download = await downloadPromise;
    
    // Verify the downloaded content does NOT contain data-uuid
    const path = await download.path();
    if (path) {
      const fs = await import('node:fs');
      const content = fs.readFileSync(path, 'utf-8');
      
      // Verify it's valid SVG
      expect(content).toContain('<svg');
      expect(content).toContain('</svg>');
      
      // Verify data-uuid is NOT present (clean output)
      expect(content).not.toContain('data-uuid');
      
      // Verify the element is still there (by id)
      expect(content).toContain('id="test-rect"');
    }
  });

  test('should assign data-uuid to newly created elements', async ({ page }) => {
    // Start with a blank document
    await page.evaluate(() => {
      const { documentStateUpdater, SVGParser } = (window as any);
      if (documentStateUpdater && SVGParser) {
        const parser = new SVGParser();
        const blankSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"></svg>';
        const result = parser.parse(blankSVG);
        if (result.success && result.document) {
          documentStateUpdater.setDocument(result.document, result.tree, blankSVG);
        }
      }
    });
    
    await page.waitForTimeout(200);
    
    // Select rectangle tool
    const toolPalette = page.locator('svg-tool-palette');
    const rectTool = toolPalette.locator('[data-tool="rectangle"]');
    await rectTool.click();
    
    // Draw a rectangle
    const canvas = page.locator('svg-canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 200, canvasBox.y + 200);
    await page.mouse.up();
    
    // Wait for element creation
    await page.waitForTimeout(300);
    
    // Verify the newly created rectangle has a data-uuid
    const newRect = canvas.locator('svg rect').last();
    const uuid = await newRect.getAttribute('data-uuid');
    expect(uuid).toBeTruthy();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
