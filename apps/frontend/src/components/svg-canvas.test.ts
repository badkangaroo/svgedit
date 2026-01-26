/**
 * Unit tests for SVG Canvas Component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './svg-canvas';
import { SVGCanvas } from './svg-canvas';
import { documentStateUpdater } from '../state/document-state';
import { selectionManager } from '../state/selection-manager';

describe('SVGCanvas Component', () => {
  let canvas: SVGCanvas;

  beforeEach(() => {
    canvas = document.createElement('svg-canvas') as SVGCanvas;
    document.body.appendChild(canvas);
    documentStateUpdater.clearDocument();
    selectionManager.clearSelection();
  });

  afterEach(() => {
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  });

  describe('Component Initialization', () => {
    it('should create a canvas element', () => {
      expect(canvas).toBeInstanceOf(SVGCanvas);
      expect(canvas.tagName).toBe('SVG-CANVAS');
    });

    it('should have a shadow root', () => {
      expect(canvas.shadowRoot).not.toBeNull();
    });

    it('should render the canvas container', () => {
      const container = canvas.shadowRoot?.querySelector('.canvas-container');
      expect(container).not.toBeNull();
    });

    it('should show empty state when no document is loaded', () => {
      const emptyState = canvas.shadowRoot?.querySelector('.empty-state');
      expect(emptyState).not.toBeNull();
    });
  });

  describe('SVG Document Rendering', () => {
    it('should render an SVG document when state is updated', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100');
      svg.setAttribute('height', '100');

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '10');
      rect.setAttribute('width', '80');
      rect.setAttribute('height', '80');
      svg.appendChild(rect);

      documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');
      await new Promise(resolve => setTimeout(resolve, 10));

      const renderedSVG = canvas.shadowRoot?.querySelector('.svg-content');
      expect(renderedSVG).not.toBeNull();
      expect(renderedSVG?.tagName.toLowerCase()).toBe('svg');
    });

    it('should create a selection overlay', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100');
      svg.setAttribute('height', '100');

      documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');
      await new Promise(resolve => setTimeout(resolve, 10));

      const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
      expect(overlay).not.toBeNull();
      expect(overlay?.tagName.toLowerCase()).toBe('svg');
    });
  });

  describe('Selection Visual Indicators', () => {
    let svg: SVGElement;
    let rect: SVGElement;

    beforeEach(async () => {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '200');
      svg.setAttribute('height', '200');

      rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('x', '50');
      rect.setAttribute('y', '50');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '80');
      svg.appendChild(rect);

      documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should show selection outline when element is selected', async () => {
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 10));

      const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
      const outline = overlay?.querySelector('.selection-outline');
      expect(outline).not.toBeNull();
    });

    it('should show selection handles when element is selected', async () => {
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 10));

      const overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
      const handles = overlay?.querySelectorAll('.selection-handle');
      expect(handles?.length).toBe(4);
    });

    it('should remove selection visuals when selection is cleared', async () => {
      selectionManager.select(['rect1']);
      await new Promise(resolve => setTimeout(resolve, 10));

      let overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
      expect(overlay?.querySelector('.selection-outline')).not.toBeNull();

      selectionManager.clearSelection();
      await new Promise(resolve => setTimeout(resolve, 10));

      overlay = canvas.shadowRoot?.querySelector('.selection-overlay');
      expect(overlay?.querySelector('.selection-outline')).toBeNull();
    });
  });

  describe('Reactive Updates', () => {
    it('should update when document state changes', async () => {
      expect(canvas.shadowRoot?.querySelector('.empty-state')).not.toBeNull();

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100');
      svg.setAttribute('height', '100');
      
      documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(canvas.shadowRoot?.querySelector('.svg-content')).not.toBeNull();
      expect(canvas.shadowRoot?.querySelector('.empty-state')).toBeNull();
    });
  });
});
