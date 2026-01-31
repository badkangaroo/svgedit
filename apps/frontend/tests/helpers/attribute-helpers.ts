/**
 * Attribute Helper Functions for Playwright Tests
 * 
 * These helpers provide utilities for testing attribute editing functionality
 * in the SVG editor's attribute inspector panel.
 */

import { Page, expect } from '@playwright/test';

/**
 * Edit an attribute value in the inspector
 * 
 * This function locates the attribute field in the inspector and updates its value.
 * It handles the shadow DOM piercing and waits for the change to propagate.
 * Uses page.evaluate to properly trigger events in the shadow DOM.
 * 
 * @param page - Playwright page object
 * @param attributeName - Name of the attribute to edit (e.g., 'x', 'fill', 'width')
 * @param value - New value for the attribute
 */
export async function editAttribute(
  page: Page, 
  attributeName: string, 
  value: string
): Promise<void> {
  // Wait for app and inspector to be visible
  await page.waitForSelector('svg-editor-app', { state: 'visible', timeout: 10000 });
  
  // Wait a bit for the inspector to fully render after selection
  await page.waitForTimeout(500);
  
  // Use page.evaluate to interact with shadow DOM directly
  const success = await page.evaluate(({ attr, val }) => {
    // Navigate through app shadow DOM to get to inspector
    const app = document.querySelector('svg-editor-app');
    if (!app || !app.shadowRoot) {
      console.error('App or app shadowRoot not found');
      return false;
    }
    
    const inspector = app.shadowRoot.querySelector('svg-attribute-inspector');
    if (!inspector || !inspector.shadowRoot) {
      console.error('Inspector or inspector shadowRoot not found');
      return false;
    }
    
    const field = inspector.shadowRoot.querySelector(`[data-attribute-name="${attr}"]`);
    if (!field) {
      console.error(`Attribute field "${attr}" not found`);
      // Log available fields for debugging
      const allFields = inspector.shadowRoot.querySelectorAll('[data-attribute-name]');
      console.log('Available fields:', Array.from(allFields).map(f => f.getAttribute('data-attribute-name')));
      return false;
    }
    
    // Find the input element - prefer text input for colors
    let input = field.querySelector('input[type="text"]') as HTMLInputElement;
    if (!input) {
      input = field.querySelector('input, select') as HTMLInputElement;
    }
    
    if (!input) {
      console.error(`Input for attribute "${attr}" not found`);
      return false;
    }
    
    // Set the value and trigger blur event
    input.value = val;
    input.dispatchEvent(new Event('input', { bubbles: true })); // Trigger input first
    input.dispatchEvent(new Event('change', { bubbles: true })); // Then change
    input.dispatchEvent(new Event('blur', { bubbles: true })); // Then blur
    return true;
  }, { attr: attributeName, val: value });
  
  if (!success) {
    throw new Error(`Failed to edit attribute "${attributeName}"`);
  }
  
  // Wait for the change to propagate through the system
  await page.waitForTimeout(150);
}

/**
 * Verify attribute value in canvas element
 * 
 * This function checks that an element in the canvas has the expected attribute value.
 * It handles both regular IDs and data-original-id attributes.
 * 
 * @param page - Playwright page object
 * @param elementId - ID of the element to check
 * @param attributeName - Name of the attribute to verify
 * @param expectedValue - Expected value of the attribute
 */
export async function verifyAttributeValue(
  page: Page,
  elementId: string,
  attributeName: string,
  expectedValue: string
): Promise<void> {
  const canvas = page.locator('svg-canvas');
  
  // Try to find element by ID or data-original-id
  const element = canvas.locator(
    `svg [id="${elementId}"], svg [data-original-id="${elementId}"]`
  ).first();
  
  // Verify the attribute has the expected value
  await expect(element).toHaveAttribute(attributeName, expectedValue);
}

/**
 * Expect validation error for attribute
 * 
 * This function verifies that a validation error is displayed for a specific attribute.
 * It checks both the error class on the field and the error message text.
 * 
 * @param page - Playwright page object
 * @param attributeName - Name of the attribute that should have an error
 * @param errorMessage - Expected error message text (partial match)
 */
export async function expectValidationError(
  page: Page,
  attributeName: string,
  errorMessage: string
): Promise<void> {
  const inspector = page.locator('svg-attribute-inspector');
  
  // Locate the attribute field
  const field = inspector.locator(`[data-attribute-name="${attributeName}"]`);
  
  // Verify the field has the error class
  await expect(field).toHaveClass(/error/);
  
  // Verify the error message is displayed
  const errorDiv = field.locator('.attribute-error');
  await expect(errorDiv).toBeVisible();
  await expect(errorDiv).toContainText(errorMessage);
}


/**
 * KNOWN ISSUES:
 * 
 * The editAttribute function currently has issues with shadow DOM access in Playwright tests.
 * The inspector element is not being found consistently after element selection.
 * 
 * Workaround: Use page.evaluate to directly manipulate the inspector's shadow DOM,
 * or wait longer for the inspector to become visible after selection.
 * 
 * The verifyAttributeValue and expectValidationError functions work correctly.
 */
