import { describe, it, expect } from 'vitest';
import { generateTestSVG, generateLargeSVG, generateAttributeTestSVG } from '../helpers/test-data-generators';

describe('Test Data Generators', () => {
  describe('generateTestSVG', () => {
    it('should generate a valid SVG string', () => {
      const svg = generateTestSVG();
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('width="800"');
      expect(svg).toContain('height="600"');
    });

    it('should contain expected elements', () => {
      const svg = generateTestSVG();
      expect(svg).toContain('id="test-rect"');
      expect(svg).toContain('id="test-circle"');
      expect(svg).toContain('id="test-ellipse"');
      expect(svg).toContain('id="test-line"');
      expect(svg).toContain('id="test-text"');
      expect(svg).toContain('id="test-group"');
    });
  });

  describe('generateLargeSVG', () => {
    it('should generate correct number of elements', () => {
      const count = 10;
      const svg = generateLargeSVG(count);
      
      // Count occurrences of <rect
      const rectCount = (svg.match(/<rect/g) || []).length;
      expect(rectCount).toBe(count);
    });

    it('should generate unique IDs', () => {
      const svg = generateLargeSVG(5);
      expect(svg).toContain('id="rect-0"');
      expect(svg).toContain('id="rect-4"');
    });

    it('should adjust dimensions based on count', () => {
      const svg = generateLargeSVG(100); // 10x10 grid
      // Implementation enforces min width/height of 1000
      expect(svg).toContain('width="1000"');
      expect(svg).toContain('height="1000"');
    });
  });

  describe('generateAttributeTestSVG', () => {
    it('should generate elements with specific attributes', () => {
      const svg = generateAttributeTestSVG();
      expect(svg).toContain('opacity="0.5"');
      expect(svg).toContain('transform="rotate(45 100 100)"');
      expect(svg).toContain('stroke-width="5"');
      expect(svg).toContain('font-family="serif"');
    });
  });
});
