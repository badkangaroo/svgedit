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
    // We target the SVG inside the shadow DOM that represents the document content
    // Use evaluate to check shadow DOM content directly if locator fails
    const svgExists = await canvas.evaluate((el: HTMLElement) => {
      // Find the shadow root
      if (!el.shadowRoot) return false;
      
      // Look for the main SVG content
      const svg = el.shadowRoot.querySelector('svg.svg-content');
      if (!svg) return false;
      
      // Basic visibility check
      const style = window.getComputedStyle(svg);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    
    // If SVG doesn't exist yet, wait a bit and try again (handling slow rendering)
    if (!svgExists) {
      await page.waitForTimeout(2000); // Increased wait time
    }
    
    // Continue with locator for attribute checks - but target specifically and allow waiting
    // Use an XPath selector to find the svg with class svg-content anywhere in the shadow tree
    const svg = canvas.locator('//*[@class="svg-content" and local-name()="svg"]');
    // If XPath fails, fallback to simple CSS selector
    const svgFallback = canvas.locator('svg.svg-content');
    
    try {
        await expect(svg).toBeVisible({ timeout: 5000 });
    } catch (e) {
        await expect(svgFallback).toBeVisible({ timeout: 10000 });
    }
    
    // Use the fallback locator for subsequent checks as it's cleaner
    const targetSvg = svgFallback;
    await expect(targetSvg).toHaveAttribute('width', '1200');
    await expect(targetSvg).toHaveAttribute('height', '800');
    await expect(targetSvg).toHaveAttribute('viewBox', '0 0 1200 800');
    
    // Verify specific groups exist in the rendered SVG
    // We explicitly look for these IDs within the shadow root of svg-canvas
    // Using evaluate is the most reliable way to pierce the shadow boundary for these specific checks
    // We'll wrap this in a waitForFunction to allow for async rendering/parsing
    await page.waitForFunction(
      () => {
        const canvas = document.querySelector('svg-canvas');
        if (!canvas || !canvas.shadowRoot) return false;
        
        const root = canvas.shadowRoot;
        // Check for at least one of the major groups to confirm SVG structure is loaded
        // We use querySelector inside the shadow root to find elements
        // The previous check might have failed because we were looking for the SVG itself, not its content
        // This is safer because it just checks existence
        // Need to be careful: the SVG content is inside a div with class 'svg-wrapper' or directly in shadow root
        // or inside the svg-content element
        
        // Try to find the svg content element first
        const svgContent = root.querySelector('.svg-content');
        if (svgContent) {
             return !!svgContent.querySelector('#header') || 
                    !!svgContent.querySelector('#scene');
        }
        
        // Fallback to checking root directly
        return !!root.querySelector('#header') || 
               !!root.querySelector('#scene');
      }, 
      null, 
      { timeout: 10000 }
    );
    
    // Once we know structure exists, do the specific checks
    // We use a more permissive check to find elements anywhere in the shadow DOM
    // This handles cases where elements might be nested inside g tags or other containers
    const hasGroups = await canvas.evaluate((el: HTMLElement) => {
      if (!el.shadowRoot) return false;
      
      const root = el.shadowRoot;
      const container = root.querySelector('.svg-content') || root;
      
      // Helper function to find element by ID anywhere in the subtree
      const findById = (root: Element | ShadowRoot, id: string): boolean => {
        if (root.querySelector(`#${id}`)) return true;
        return false;
      };
      
      // Check for elements by ID
      const hasHeader = findById(container, 'header');
      const hasScene = findById(container, 'scene');
      const hasShapes = findById(container, 'shapes');
      const hasIcons = findById(container, 'icons');
      const hasLabels = findById(container, 'labels');
      
      return hasHeader && hasScene && hasShapes && hasIcons && hasLabels;
    });
    
    expect(hasGroups).toBe(true);
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
    // We need to look inside the SVG defs in the shadow DOM
    // The previous locator('defs') might have been ambiguous or failing to pierce
    const hasDefs = await canvas.evaluate((el: HTMLElement) => {
      if (!el.shadowRoot) return false;
      const root = el.shadowRoot;
      const defs = root.querySelector('defs');
      if (!defs) return false;
      
      return (
        !!defs.querySelector('#grad-sun') &&
        !!defs.querySelector('#grad-bubble') &&
        !!defs.querySelector('#pattern-grid') &&
        !!defs.querySelector('#clip-window') &&
        !!defs.querySelector('#mask-hole')
      );
    });
    
    expect(hasDefs).toBe(true);
  });

  test('should render all element types correctly', async ({ page }) => {
    await loadTestSVG(page);
    
    const canvas = page.locator('svg-canvas svg');
    
    // Verify different element types are rendered
    // Use a more relaxed selector strategy or evaluate for these elements
    // Playwright might struggle with shadow DOM piercing for multiple elements at once
    
    // Check if at least one of each type exists in the shadow DOM
    const hasElements = await canvas.evaluate((el: HTMLElement) => {
      if (!el.shadowRoot) return false;
      const root = el.shadowRoot;
      return (
        !!root.querySelector('rect') &&
        !!root.querySelector('circle') &&
        !!root.querySelector('ellipse') &&
        !!root.querySelector('line') &&
        !!root.querySelector('polyline') &&
        !!root.querySelector('polygon') &&
        !!root.querySelector('path') &&
        !!root.querySelector('text') &&
        !!root.querySelector('image')
      );
    });
    
    expect(hasElements).toBe(true);
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
    // Use a more relaxed check for the image element
    // The previous selector 'image[href="embedded_image.webp"]' might fail if the href is resolved or modified
    const hasImage = await canvas.evaluate((el: HTMLElement) => {
      if (!el.shadowRoot) return false;
      const root = el.shadowRoot;
      const images = root.querySelectorAll('image');
      if (images.length === 0) return false;
      
      // Check if any image has the expected attributes
      return Array.from(images).some(img => {
        const x = img.getAttribute('x');
        const y = img.getAttribute('y');
        const w = img.getAttribute('width');
        const h = img.getAttribute('height');
        const href = img.getAttribute('href') || img.getAttribute('xlink:href');
        
        return (
          x === '10' &&
          y === '8' &&
          w === '220' &&
          h === '74' &&
          href && href.includes('embedded_image.webp')
        );
      });
    });
    
    expect(hasImage).toBe(true);
  });
});
