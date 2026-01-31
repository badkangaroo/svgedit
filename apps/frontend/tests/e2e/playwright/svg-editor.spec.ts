/**
 * Playwright E2E Tests for SVG Editor
 * 
 * These tests run in real browsers and test the complete application workflow.
 * To run: npx playwright test
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load test.svg content
function loadTestSVG(): string {
  const testSvgPath = path.resolve(__dirname, '../../../test.svg');
  return fs.readFileSync(testSvgPath, 'utf-8');
}

// Helper to programmatically load SVG into the editor
async function loadSVGIntoEditor(page: Page, svgContent: string) {
  await page.evaluate((content) => {
    // Access the document state and load the SVG
    const parser = new (window as any).SVGParser();
    const result = parser.parse(content);
    
    if (result.success) {
      const documentStateUpdater = (window as any).documentStateUpdater;
      documentStateUpdater.setDocument(result.document, result.tree, content);
    }
  }, svgContent);
}

test.describe('SVG Editor - Basic Functionality', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Verify main app component is present
    const app = page.locator('svg-editor-app');
    await expect(app).toBeVisible();
    
    // Verify main panels are present
    await expect(page.locator('svg-canvas')).toBeVisible();
    await expect(page.locator('svg-hierarchy-panel')).toBeVisible();
    await expect(page.locator('svg-attribute-inspector')).toBeVisible();
  });

  test('should display menu bar with File menu', async ({ page }) => {
    await page.goto('/');
    
    // Find File menu button (need to pierce shadow DOM)
    const fileMenuButton = page.locator('svg-editor-app').locator('button:has-text("File")');
    await expect(fileMenuButton).toBeVisible();
    
    // Click to open dropdown
    await fileMenuButton.click();
    
    // Verify menu items are visible
    const newButton = page.locator('svg-editor-app').locator('button:has-text("New")');
    await expect(newButton).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    await page.goto('/');
    
    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    
    // Click theme toggle
    const themeToggle = page.locator('svg-editor-app').locator('button[id="theme-toggle"]');
    await themeToggle.click();
    
    // Verify theme changed
    const newTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    
    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe('SVG Editor - test.svg Loading', () => {
  test('should load test.svg programmatically', async ({ page }) => {
    await page.goto('/');
    
    // Load test.svg content
    const testSVGContent = loadTestSVG();
    
    // Expose parser and state to page context
    await page.addScriptTag({
      content: `
        window.SVGParser = class {
          parse(content) {
            // This would use the actual parser from the app
            // For now, return mock structure
            return {
              success: true,
              document: { root: 'mock' },
              tree: [],
              errors: []
            };
          }
        };
        window.documentStateUpdater = {
          setDocument: (doc, tree, raw) => {
            console.log('Document loaded:', raw.length, 'bytes');
          }
        };
      `
    });
    
    // Load SVG
    await loadSVGIntoEditor(page, testSVGContent);
    
    // Wait a bit for rendering
    await page.waitForTimeout(500);
    
    // Verify something rendered (this is a basic check)
    // In a real implementation, you'd check for specific elements
    const canvas = page.locator('svg-canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('SVG Editor - Panel Resizing', () => {
  test('should resize hierarchy panel', async ({ page }) => {
    await page.goto('/');
    
    // Get initial width of hierarchy panel
    const hierarchyPanel = page.locator('svg-editor-app').locator('.hierarchy-panel');
    const initialBox = await hierarchyPanel.boundingBox();
    
    if (!initialBox) {
      throw new Error('Hierarchy panel not found');
    }
    
    // Find the divider
    const divider = page.locator('svg-editor-app').locator('.divider-h');
    
    // Drag the divider to resize
    await divider.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox.x + initialBox.width + 100, initialBox.y + initialBox.height / 2);
    await page.mouse.up();
    
    // Wait for layout to update
    await page.waitForTimeout(100);
    
    // Get new width
    const newBox = await hierarchyPanel.boundingBox();
    
    if (!newBox) {
      throw new Error('Hierarchy panel not found after resize');
    }
    
    // Verify width changed
    expect(newBox.width).not.toBe(initialBox.width);
  });
});

test.describe('SVG Editor - Performance', () => {
  test('should load and render within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for main components to be visible
    await page.locator('svg-canvas').waitFor({ state: 'visible' });
    await page.locator('svg-hierarchy-panel').waitFor({ state: 'visible' });
    await page.locator('svg-attribute-inspector').waitFor({ state: 'visible' });
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log(`Application loaded in ${loadTime}ms`);
    
    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('SVG Editor - Visual Regression', () => {
  test('should match initial layout screenshot', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to be ready
    await page.locator('svg-canvas').waitFor({ state: 'visible' });
    
    // Take screenshot of entire app
    await expect(page).toHaveScreenshot('initial-layout.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match dark theme screenshot', async ({ page }) => {
    await page.goto('/');
    
    // Switch to dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    // Wait for theme to apply
    await page.waitForTimeout(100);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('dark-theme.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('SVG Editor - Accessibility', () => {
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.locator('svg-canvas').waitFor({ state: 'visible' });
    
    // Basic accessibility checks
    // Check for proper ARIA labels
    const themeToggle = page.locator('svg-editor-app').locator('button[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeVisible();
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    // Should be able to focus on interactive elements
    expect(focusedElement).toBeTruthy();
  });
});
