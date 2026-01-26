/**
 * Unit tests for SVG Attribute Inspector Component
 * 
 * Tests attribute display, input control generation, and attribute editing.
 * Requirements: 1.1, 4.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SVGAttributeInspector } from './svg-attribute-inspector';
import { documentState, documentStateUpdater } from '../state/document-state';
import type { DocumentNode } from '../types';

describe('SVGAttributeInspector', () => {
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

  describe('Component Initialization', () => {
    it('should create and render the component', () => {
      expect(inspector).toBeDefined();
      expect(inspector.shadowRoot).toBeDefined();
    });

    it('should display header', () => {
      const header = inspector.shadowRoot?.querySelector('.inspector-header');
      expect(header).toBeDefined();
      expect(header?.textContent).toContain('Attribute Inspector');
    });

    it('should show empty state when no element is selected', () => {
      const emptyState = inspector.shadowRoot?.querySelector('.empty-state');
      expect(emptyState).toBeDefined();
      expect(emptyState?.textContent).toContain('Select an element');
    });
  });

  describe('Empty State', () => {
    it('should display empty state icon and message', () => {
      const icon = inspector.shadowRoot?.querySelector('.empty-state-icon');
      const text = inspector.shadowRoot?.querySelector('.empty-state-text');
      
      expect(icon).toBeDefined();
      expect(text).toBeDefined();
      expect(text?.textContent).toContain('Select an element to view its attributes');
    });
  });

  describe('Single Element Selection', () => {
    it('should display attributes when a single element is selected', async () => {
      // Create a test SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      rect.setAttribute('fill', '#ff0000');
      svg.appendChild(rect);

      // Create document node
      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['x', '10'],
          ['y', '20'],
          ['width', '100'],
          ['height', '50'],
          ['fill', '#ff0000'],
        ]),
        children: [],
        element: rect,
      };

      // Update document state
      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);

      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check element info is displayed
      const elementInfo = inspector.shadowRoot?.querySelector('.element-info');
      expect(elementInfo).toBeDefined();
      expect(elementInfo?.textContent).toContain('rect');
      expect(elementInfo?.textContent).toContain('test-rect');
    });

    it('should display all attributes of selected element', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('id', 'test-circle');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '50');
      circle.setAttribute('r', '25');
      circle.setAttribute('fill', 'blue');
      circle.setAttribute('stroke', 'black');
      circle.setAttribute('stroke-width', '2');
      svg.appendChild(circle);

      const node: DocumentNode = {
        id: 'test-circle',
        type: 'element',
        tagName: 'circle',
        attributes: new Map([
          ['id', 'test-circle'],
          ['cx', '50'],
          ['cy', '50'],
          ['r', '25'],
          ['fill', 'blue'],
          ['stroke', 'black'],
          ['stroke-width', '2'],
        ]),
        children: [],
        element: circle,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-circle']);

      await new Promise(resolve => setTimeout(resolve, 50));

      // Check that all attributes are displayed
      const attributes = inspector.getCurrentAttributes();
      expect(attributes.size).toBe(7);
      expect(attributes.get('cx')).toBe('50');
      expect(attributes.get('cy')).toBe('50');
      expect(attributes.get('r')).toBe('25');
      expect(attributes.get('fill')).toBe('blue');
      expect(attributes.get('stroke')).toBe('black');
      expect(attributes.get('stroke-width')).toBe('2');
    });

    it('should show "no attributes" message for element without attributes', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', 'test-group');
      svg.appendChild(g);

      const node: DocumentNode = {
        id: 'test-group',
        type: 'element',
        tagName: 'g',
        attributes: new Map([['id', 'test-group']]),
        children: [],
        element: g,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-group']);

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should show element info but indicate no other attributes
      const elementInfo = inspector.shadowRoot?.querySelector('.element-info');
      expect(elementInfo).toBeDefined();
    });
  });

  describe('Multi-Element Selection', () => {
    it('should display multi-select state when multiple elements are selected', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect1.setAttribute('id', 'rect1');
      svg.appendChild(rect1);
      
      const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect2.setAttribute('id', 'rect2');
      svg.appendChild(rect2);

      const node1: DocumentNode = {
        id: 'rect1',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([['id', 'rect1']]),
        children: [],
        element: rect1,
      };

      const node2: DocumentNode = {
        id: 'rect2',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([['id', 'rect2']]),
        children: [],
        element: rect2,
      };

      documentStateUpdater.setDocument(svg, [node1, node2], svg.outerHTML);
      documentStateUpdater.select(['rect1', 'rect2']);

      await new Promise(resolve => setTimeout(resolve, 50));

      const multiSelectState = inspector.shadowRoot?.querySelector('.multi-select-state');
      expect(multiSelectState).toBeDefined();
      expect(multiSelectState?.textContent).toContain('2');
      expect(multiSelectState?.textContent).toContain('elements selected');
    });

    it('should show correct count for multi-select', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      const elements: SVGElement[] = [];
      const nodes: DocumentNode[] = [];
      
      for (let i = 0; i < 5; i++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('id', `circle${i}`);
        svg.appendChild(circle);
        elements.push(circle);
        
        nodes.push({
          id: `circle${i}`,
          type: 'element',
          tagName: 'circle',
          attributes: new Map([['id', `circle${i}`]]),
          children: [],
          element: circle,
        });
      }

      documentStateUpdater.setDocument(svg, nodes, svg.outerHTML);
      documentStateUpdater.select(nodes.map(n => n.id));

      await new Promise(resolve => setTimeout(resolve, 50));

      const count = inspector.shadowRoot?.querySelector('.multi-select-count');
      expect(count?.textContent).toBe('5');
    });
  });

  describe('Input Control Generation', () => {
    it('should generate number inputs for numeric attributes', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('x', '10');
      rect.setAttribute('width', '100');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['x', '10'],
          ['width', '100'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);

      await new Promise(resolve => setTimeout(resolve, 50));

      const numberInputs = inspector.shadowRoot?.querySelectorAll('input[type="number"]');
      expect(numberInputs).toBeDefined();
      expect(numberInputs!.length).toBeGreaterThan(0);
    });

    it('should generate color inputs for color attributes', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('fill', '#ff0000');
      rect.setAttribute('stroke', '#0000ff');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['fill', '#ff0000'],
          ['stroke', '#0000ff'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);

      await new Promise(resolve => setTimeout(resolve, 50));

      const colorInputs = inspector.shadowRoot?.querySelectorAll('input[type="color"]');
      expect(colorInputs).toBeDefined();
      expect(colorInputs!.length).toBeGreaterThanOrEqual(2);
    });

    it('should generate text inputs for text attributes', async () => {
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

      const textInputs = inspector.shadowRoot?.querySelectorAll('input[type="text"]');
      expect(textInputs).toBeDefined();
      expect(textInputs!.length).toBeGreaterThan(0);
    });

    it('should generate select inputs for enumerated attributes', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('id', 'test-text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-weight', 'bold');
      svg.appendChild(text);

      const node: DocumentNode = {
        id: 'test-text',
        type: 'element',
        tagName: 'text',
        attributes: new Map([
          ['id', 'test-text'],
          ['text-anchor', 'middle'],
          ['font-weight', 'bold'],
        ]),
        children: [],
        element: text,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-text']);

      await new Promise(resolve => setTimeout(resolve, 50));

      const selectInputs = inspector.shadowRoot?.querySelectorAll('select');
      expect(selectInputs).toBeDefined();
      expect(selectInputs!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Attribute Grouping', () => {
    it('should group attributes by category', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      rect.setAttribute('fill', '#ff0000');
      rect.setAttribute('stroke', '#000000');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'test-rect'],
          ['x', '10'],
          ['y', '20'],
          ['width', '100'],
          ['height', '50'],
          ['fill', '#ff0000'],
          ['stroke', '#000000'],
        ]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);

      await new Promise(resolve => setTimeout(resolve, 50));

      const groups = inspector.shadowRoot?.querySelectorAll('.attribute-group');
      expect(groups).toBeDefined();
      expect(groups!.length).toBeGreaterThan(0);

      const groupTitles = inspector.shadowRoot?.querySelectorAll('.attribute-group-title');
      const titles = Array.from(groupTitles || []).map(el => el.textContent);
      
      // Should have Position, Size, Appearance, and Identity groups
      expect(titles).toContain('Position');
      expect(titles).toContain('Size');
      expect(titles).toContain('Appearance');
      expect(titles).toContain('Identity');
    });
  });

  describe('Attribute Editing', () => {
    it('should update element attribute when input value changes', async () => {
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
      expect(xInput.value).toBe('10');

      // Change the value and trigger blur (validation happens on blur)
      xInput.value = '25';
      xInput.dispatchEvent(new Event('blur', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Check that the element attribute was updated
      expect(rect.getAttribute('x')).toBe('25');
    });

    it('should update color attribute when color picker changes', async () => {
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

      // Find the fill attribute color input
      const fillField = inspector.shadowRoot?.querySelector('[data-attribute-name="fill"]');
      const colorInput = fillField?.querySelector('input[type="color"]') as HTMLInputElement;
      
      expect(colorInput).toBeDefined();

      // Change the color (color picker uses 'change' event, not 'input')
      colorInput.value = '#00ff00';
      colorInput.dispatchEvent(new Event('change', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Check that the element attribute was updated
      expect(rect.getAttribute('fill')).toBe('#00ff00');
    });
  });

  describe('Selection Changes', () => {
    it('should update display when selection changes', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('width', '100');
      svg.appendChild(rect);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('id', 'circle1');
      circle.setAttribute('r', '50');
      svg.appendChild(circle);

      const rectNode: DocumentNode = {
        id: 'rect1',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([
          ['id', 'rect1'],
          ['width', '100'],
        ]),
        children: [],
        element: rect,
      };

      const circleNode: DocumentNode = {
        id: 'circle1',
        type: 'element',
        tagName: 'circle',
        attributes: new Map([
          ['id', 'circle1'],
          ['r', '50'],
        ]),
        children: [],
        element: circle,
      };

      documentStateUpdater.setDocument(svg, [rectNode, circleNode], svg.outerHTML);
      
      // Select rect first
      documentStateUpdater.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 50));

      let elementInfo = inspector.shadowRoot?.querySelector('.element-info');
      expect(elementInfo?.textContent).toContain('rect');

      // Change selection to circle
      documentStateUpdater.select(['circle1']);
      await new Promise(resolve => setTimeout(resolve, 50));

      elementInfo = inspector.shadowRoot?.querySelector('.element-info');
      expect(elementInfo?.textContent).toContain('circle');
    });

    it('should clear display when selection is cleared', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'test-rect');
      svg.appendChild(rect);

      const node: DocumentNode = {
        id: 'test-rect',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([['id', 'test-rect']]),
        children: [],
        element: rect,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-rect']);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should show element info
      let elementInfo = inspector.shadowRoot?.querySelector('.element-info');
      expect(elementInfo).toBeDefined();

      // Clear selection
      documentStateUpdater.clearSelection();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should show empty state
      const emptyState = inspector.shadowRoot?.querySelector('.empty-state');
      expect(emptyState).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle elements with many attributes', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Add many attributes
      const attrs = new Map<string, string>();
      attrs.set('id', 'test-path');
      attrs.set('d', 'M 10 10 L 100 100');
      attrs.set('fill', '#ff0000');
      attrs.set('stroke', '#000000');
      attrs.set('stroke-width', '2');
      attrs.set('opacity', '0.8');
      attrs.set('transform', 'rotate(45)');
      
      attrs.forEach((value, key) => {
        path.setAttribute(key, value);
      });
      svg.appendChild(path);

      const node: DocumentNode = {
        id: 'test-path',
        type: 'element',
        tagName: 'path',
        attributes: attrs,
        children: [],
        element: path,
      };

      documentStateUpdater.setDocument(svg, [node], svg.outerHTML);
      documentStateUpdater.select(['test-path']);

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should display all attributes
      const currentAttrs = inspector.getCurrentAttributes();
      expect(currentAttrs.size).toBe(attrs.size);
    });

    it('should handle rapid selection changes', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      const elements: SVGElement[] = [];
      const nodes: DocumentNode[] = [];
      
      for (let i = 0; i < 10; i++) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('id', `rect${i}`);
        svg.appendChild(rect);
        elements.push(rect);
        
        nodes.push({
          id: `rect${i}`,
          type: 'element',
          tagName: 'rect',
          attributes: new Map([['id', `rect${i}`]]),
          children: [],
          element: rect,
        });
      }

      documentStateUpdater.setDocument(svg, nodes, svg.outerHTML);

      // Rapidly change selection
      for (let i = 0; i < 10; i++) {
        documentStateUpdater.select([`rect${i}`]);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should display the last selected element
      const elementInfo = inspector.shadowRoot?.querySelector('.element-info');
      expect(elementInfo?.textContent).toContain('rect9');
    });
  });
});
