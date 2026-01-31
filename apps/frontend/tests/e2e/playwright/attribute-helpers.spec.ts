/**
 * Integration Tests for Attribute Helper Functions
 * 
 * These tests verify the attribute helper functions work correctly
 * with the SVG editor's attribute inspector.
 */

import { test, expect } from '@playwright/test';
import {
  editAttribute,
  verifyAttributeValue,
  expectValidationError
} from '../../helpers/attribute-helpers';
import { selectElement } from '../../helpers/selection-helpers';
import { loadSVGContent, waitForEditorReady } from '../../helpers/svg-helpers';

// Simple test SVG with known elements
const testSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect id="test-rect" x="100" y="100" width="100" height="100" fill="red"/>
  <circle id="test-circle" cx="300" cy="150" r="50" fill="blue"/>
  <ellipse id="test-ellipse" cx="500" cy="150" rx="60" ry="40" fill="green"/>
</svg>
`.trim();

test.describe('Attribute Helpers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
    await loadSVGContent(page, testSVG);
  });

  test('verifyAttributeValue should check attribute values', async ({ page }) => {
    // Verify initial attribute values
    await verifyAttributeValue(page, 'test-rect', 'x', '100');
    await verifyAttributeValue(page, 'test-rect', 'y', '100');
    await verifyAttributeValue(page, 'test-rect', 'width', '100');
    await verifyAttributeValue(page, 'test-rect', 'height', '100');
  });

  test('verifyAttributeValue should work with circle attributes', async ({ page }) => {
    // Verify circle attributes
    await verifyAttributeValue(page, 'test-circle', 'cx', '300');
    await verifyAttributeValue(page, 'test-circle', 'cy', '150');
    await verifyAttributeValue(page, 'test-circle', 'r', '50');
  });

  test('editAttribute should update numeric attribute', async ({ page }) => {
    // Select an element
    await selectElement(page, 'test-rect');
    
    // Wait for inspector to show
    await page.waitForTimeout(200);
    
    // Edit the width attribute
    await editAttribute(page, 'width', '200');
    
    // Verify the attribute was updated in the canvas
    await verifyAttributeValue(page, 'test-rect', 'width', '200');
  });

  test('editAttribute should update position attributes', async ({ page }) => {
    // Select an element
    await selectElement(page, 'test-rect');
    
    // Wait for inspector to show
    await page.waitForTimeout(200);
    
    // Edit the x attribute
    await editAttribute(page, 'x', '150');
    
    // Verify the attribute was updated
    await verifyAttributeValue(page, 'test-rect', 'x', '150');
  });

  test('editAttribute should update color attribute', async ({ page }) => {
    // Select an element
    await selectElement(page, 'test-rect');
    
    // Wait for inspector to show
    await page.waitForTimeout(200);
    
    // Edit the fill attribute with a hex color
    await editAttribute(page, 'fill', '#0000ff');
    
    // Verify the attribute was updated in the canvas
    await verifyAttributeValue(page, 'test-rect', 'fill', '#0000ff');
  });

  test('expectValidationError should detect negative values', async ({ page }) => {
    // Select an element
    await selectElement(page, 'test-rect');
    
    // Wait for inspector to show
    await page.waitForTimeout(200);
    
    // Try to set a negative width
    await editAttribute(page, 'width', '-50');
    
    // Wait for validation to occur
    await page.waitForTimeout(200);
    
    // Verify error is shown
    await expectValidationError(page, 'width', 'at least 0');
  });

  test('expectValidationError should detect invalid color format', async ({ page }) => {
    // Select an element
    await selectElement(page, 'test-rect');
    
    // Wait for inspector to show
    await page.waitForTimeout(200);
    
    // Try to set an invalid color
    await editAttribute(page, 'fill', 'notacolor');
    
    // Wait for validation to occur
    await page.waitForTimeout(200);
    
    // Verify error is shown
    await expectValidationError(page, 'fill', 'Invalid');
  });
});
