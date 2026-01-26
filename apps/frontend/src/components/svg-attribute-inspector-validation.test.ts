/**
 * Unit tests for SVG Attribute Inspector Validation
 * 
 * Tests attribute validation for all attribute types.
 * Requirements: 4.2, 4.3, 4.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SVGAttributeInspector } from './svg-attribute-inspector';
import { documentStateUpdater } from '../state/document-state';
import type { DocumentNode } from '../types';

describe('SVGAttributeInspector - Validation', () => {
  let inspector: SVGAttributeInspector;

  beforeEach(() => {
    // Register the custom element if not already registered
    if (!customElements.get('svg-attribute-inspector')) {
      customElements.define('svg-attribute-inspector', SVGAttributeInspector);
    }

    // Create inspector instance
    inspector = document.createElement('svg-attribute-inspector') as SVGAttributeInspector;
    document.body.appendChild(inspector);

    // Clear document state
    documentStateUpdater.clearDocument();
  });

  afterEach(() => {
    // Clean up
    if (inspector && inspector.parentNode) {
      inspector.parentNode.removeChild(inspector);
    }
    documentStateUpdater.clearDocument();
  });

  describe('Number Validation', () => {
    it('should reject NaN values for number attributes', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('x', '10');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['x', '10'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Find the x attribute input
      const xField = inspector.shadowRoot?.querySelector('[data-attribute-name="x"]');
      const xInput = xField?.querySelector('input') as HTMLInputElement;

      expect(xInput).toBeDefined();

      // Try to set an invalid value
      xInput.value = 'not-a-number';
      xInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should show error
      const errorDiv = xField?.querySelector('.attribute-error') as HTMLElement;
      expect(errorDiv).toBeDefined();
      expect(errorDiv.textContent).toContain('valid number');
      expect(xField?.classList.contains('error')).toBe(true);

      // Value should be rolled back to original
      expect(xInput.value).toBe('10');
      
      // Element attribute should not have changed
      expect(rect.getAttribute('x')).toBe('10');
    });

    it('should reject values below minimum', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('width', '100');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['width', '100'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const widthField = inspector.shadowRoot?.querySelector('[data-attribute-name="width"]');
      const widthInput = widthField?.querySelector('input') as HTMLInputElement;

      // Try to set negative width (min is 0)
      widthInput.value = '-10';
      widthInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should show error
      const errorDiv = widthField?.querySelector('.attribute-error') as HTMLElement;
      expect(errorDiv.textContent).toContain('at least 0');
      expect(widthField?.classList.contains('error')).toBe(true);

      // Value should be rolled back
      expect(widthInput.value).toBe('100');
      expect(rect.getAttribute('width')).toBe('100');
    });

    it('should reject values above maximum', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('opacity', '0.5');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['opacity', '0.5'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const opacityField = inspector.shadowRoot?.querySelector('[data-attribute-name="opacity"]');
      const opacityInput = opacityField?.querySelector('input') as HTMLInputElement;

      // Try to set opacity > 1 (max is 1)
      opacityInput.value = '1.5';
      opacityInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should show error
      const errorDiv = opacityField?.querySelector('.attribute-error') as HTMLElement;
      expect(errorDiv.textContent).toContain('at most 1');
      expect(opacityField?.classList.contains('error')).toBe(true);

      // Value should be rolled back
      expect(opacityInput.value).toBe('0.5');
      expect(rect.getAttribute('opacity')).toBe('0.5');
    });

    it('should accept valid number values', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('x', '10');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['x', '10'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const xField = inspector.shadowRoot?.querySelector('[data-attribute-name="x"]');
      const xInput = xField?.querySelector('input') as HTMLInputElement;

      // Set a valid value
      xInput.value = '25';
      xInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not show error
      expect(xField?.classList.contains('error')).toBe(false);

      // Element should be updated
      expect(rect.getAttribute('x')).toBe('25');
    });
  });

  describe('Color Validation', () => {
    it('should accept valid hex colors (#RRGGBB)', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('fill', '#ff0000');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['fill', '#ff0000'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const fillField = inspector.shadowRoot?.querySelector('[data-attribute-name="fill"]');
      const textInput = fillField?.querySelector('input[type="text"]') as HTMLInputElement;

      // Set a valid hex color
      textInput.value = '#00ff00';
      textInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not show error
      expect(fillField?.classList.contains('error')).toBe(false);

      // Element should be updated
      expect(rect.getAttribute('fill')).toBe('#00ff00');
    });

    it('should accept valid short hex colors (#RGB)', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('fill', '#ff0000');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['fill', '#ff0000'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const fillField = inspector.shadowRoot?.querySelector('[data-attribute-name="fill"]');
      const textInput = fillField?.querySelector('input[type="text"]') as HTMLInputElement;

      // Set a valid short hex color
      textInput.value = '#0f0';
      textInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not show error
      expect(fillField?.classList.contains('error')).toBe(false);

      // Element should be updated
      expect(rect.getAttribute('fill')).toBe('#0f0');
    });

    it('should accept valid rgb colors', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('fill', '#ff0000');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['fill', '#ff0000'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const fillField = inspector.shadowRoot?.querySelector('[data-attribute-name="fill"]');
      const textInput = fillField?.querySelector('input[type="text"]') as HTMLInputElement;

      // Set a valid rgb color
      textInput.value = 'rgb(0, 255, 0)';
      textInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not show error
      expect(fillField?.classList.contains('error')).toBe(false);

      // Element should be updated
      expect(rect.getAttribute('fill')).toBe('rgb(0, 255, 0)');
    });

    it('should accept valid rgba colors', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('fill', '#ff0000');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['fill', '#ff0000'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const fillField = inspector.shadowRoot?.querySelector('[data-attribute-name="fill"]');
      const textInput = fillField?.querySelector('input[type="text"]') as HTMLInputElement;

      // Set a valid rgba color
      textInput.value = 'rgba(0, 255, 0, 0.5)';
      textInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not show error
      expect(fillField?.classList.contains('error')).toBe(false);

      // Element should be updated
      expect(rect.getAttribute('fill')).toBe('rgba(0, 255, 0, 0.5)');
    });

    it('should accept named colors', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('fill', '#ff0000');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['fill', '#ff0000'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const fillField = inspector.shadowRoot?.querySelector('[data-attribute-name="fill"]');
      const textInput = fillField?.querySelector('input[type="text"]') as HTMLInputElement;

      // Set a named color
      textInput.value = 'blue';
      textInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not show error
      expect(fillField?.classList.contains('error')).toBe(false);

      // Element should be updated
      expect(rect.getAttribute('fill')).toBe('blue');
    });

    it('should accept special color values (none, transparent)', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('fill', '#ff0000');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['fill', '#ff0000'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const fillField = inspector.shadowRoot?.querySelector('[data-attribute-name="fill"]');
      const textInput = fillField?.querySelector('input[type="text"]') as HTMLInputElement;

      // Set 'none'
      textInput.value = 'none';
      textInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not show error
      expect(fillField?.classList.contains('error')).toBe(false);
      expect(rect.getAttribute('fill')).toBe('none');
    });

    it('should reject invalid hex colors', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('fill', '#ff0000');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['fill', '#ff0000'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const fillField = inspector.shadowRoot?.querySelector('[data-attribute-name="fill"]');
      const textInput = fillField?.querySelector('input[type="text"]') as HTMLInputElement;

      // Try invalid hex color
      textInput.value = '#gggggg';
      textInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should show error
      const errorDiv = fillField?.querySelector('.attribute-error') as HTMLElement;
      expect(errorDiv.textContent).toContain('Invalid');
      expect(fillField?.classList.contains('error')).toBe(true);

      // Value should be rolled back
      expect(textInput.value).toBe('#ff0000');
      expect(rect.getAttribute('fill')).toBe('#ff0000');
    });

    it('should reject invalid rgb values (out of range)', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('fill', '#ff0000');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['fill', '#ff0000'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const fillField = inspector.shadowRoot?.querySelector('[data-attribute-name="fill"]');
      const textInput = fillField?.querySelector('input[type="text"]') as HTMLInputElement;

      // Try rgb with value > 255
      textInput.value = 'rgb(300, 0, 0)';
      textInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should show error
      const errorDiv = fillField?.querySelector('.attribute-error') as HTMLElement;
      expect(errorDiv.textContent).toContain('0 and 255');
      expect(fillField?.classList.contains('error')).toBe(true);

      // Value should be rolled back
      expect(textInput.value).toBe('#ff0000');
    });
  });

  describe('String Validation', () => {
    it('should accept valid ID values', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const idField = inspector.shadowRoot?.querySelector('[data-attribute-name="id"]');
      const idInput = idField?.querySelector('input') as HTMLInputElement;

      // Set a valid ID
      idInput.value = 'new-rect-id';
      idInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not show error
      expect(idField?.classList.contains('error')).toBe(false);

      // Element should be updated
      expect(rect.getAttribute('id')).toBe('new-rect-id');
    });

    it('should reject empty ID values', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const idField = inspector.shadowRoot?.querySelector('[data-attribute-name="id"]');
      const idInput = idField?.querySelector('input') as HTMLInputElement;

      // Try to set empty ID
      idInput.value = '';
      idInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should show error
      const errorDiv = idField?.querySelector('.attribute-error') as HTMLElement;
      expect(errorDiv.textContent).toContain('required');
      expect(idField?.classList.contains('error')).toBe(true);

      // Value should be rolled back
      expect(idInput.value).toBe('test-rect');
      expect(rect.getAttribute('id')).toBe('test-rect');
    });

    it('should reject invalid ID format (starting with number)', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const idField = inspector.shadowRoot?.querySelector('[data-attribute-name="id"]');
      const idInput = idField?.querySelector('input') as HTMLInputElement;

      // Try to set ID starting with number
      idInput.value = '123-rect';
      idInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should show error
      const errorDiv = idField?.querySelector('.attribute-error') as HTMLElement;
      expect(errorDiv.textContent).toContain('letter or underscore');
      expect(idField?.classList.contains('error')).toBe(true);

      // Value should be rolled back
      expect(idInput.value).toBe('test-rect');
      expect(rect.getAttribute('id')).toBe('test-rect');
    });

    it('should accept non-required empty text attributes', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('id', 'test-text');
      text.setAttribute('font-family', 'Arial');
      svg.appendChild(text);

      const node: DocumentNode = {
        id: 'test-text',
        type: 'element',
        tagName: 'text',
        attributes: new Map([
          ['id', 'test-text'],
          ['font-family', 'Arial'],
        ]),
        children: [],
        element: text,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-text']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const fontField = inspector.shadowRoot?.querySelector('[data-attribute-name="font-family"]');
      const fontInput = fontField?.querySelector('input') as HTMLInputElement;

      // Set empty font-family (non-required)
      fontInput.value = '';
      fontInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not show error (font-family is not required)
      expect(fontField?.classList.contains('error')).toBe(false);

      // Element should be updated
      expect(text.getAttribute('font-family')).toBe('');
    });
  });

  describe('Enum Validation', () => {
    it('should accept valid enum values', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('id', 'test-text');
      text.setAttribute('text-anchor', 'start');
      svg.appendChild(text);

      const node: DocumentNode = {
        id: 'test-text',
        type: 'element',
        tagName: 'text',
        attributes: new Map([
          ['id', 'test-text'],
          ['text-anchor', 'start'],
        ]),
        children: [],
        element: text,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-text']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const anchorField = inspector.shadowRoot?.querySelector('[data-attribute-name="text-anchor"]');
      const anchorSelect = anchorField?.querySelector('select') as HTMLSelectElement;

      // Change to valid value
      anchorSelect.value = 'middle';
      anchorSelect.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not show error
      expect(anchorField?.classList.contains('error')).toBe(false);

      // Element should be updated
      expect(text.getAttribute('text-anchor')).toBe('middle');
    });
  });

  describe('Error Display and Clearing', () => {
    it('should clear error when value becomes valid', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('x', '10');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['x', '10'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const xField = inspector.shadowRoot?.querySelector('[data-attribute-name="x"]');
      const xInput = xField?.querySelector('input') as HTMLInputElement;

      // Set invalid value
      xInput.value = 'invalid';
      xInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should show error
      expect(xField?.classList.contains('error')).toBe(true);

      // Set valid value
      xInput.value = '25';
      xInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Error should be cleared
      expect(xField?.classList.contains('error')).toBe(false);
      const errorDiv = xField?.querySelector('.attribute-error') as HTMLElement;
      expect(errorDiv.textContent).toBe('');
    });
  });

  describe('Document State Updates', () => {
    it('should not update document state on invalid values', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['x', '10'],
          ['y', '20'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Get initial raw SVG
      const initialRawSVG = svg.outerHTML;

      const xField = inspector.shadowRoot?.querySelector('[data-attribute-name="x"]');
      const xInput = xField?.querySelector('input') as HTMLInputElement;

      // Try to set invalid value
      xInput.value = 'not-a-number';
      xInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Document should not have changed
      expect(rect.getAttribute('x')).toBe('10');
      
      // Raw SVG should not have changed
      const currentRawSVG = svg.outerHTML;
      expect(currentRawSVG).toBe(initialRawSVG);
    });

    it('should update document state on valid values', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('x', '10');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['x', '10'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      const xField = inspector.shadowRoot?.querySelector('[data-attribute-name="x"]');
      const xInput = xField?.querySelector('input') as HTMLInputElement;

      // Set valid value
      xInput.value = '25';
      xInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Document should be updated
      expect(rect.getAttribute('x')).toBe('25');
    });
  });
});
