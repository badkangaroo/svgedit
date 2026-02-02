/**
 * File Operations E2E Tests
 * 
 * Verifies file menu interactions, document creation, and save operations.
 */

import { test, expect } from '@playwright/test';
import { loadTestSVG, waitForEditorReady, getRawSVGText } from '../../helpers/svg-helpers';
import { generateTestSVG } from '../../helpers/test-data-generators';

test.describe('File Operations - Menu Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
  });

  test('should open file menu on click', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    
    // Locate the file menu button
    const fileMenu = app.locator('#file-menu');
    await expect(fileMenu).toBeVisible();
    
    // Click to open the dropdown
    await fileMenu.click();
    
    // Wait for dropdown to appear
    await page.waitForTimeout(100);
    
    // Verify dropdown is visible
    const dropdown = app.locator('#file-menu-dropdown');
    await expect(dropdown).toHaveClass(/show/);
  });

  test('should close file menu on outside click', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    
    // Open the file menu
    const fileMenu = app.locator('#file-menu');
    await fileMenu.click();
    
    // Verify dropdown is open
    const dropdown = app.locator('#file-menu-dropdown');
    await expect(dropdown).toHaveClass(/show/);
    
    // Click outside the menu (on the canvas area)
    const canvas = page.locator('svg-canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Wait for the click to be processed
    await page.waitForTimeout(100);
    
    // Verify dropdown is closed
    await expect(dropdown).not.toHaveClass(/show/);
  });

  test('should show all menu items (New, Open, Save, Save As)', async ({ page }) => {
    const app = page.locator('svg-editor-app');
    
    // Open the file menu
    const fileMenu = app.locator('#file-menu');
    await fileMenu.click();
    
    // Verify all menu items are visible
    const fileNew = app.locator('#file-new');
    await expect(fileNew).toBeVisible();
    await expect(fileNew).toContainText('New');
    await expect(fileNew).toContainText('Ctrl+N');
    
    const fileOpen = app.locator('#file-open');
    await expect(fileOpen).toBeVisible();
    await expect(fileOpen).toContainText('Open');
    await expect(fileOpen).toContainText('Ctrl+O');
    
    const fileSave = app.locator('#file-save');
    await expect(fileSave).toBeVisible();
    await expect(fileSave).toContainText('Save');
    await expect(fileSave).toContainText('Ctrl+S');
    
    const fileSaveAs = app.locator('#file-save-as');
    await expect(fileSaveAs).toBeVisible();
    await expect(fileSaveAs).toContainText('Save As');
    await expect(fileSaveAs).toContainText('Ctrl+Shift+S');
  });
});

test.describe('File Operations - Document Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
  });

  test('should create new document from menu', async ({ page }) => {
    // Load a test SVG first
    await loadTestSVG(page);
    
    // Verify SVG is loaded (canvas has content)
    const canvas = page.locator('svg-canvas');
    const svgElements = canvas.locator('svg rect, svg circle, svg ellipse');
    const initialCount = await svgElements.count();
    expect(initialCount).toBeGreaterThan(0);
    
    const app = page.locator('svg-editor-app');
    
    // Open file menu
    const fileMenu = app.locator('#file-menu');
    await fileMenu.click();
    
    // Click New
    const fileNew = app.locator('#file-new');
    await fileNew.click();
    
    // Wait for the new document to be created
    await page.waitForTimeout(300);
    
    // Verify canvas is empty or has been reset
    const newCount = await svgElements.count();
    expect(newCount).toBe(0);
    
    // Verify the raw SVG contains a blank document
    const rawSVG = await getRawSVGText(page);
    expect(rawSVG).toContain('<svg');
    expect(rawSVG).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(rawSVG).toContain('</svg>');
  });
});

test.describe('File Operations - Save Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
  });

  test('should save document and download file', async ({ page }) => {
    // Load a test SVG
    await loadTestSVG(page);
    
    const app = page.locator('svg-editor-app');
    
    // Open file menu
    const fileMenu = app.locator('#file-menu');
    await fileMenu.click();
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 3000 });
    
    // Click Save
    const fileSave = app.locator('#file-save');
    await fileSave.click();
    
    // Verify download occurred
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
    
    // Verify the downloaded content is valid SVG
    const path = await download.path();
    if (path) {
      const fs = await import('node:fs');
      const content = fs.readFileSync(path, 'utf-8');
      expect(content).toContain('<svg');
      expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(content).toContain('</svg>');
    }
  });

  test('should save edited document with changes', async ({ page }) => {
    // Load a test SVG
    await loadTestSVG(page);
    
    // Make an edit - change the fill color of the test rectangle
    await page.evaluate(() => {
      const { documentState } = (window as any);
      const doc = documentState.svgDocument.get();
      
      // Find the test-rect element and change its fill
      const rect = doc.getElementById('test-rect');
      if (rect) {
        rect.setAttribute('fill', 'purple');
        
        // Trigger update
        const { documentStateUpdater } = (window as any);
        const { SVGSerializer } = (window as any);
        if (documentStateUpdater && SVGSerializer) {
          const serializer = new SVGSerializer();
          const newRawSVG = serializer.serialize(doc);
          documentStateUpdater.updateRawSVG(newRawSVG);
        }
      }
    });
    
    // Wait for the change to propagate
    await page.waitForTimeout(200);
    
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
    
    // Verify the downloaded content contains the edit
    const path = await download.path();
    if (path) {
      const fs = await import('node:fs');
      const content = fs.readFileSync(path, 'utf-8');
      expect(content).toContain('fill="purple"');
    }
  });

  test('should verify downloaded file contains correct SVG', async ({ page }) => {
    // Load a test SVG with known content
    const testSVG = generateTestSVG();
    await page.evaluate((svg) => {
      const { documentStateUpdater, SVGParser } = (window as any);
      if (documentStateUpdater && SVGParser) {
        const parser = new SVGParser();
        const result = parser.parse(svg);
        if (result.success && result.document) {
          documentStateUpdater.setDocument(result.document, result.tree, svg);
        }
      }
    }, testSVG);
    
    // Wait for the SVG to be loaded
    await page.waitForTimeout(200);
    
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
    
    // Verify the downloaded content matches expected elements
    const path = await download.path();
    if (path) {
      const fs = await import('node:fs');
      const content = fs.readFileSync(path, 'utf-8');
      
      // Verify it's valid SVG
      expect(content).toContain('<svg');
      expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(content).toContain('</svg>');
      
      // Verify it contains the expected elements from our test SVG
      expect(content).toContain('id="test-rect"');
      expect(content).toContain('id="test-circle"');
      expect(content).toContain('id="test-ellipse"');
      expect(content).toContain('id="test-line"');
      expect(content).toContain('id="test-group"');
    }
  });
});
