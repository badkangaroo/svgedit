/**
 * Helper utilities for SVG testing
 */

import type { Page } from '@playwright/test';
import { generateTestSVG } from './test-data-generators';

/**
 * Load the test.svg file from the apps/frontend directory
 */
export async function loadTestSVG(page: Page): Promise<void> {
  const svgContent = generateTestSVG();
  await loadSVGContent(page, svgContent);
}

/**
 * Load SVG content into the editor
 */
export async function loadSVGContent(page: Page, content: string): Promise<void> {
  // Use the file manager to load SVG content programmatically
  await page.evaluate((svg) => {
    // Access the file manager and load the content
    const { documentStateUpdater } = (window as any);
    const { SVGParser } = (window as any);
    
    console.log('loadSVGContent: documentStateUpdater available?', !!documentStateUpdater);
    console.log('loadSVGContent: SVGParser available?', !!SVGParser);
    
    if (documentStateUpdater && SVGParser) {
      const parser = new SVGParser();
      const result = parser.parse(svg);
      
      if (result.success && result.document) {
        documentStateUpdater.setDocument(result.document, result.tree, svg);
      }
    }
  }, content);
  
  // Wait for the SVG to be rendered in the canvas
  await page.waitForSelector('svg-canvas svg', { 
    state: 'visible',
    timeout: 5000 
  });
}


/**
 * Initialize a new empty document
 */
export async function initializeNewDocument(page: Page): Promise<void> {
  const emptySVG = '<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg"></svg>';
  await loadSVGContent(page, emptySVG);
}

/**
 * Wait for the editor to be fully initialized
 */
export async function waitForEditorReady(page: Page): Promise<void> {
  // Wait for all main components to be defined
  await page.waitForFunction(() => {
    return (
      customElements.get('svg-editor-app') &&
      customElements.get('svg-canvas') &&
      customElements.get('svg-hierarchy-panel') &&
      customElements.get('svg-attribute-inspector')
    );
  });
  
  // Wait for the app to be visible
  await page.waitForSelector('svg-editor-app', { state: 'visible' });
}

/**
 * Get the selected element ID from the document state
 */
export async function getSelectedElementId(page: Page): Promise<string | null> {
  return await page.evaluate<string | null>(() => {
    const { documentState } = (window as any);
    if (!documentState) return null;
    
    const selectedIds = documentState.selectedIds.get();
    return (selectedIds.size > 0 ? Array.from(selectedIds)[0] : null) as string | null;
  });
}

/**
 * Select an element by ID in the canvas
 */
export async function selectElementById(page: Page, id: string): Promise<void> {
  await page.evaluate((elementId) => {
    const { selectionManager } = (window as any);
    if (selectionManager) {
      selectionManager.select([elementId]);
    }
  }, id);
  
  // Wait a bit for the selection to propagate
  await page.waitForTimeout(100);
}

/**
 * Get the raw SVG text from the document state
 */
export async function getRawSVGText(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const { documentState } = (window as any);
    return documentState ? documentState.rawSVG.get() : '';
  });
}

/**
 * Get attribute value from the inspector
 */
export async function getInspectorAttributeValue(
  page: Page, 
  attributeName: string
): Promise<string | null> {
  const inspector = page.locator('svg-attribute-inspector');
  const input = inspector.locator(`input[name="${attributeName}"], input[aria-label="${attributeName}"]`);
  
  if (await input.count() === 0) {
    return null;
  }
  
  return await input.inputValue();
}

/**
 * Set attribute value in the inspector
 */
export async function setInspectorAttributeValue(
  page: Page,
  attributeName: string,
  value: string
): Promise<void> {
  const inspector = page.locator('svg-attribute-inspector');
  const input = inspector.locator(`input[name="${attributeName}"], input[aria-label="${attributeName}"]`);
  
  await input.fill(value);
  await input.press('Enter');
  
  // Wait for the change to propagate
  await page.waitForTimeout(100);
}

/**
 * Check if an element exists in the hierarchy panel
 */
export async function hierarchyHasElement(
  page: Page,
  text: string
): Promise<boolean> {
  const hierarchy = page.locator('svg-hierarchy-panel');
  const element = hierarchy.getByText(text, { exact: false });
  return await element.count() > 0;
}

/**
 * Expand a node in the hierarchy panel
 */
export async function expandHierarchyNode(
  page: Page,
  nodeText: string
): Promise<void> {
  const hierarchy = page.locator('svg-hierarchy-panel');
  const node = hierarchy.getByText(nodeText).first();
  
  // Look for expand button near the node
  const expandButton = node.locator('..').locator('button[aria-label*="expand"], button[aria-label*="Expand"]');
  
  if (await expandButton.count() > 0) {
    await expandButton.click();
    await page.waitForTimeout(100);
  }
}
