/**
 * Unit tests for bounding box calculations.
 * 
 * Tests cover:
 * - Basic shape bounding boxes (rect, circle, ellipse, line)
 * - Edge cases (zero dimensions, negative coordinates)
 * - Boundary conditions
 */

import { describe, it, expect } from 'vitest';
import {
  bboxRect,
  bboxCircle,
  bboxEllipse,
  bboxLine,
  bboxPath,
  bboxGroup,
  bboxTransform,
  type BoundingBox,
} from './bbox.js';

describe('bboxRect', () => {
  it('should calculate bounding box for a standard rectangle', () => {
    const bbox = bboxRect(10, 20, 100, 50);
    
    expect(bbox).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
  });
  
  it('should handle rectangle at origin', () => {
    const bbox = bboxRect(0, 0, 100, 100);
    
    expect(bbox).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  });
  
  it('should handle rectangle with negative coordinates', () => {
    const bbox = bboxRect(-50, -30, 100, 60);
    
    expect(bbox).toEqual({
      x: -50,
      y: -30,
      width: 100,
      height: 60,
    });
  });
  
  it('should handle rectangle with zero width', () => {
    const bbox = bboxRect(10, 20, 0, 50);
    
    expect(bbox).toEqual({
      x: 10,
      y: 20,
      width: 0,
      height: 50,
    });
  });
  
  it('should handle rectangle with zero height', () => {
    const bbox = bboxRect(10, 20, 100, 0);
    
    expect(bbox).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 0,
    });
  });
  
  it('should handle rectangle with zero dimensions', () => {
    const bbox = bboxRect(10, 20, 0, 0);
    
    expect(bbox).toEqual({
      x: 10,
      y: 20,
      width: 0,
      height: 0,
    });
  });
  
  it('should handle very large rectangles', () => {
    const bbox = bboxRect(0, 0, 10000, 10000);
    
    expect(bbox).toEqual({
      x: 0,
      y: 0,
      width: 10000,
      height: 10000,
    });
  });
  
  it('should handle very small rectangles', () => {
    const bbox = bboxRect(0, 0, 0.001, 0.001);
    
    expect(bbox).toEqual({
      x: 0,
      y: 0,
      width: 0.001,
      height: 0.001,
    });
  });
});

describe('bboxCircle', () => {
  it('should calculate bounding box for a standard circle', () => {
    const bbox = bboxCircle(50, 50, 25);
    
    expect(bbox).toEqual({
      x: 25,
      y: 25,
      width: 50,
      height: 50,
    });
  });
  
  it('should handle circle at origin', () => {
    const bbox = bboxCircle(0, 0, 10);
    
    expect(bbox).toEqual({
      x: -10,
      y: -10,
      width: 20,
      height: 20,
    });
  });
  
  it('should handle circle with negative center coordinates', () => {
    const bbox = bboxCircle(-50, -30, 20);
    
    expect(bbox).toEqual({
      x: -70,
      y: -50,
      width: 40,
      height: 40,
    });
  });
  
  it('should handle circle with zero radius', () => {
    const bbox = bboxCircle(50, 50, 0);
    
    expect(bbox).toEqual({
      x: 50,
      y: 50,
      width: 0,
      height: 0,
    });
  });
  
  it('should handle very large circle', () => {
    const bbox = bboxCircle(0, 0, 5000);
    
    expect(bbox).toEqual({
      x: -5000,
      y: -5000,
      width: 10000,
      height: 10000,
    });
  });
  
  it('should handle very small circle', () => {
    const bbox = bboxCircle(0, 0, 0.5);
    
    expect(bbox).toEqual({
      x: -0.5,
      y: -0.5,
      width: 1,
      height: 1,
    });
  });
  
  it('should produce square bounding box', () => {
    const bbox = bboxCircle(100, 100, 30);
    
    // Circle bounding box should always be square
    expect(bbox.width).toBe(bbox.height);
  });
});

describe('bboxEllipse', () => {
  it('should calculate bounding box for a standard ellipse', () => {
    const bbox = bboxEllipse(50, 50, 30, 20);
    
    expect(bbox).toEqual({
      x: 20,
      y: 30,
      width: 60,
      height: 40,
    });
  });
  
  it('should handle ellipse at origin', () => {
    const bbox = bboxEllipse(0, 0, 15, 10);
    
    expect(bbox).toEqual({
      x: -15,
      y: -10,
      width: 30,
      height: 20,
    });
  });
  
  it('should handle ellipse with negative center coordinates', () => {
    const bbox = bboxEllipse(-50, -30, 25, 15);
    
    expect(bbox).toEqual({
      x: -75,
      y: -45,
      width: 50,
      height: 30,
    });
  });
  
  it('should handle ellipse with zero horizontal radius', () => {
    const bbox = bboxEllipse(50, 50, 0, 20);
    
    expect(bbox).toEqual({
      x: 50,
      y: 30,
      width: 0,
      height: 40,
    });
  });
  
  it('should handle ellipse with zero vertical radius', () => {
    const bbox = bboxEllipse(50, 50, 30, 0);
    
    expect(bbox).toEqual({
      x: 20,
      y: 50,
      width: 60,
      height: 0,
    });
  });
  
  it('should handle ellipse with both radii zero', () => {
    const bbox = bboxEllipse(50, 50, 0, 0);
    
    expect(bbox).toEqual({
      x: 50,
      y: 50,
      width: 0,
      height: 0,
    });
  });
  
  it('should handle horizontal ellipse (rx > ry)', () => {
    const bbox = bboxEllipse(100, 100, 50, 25);
    
    expect(bbox).toEqual({
      x: 50,
      y: 75,
      width: 100,
      height: 50,
    });
    expect(bbox.width).toBeGreaterThan(bbox.height);
  });
  
  it('should handle vertical ellipse (ry > rx)', () => {
    const bbox = bboxEllipse(100, 100, 25, 50);
    
    expect(bbox).toEqual({
      x: 75,
      y: 50,
      width: 50,
      height: 100,
    });
    expect(bbox.height).toBeGreaterThan(bbox.width);
  });
  
  it('should handle circle as special case (rx = ry)', () => {
    const bbox = bboxEllipse(50, 50, 25, 25);
    
    expect(bbox).toEqual({
      x: 25,
      y: 25,
      width: 50,
      height: 50,
    });
    expect(bbox.width).toBe(bbox.height);
  });
});

