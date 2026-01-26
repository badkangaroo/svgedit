/**
 * SVG Parser Worker Tests
 * 
 * Tests for Web Worker-based SVG parsing
 * 
 * Note: These tests verify the worker logic and fallback behavior.
 * In the jsdom test environment, Worker is not available, so the code
 * falls back to main thread parsing. We use small documents to keep tests fast.
 * 
 * The actual worker functionality should be tested in browser-based E2E tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SVGParser } from './svg-parser';

describe('SVGParser Worker', () => {
  let parser: SVGParser;

  beforeEach(() => {
    parser = new SVGParser();
  });

  describe('parseInWorker', () => {
    it('should use regular parse for small documents (< 1MB)', async () => {
      const smallSVG = '<svg><rect x="0" y="0" width="100" height="100" /></svg>';
      
      const result = await parser.parseInWorker(smallSVG);
      
      expect(result.success).toBe(true);
      expect(result.document).toBeTruthy();
      expect(result.tree.length).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it('should detect Worker availability and fall back gracefully', async () => {
      // In jsdom, Worker is not available, so this tests the fallback
      const smallSVG = '<svg><rect x="0" y="0" width="100" height="100" /></svg>';
      const result = await parser.parseInWorker(smallSVG);
      expect(result.success).toBe(true);
      
      // The implementation should check for Worker availability before trying to use it
      // This prevents slow error handling in test environments
    });

    it('should handle progress callback parameter', async () => {
      const smallSVG = '<svg><circle cx="50" cy="50" r="40" /></svg>';
      const progressUpdates: Array<{ percent: number; message: string }> = [];
      
      const result = await parser.parseInWorker(smallSVG, (percent, message) => {
        progressUpdates.push({ percent, message });
      });
      
      expect(result.success).toBe(true);
      
      // In test environment, Worker is not available, so no progress updates
      // In real browser with large documents, progress updates would be sent
    });

    it('should handle invalid SVG', async () => {
      const invalidSVG = '<svg><rect><invalid></rect></svg>';
      
      const result = await parser.parseInWorker(invalidSVG);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle non-SVG root element', async () => {
      const nonSVG = '<div><rect x="0" y="0" width="100" height="100" /></div>';
      
      const result = await parser.parseInWorker(nonSVG);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Root element must be <svg>');
    });

    it('should successfully parse valid SVG', async () => {
      const validSVG = '<svg><circle cx="50" cy="50" r="40" /></svg>';
      
      const result = await parser.parseInWorker(validSVG);
      
      expect(result.success).toBe(true);
      expect(result.document).toBeTruthy();
      expect(result.tree.length).toBe(1);
    });
  });
});
