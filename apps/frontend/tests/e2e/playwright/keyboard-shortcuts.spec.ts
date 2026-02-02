/**
 * Keyboard Shortcuts E2E Tests
 * 
 * Verifies keyboard shortcuts for file operations and tool selection.
 */

import { test, expect } from '@playwright/test';
import { loadTestSVG, waitForEditorReady } from '../../helpers/svg-helpers';

test.describe('Keyboard Shortcuts - File Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
  });

  test('should create new document with Ctrl+N', async ({ page }) => {
    // Load a test SVG first
    await loadTestSVG(page);
    
    // Verify SVG is loaded (canvas has content)
    const canvas = page.locator('svg-canvas');
    const svgElements = canvas.locator('svg rect, svg circle, svg ellipse');
    const initialCount = await svgElements.count();
    expect(initialCount).toBeGreaterThan(0);
    
    // Trigger new document with Ctrl+N
    await page.keyboard.press('Control+n');
    
    // Wait for the new document event to be processed
    await page.waitForTimeout(200);
    
    // Verify canvas is empty or has been reset
    // The new document should have no elements or just an empty SVG
    const newCount = await svgElements.count();
    expect(newCount).toBe(0);
  });

  test('should trigger open dialog with Ctrl+O', async ({ page }) => {
    // Note: Ctrl+O typically triggers a file input dialog
    // In a real browser, this would open a file picker
    // We can't fully test file picker in Playwright, but we can verify the event is triggered
    
    // Listen for the file input to be triggered
    const fileInputPromise = page.waitForEvent('filechooser', { timeout: 2000 });
    
    // Trigger open with Ctrl+O
    await page.keyboard.press('Control+o');
    
    // Verify file chooser was triggered
    const fileChooser = await fileInputPromise;
    expect(fileChooser).toBeTruthy();
  });

  test('should save document with Ctrl+S', async ({ page }) => {
    // Load a test SVG
    await loadTestSVG(page);
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 3000 });
    
    // Trigger save with Ctrl+S
    await page.keyboard.press('Control+s');
    
    // Verify download occurred
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
    
    // Verify the downloaded content is valid SVG
    const path = await download.path();
    if (path) {
      const fs = await import('node:fs');
      const content = fs.readFileSync(path, 'utf-8');
      expect(content).toContain('<svg');
      expect(content).toContain('</svg>');
    }
  });

  test('should save as with Ctrl+Shift+S', async ({ page }) => {
    // Load a test SVG
    await loadTestSVG(page);
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 3000 });
    
    // Trigger save as with Ctrl+Shift+S
    await page.keyboard.press('Control+Shift+s');
    
    // Verify download occurred
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
  });
});

test.describe('Keyboard Shortcuts - Tool Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
  });

  test('should switch to select tool with \'V\' key', async ({ page }) => {
    // First activate a different tool (rectangle)
    const toolPalette = page.locator('svg-tool-palette');
    const rectTool = toolPalette.locator('[data-tool="rectangle"]');
    await rectTool.click();
    
    // Verify rectangle tool is active
    await expect(rectTool).toHaveClass(/active/);
    
    // Press 'V' to switch to select tool
    await page.keyboard.press('v');
    
    // Wait for tool change
    await page.waitForTimeout(100);
    
    // Verify select tool is now active
    const selectTool = toolPalette.locator('[data-tool="select"]');
    await expect(selectTool).toHaveClass(/active/);
  });

  test('should switch to rectangle tool with \'R\' key', async ({ page }) => {
    // Verify select tool is initially active
    const toolPalette = page.locator('svg-tool-palette');
    const selectTool = toolPalette.locator('[data-tool="select"]');
    await expect(selectTool).toHaveClass(/active/);
    
    // Press 'R' to switch to rectangle tool
    await page.keyboard.press('r');
    
    // Wait for tool change
    await page.waitForTimeout(100);
    
    // Verify rectangle tool is now active
    const rectTool = toolPalette.locator('[data-tool="rectangle"]');
    await expect(rectTool).toHaveClass(/active/);
  });

  test('should switch to circle tool with \'C\' key', async ({ page }) => {
    // Verify select tool is initially active
    const toolPalette = page.locator('svg-tool-palette');
    const selectTool = toolPalette.locator('[data-tool="select"]');
    await expect(selectTool).toHaveClass(/active/);
    
    // Press 'C' to switch to circle tool
    await page.keyboard.press('c');
    
    // Wait for tool change
    await page.waitForTimeout(100);
    
    // Verify circle tool is now active
    const circleTool = toolPalette.locator('[data-tool="circle"]');
    await expect(circleTool).toHaveClass(/active/);
  });

  test('should switch to ellipse tool with \'E\' key', async ({ page }) => {
    // Verify select tool is initially active
    const toolPalette = page.locator('svg-tool-palette');
    const selectTool = toolPalette.locator('[data-tool="select"]');
    await expect(selectTool).toHaveClass(/active/);
    
    // Press 'E' to switch to ellipse tool
    await page.keyboard.press('e');
    
    // Wait for tool change
    await page.waitForTimeout(100);
    
    // Verify ellipse tool is now active
    const ellipseTool = toolPalette.locator('[data-tool="ellipse"]');
    await expect(ellipseTool).toHaveClass(/active/);
  });

  test('should switch to line tool with \'L\' key', async ({ page }) => {
    // Verify select tool is initially active
    const toolPalette = page.locator('svg-tool-palette');
    const selectTool = toolPalette.locator('[data-tool="select"]');
    await expect(selectTool).toHaveClass(/active/);
    
    // Press 'L' to switch to line tool
    await page.keyboard.press('l');
    
    // Wait for tool change
    await page.waitForTimeout(100);
    
    // Verify line tool is now active
    const lineTool = toolPalette.locator('[data-tool="line"]');
    await expect(lineTool).toHaveClass(/active/);
  });
});
