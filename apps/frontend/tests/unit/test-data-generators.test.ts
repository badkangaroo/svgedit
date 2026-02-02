import { describe, it, expect } from 'vitest';
import { generateTestSVG, generateLargeSVG, generateAttributeTestSVG, generateSimpleTestSVG } from '../helpers/test-data-generators';

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

  // Task 6.2: Validation tests for generated SVG
  describe('SVG Structure and UUID Validation', () => {
    describe('generateTestSVG - UUID validation', () => {
      it('should include data-uuid on root svg element', () => {
        const svg = generateTestSVG();
        expect(svg).toMatch(/<svg[^>]*data-uuid="[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"/);
      });

      it('should include data-uuid on all child elements', () => {
        const svg = generateTestSVG();
        
        // Verify each element has data-uuid
        expect(svg).toMatch(/id="test-rect"[^>]*data-uuid="[0-9a-f-]{36}"/);
        expect(svg).toMatch(/id="test-circle"[^>]*data-uuid="[0-9a-f-]{36}"/);
        expect(svg).toMatch(/id="test-ellipse"[^>]*data-uuid="[0-9a-f-]{36}"/);
        expect(svg).toMatch(/id="test-line"[^>]*data-uuid="[0-9a-f-]{36}"/);
        expect(svg).toMatch(/id="test-text"[^>]*data-uuid="[0-9a-f-]{36}"/);
        expect(svg).toMatch(/id="test-group"[^>]*data-uuid="[0-9a-f-]{36}"/);
      });

      it('should include data-uuid on nested group elements', () => {
        const svg = generateTestSVG();
        
        // Verify nested elements in group have data-uuid
        expect(svg).toMatch(/id="group-rect"[^>]*data-uuid="[0-9a-f-]{36}"/);
        expect(svg).toMatch(/id="group-circle"[^>]*data-uuid="[0-9a-f-]{36}"/);
      });

      it('should generate unique UUIDs for each element', () => {
        const svg = generateTestSVG();
        
        // Extract all UUIDs
        const uuidRegex = /data-uuid="([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})"/g;
        const matches = [...svg.matchAll(uuidRegex)];
        const uuids = matches.map(m => m[1]);
        
        // Verify we have UUIDs
        expect(uuids.length).toBeGreaterThan(0);
        
        // Verify all UUIDs are unique
        const uniqueUuids = new Set(uuids);
        expect(uniqueUuids.size).toBe(uuids.length);
      });

      it('should generate valid UUID v4 format', () => {
        const svg = generateTestSVG();
        
        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        // where y is one of [8, 9, a, b]
        const uuidV4Regex = /data-uuid="[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"/g;
        const matches = svg.match(uuidV4Regex);
        
        expect(matches).not.toBeNull();
        expect(matches!.length).toBeGreaterThan(0);
      });
    });

    describe('generateLargeSVG - UUID validation', () => {
      it('should include data-uuid on root svg element', () => {
        const svg = generateLargeSVG(5);
        expect(svg).toMatch(/<svg[^>]*data-uuid="[0-9a-f-]{36}"/);
      });

      it('should include data-uuid on all generated rectangles', () => {
        const count = 10;
        const svg = generateLargeSVG(count);
        
        // Count data-uuid occurrences (should be count + 1 for svg root)
        const uuidMatches = svg.match(/data-uuid="/g);
        expect(uuidMatches).not.toBeNull();
        expect(uuidMatches!.length).toBe(count + 1);
      });

      it('should generate unique UUIDs for large documents', () => {
        const count = 50;
        const svg = generateLargeSVG(count);
        
        // Extract all UUIDs
        const uuidRegex = /data-uuid="([0-9a-f-]{36})"/g;
        const matches = [...svg.matchAll(uuidRegex)];
        const uuids = matches.map(m => m[1]);
        
        // Verify all UUIDs are unique
        const uniqueUuids = new Set(uuids);
        expect(uniqueUuids.size).toBe(uuids.length);
        expect(uniqueUuids.size).toBe(count + 1); // +1 for svg root
      });

      it('should maintain UUID format consistency across all elements', () => {
        const svg = generateLargeSVG(20);
        
        // Verify all UUIDs match v4 format
        const uuidV4Regex = /data-uuid="([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})"/g;
        const matches = [...svg.matchAll(uuidV4Regex)];
        
        // Should have 21 UUIDs (20 rects + 1 svg root)
        expect(matches.length).toBe(21);
      });
    });

    describe('generateSimpleTestSVG - UUID validation', () => {
      it('should include data-uuid on all elements', () => {
        const svg = generateSimpleTestSVG();
        
        // Should have 2 UUIDs (svg root + rect)
        const uuidMatches = svg.match(/data-uuid="/g);
        expect(uuidMatches).not.toBeNull();
        expect(uuidMatches!.length).toBe(2);
      });

      it('should generate valid UUIDs', () => {
        const svg = generateSimpleTestSVG();
        
        const uuidV4Regex = /data-uuid="[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"/g;
        const matches = svg.match(uuidV4Regex);
        
        expect(matches).not.toBeNull();
        expect(matches!.length).toBe(2);
      });
    });

    describe('generateAttributeTestSVG - UUID validation', () => {
      it('should include data-uuid on all elements', () => {
        const svg = generateAttributeTestSVG();
        
        // Should have 4 UUIDs (svg root + 3 elements)
        const uuidMatches = svg.match(/data-uuid="/g);
        expect(uuidMatches).not.toBeNull();
        expect(uuidMatches!.length).toBe(4);
      });

      it('should include data-uuid on elements with complex attributes', () => {
        const svg = generateAttributeTestSVG();
        
        // Verify elements with transforms, opacity, etc. still have UUIDs
        expect(svg).toMatch(/id="attr-rect"[^>]*data-uuid="[0-9a-f-]{36}"/);
        expect(svg).toMatch(/id="attr-circle"[^>]*data-uuid="[0-9a-f-]{36}"/);
        expect(svg).toMatch(/id="attr-text"[^>]*data-uuid="[0-9a-f-]{36}"/);
      });

      it('should generate unique UUIDs', () => {
        const svg = generateAttributeTestSVG();
        
        const uuidRegex = /data-uuid="([0-9a-f-]{36})"/g;
        const matches = [...svg.matchAll(uuidRegex)];
        const uuids = matches.map(m => m[1]);
        
        const uniqueUuids = new Set(uuids);
        expect(uniqueUuids.size).toBe(uuids.length);
      });
    });

    describe('SVG Structure Validation', () => {
      it('should generate well-formed XML structure', () => {
        const svg = generateTestSVG();
        
        // Basic XML structure checks
        expect(svg).toMatch(/^<svg/);
        expect(svg).toMatch(/<\/svg>$/);
        expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      });

      it('should properly nest elements', () => {
        const svg = generateTestSVG();
        
        // Verify group contains nested elements
        const groupMatch = svg.match(/<g[^>]*id="test-group"[^>]*>([\s\S]*?)<\/g>/);
        expect(groupMatch).not.toBeNull();
        
        const groupContent = groupMatch![1];
        expect(groupContent).toContain('id="group-rect"');
        expect(groupContent).toContain('id="group-circle"');
      });

      it('should include required SVG attributes', () => {
        const svg = generateTestSVG();
        
        // Verify svg element has required attributes
        expect(svg).toMatch(/<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
        expect(svg).toMatch(/<svg[^>]*width="/);
        expect(svg).toMatch(/<svg[^>]*height="/);
      });

      it('should generate parseable SVG for large documents', () => {
        const svg = generateLargeSVG(100);
        
        // Basic structure validation
        expect(svg).toMatch(/^<svg/);
        expect(svg).toMatch(/<\/svg>$/);
        
        // Verify no unclosed tags
        const openTags = (svg.match(/<rect/g) || []).length;
        const closeTags = (svg.match(/\/>/g) || []).length;
        expect(openTags).toBe(closeTags);
      });
    });

    describe('UUID Consistency Across Multiple Generations', () => {
      it('should generate different UUIDs on each call', () => {
        const svg1 = generateTestSVG();
        const svg2 = generateTestSVG();
        
        // Extract first UUID from each
        const uuid1Match = svg1.match(/data-uuid="([0-9a-f-]{36})"/);
        const uuid2Match = svg2.match(/data-uuid="([0-9a-f-]{36})"/);
        
        expect(uuid1Match).not.toBeNull();
        expect(uuid2Match).not.toBeNull();
        
        // UUIDs should be different
        expect(uuid1Match![1]).not.toBe(uuid2Match![1]);
      });

      it('should maintain UUID uniqueness across multiple large SVG generations', () => {
        const svg1 = generateLargeSVG(10);
        const svg2 = generateLargeSVG(10);
        
        // Extract all UUIDs from both
        const uuidRegex = /data-uuid="([0-9a-f-]{36})"/g;
        const uuids1 = [...svg1.matchAll(uuidRegex)].map(m => m[1]);
        const uuids2 = [...svg2.matchAll(uuidRegex)].map(m => m[1]);
        
        // No UUID should appear in both sets
        const intersection = uuids1.filter(uuid => uuids2.includes(uuid));
        expect(intersection.length).toBe(0);
      });
    });
  });
});
