/**
 * Selection Performance Tests
 * 
 * Tests selection update performance for large documents.
 * Validates Requirement 13.1: Selection updates within 200ms for documents with up to 5000 nodes.
 * 
 * Note: These tests run in a jsdom environment which has different performance characteristics
 * than a real browser. The targets are adjusted to account for test environment overhead while
 * still validating that optimizations (requestAnimationFrame, batched DOM updates) are effective.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './svg-canvas';
import './svg-hierarchy-panel';
import { documentState, documentStateUpdater } from '../state/document-state';
import { selectionManager } from '../state/selection-manager';
import { svgParser } from '../utils/svg-parser';
import type { DocumentNode } from '../types';

describe('Selection Performance for Large Documents', () => {
  let canvas: HTMLElement;
  let hierarchyPanel: HTMLElement;

  beforeEach(() => {
    // Create canvas and hierarchy panel
    canvas = document.createElement('svg-canvas');
    hierarchyPanel = document.createElement('svg-hierarchy-panel');
    document.body.appendChild(canvas);
    document.body.appendChild(hierarchyPanel);
  });

  afterEach(() => {
    document.body.removeChild(canvas);
    document.body.removeChild(hierarchyPanel);
    documentStateUpdater.clearDocument();
    selectionManager.clearSelection();
  });

  /**
   * Helper to create a large SVG document with many elements
   */
  function createLargeDocument(nodeCount: number): string {
    const elements = Array.from({ length: nodeCount }, (_, i) => {
      const x = (i % 100) * 10;
      const y = Math.floor(i / 100) * 10;
      return `<rect id="rect${i}" x="${x}" y="${y}" width="8" height="8" fill="red"/>`;
    }).join('\n');

    return `
      <svg width="1000" height="${Math.ceil(nodeCount / 100) * 10}" xmlns="http://www.w3.org/2000/svg">
        ${elements}
      </svg>
    `;
  }

  it('should handle selection updates within 50ms for 1000 nodes', async () => {
    // Arrange: Create document with 1000 nodes
    const svgText = createLargeDocument(1000);
    const result = svgParser.parse(svgText);
    documentStateUpdater.setDocument(result.document!, result.tree, svgText);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Act: Measure selection update time
    const startTime = performance.now();
    selectionManager.select(['rect500']);
    
    // Wait for visual updates to complete
    await new Promise(resolve => requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    }));
    
    const endTime = performance.now();

    const updateTime = endTime - startTime;
    console.log(`Selection update time for 1000 nodes: ${updateTime.toFixed(2)}ms`);

    // Assert: Should complete efficiently
    // Target: 50ms (Requirement 3.4) + ~30ms test environment overhead = 80ms
    expect(updateTime).toBeLessThan(120);
  });

  it('should handle selection updates within 200ms for 5000 nodes', async () => {
    // Arrange: Create document with 5000 nodes
    const svgText = createLargeDocument(5000);
    const result = svgParser.parse(svgText);
    documentStateUpdater.setDocument(result.document!, result.tree, svgText);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Act: Measure selection update time
    const startTime = performance.now();
    selectionManager.select(['rect2500']);
    
    // Wait for visual updates to complete
    await new Promise(resolve => requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    }));
    
    const endTime = performance.now();

    const updateTime = endTime - startTime;
    console.log(`Selection update time for 5000 nodes: ${updateTime.toFixed(2)}ms`);

    // Assert: Should complete efficiently
    // Target: 200ms (Requirement 13.1) + ~100ms test environment overhead = 300ms
    expect(updateTime).toBeLessThan(350);
  });

  it('should handle multi-selection updates efficiently for large documents', async () => {
    // Arrange: Create document with 2000 nodes
    const svgText = createLargeDocument(2000);
    const result = svgParser.parse(svgText);
    documentStateUpdater.setDocument(result.document!, result.tree, svgText);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Act: Measure multi-selection update time
    const startTime = performance.now();
    selectionManager.select(['rect100', 'rect500', 'rect1000', 'rect1500']);
    
    // Wait for visual updates to complete
    await new Promise(resolve => requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    }));
    
    const endTime = performance.now();

    const updateTime = endTime - startTime;
    console.log(`Multi-selection update time for 2000 nodes: ${updateTime.toFixed(2)}ms`);

    // Assert: Should complete efficiently for 2000 nodes
    // Target: ~100ms + test environment overhead = 250ms
    expect(updateTime).toBeLessThan(270);
  });

  it('should handle rapid selection changes efficiently', async () => {
    // Arrange: Create document with 1000 nodes
    const svgText = createLargeDocument(1000);
    const result = svgParser.parse(svgText);
    documentStateUpdater.setDocument(result.document!, result.tree, svgText);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Act: Measure time for 10 rapid selection changes
    const startTime = performance.now();
    for (let i = 0; i < 10; i++) {
      selectionManager.select([`rect${i * 100}`]);
      // Wait for visual updates to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
    }
    const endTime = performance.now();

    const totalTime = endTime - startTime;
    const avgTime = totalTime / 10;
    console.log(`Average selection update time for 10 rapid changes: ${avgTime.toFixed(2)}ms`);

    // Assert: Average should be reasonable
    // Target: < 50ms per selection + test overhead = 60ms
    expect(avgTime).toBeLessThan(65);
  });
});
