/**
 * Worker Progress Indicator Tests
 * 
 * Tests that verify progress indicators are displayed and updated
 * during worker operations.
 * 
 * Note: In jsdom test environment, Workers are not available, so these tests
 * verify the fallback behavior and progress indicator logic. The actual worker
 * progress updates should be tested in browser-based E2E tests.
 * 
 * Requirements: 14.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadingIndicator } from '../utils/loading-indicator';
import { svgParser } from '../utils/svg-parser';
import { transformEngine } from '../state/transform-engine';
import { documentState } from '../state/document-state';

describe('Worker Progress Indicators', () => {
  beforeEach(() => {
    // Clean up any existing indicators
    loadingIndicator.reset();
    
    // Clear document body
    document.body.innerHTML = '';
  });

  afterEach(() => {
    loadingIndicator.reset();
  });

  describe('SVG Parser Worker Progress', () => {
    it('should handle large SVG parsing with progress callback', async () => {
      // Create a large SVG (> 1MB) to trigger worker usage
      // Note: In test environment, Worker is not available, so this tests fallback
      const largeElement = '<rect x="0" y="0" width="100" height="100" fill="red"/>\n'.repeat(50000);
      const largeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">\n${largeElement}</svg>`;
      
      // Verify size is > 1MB
      const sizeInMB = new Blob([largeSVG]).size / (1024 * 1024);
      expect(sizeInMB).toBeGreaterThan(1);
      
      // Track progress updates
      const progressUpdates: Array<{ percent: number; message: string }> = [];
      
      // Parse with progress callback
      // In test environment, falls back to main thread parsing
      const result = await svgParser.parseInWorker(largeSVG, (percent, message) => {
        progressUpdates.push({ percent, message });
      });
      
      // Verify parsing succeeded (via fallback)
      expect(result.success).toBe(true);
      
      // In test environment with fallback, no progress updates are sent
      // In real browser with Worker, progress updates would be received
      // This test verifies the code doesn't crash with the callback
    });

    it('should not use worker for small documents', async () => {
      // Create a small SVG (< 1MB)
      const smallSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="0" y="0" width="50" height="50" fill="blue"/></svg>';
      
      // Verify size is < 1MB
      const sizeInMB = new Blob([smallSVG]).size / (1024 * 1024);
      expect(sizeInMB).toBeLessThan(1);
      
      const progressUpdates: number[] = [];
      
      // Parse (should use main thread, not worker)
      const result = await svgParser.parseInWorker(smallSVG, (percent) => {
        progressUpdates.push(percent);
      });
      
      // Verify parsing succeeded
      expect(result.success).toBe(true);
      
      // Should not have progress updates (main thread parsing)
      expect(progressUpdates.length).toBe(0);
    });
  });

  describe('Transform Worker Progress', () => {
    it('should handle large document transformations', async () => {
      // Create a large document (> 5000 nodes) to trigger worker usage
      // Note: In test environment, Worker is not available, so this tests fallback
      const elements: string[] = [];
      for (let i = 0; i < 5100; i++) {
        elements.push(`<rect id="rect-${i}" x="${i % 100}" y="${Math.floor(i / 100)}" width="10" height="10" fill="red"/>`);
      }
      const largeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">\n${elements.join('\n')}\n</svg>`;
      
      // Parse and set document state
      const result = svgParser.parse(largeSVG);
      if (result.success && result.document) {
        documentState.svgDocument.set(result.document);
        documentState.documentTree.set(result.tree);
        documentState.rawSVG.set(largeSVG);
      }
      
      // Get some element IDs to move
      const elementIds = ['rect-0', 'rect-1', 'rect-2'];
      
      // Move operation (in test environment, falls back to main thread)
      const operation = transformEngine.move(elementIds, 10, 20);
      
      expect(operation.type).toBe('move');
      expect(operation.description).toContain('Move');
      
      // Wait for any async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should not use worker for small documents', () => {
      // Create a small document (< 5000 nodes)
      const smallSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect id="rect-1" x="0" y="0" width="50" height="50" fill="blue"/></svg>';
      
      const result = svgParser.parse(smallSVG);
      if (result.success && result.document) {
        documentState.svgDocument.set(result.document);
        documentState.documentTree.set(result.tree);
        documentState.rawSVG.set(smallSVG);
      }
      
      // Move operation should use main thread (no worker)
      const operation = transformEngine.move(['rect-1'], 10, 20);
      
      expect(operation.type).toBe('move');
      
      // Should not show progress indicator for small documents
      expect(loadingIndicator.getActiveCount()).toBe(0);
    });
  });

  describe('Progress Indicator UI', () => {
    it('should show progress bar with percentage', async () => {
      const handle = loadingIndicator.show({
        type: 'progress',
        message: 'Processing...',
        progress: 0,
        delay: 0,
      });
      
      // Verify progress bar exists
      const progressBar = document.querySelector('.loading-progress-bar');
      expect(progressBar).toBeTruthy();
      
      // Verify initial progress
      const progressFill = document.querySelector('.loading-progress-fill') as HTMLElement;
      expect(progressFill?.style.width).toBe('0%');
      
      // Update progress
      handle.updateProgress(25);
      expect(progressFill?.style.width).toBe('25%');
      
      handle.updateProgress(50);
      expect(progressFill?.style.width).toBe('50%');
      
      handle.updateProgress(75);
      expect(progressFill?.style.width).toBe('75%');
      
      handle.updateProgress(100);
      expect(progressFill?.style.width).toBe('100%');
      
      handle.hide();
    });

    it('should update message during progress', async () => {
      const handle = loadingIndicator.show({
        type: 'progress',
        message: 'Starting...',
        delay: 0,
      });
      
      const container = document.getElementById('loading-indicator-container');
      expect(container?.textContent).toContain('Starting...');
      
      handle.updateMessage('Processing...');
      expect(container?.textContent).toContain('Processing...');
      
      handle.updateMessage('Finalizing...');
      expect(container?.textContent).toContain('Finalizing...');
      
      handle.hide();
    });

    it('should clamp progress values to 0-100 range', async () => {
      const handle = loadingIndicator.show({
        type: 'progress',
        progress: 0,
        delay: 0,
      });
      
      const progressFill = document.querySelector('.loading-progress-fill') as HTMLElement;
      
      // Test negative value
      handle.updateProgress(-10);
      expect(progressFill?.style.width).toBe('0%');
      
      // Test value > 100
      handle.updateProgress(150);
      expect(progressFill?.style.width).toBe('100%');
      
      handle.hide();
    });

    it('should display progress type indicator with proper styling', () => {
      const handle = loadingIndicator.show({
        type: 'progress',
        message: 'Loading...',
        progress: 50,
        delay: 0,
      });
      
      // Verify progress indicator has correct class
      const indicator = document.querySelector('.loading-indicator-progress');
      expect(indicator).toBeTruthy();
      
      // Verify progress bar structure
      const progressBar = document.querySelector('.loading-progress-bar');
      const progressFill = document.querySelector('.loading-progress-fill');
      const message = document.querySelector('.loading-message');
      
      expect(progressBar).toBeTruthy();
      expect(progressFill).toBeTruthy();
      expect(message).toBeTruthy();
      expect(message?.textContent).toBe('Loading...');
      
      handle.hide();
    });

    it('should handle multiple simultaneous progress indicators', () => {
      const handle1 = loadingIndicator.show({
        type: 'progress',
        message: 'Operation 1...',
        delay: 0,
      });
      
      const handle2 = loadingIndicator.show({
        type: 'progress',
        message: 'Operation 2...',
        delay: 0,
      });
      
      // Both should be visible
      expect(loadingIndicator.getActiveCount()).toBe(2);
      
      const container = document.getElementById('loading-indicator-container');
      expect(container?.textContent).toContain('Operation 1...');
      expect(container?.textContent).toContain('Operation 2...');
      
      // Hide first
      handle1.hide();
      expect(loadingIndicator.getActiveCount()).toBe(1);
      
      // Hide second
      handle2.hide();
      expect(loadingIndicator.getActiveCount()).toBe(0);
    });
  });
});