describe('bboxLine', () => {
  it('should calculate bounding box for a standard line', () => {
    const bbox = bboxLine(10, 20, 100, 80);
    
    expect(bbox).toEqual({
      x: 10,
      y: 20,
      width: 90,
      height: 60,
    });
  });
  
  it('should handle line from origin', () => {
    const bbox = bboxLine(0, 0, 100, 100);
    
    expect(bbox).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  });
  
  it('should handle line with reversed endpoints (x2 < x1, y2 < y1)', () => {
    const bbox = bboxLine(100, 80, 10, 20);
    
    expect(bbox).toEqual({
      x: 10,
      y: 20,
      width: 90,
      height: 60,
    });
  });
  
  it('should handle horizontal line', () => {
    const bbox = bboxLine(10, 50, 100, 50);
    
    expect(bbox).toEqual({
      x: 10,
      y: 50,
      width: 90,
      height: 0,
    });
  });
  
  it('should handle vertical line', () => {
    const bbox = bboxLine(50, 10, 50, 100);
    
    expect(bbox).toEqual({
      x: 50,
      y: 10,
      width: 0,
      height: 90,
    });
  });
  
  it('should handle point (zero-length line)', () => {
    const bbox = bboxLine(50, 50, 50, 50);
    
    expect(bbox).toEqual({
      x: 50,
      y: 50,
      width: 0,
      height: 0,
    });
  });
  
  it('should handle line with negative coordinates', () => {
    const bbox = bboxLine(-50, -30, 50, 30);
    
    expect(bbox).toEqual({
      x: -50,
      y: -30,
      width: 100,
      height: 60,
    });
  });
  
  it('should handle line entirely in negative space', () => {
    const bbox = bboxLine(-100, -80, -10, -20);
    
    expect(bbox).toEqual({
      x: -100,
      y: -80,
      width: 90,
      height: 60,
    });
  });
  
  it('should handle diagonal line (45 degrees)', () => {
    const bbox = bboxLine(0, 0, 100, 100);
    
    expect(bbox).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    expect(bbox.width).toBe(bbox.height);
  });
  
  it('should handle very long line', () => {
    const bbox = bboxLine(0, 0, 10000, 10000);
    
    expect(bbox).toEqual({
      x: 0,
      y: 0,
      width: 10000,
      height: 10000,
    });
  });
  
  it('should handle very short line', () => {
    const bbox = bboxLine(0, 0, 0.001, 0.001);
    
    expect(bbox).toEqual({
      x: 0,
      y: 0,
      width: 0.001,
      height: 0.001,
    });
  });
});

describe('BoundingBox edge cases', () => {
  it('should handle floating point precision for circles', () => {
    const bbox = bboxCircle(0.1, 0.2, 0.3);
    
    expect(bbox.x).toBeCloseTo(-0.2, 10);
    expect(bbox.y).toBeCloseTo(-0.1, 10);
    expect(bbox.width).toBeCloseTo(0.6, 10);
    expect(bbox.height).toBeCloseTo(0.6, 10);
  });
  
  it('should handle floating point precision for ellipses', () => {
    const bbox = bboxEllipse(0.1, 0.2, 0.3, 0.4);
    
    expect(bbox.x).toBeCloseTo(-0.2, 10);
    expect(bbox.y).toBeCloseTo(-0.2, 10);
    expect(bbox.width).toBeCloseTo(0.6, 10);
    expect(bbox.height).toBeCloseTo(0.8, 10);
  });
  
  it('should handle floating point precision for lines', () => {
    const bbox = bboxLine(0.1, 0.2, 0.4, 0.5);
    
    expect(bbox.x).toBeCloseTo(0.1, 10);
    expect(bbox.y).toBeCloseTo(0.2, 10);
    expect(bbox.width).toBeCloseTo(0.3, 10);
    expect(bbox.height).toBeCloseTo(0.3, 10);
  });
});

