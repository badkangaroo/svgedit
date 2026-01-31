/**
 * Utility for loading test.svg in tests
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Load the test.svg file content
 * This file is located at the project root
 */
export function loadTestSVG(): string {
  const testSvgPath = resolve(__dirname, '../../../../test.svg');
  return readFileSync(testSvgPath, 'utf-8');
}

/**
 * Parse test.svg and return element count for verification
 */
export function getTestSVGElementCount(svgContent: string): number {
  // Simple regex count - not perfect but good for testing
  const matches = svgContent.match(/<(rect|circle|ellipse|line|polyline|polygon|path|text|image|g)\s/g);
  return matches ? matches.length : 0;
}

/**
 * Extract specific element by id from SVG content
 */
export function getElementByIdFromSVG(svgContent: string, id: string): string | null {
  const regex = new RegExp(`<[^>]*id="${id}"[^>]*>`, 'i');
  const match = svgContent.match(regex);
  return match ? match[0] : null;
}

/**
 * Check if SVG contains specific element type
 */
export function hasElementType(svgContent: string, tagName: string): boolean {
  const regex = new RegExp(`<${tagName}\\s`, 'i');
  return regex.test(svgContent);
}
