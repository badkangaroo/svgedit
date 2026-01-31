/**
 * E2E tests for loading and displaying SVG files
 * Tests using the test.svg file from the repository root
 */

import { test, expect } from '@playwright/test';
import { 
  loadTestSVG, 
  waitForEditorReady,
  hierarchyHasElement,
  expandHierarchyNode 
} from '../../helpers/svg-helpers';

test.describe('SVG Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
  });

  test('should load and display test.svg correctly', async ({ page }) => {
    // Load test.svg
    await loadTestSVG(page);
    
    // Verify canvas shows SVG
    const canvas = page.locator('svg-canvas');
    await expect(canvas).toBeVisible();
    
    // Verify SVG element is rendered with correct dimensions
    const svg = canvas.locator('svg');
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute('width', '1200');
    await expect(svg).toHaveAttribute('height', '800');
    await expect(svg).toHaveAttribute('viewBox', '0 0 1200 800');
    
    // Verify specific groups exist in the rendered SVG
    await expect(svg.locator('#header')).toBeVisible();
    await expect(svg.locator('#scene')).toBeVisible();
    await expect(svg.locator('#shapes')).toBeVisible();
    await expect(svg.locator('#icons')).toBeVisible();
    await expect(svg.locator('#labels')).toBeVisible();
  });

  test('should populate hierarchy panel with test.svg structure', async ({ page }) => {
    await loadTestSVG(page);
    
    // Verify hierarchy panel is visible
    const hierarchy = page.locator('svg-hierarchy-panel');
    await expect(hierarchy).toBeVisible();
    
    // Check for main groups in the hierarchy
    expect(await hierarchyHasElement(page, 'header')).toBe(true);
    expect(await hierarchyHasElement(page, 'scene')).toBe(true);
    expect(await hierarchyHasElement(page, 'shapes')).toBe(true);
    expect(await hierarchyHasElement(page, 'icons')).toBe(true);
    
    // Expand a group to verify nested structure
    await expandHierarchyNode(page, 'header');
    
    // Should show children elements
    expect(await hierarchyHasElement(page, 'rect')).toBe(true);
    expect(await hierarchyHasElement(page, 'text')).toBe(true);
    expect(await hierarchyHasElement(page, 'circle')).toBe(true);
  });

  test('should display defs section with gradients and patterns', async ({ page }) => {
    await loadTestSVG(page);
    
    const canvas = page.locator('svg-canvas svg');
    const defs = canvas.locator('defs');
    
    // Verify defs section exists
    await expect(defs).toBeVisible();
    
    // Verify gradients are defined
    await expect(defs.locator('#grad-sun')).toBeVisible();
    await expect(defs.locator('#grad-bubble')).toBeVisible();
    
    // Verify pattern is defined
    await expect(defs.locator('#pattern-grid')).toBeVisible();
    
    // Verify clipPath is defined
    await expect(defs.locator('#clip-window')).toBeVisible();
    
    // Verify mask is defined
    await expect(defs.locator('#mask-hole')).toBeVisible();
  });

  test('should render all element types correctly', async ({ page }) => {
    await loadTestSVG(page);
    
    const canvas = page.locator('svg-canvas svg');
    
    // Verify different element types are rendered
    await expect(canvas.locator('rect').first()).toBeVisible();
    await expect(canvas.locator('circle').first()).toBeVisible();
    await expect(canvas.locator('ellipse').first()).toBeVisible();
    await expect(canvas.locator('line').first()).toBeVisible();
    await expect(canvas.locator('polyline').first()).toBeVisible();
    await expect(canvas.locator('polygon').first()).toBeVisible();
    await expect(canvas.locator('path').first()).toBeVisible();
    await expect(canvas.locator('text').first()).toBeVisible();
    await expect(canvas.locator('image').first()).toBeVisible();
  });

  test('should display raw SVG text in raw panel', async ({ page }) => {
    await loadTestSVG(page);
    
    // Verify raw SVG panel is visible
    const rawPanel = page.locator('svg-raw-panel');
    await expect(rawPanel).toBeVisible();
    
    // Get the raw SVG text content
    const textarea = rawPanel.locator('textarea, [contenteditable="true"]');
    const content = await textarea.inputValue().catch(() => textarea.textContent());
    
    // Verify it contains expected SVG content
    expect(content).toContain('<svg');
    expect(content).toContain('width="1200"');
    expect(content).toContain('height="800"');
    expect(content).toContain('id="header"');
    expect(content).toContain('id="scene"');
    expect(content).toContain('</svg>');
  });

  test('should handle empty/new document', async ({ page }) => {
    // Don't load test.svg, just verify empty state
    
    const canvas = page.locator('svg-canvas');
    await expect(canvas).toBeVisible();
    
    // Should show empty canvas or placeholder
    const svg = canvas.locator('svg');
    const svgCount = await svg.count();
    
    // Either no SVG or an empty SVG element
    if (svgCount > 0) {
      // If there's a default SVG, it should be minimal
      const children = await svg.locator('> *').count();
      expect(children).toBeLessThanOrEqual(1); // At most a defs section
    }
  });

  test('should maintain aspect ratio when displaying SVG', async ({ page }) => {
    await loadTestSVG(page);
    
    const canvas = page.locator('svg-canvas svg');
    
    // Get the bounding box
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    
    if (box) {
      // The SVG should maintain its 1200:800 (3:2) aspect ratio
      const aspectRatio = box.width / box.height;
      
      // Allow some tolerance for padding/margins
      expect(aspectRatio).toBeGreaterThan(1.4);
      expect(aspectRatio).toBeLessThan(1.6);
    }
  });

  test('should load SVG with embedded image reference', async ({ page }) => {
    await loadTestSVG(page);
    
    const canvas = page.locator('svg-canvas svg');
    
    // Find the image element
    const image = canvas.locator('image[href="embedded_image.webp"]');
    await expect(image).toBeVisible();
    
    // Verify image attributes
    await expect(image).toHaveAttribute('x', '10');
    await expect(image).toHaveAttribute('y', '8');
    await expect(image).toHaveAttribute('width', '220');
    await expect(image).toHaveAttribute('height', '74');
  });
});
