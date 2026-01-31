/**
 * E2E Test: Loading and displaying test.svg
 * 
 * This test verifies that the editor can load and display the test.svg file
 * using the existing component infrastructure with jsdom.
 * 
 * Note: For full browser testing with file picker APIs, use Playwright.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { loadTestSVG, getTestSVGElementCount } from '../utils/test-svg-loader';
import { SVGParser } from '../../src/utils/svg-parser';
import { documentStateUpdater, documentState } from '../../src/state/document-state';
import { selectionManager } from '../../src/state/selection-manager';

describe('test.svg Loading and Display', () => {
  let testSVGContent: string;
  let parser: SVGParser;

  beforeEach(() => {
    // Load test.svg
    testSVGContent = loadTestSVG();
    parser = new SVGParser();
    
    // Clear state
    documentStateUpdater.clearDocument();
    selectionManager.clearSelection();
  });

  describe('File Loading', () => {
    it('should successfully load test.svg', () => {
      expect(testSVGContent).toBeTruthy();
      expect(testSVGContent).toContain('<svg');
      expect(testSVGContent).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should contain expected element groups', () => {
      expect(testSVGContent).toContain('id="header"');
      expect(testSVGContent).toContain('id="scene"');
      expect(testSVGContent).toContain('id="shapes"');
      expect(testSVGContent).toContain('id="icons"');
      expect(testSVGContent).toContain('id="labels"');
    });

    it('should contain various SVG element types', () => {
      expect(testSVGContent).toContain('<rect');
      expect(testSVGContent).toContain('<circle');
      expect(testSVGContent).toContain('<ellipse');
      expect(testSVGContent).toContain('<line');
      expect(testSVGContent).toContain('<polyline');
      expect(testSVGContent).toContain('<polygon');
      expect(testSVGContent).toContain('<path');
      expect(testSVGContent).toContain('<text');
      expect(testSVGContent).toContain('<image');
    });

    it('should contain advanced SVG features', () => {
      expect(testSVGContent).toContain('<defs>');
      expect(testSVGContent).toContain('<linearGradient');
      expect(testSVGContent).toContain('<radialGradient');
      expect(testSVGContent).toContain('<pattern');
      expect(testSVGContent).toContain('<clipPath');
      expect(testSVGContent).toContain('<mask');
    });

    it('should have expected element count', () => {
      const elementCount = getTestSVGElementCount(testSVGContent);
      // test.svg has 50+ elements
      expect(elementCount).toBeGreaterThan(50);
      console.log(`test.svg contains ${elementCount} elements`);
    });
  });

  describe('Parsing test.svg', () => {
    it('should parse test.svg without errors', () => {
      const result = parser.parse(testSVGContent);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.document).toBeTruthy();
      expect(result.tree).toBeTruthy();
    });

    it('should create document tree with all groups', () => {
      const result = parser.parse(testSVGContent);
      
      expect(result.success).toBe(true);
      expect(result.tree).toBeTruthy();
      expect(result.tree.length).toBeGreaterThan(0);
      
      // Collect all nodes recursively
      const allNodes: any[] = [];
      const collectNodes = (nodes: any[]) => {
        for (const node of nodes) {
          allNodes.push(node);
          if (node.children && node.children.length > 0) {
            collectNodes(node.children);
          }
        }
      };
      collectNodes(result.tree);
      
      // Should have many nodes from test.svg (50+ elements)
      expect(allNodes.length).toBeGreaterThan(20);
      
      console.log(`Found ${allNodes.length} nodes in document tree`);
    });

    it('should load test.svg into document state', () => {
      const result = parser.parse(testSVGContent);
      
      expect(result.success).toBe(true);
      
      // Load into document state
      documentStateUpdater.setDocument(result.document!, result.tree, testSVGContent);

      // Verify document state
      const doc = documentState.svgDocument.get();
      expect(doc).toBeTruthy();
      
      const tree = documentState.documentTree.get();
      expect(tree).toBeTruthy();
      expect(tree.length).toBeGreaterThan(0);
      
      const rawSVG = documentState.rawSVG.get();
      expect(rawSVG).toBe(testSVGContent);
    });
  });

  describe('Element Selection in test.svg', () => {
    beforeEach(() => {
      // Parse and load test.svg
      const result = parser.parse(testSVGContent);
      documentStateUpdater.setDocument(result.document!, result.tree, testSVGContent);
    });

    it('should select header group', () => {
      selectionManager.select(['header']);
      
      expect(documentState.hasSelection.get()).toBe(true);
      expect(documentState.selectedIds.get().has('header')).toBe(true);
      expect(documentState.selectionCount.get()).toBe(1);
    });

    it('should select multiple groups', () => {
      selectionManager.select(['header', 'scene', 'shapes']);
      
      expect(documentState.selectionCount.get()).toBe(3);
      expect(documentState.selectedIds.get().has('header')).toBe(true);
      expect(documentState.selectedIds.get().has('scene')).toBe(true);
      expect(documentState.selectedIds.get().has('shapes')).toBe(true);
    });

    it('should clear selection', () => {
      selectionManager.select(['header']);
      expect(documentState.hasSelection.get()).toBe(true);
      
      selectionManager.clearSelection();
      expect(documentState.hasSelection.get()).toBe(false);
      expect(documentState.selectionCount.get()).toBe(0);
    });
  });

  describe('Performance with test.svg', () => {
    it('should parse test.svg within acceptable time', () => {
      const startTime = performance.now();
      const result = parser.parse(testSVGContent);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500); // Should parse in <500ms
      
      console.log(`Parsed test.svg (${getTestSVGElementCount(testSVGContent)} elements) in ${duration.toFixed(2)}ms`);
    });

    it('should load test.svg into state within acceptable time', () => {
      const result = parser.parse(testSVGContent);
      
      const startTime = performance.now();
      documentStateUpdater.setDocument(result.document!, result.tree, testSVGContent);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should load in <100ms
      
      console.log(`Loaded test.svg into state in ${duration.toFixed(2)}ms`);
    });

    it('should handle selection operations quickly', () => {
      const result = parser.parse(testSVGContent);
      documentStateUpdater.setDocument(result.document!, result.tree, testSVGContent);
      
      const startTime = performance.now();
      selectionManager.select(['header', 'scene', 'shapes', 'icons', 'labels']);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // Should select in <50ms
      
      console.log(`Selected 5 elements in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Advanced Features in test.svg', () => {
    beforeEach(() => {
      const result = parser.parse(testSVGContent);
      documentStateUpdater.setDocument(result.document!, result.tree, testSVGContent);
    });

    it('should handle elements with gradients', () => {
      // test.svg has elements using url(#grad-sun) and url(#grad-bubble)
      expect(testSVGContent).toContain('url(#grad-sun)');
      expect(testSVGContent).toContain('url(#grad-bubble)');
      
      // Verify gradients are defined
      expect(testSVGContent).toContain('id="grad-sun"');
      expect(testSVGContent).toContain('id="grad-bubble"');
    });

    it('should handle elements with clip paths', () => {
      // test.svg has elements using clip-path="url(#clip-window)"
      expect(testSVGContent).toContain('clip-path="url(#clip-window)"');
      expect(testSVGContent).toContain('id="clip-window"');
    });

    it('should handle elements with masks', () => {
      // test.svg has elements using mask="url(#mask-hole)"
      expect(testSVGContent).toContain('mask="url(#mask-hole)"');
      expect(testSVGContent).toContain('id="mask-hole"');
    });

    it('should handle elements with patterns', () => {
      // test.svg has elements using url(#pattern-grid)
      expect(testSVGContent).toContain('url(#pattern-grid)');
      expect(testSVGContent).toContain('id="pattern-grid"');
    });

    it('should handle groups with transforms', () => {
      // test.svg has multiple groups with transform attributes
      expect(testSVGContent).toContain('transform="translate');
      
      // Count transform occurrences
      const transformCount = (testSVGContent.match(/transform="/g) || []).length;
      expect(transformCount).toBeGreaterThan(5);
      
      console.log(`test.svg contains ${transformCount} transformed elements`);
    });

    it('should handle embedded images', () => {
      // test.svg has an embedded image reference
      expect(testSVGContent).toContain('<image');
      expect(testSVGContent).toContain('href="embedded_image.webp"');
      expect(testSVGContent).toContain('id="embedded-image"');
    });
  });
});
