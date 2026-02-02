/**
 * Helper utilities for SVG testing
 */

import type { Page } from '@playwright/test';
import { generateTestSVG, generateSimpleTestSVG } from './test-data-generators';

/**
 * Load the test.svg file from the apps/frontend directory
 */
export async function loadTestSVG(page: Page): Promise<void> {
  const svgContent = generateTestSVG();
  await loadSVGContent(page, svgContent);
  
  // Wait for hierarchy to populate - handled by loadSVGContent now
  // Additional wait to ensure everything is settled
  await page.waitForTimeout(500);
}

/**
 * Load the minimal simple-test.svg content for debugging hierarchy/parsing.
 * Use when verifying that the app can read a clean SVG and the hierarchy view updates.
 */
export async function loadSimpleTestSVG(page: Page): Promise<void> {
  const svgContent = generateSimpleTestSVG();
  await loadSVGContent(page, svgContent);
  await page.waitForTimeout(300);
}

/**
 * Load SVG content into the editor
 */
export async function loadSVGContent(page: Page, content: string): Promise<void> {
  // Use the file manager to load SVG content programmatically
  await page.evaluate(async (svg) => {
    // Access the file manager and load the content
    const { documentStateUpdater } = (window as any);
    const { SVGParser } = (window as any);
    
    if (!documentStateUpdater) throw new Error('documentStateUpdater not found on window');
    if (!SVGParser) throw new Error('SVGParser not found on window');
    
    if (documentStateUpdater && SVGParser) {
      const parser = new SVGParser();
      const result = parser.parse(svg);
      
      if (result.success && result.document) {
        documentStateUpdater.setDocument(result.document, result.tree, svg);

        // Yield to microtask queue so reactive effects run (hierarchy panel subscribes to documentTree)
        await new Promise<void>((resolve) => queueMicrotask(resolve));

        // Force refresh as safety net if effect did not run
        const hierarchy = document.querySelector('svg-hierarchy-panel');
        if (hierarchy && typeof (hierarchy as any).refresh === 'function') {
          (hierarchy as any).refresh();
        }

        // Wait for hierarchy to populate (up to 2s)
        const start = Date.now();
        const checkHierarchy = () => {
          const h = document.querySelector('svg-hierarchy-panel');
          if (h?.shadowRoot) {
            const nodes = h.shadowRoot.querySelectorAll('.node-content');
            if (nodes.length > 0) return true;
          }
          return false;
        };

        while (!checkHierarchy() && Date.now() - start < 2000) {
          await new Promise((r) => setTimeout(r, 50));
        }

        if (!checkHierarchy()) {
          const h = document.querySelector('svg-hierarchy-panel') as HTMLElement;
          const debugLog = h?.shadowRoot?.querySelector('#debug-log');
          const debugInfo = {
            lastUpdate: h?.dataset?.lastUpdate,
            treeSize: h?.dataset?.treeSize,
            debugLog: debugLog?.textContent,
          };
          throw new Error(
            `Hierarchy not populated in loadSVGContent. Debug: ${JSON.stringify(debugInfo)}`
          );
        }
      } else {
        throw new Error(`SVG Parsing failed: ${JSON.stringify(result.errors)}`);
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