describe('bboxPath', () => {
  describe('basic path commands', () => {
    it('should handle empty path', () => {
      const bbox = bboxPath('');
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });
    
    it('should handle single moveto command', () => {
      const bbox = bboxPath('M 10 20');
      
      expect(bbox).toEqual({
        x: 10,
        y: 20,
        width: 0,
        height: 0,
      });
    });
    
    it('should handle simple line path', () => {
      const bbox = bboxPath('M 10 10 L 50 50');
      
      expect(bbox).toEqual({
        x: 10,
        y: 10,
        width: 40,
        height: 40,
      });
    });
    
    it('should handle multiple line segments', () => {
      const bbox = bboxPath('M 0 0 L 100 0 L 100 100 L 0 100');
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
    });
    
    it('should handle horizontal lineto (H)', () => {
      const bbox = bboxPath('M 10 20 H 50');
      
      expect(bbox).toEqual({
        x: 10,
        y: 20,
        width: 40,
        height: 0,
      });
    });
    
    it('should handle vertical lineto (V)', () => {
      const bbox = bboxPath('M 10 20 V 60');
      
      expect(bbox).toEqual({
        x: 10,
        y: 20,
        width: 0,
        height: 40,
      });
    });
    
    it('should handle closepath (Z)', () => {
      const bbox = bboxPath('M 10 10 L 50 10 L 50 50 L 10 50 Z');
      
      expect(bbox).toEqual({
        x: 10,
        y: 10,
        width: 40,
        height: 40,
      });
    });
  });
  
  describe('relative commands', () => {
    it('should handle relative moveto (m)', () => {
      const bbox = bboxPath('M 10 10 m 20 20');
      
      expect(bbox).toEqual({
        x: 10,
        y: 10,
        width: 20,
        height: 20,
      });
    });
    
    it('should handle relative lineto (l)', () => {
      const bbox = bboxPath('M 10 10 l 40 40');
      
      expect(bbox).toEqual({
        x: 10,
        y: 10,
        width: 40,
        height: 40,
      });
    });
    
    it('should handle relative horizontal lineto (h)', () => {
      const bbox = bboxPath('M 10 20 h 40');
      
      expect(bbox).toEqual({
        x: 10,
        y: 20,
        width: 40,
        height: 0,
      });
    });
    
    it('should handle relative vertical lineto (v)', () => {
      const bbox = bboxPath('M 10 20 v 40');
      
      expect(bbox).toEqual({
        x: 10,
        y: 20,
        width: 0,
        height: 40,
      });
    });
  });
  
  describe('cubic Bezier curves', () => {
    it('should handle cubic Bezier curve (C)', () => {
      const bbox = bboxPath('M 0 0 C 0 100 100 100 100 0');
      
      // Curve goes from (0,0) to (100,0) with control points at (0,100) and (100,100)
      // The curve should bulge upward
      expect(bbox.x).toBe(0);
      expect(bbox.width).toBe(100);
      expect(bbox.y).toBeLessThanOrEqual(0);
      expect(bbox.height).toBeGreaterThan(0);
    });
    
    it('should handle smooth cubic Bezier curve (S)', () => {
      const bbox = bboxPath('M 0 0 C 0 50 50 50 50 0 S 100 -50 100 0');
      
      expect(bbox.x).toBe(0);
      expect(bbox.width).toBe(100);
    });
    
    it('should include control points in bounds', () => {
      const bbox = bboxPath('M 50 50 C 10 10 90 10 50 50');
      
      // Control points at (10,10) and (90,10) should influence bounds
      expect(bbox.y).toBeLessThanOrEqual(50);
      expect(bbox.x).toBeLessThanOrEqual(50);
    });
  });
  
  describe('quadratic Bezier curves', () => {
    it('should handle quadratic Bezier curve (Q)', () => {
      const bbox = bboxPath('M 0 0 Q 50 100 100 0');
      
      // Curve goes from (0,0) to (100,0) with control point at (50,100)
      expect(bbox.x).toBe(0);
      expect(bbox.width).toBe(100);
      expect(bbox.y).toBeLessThanOrEqual(0);
      expect(bbox.height).toBeGreaterThan(0);
    });
    
    it('should handle smooth quadratic Bezier curve (T)', () => {
      const bbox = bboxPath('M 0 0 Q 50 50 100 0 T 200 0');
      
      expect(bbox.x).toBe(0);
      expect(bbox.width).toBe(200);
    });
  });
  
  describe('elliptical arcs', () => {
    it('should handle elliptical arc (A)', () => {
      const bbox = bboxPath('M 0 0 A 50 50 0 0 1 100 0');
      
      // Arc from (0,0) to (100,0) with radius 50
      expect(bbox.x).toBeLessThanOrEqual(0);
      expect(bbox.width).toBeGreaterThanOrEqual(100);
    });
    
    it('should handle arc with rotation', () => {
      const bbox = bboxPath('M 0 0 A 50 30 45 0 1 100 0');
      
      // Rotated elliptical arc
      expect(bbox.width).toBeGreaterThan(0);
      expect(bbox.height).toBeGreaterThan(0);
    });
  });
  
  describe('complex paths', () => {
    it('should handle path with multiple subpaths', () => {
      const bbox = bboxPath('M 0 0 L 50 50 M 100 100 L 150 150');
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 150,
        height: 150,
      });
    });
    
    it('should handle mixed absolute and relative commands', () => {
      const bbox = bboxPath('M 10 10 L 50 50 l 20 20 L 100 100');
      
      expect(bbox).toEqual({
        x: 10,
        y: 10,
        width: 90,
        height: 90,
      });
    });
    
    it('should handle path with all command types', () => {
      const bbox = bboxPath('M 0 0 L 10 10 H 20 V 20 C 30 30 40 40 50 50 Q 60 60 70 70 A 10 10 0 0 1 80 80 Z');
      
      expect(bbox.x).toBeLessThanOrEqual(0);
      expect(bbox.y).toBeLessThanOrEqual(0);
      expect(bbox.width).toBeGreaterThan(0);
      expect(bbox.height).toBeGreaterThan(0);
    });
  });
  
  describe('edge cases', () => {
    it('should handle path with only whitespace', () => {
      const bbox = bboxPath('   ');
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });
    
    it('should handle path with commas as separators', () => {
      const bbox = bboxPath('M 10,20 L 50,60');
      
      expect(bbox).toEqual({
        x: 10,
        y: 20,
        width: 40,
        height: 40,
      });
    });
    
    it('should handle path with mixed separators', () => {
      const bbox = bboxPath('M 10, 20 L 50 60');
      
      expect(bbox).toEqual({
        x: 10,
        y: 20,
        width: 40,
        height: 40,
      });
    });
    
    it('should handle path with extra whitespace', () => {
      const bbox = bboxPath('M  10   20   L   50   60');
      
      expect(bbox).toEqual({
        x: 10,
        y: 20,
        width: 40,
        height: 40,
      });
    });
    
    it('should handle path with negative coordinates', () => {
      const bbox = bboxPath('M -10 -20 L 50 60');
      
      expect(bbox).toEqual({
        x: -10,
        y: -20,
        width: 60,
        height: 80,
      });
    });
    
    it('should handle path with floating point coordinates', () => {
      const bbox = bboxPath('M 10.5 20.5 L 50.5 60.5');
      
      expect(bbox.x).toBeCloseTo(10.5, 10);
      expect(bbox.y).toBeCloseTo(20.5, 10);
      expect(bbox.width).toBeCloseTo(40, 10);
      expect(bbox.height).toBeCloseTo(40, 10);
    });
    
    it('should handle single point path', () => {
      const bbox = bboxPath('M 50 50 Z');
      
      expect(bbox).toEqual({
        x: 50,
        y: 50,
        width: 0,
        height: 0,
      });
    });
    
    it('should handle path that returns to start', () => {
      const bbox = bboxPath('M 10 10 L 50 50 L 10 10');
      
      expect(bbox).toEqual({
        x: 10,
        y: 10,
        width: 40,
        height: 40,
      });
    });
  });
  
  describe('real-world SVG paths', () => {
    it('should handle rectangle path', () => {
      const bbox = bboxPath('M 10 10 H 110 V 60 H 10 Z');
      
      expect(bbox).toEqual({
        x: 10,
        y: 10,
        width: 100,
        height: 50,
      });
    });
    
    it('should handle circle approximation path', () => {
      // Circle at (50, 50) with radius 25, approximated with cubic Bezier curves
      const bbox = bboxPath('M 50 25 C 63.807 25 75 36.193 75 50 C 75 63.807 63.807 75 50 75 C 36.193 75 25 63.807 25 50 C 25 36.193 36.193 25 50 25 Z');
      
      expect(bbox.x).toBeCloseTo(25, 0);
      expect(bbox.y).toBeCloseTo(25, 0);
      expect(bbox.width).toBeCloseTo(50, 0);
      expect(bbox.height).toBeCloseTo(50, 0);
    });
    
    it('should handle star path', () => {
      const bbox = bboxPath('M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z');
      
      expect(bbox.x).toBe(2);
      expect(bbox.y).toBe(0);
      expect(bbox.width).toBe(96);
      expect(bbox.height).toBe(91);
    });
  });
});

