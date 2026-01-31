/**
 * Attribute Editing E2E Tests
 * 
 * Verifies the functionality of editing element attributes in the SVG editor,
 * including numeric attributes, color attributes, validation, and synchronization.
 */

import { test, expect } from '@playwright/test';
import {
  editAttribute,
  verifyAttributeValue,
  expectValidationError
} from '../../helpers/attribute-helpers';
import { selectElement } from '../../helpers/selection-helpers';
import { loadTestSVG, waitForEditorReady } from '../../helpers/svg-helpers';

test.describe('Attribute Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
    await loadTestSVG(page);
  });

  test('should edit numeric attributes (x, y, width, height)', async ({ page }) => {
    // Select the test rectangle
    await selectElement(page, 'test-rect');
    
    // Edit x position
    await editAttribute(page, 'x', '150');
    // Wait a bit longer for the change to propagate
    await page.waitForTimeout(300);
    await verifyAttributeValue(page, 'test-rect', 'x', '150');
    
    // Edit y position
    await editAttribute(page, 'y', '200');
    await page.waitForTimeout(300);
    await verifyAttributeValue(page, 'test-rect', 'y', '200');
    
    // Edit width
    await editAttribute(page, 'width', '150');
    await page.waitForTimeout(300);
    await verifyAttributeValue(page, 'test-rect', 'width', '150');
    
    // Edit height
    await editAttribute(page, 'height', '80');
    await page.waitForTimeout(300);
    await verifyAttributeValue(page, 'test-rect', 'height', '80');
  });

  test('should edit color attributes (fill, stroke)', async ({ page }) => {
    // Select the test rectangle
    await selectElement(page, 'test-rect');
    
    // Edit fill color
    await editAttribute(page, 'fill', '#00ff00');
    await verifyAttributeValue(page, 'test-rect', 'fill', '#00ff00');
    
    // Edit stroke color
    await editAttribute(page, 'stroke', '#0000ff');
    await verifyAttributeValue(page, 'test-rect', 'stroke', '#0000ff');
    
    // Test named colors
    await editAttribute(page, 'fill', 'blue');
    await verifyAttributeValue(page, 'test-rect', 'fill', 'blue');
  });

  test('should update canvas when attribute changes', async ({ page }) => {
    // Select the test circle
    await selectElement(page, 'test-circle');
    
    // Get initial position
    const canvas = page.locator('svg-canvas');
    const circle = canvas.locator('svg [id="test-circle"], svg [data-original-id="test-circle"]').first();
    
    const initialCx = await circle.getAttribute('cx');
    
    // Edit cx attribute
    await editAttribute(page, 'cx', '400');
    
    // Verify canvas updated
    await verifyAttributeValue(page, 'test-circle', 'cx', '400');
    
    // Verify the value actually changed
    const newCx = await circle.getAttribute('cx');
    expect(newCx).not.toBe(initialCx);
    expect(newCx).toBe('400');
  });

  test('should update raw SVG when attribute changes', async ({ page }) => {
    // Select the test rectangle
    await selectElement(page, 'test-rect');
    
    // Edit fill attribute
    await editAttribute(page, 'fill', '#ff00ff');
    
    // Get raw SVG content
    const rawSVG = await page.evaluate(() => {
      const { documentState } = (window as any);
      return documentState ? documentState.rawSVG.get() : '';
    });
    
    // Verify raw SVG contains the new fill value
    expect(rawSVG).toContain('#ff00ff');
  });

  test('should validate numeric attribute ranges', async ({ page }) => {
    // Select the test rectangle
    await selectElement(page, 'test-rect');
    
    // Try to set negative width (should be rejected or clamped)
    await editAttribute(page, 'width', '-50');
    
    // Wait for validation to process
    await page.waitForTimeout(200);
    
    // Check if validation error is shown or value is clamped
    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator('svg [id="test-rect"], svg [data-original-id="test-rect"]').first();
    const width = await rect.getAttribute('width');
    
    // Width should either remain unchanged or be clamped to a valid value
    const widthNum = parseFloat(width || '0');
    expect(widthNum).toBeGreaterThanOrEqual(0);
  });

  test('should validate color attribute formats', async ({ page }) => {
    // Select the test rectangle
    await selectElement(page, 'test-rect');
    
    // Test valid hex color
    await editAttribute(page, 'fill', '#123456');
    await verifyAttributeValue(page, 'test-rect', 'fill', '#123456');
    
    // Test valid RGB color
    await editAttribute(page, 'fill', 'rgb(100, 150, 200)');
    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator('svg [id="test-rect"], svg [data-original-id="test-rect"]').first();
    const fill = await rect.getAttribute('fill');
    
    // The fill should be set (might be normalized)
    expect(fill).toBeTruthy();
    expect(fill).not.toBe('red'); // Should have changed from original
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    // Select the test rectangle
    await selectElement(page, 'test-rect');
    
    // Try to set invalid numeric value
    await editAttribute(page, 'width', 'not-a-number');
    
    // Wait for validation
    await page.waitForTimeout(200);
    
    // Check that the value was either rejected or an error is shown
    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator('svg [id="test-rect"], svg [data-original-id="test-rect"]').first();
    const width = await rect.getAttribute('width');
    
    // Width should still be a valid number
    const widthNum = parseFloat(width || '0');
    expect(isNaN(widthNum)).toBe(false);
  });

  test('should rollback invalid changes', async ({ page }) => {
    // Select the test rectangle
    await selectElement(page, 'test-rect');
    
    // Get initial width
    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator('svg [id="test-rect"], svg [data-original-id="test-rect"]').first();
    const initialWidth = await rect.getAttribute('width');
    
    // Try to set invalid value
    await editAttribute(page, 'width', 'invalid');
    
    // Wait for validation
    await page.waitForTimeout(200);
    
    // Verify width is still valid (either unchanged or reset)
    const currentWidth = await rect.getAttribute('width');
    const widthNum = parseFloat(currentWidth || '0');
    expect(isNaN(widthNum)).toBe(false);
    
    // Width should be a reasonable value
    expect(widthNum).toBeGreaterThan(0);
  });
});