describe('bboxTransform', () => {
  // Helper to create matrices
  const identity = (): [number, number, number, number, number, number] => [1, 0, 0, 1, 0, 0];
  const translate = (tx: number, ty: number): [number, number, number, number, number, number] => [1, 0, 0, 1, tx, ty];
  const scale = (sx: number, sy: number): [number, number, number, number, number, number] => [sx, 0, 0, sy, 0, 0];
  const rotate = (angle: number): [number, number, number, number, number, number] => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [cos, sin, -sin, cos, 0, 0];
  };
  const compose = (
    m1: [number, number, number, number, number, number],
    m2: [number, number, number, number, number, number]
  ): [number, number, number, number, number, number] => {
    const [a1, b1, c1, d1, e1, f1] = m1;
    const [a2, b2, c2, d2, e2, f2] = m2;
    return [
      a1 * a2 + c1 * b2,
      b1 * a2 + d1 * b2,
      a1 * c2 + c1 * d2,
      b1 * c2 + d1 * d2,
      a1 * e2 + c1 * f2 + e1,
      b1 * e2 + d1 * f2 + f1,
    ];
  };

  describe('identity transform', () => {
    it('should not change bounding box with identity matrix', () => {
      const bbox = bboxRect(10, 20, 100, 50);
      const transformed = bboxTransform(bbox, identity());
      
      expect(transformed).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });
    
    it('should handle identity transform on circle', () => {
      const bbox = bboxCircle(50, 50, 25);
      const transformed = bboxTransform(bbox, identity());
      
      expect(transformed).toEqual({
        x: 25,
        y: 25,
        width: 50,
        height: 50,
      });
    });
    
    it('should handle identity transform on zero-size box', () => {
      const bbox = { x: 10, y: 20, width: 0, height: 0 };
      const transformed = bboxTransform(bbox, identity());
      
      expect(transformed).toEqual({
        x: 10,
        y: 20,
        width: 0,
        height: 0,
      });
    });
  });

  describe('translation', () => {
    it('should translate bounding box', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const transformed = bboxTransform(bbox, translate(10, 20));
      
      expect(transformed).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });
    
    it('should translate by negative values', () => {
      const bbox = bboxRect(50, 50, 100, 50);
      const transformed = bboxTransform(bbox, translate(-20, -30));
      
      expect(transformed).toEqual({
        x: 30,
        y: 20,
        width: 100,
        height: 50,
      });
    });
    
    it('should translate to negative coordinates', () => {
      const bbox = bboxRect(0, 0, 50, 50);
      const transformed = bboxTransform(bbox, translate(-100, -100));
      
      expect(transformed).toEqual({
        x: -100,
        y: -100,
        width: 50,
        height: 50,
      });
    });
    
    it('should preserve dimensions during translation', () => {
      const bbox = bboxRect(10, 20, 100, 50);
      const transformed = bboxTransform(bbox, translate(50, 75));
      
      expect(transformed.width).toBe(bbox.width);
      expect(transformed.height).toBe(bbox.height);
    });
  });

  describe('scale', () => {
    it('should scale bounding box uniformly', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const transformed = bboxTransform(bbox, scale(2, 2));
      
      expect(transformed).toEqual({
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      });
    });
    
    it('should scale bounding box non-uniformly', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const transformed = bboxTransform(bbox, scale(2, 3));
      
      expect(transformed).toEqual({
        x: 0,
        y: 0,
        width: 200,
        height: 150,
      });
    });
    
    it('should scale bounding box with non-zero origin', () => {
      const bbox = bboxRect(10, 20, 100, 50);
      const transformed = bboxTransform(bbox, scale(2, 2));
      
      expect(transformed).toEqual({
        x: 20,
        y: 40,
        width: 200,
        height: 100,
      });
    });
    
    it('should handle scale by 0.5', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const transformed = bboxTransform(bbox, scale(0.5, 0.5));
      
      expect(transformed).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 25,
      });
    });
    
    it('should handle negative scale (reflection)', () => {
      const bbox = bboxRect(10, 20, 100, 50);
      const transformed = bboxTransform(bbox, scale(-1, 1));
      
      // Reflection flips the box, so x becomes negative
      expect(transformed.x).toBe(-110);
      expect(transformed.y).toBe(20);
      expect(transformed.width).toBe(100);
      expect(transformed.height).toBe(50);
    });
    
    it('should handle zero scale', () => {
      const bbox = bboxRect(10, 20, 100, 50);
      const transformed = bboxTransform(bbox, scale(0, 0));
      
      // All corners collapse to origin
      expect(transformed).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });
  });

  describe('rotation', () => {
    it('should rotate bounding box by 90 degrees', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const transformed = bboxTransform(bbox, rotate(Math.PI / 2));
      
      // After 90° rotation: (0,0) -> (0,0), (100,0) -> (0,100), (0,50) -> (-50,0), (100,50) -> (-50,100)
      expect(transformed.x).toBeCloseTo(-50, 5);
      expect(transformed.y).toBeCloseTo(0, 5);
      expect(transformed.width).toBeCloseTo(50, 5);
      expect(transformed.height).toBeCloseTo(100, 5);
    });
    
    it('should rotate bounding box by 180 degrees', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const transformed = bboxTransform(bbox, rotate(Math.PI));
      
      // After 180° rotation: box is flipped
      expect(transformed.x).toBeCloseTo(-100, 5);
      expect(transformed.y).toBeCloseTo(-50, 5);
      expect(transformed.width).toBeCloseTo(100, 5);
      expect(transformed.height).toBeCloseTo(50, 5);
    });
    
    it('should rotate bounding box by 45 degrees', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const transformed = bboxTransform(bbox, rotate(Math.PI / 4));
      
      // After 45° rotation, the bounding box should be larger
      expect(transformed.width).toBeGreaterThan(100);
      expect(transformed.height).toBeGreaterThan(50);
      
      // The diagonal of the original box is sqrt(100^2 + 50^2) ≈ 111.8
      // At 45°, the bounding box should be approximately this size
      const diagonal = Math.sqrt(100 * 100 + 50 * 50);
      expect(transformed.width).toBeLessThanOrEqual(diagonal + 1);
      expect(transformed.height).toBeLessThanOrEqual(diagonal + 1);
    });
    
    it('should rotate bounding box by 360 degrees (full rotation)', () => {
      const bbox = bboxRect(10, 20, 100, 50);
      const transformed = bboxTransform(bbox, rotate(2 * Math.PI));
      
      // Full rotation should return to original (within floating point precision)
      expect(transformed.x).toBeCloseTo(10, 5);
      expect(transformed.y).toBeCloseTo(20, 5);
      expect(transformed.width).toBeCloseTo(100, 5);
      expect(transformed.height).toBeCloseTo(50, 5);
    });
    
    it('should handle rotation of square (symmetric)', () => {
      const bbox = bboxRect(0, 0, 100, 100);
      const transformed = bboxTransform(bbox, rotate(Math.PI / 4));
      
      // Square rotated by 45° should have equal width and height
      expect(transformed.width).toBeCloseTo(transformed.height, 5);
    });
    
    it('should rotate bounding box with non-zero origin', () => {
      const bbox = bboxRect(10, 10, 50, 50);
      const transformed = bboxTransform(bbox, rotate(Math.PI / 2));
      
      // Rotation is around origin (0,0), so the box at (10,10) to (60,60) rotates
      // After 90° rotation: (10,10) -> (-10,10), (60,10) -> (-10,60), (10,60) -> (-60,10), (60,60) -> (-60,60)
      // So the bounding box should be from (-60,10) to (-10,60)
      expect(transformed.x).toBeCloseTo(-60, 5);
      expect(transformed.y).toBeCloseTo(10, 5);
      expect(transformed.width).toBeCloseTo(50, 5);
      expect(transformed.height).toBeCloseTo(50, 5);
    });
  });

  describe('complex transforms', () => {
    it('should handle scale then translate', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const matrix = compose(translate(10, 20), scale(2, 2));
      const transformed = bboxTransform(bbox, matrix);
      
      expect(transformed).toEqual({
        x: 10,
        y: 20,
        width: 200,
        height: 100,
      });
    });
    
    it('should handle translate then scale', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const matrix = compose(scale(2, 2), translate(10, 20));
      const transformed = bboxTransform(bbox, matrix);
      
      // Scale is applied first, then translate
      expect(transformed).toEqual({
        x: 20,
        y: 40,
        width: 200,
        height: 100,
      });
    });
    
    it('should handle rotate then translate', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const matrix = compose(translate(50, 50), rotate(Math.PI / 2));
      const transformed = bboxTransform(bbox, matrix);
      
      // Rotation first, then translation
      expect(transformed.x).toBeCloseTo(0, 5);
      expect(transformed.y).toBeCloseTo(50, 5);
    });
    
    it('should handle scale, rotate, and translate', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const matrix = compose(
        translate(100, 100),
        compose(rotate(Math.PI / 4), scale(2, 2))
      );
      const transformed = bboxTransform(bbox, matrix);
      
      // Complex transformation
      expect(transformed.width).toBeGreaterThan(100);
      expect(transformed.height).toBeGreaterThan(50);
      expect(transformed.x).toBeGreaterThan(0);
      expect(transformed.y).toBeGreaterThan(0);
    });
    
    it('should handle multiple rotations', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const matrix = compose(rotate(Math.PI / 4), rotate(Math.PI / 4));
      const transformed = bboxTransform(bbox, matrix);
      
      // Two 45° rotations = 90° rotation
      expect(transformed.x).toBeCloseTo(-50, 5);
      expect(transformed.y).toBeCloseTo(0, 5);
      expect(transformed.width).toBeCloseTo(50, 5);
      expect(transformed.height).toBeCloseTo(100, 5);
    });
  });

  describe('edge cases', () => {
    it('should handle zero-width bounding box', () => {
      const bbox = { x: 10, y: 20, width: 0, height: 50 };
      const transformed = bboxTransform(bbox, translate(5, 10));
      
      expect(transformed).toEqual({
        x: 15,
        y: 30,
        width: 0,
        height: 50,
      });
    });
    
    it('should handle zero-height bounding box', () => {
      const bbox = { x: 10, y: 20, width: 100, height: 0 };
      const transformed = bboxTransform(bbox, translate(5, 10));
      
      expect(transformed).toEqual({
        x: 15,
        y: 30,
        width: 100,
        height: 0,
      });
    });
    
    it('should handle point (zero-size box)', () => {
      const bbox = { x: 50, y: 50, width: 0, height: 0 };
      const transformed = bboxTransform(bbox, scale(2, 2));
      
      expect(transformed).toEqual({
        x: 100,
        y: 100,
        width: 0,
        height: 0,
      });
    });
    
    it('should handle very small bounding box', () => {
      const bbox = { x: 0, y: 0, width: 0.001, height: 0.001 };
      const transformed = bboxTransform(bbox, scale(1000, 1000));
      
      expect(transformed.x).toBeCloseTo(0, 5);
      expect(transformed.y).toBeCloseTo(0, 5);
      expect(transformed.width).toBeCloseTo(1, 5);
      expect(transformed.height).toBeCloseTo(1, 5);
    });
    
    it('should handle very large bounding box', () => {
      const bbox = { x: 0, y: 0, width: 10000, height: 10000 };
      const transformed = bboxTransform(bbox, scale(2, 2));
      
      expect(transformed).toEqual({
        x: 0,
        y: 0,
        width: 20000,
        height: 20000,
      });
    });
    
    it('should handle negative coordinates', () => {
      const bbox = { x: -50, y: -30, width: 100, height: 60 };
      const transformed = bboxTransform(bbox, translate(10, 20));
      
      expect(transformed).toEqual({
        x: -40,
        y: -10,
        width: 100,
        height: 60,
      });
    });
    
    it('should handle bounding box entirely in negative space', () => {
      const bbox = { x: -100, y: -80, width: 50, height: 40 };
      const transformed = bboxTransform(bbox, scale(2, 2));
      
      expect(transformed).toEqual({
        x: -200,
        y: -160,
        width: 100,
        height: 80,
      });
    });
  });

  describe('real-world scenarios', () => {
    it('should transform selection box', () => {
      // Simulate a selection box that needs to be transformed
      const selectionBox = bboxRect(10, 10, 100, 50);
      const userTransform = compose(translate(50, 50), rotate(Math.PI / 6));
      const transformed = bboxTransform(selectionBox, userTransform);
      
      // Should produce a valid bounding box
      expect(transformed.width).toBeGreaterThan(0);
      expect(transformed.height).toBeGreaterThan(0);
      expect(isFinite(transformed.x)).toBe(true);
      expect(isFinite(transformed.y)).toBe(true);
    });
    
    it('should transform rotated rectangle for hit testing', () => {
      // A rectangle rotated 30 degrees
      const rect = bboxRect(0, 0, 200, 100);
      const rotated = bboxTransform(rect, rotate(Math.PI / 6));
      
      // The rotated bounding box should be larger than the original
      expect(rotated.width).toBeGreaterThan(200);
      expect(rotated.height).toBeGreaterThan(100);
    });
    
    it('should transform scaled and translated element', () => {
      // Common scenario: element scaled by 1.5 and moved to (100, 100)
      const element = bboxRect(0, 0, 80, 60);
      const transform = compose(translate(100, 100), scale(1.5, 1.5));
      const transformed = bboxTransform(element, transform);
      
      expect(transformed).toEqual({
        x: 100,
        y: 100,
        width: 120,
        height: 90,
      });
    });
    
    it('should handle viewport transformation', () => {
      // Simulate viewport zoom and pan
      const elementBox = bboxRect(50, 50, 100, 100);
      const viewportTransform = compose(translate(200, 200), scale(2, 2));
      const screenSpace = bboxTransform(elementBox, viewportTransform);
      
      expect(screenSpace.x).toBe(300); // (50 * 2) + 200
      expect(screenSpace.y).toBe(300); // (50 * 2) + 200
      expect(screenSpace.width).toBe(200); // 100 * 2
      expect(screenSpace.height).toBe(200); // 100 * 2
    });
  });

  describe('floating point precision', () => {
    it('should handle floating point coordinates', () => {
      const bbox = { x: 0.1, y: 0.2, width: 10.5, height: 20.5 };
      const transformed = bboxTransform(bbox, translate(0.3, 0.4));
      
      expect(transformed.x).toBeCloseTo(0.4, 10);
      expect(transformed.y).toBeCloseTo(0.6, 10);
      expect(transformed.width).toBeCloseTo(10.5, 10);
      expect(transformed.height).toBeCloseTo(20.5, 10);
    });
    
    it('should handle very small transformations', () => {
      const bbox = bboxRect(0, 0, 100, 100);
      const transformed = bboxTransform(bbox, translate(0.0001, 0.0001));
      
      expect(transformed.x).toBeCloseTo(0.0001, 10);
      expect(transformed.y).toBeCloseTo(0.0001, 10);
      expect(transformed.width).toBeCloseTo(100, 10);
      expect(transformed.height).toBeCloseTo(100, 10);
    });
    
    it('should handle rotation with floating point angles', () => {
      const bbox = bboxRect(0, 0, 100, 50);
      const angle = Math.PI / 7; // Non-standard angle
      const transformed = bboxTransform(bbox, rotate(angle));
      
      // Should produce valid results
      expect(isFinite(transformed.x)).toBe(true);
      expect(isFinite(transformed.y)).toBe(true);
      expect(isFinite(transformed.width)).toBe(true);
      expect(isFinite(transformed.height)).toBe(true);
    });
  });
});

describe('bboxGroup', () => {
  describe('basic group operations', () => {
    it('should handle empty group', () => {
      const bbox = bboxGroup([]);
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });
    
    it('should handle single child', () => {
      const child = bboxRect(10, 20, 100, 50);
      const bbox = bboxGroup([child]);
      
      expect(bbox).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });
    
    it('should calculate union of two non-overlapping rectangles', () => {
      const child1 = bboxRect(0, 0, 50, 50);
      const child2 = bboxRect(60, 60, 50, 50);
      const bbox = bboxGroup([child1, child2]);
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 110,
        height: 110,
      });
    });
    
    it('should calculate union of two overlapping rectangles', () => {
      const child1 = bboxRect(0, 0, 50, 50);
      const child2 = bboxRect(40, 40, 50, 50);
      const bbox = bboxGroup([child1, child2]);
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 90,
        height: 90,
      });
    });
    
    it('should calculate union of multiple children', () => {
      const child1 = bboxRect(0, 0, 30, 30);
      const child2 = bboxRect(50, 50, 30, 30);
      const child3 = bboxRect(100, 100, 30, 30);
      const bbox = bboxGroup([child1, child2, child3]);
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 130,
        height: 130,
      });
    });
  });
  
  describe('mixed shape types', () => {
    it('should handle group with different shape types', () => {
      const rect = bboxRect(0, 0, 50, 50);
      const circle = bboxCircle(100, 100, 25);
      const line = bboxLine(150, 150, 200, 200);
      const bbox = bboxGroup([rect, circle, line]);
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      });
    });
    
    it('should handle group with circles', () => {
      const circle1 = bboxCircle(50, 50, 25);
      const circle2 = bboxCircle(150, 150, 30);
      const bbox = bboxGroup([circle1, circle2]);
      
      expect(bbox).toEqual({
        x: 25,
        y: 25,
        width: 155,
        height: 155,
      });
    });
    
    it('should handle group with ellipses', () => {
      const ellipse1 = bboxEllipse(50, 50, 30, 20);
      const ellipse2 = bboxEllipse(150, 150, 40, 25);
      const bbox = bboxGroup([ellipse1, ellipse2]);
      
      expect(bbox).toEqual({
        x: 20,
        y: 30,
        width: 170,
        height: 145,
      });
    });
    
    it('should handle group with lines', () => {
      const line1 = bboxLine(0, 0, 50, 50);
      const line2 = bboxLine(100, 100, 150, 150);
      const bbox = bboxGroup([line1, line2]);
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 150,
        height: 150,
      });
    });
    
    it('should handle group with paths', () => {
      const path1 = bboxPath('M 0 0 L 50 50');
      const path2 = bboxPath('M 100 100 L 150 150');
      const bbox = bboxGroup([path1, path2]);
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 150,
        height: 150,
      });
    });
  });
  
  describe('edge cases', () => {
    it('should handle group with zero-dimension children', () => {
      const point1 = bboxCircle(50, 50, 0);
      const point2 = bboxCircle(100, 100, 0);
      const bbox = bboxGroup([point1, point2]);
      
      expect(bbox).toEqual({
        x: 50,
        y: 50,
        width: 50,
        height: 50,
      });
    });
    
    it('should handle group with horizontal line (zero height)', () => {
      const hLine = bboxLine(10, 50, 100, 50);
      const rect = bboxRect(0, 0, 50, 50);
      const bbox = bboxGroup([hLine, rect]);
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      });
    });
    
    it('should handle group with vertical line (zero width)', () => {
      const vLine = bboxLine(50, 10, 50, 100);
      const rect = bboxRect(0, 0, 50, 50);
      const bbox = bboxGroup([vLine, rect]);
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 100,
      });
    });
    
    it('should handle group with negative coordinates', () => {
      const child1 = bboxRect(-50, -30, 100, 60);
      const child2 = bboxRect(10, 10, 50, 50);
      const bbox = bboxGroup([child1, child2]);
      
      expect(bbox).toEqual({
        x: -50,
        y: -30,
        width: 110,
        height: 90,
      });
    });
    
    it('should handle group entirely in negative space', () => {
      const child1 = bboxRect(-100, -80, 50, 40);
      const child2 = bboxRect(-40, -30, 30, 20);
      const bbox = bboxGroup([child1, child2]);
      
      expect(bbox).toEqual({
        x: -100,
        y: -80,
        width: 90,
        height: 70,
      });
    });
    
    it('should handle group with one child containing another', () => {
      const outer = bboxRect(0, 0, 100, 100);
      const inner = bboxRect(25, 25, 50, 50);
      const bbox = bboxGroup([outer, inner]);
      
      // Union should be the outer rectangle
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
    });
    
    it('should handle group with identical children', () => {
      const child1 = bboxRect(10, 20, 100, 50);
      const child2 = bboxRect(10, 20, 100, 50);
      const bbox = bboxGroup([child1, child2]);
      
      expect(bbox).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });
  });
  
  describe('nested groups', () => {
    it('should handle nested group bounding boxes', () => {
      // Simulate nested groups by calculating inner group first
      const innerChild1 = bboxRect(10, 10, 30, 30);
      const innerChild2 = bboxRect(50, 50, 30, 30);
      const innerGroup = bboxGroup([innerChild1, innerChild2]);
      
      const outerChild = bboxRect(100, 100, 50, 50);
      const outerGroup = bboxGroup([innerGroup, outerChild]);
      
      expect(outerGroup).toEqual({
        x: 10,
        y: 10,
        width: 140,
        height: 140,
      });
    });
    
    it('should handle deeply nested groups', () => {
      const level3a = bboxRect(0, 0, 20, 20);
      const level3b = bboxRect(30, 30, 20, 20);
      const level2 = bboxGroup([level3a, level3b]);
      
      const level1a = bboxRect(100, 100, 30, 30);
      const level1 = bboxGroup([level2, level1a]);
      
      const level0 = bboxRect(200, 200, 40, 40);
      const root = bboxGroup([level1, level0]);
      
      expect(root).toEqual({
        x: 0,
        y: 0,
        width: 240,
        height: 240,
      });
    });
  });
  
  describe('floating point precision', () => {
    it('should handle floating point coordinates', () => {
      const child1 = bboxRect(0.1, 0.2, 10.5, 20.5);
      const child2 = bboxRect(15.3, 25.7, 10.5, 20.5);
      const bbox = bboxGroup([child1, child2]);
      
      expect(bbox.x).toBeCloseTo(0.1, 10);
      expect(bbox.y).toBeCloseTo(0.2, 10);
      expect(bbox.width).toBeCloseTo(25.7, 10);
      expect(bbox.height).toBeCloseTo(46, 10);
    });
    
    it('should handle very small dimensions', () => {
      const child1 = bboxRect(0, 0, 0.001, 0.001);
      const child2 = bboxRect(0.002, 0.002, 0.001, 0.001);
      const bbox = bboxGroup([child1, child2]);
      
      expect(bbox.x).toBeCloseTo(0, 10);
      expect(bbox.y).toBeCloseTo(0, 10);
      expect(bbox.width).toBeCloseTo(0.003, 10);
      expect(bbox.height).toBeCloseTo(0.003, 10);
    });
    
    it('should handle very large dimensions', () => {
      const child1 = bboxRect(0, 0, 10000, 10000);
      const child2 = bboxRect(5000, 5000, 10000, 10000);
      const bbox = bboxGroup([child1, child2]);
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 15000,
        height: 15000,
      });
    });
  });
  
  describe('real-world scenarios', () => {
    it('should handle selection of multiple elements', () => {
      // Simulate selecting multiple elements in an editor
      const text = bboxRect(10, 10, 100, 20);
      const icon = bboxCircle(150, 20, 15);
      const line = bboxLine(10, 50, 165, 50);
      
      const selectionBox = bboxGroup([text, icon, line]);
      
      // text: x=10, y=10, width=100, height=20 -> covers (10,10) to (110,30)
      // icon: cx=150, cy=20, r=15 -> x=135, y=5, width=30, height=30 -> covers (135,5) to (165,35)
      // line: (10,50) to (165,50) -> x=10, y=50, width=155, height=0 -> covers (10,50) to (165,50)
      // Union: x=10 (min), y=5 (min), maxX=165, maxY=50 -> width=155, height=45
      expect(selectionBox).toEqual({
        x: 10,
        y: 5,
        width: 155,
        height: 45,
      });
    });
    
    it('should handle complex SVG composition', () => {
      // Simulate a complex SVG with multiple shapes
      const background = bboxRect(0, 0, 200, 200);
      const title = bboxRect(10, 10, 180, 30);
      const icon1 = bboxCircle(50, 100, 20);
      const icon2 = bboxCircle(100, 100, 20);
      const icon3 = bboxCircle(150, 100, 20);
      const footer = bboxRect(10, 170, 180, 20);
      
      const composition = bboxGroup([
        background,
        title,
        icon1,
        icon2,
        icon3,
        footer,
      ]);
      
      expect(composition).toEqual({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      });
    });
    
    it('should handle scattered elements', () => {
      // Elements scattered across the canvas
      const topLeft = bboxRect(0, 0, 10, 10);
      const topRight = bboxRect(190, 0, 10, 10);
      const bottomLeft = bboxRect(0, 190, 10, 10);
      const bottomRight = bboxRect(190, 190, 10, 10);
      const center = bboxCircle(100, 100, 5);
      
      const bbox = bboxGroup([
        topLeft,
        topRight,
        bottomLeft,
        bottomRight,
        center,
      ]);
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      });
    });
  });
});
