/**
 * Unit tests for matrix transformation utilities.
 * 
 * Tests cover:
 * - Identity matrix behavior
 * - Matrix composition
 * - Matrix inverse
 * - Point transformation
 * - Helper functions (translate, scale, rotate)
 * - Edge cases (singular matrices, zero values, etc.)
 */

import { describe, it, expect } from 'vitest';
import {
  identity,
  compose,
  inverse,
  applyToPoint,
  translate,
  scale,
  rotate,
  decompose,
  type Matrix,
  type Point,
} from './matrix.js';

describe('Matrix Operations', () => {
  describe('identity', () => {
    it('should create an identity matrix', () => {
      const id = identity();
      expect(id).toEqual([1, 0, 0, 1, 0, 0]);
    });
    
    it('should not transform a point', () => {
      const id = identity();
      const point: Point = { x: 10, y: 20 };
      const transformed = applyToPoint(id, point);
      
      expect(transformed).toEqual(point);
    });
    
    it('should be neutral for composition', () => {
      const id = identity();
      const m: Matrix = [2, 0, 0, 3, 10, 20];
      
      const composed1 = compose(id, m);
      const composed2 = compose(m, id);
      
      expect(composed1).toEqual(m);
      expect(composed2).toEqual(m);
    });
  });
  
  describe('compose', () => {
    it('should compose two translation matrices', () => {
      const t1 = translate(10, 20);
      const t2 = translate(5, 10);
      
      const composed = compose(t1, t2);
      
      // Should translate by (15, 30) total
      const point: Point = { x: 0, y: 0 };
      const result = applyToPoint(composed, point);
      
      expect(result.x).toBeCloseTo(15);
      expect(result.y).toBeCloseTo(30);
    });
    
    it('should compose two scale matrices', () => {
      const s1 = scale(2, 3);
      const s2 = scale(4, 5);
      
      const composed = compose(s1, s2);
      
      // Should scale by (8, 15) total
      const point: Point = { x: 1, y: 1 };
      const result = applyToPoint(composed, point);
      
      expect(result.x).toBeCloseTo(8);
      expect(result.y).toBeCloseTo(15);
    });
    
    it('should compose scale and translate in correct order', () => {
      const s = scale(2, 2);
      const t = translate(10, 20);
      
      // compose(t, s) means: first scale, then translate
      const composed = compose(t, s);
      
      const point: Point = { x: 5, y: 5 };
      const result = applyToPoint(composed, point);
      
      // First scale: (5, 5) -> (10, 10)
      // Then translate: (10, 10) -> (20, 30)
      expect(result.x).toBeCloseTo(20);
      expect(result.y).toBeCloseTo(30);
    });
    
    it('should not be commutative', () => {
      const s = scale(2, 2);
      const t = translate(10, 20);
      
      const composed1 = compose(t, s);
      const composed2 = compose(s, t);
      
      expect(composed1).not.toEqual(composed2);
      
      const point: Point = { x: 5, y: 5 };
      const result1 = applyToPoint(composed1, point);
      const result2 = applyToPoint(composed2, point);
      
      expect(result1).not.toEqual(result2);
    });
    
    it('should compose rotation and translation', () => {
      const r = rotate(Math.PI / 2); // 90 degrees
      const t = translate(10, 0);
      
      const composed = compose(t, r);
      
      const point: Point = { x: 10, y: 0 };
      const result = applyToPoint(composed, point);
      
      // First rotate 90°: (10, 0) -> (0, 10)
      // Then translate: (0, 10) -> (10, 10)
      expect(result.x).toBeCloseTo(10);
      expect(result.y).toBeCloseTo(10);
    });
  });
  
  describe('inverse', () => {
    it('should invert an identity matrix to identity', () => {
      const id = identity();
      const result = inverse(id);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const inv = result.value;
        // Check each component is close to identity (handles -0 vs +0)
        for (let i = 0; i < 6; i++) {
          expect(inv[i]).toBeCloseTo(id[i]);
        }
      }
    });
    
    it('should invert a translation matrix', () => {
      const t = translate(10, 20);
      const result = inverse(t);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const inv = result.value;
        
        // Inverse should translate by (-10, -20)
        const point: Point = { x: 10, y: 20 };
        const transformed = applyToPoint(inv, point);
        
        expect(transformed.x).toBeCloseTo(0);
        expect(transformed.y).toBeCloseTo(0);
      }
    });
    
    it('should invert a scale matrix', () => {
      const s = scale(2, 3);
      const result = inverse(s);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const inv = result.value;
        
        // Inverse should scale by (0.5, 1/3)
        const point: Point = { x: 10, y: 15 };
        const transformed = applyToPoint(inv, point);
        
        expect(transformed.x).toBeCloseTo(5);
        expect(transformed.y).toBeCloseTo(5);
      }
    });
    
    it('should invert a rotation matrix', () => {
      const r = rotate(Math.PI / 4); // 45 degrees
      const result = inverse(r);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const inv = result.value;
        
        // Composing with inverse should give identity
        const composed = compose(r, inv);
        const id = identity();
        
        // Check each component is close to identity
        for (let i = 0; i < 6; i++) {
          expect(composed[i]).toBeCloseTo(id[i]);
        }
      }
    });
    
    it('should satisfy inverse property: M * M^-1 = I', () => {
      const m: Matrix = [2, 1, 1, 2, 10, 20];
      const result = inverse(m);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const inv = result.value;
        const composed = compose(m, inv);
        const id = identity();
        
        // Check each component is close to identity
        for (let i = 0; i < 6; i++) {
          expect(composed[i]).toBeCloseTo(id[i], 10);
        }
      }
    });
    
    it('should return error for singular matrix (zero determinant)', () => {
      // Matrix with zero determinant: a*d - b*c = 0
      const singular: Matrix = [2, 4, 1, 2, 0, 0]; // det = 2*2 - 4*1 = 0
      const result = inverse(singular);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_MATRIX');
        expect(result.error.message).toContain('singular');
      }
    });
    
    it('should return error for zero scale matrix', () => {
      const zeroScale = scale(0, 2);
      const result = inverse(zeroScale);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_MATRIX');
      }
    });
    
    it('should handle near-zero determinant', () => {
      // Matrix with very small but non-zero determinant
      const nearSingular: Matrix = [1, 0, 0, 1e-15, 0, 0];
      const result = inverse(nearSingular);
      
      // Should return error due to epsilon check
      expect(result.ok).toBe(false);
    });
  });
  
  describe('applyToPoint', () => {
    it('should apply identity matrix', () => {
      const id = identity();
      const point: Point = { x: 10, y: 20 };
      const result = applyToPoint(id, point);
      
      expect(result).toEqual(point);
    });
    
    it('should apply translation', () => {
      const t = translate(5, 10);
      const point: Point = { x: 10, y: 20 };
      const result = applyToPoint(t, point);
      
      expect(result.x).toBeCloseTo(15);
      expect(result.y).toBeCloseTo(30);
    });
    
    it('should apply scale', () => {
      const s = scale(2, 3);
      const point: Point = { x: 10, y: 20 };
      const result = applyToPoint(s, point);
      
      expect(result.x).toBeCloseTo(20);
      expect(result.y).toBeCloseTo(60);
    });
    
    it('should apply rotation', () => {
      const r = rotate(Math.PI / 2); // 90 degrees
      const point: Point = { x: 1, y: 0 };
      const result = applyToPoint(r, point);
      
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(1);
    });
    
    it('should handle negative coordinates', () => {
      const t = translate(10, 20);
      const point: Point = { x: -5, y: -10 };
      const result = applyToPoint(t, point);
      
      expect(result.x).toBeCloseTo(5);
      expect(result.y).toBeCloseTo(10);
    });
    
    it('should handle zero point', () => {
      const m: Matrix = [2, 1, 1, 2, 10, 20];
      const point: Point = { x: 0, y: 0 };
      const result = applyToPoint(m, point);
      
      // For zero point, only translation applies
      expect(result.x).toBeCloseTo(10);
      expect(result.y).toBeCloseTo(20);
    });
    
    it('should apply complex transformation', () => {
      // Matrix that scales, rotates, and translates
      const m: Matrix = [2, 1, -1, 2, 10, 20];
      const point: Point = { x: 5, y: 3 };
      const result = applyToPoint(m, point);
      
      // x' = 2*5 + (-1)*3 + 10 = 10 - 3 + 10 = 17
      // y' = 1*5 + 2*3 + 20 = 5 + 6 + 20 = 31
      expect(result.x).toBeCloseTo(17);
      expect(result.y).toBeCloseTo(31);
    });
  });
  
  describe('translate', () => {
    it('should create a translation matrix', () => {
      const t = translate(10, 20);
      expect(t).toEqual([1, 0, 0, 1, 10, 20]);
    });
    
    it('should translate a point', () => {
      const t = translate(5, 10);
      const point: Point = { x: 10, y: 20 };
      const result = applyToPoint(t, point);
      
      expect(result.x).toBeCloseTo(15);
      expect(result.y).toBeCloseTo(30);
    });
    
    it('should handle negative translation', () => {
      const t = translate(-5, -10);
      const point: Point = { x: 10, y: 20 };
      const result = applyToPoint(t, point);
      
      expect(result.x).toBeCloseTo(5);
      expect(result.y).toBeCloseTo(10);
    });
    
    it('should handle zero translation', () => {
      const t = translate(0, 0);
      expect(t).toEqual(identity());
    });
  });
  
  describe('scale', () => {
    it('should create a scale matrix', () => {
      const s = scale(2, 3);
      expect(s).toEqual([2, 0, 0, 3, 0, 0]);
    });
    
    it('should scale a point', () => {
      const s = scale(2, 3);
      const point: Point = { x: 10, y: 20 };
      const result = applyToPoint(s, point);
      
      expect(result.x).toBeCloseTo(20);
      expect(result.y).toBeCloseTo(60);
    });
    
    it('should handle uniform scaling', () => {
      const s = scale(2, 2);
      const point: Point = { x: 5, y: 10 };
      const result = applyToPoint(s, point);
      
      expect(result.x).toBeCloseTo(10);
      expect(result.y).toBeCloseTo(20);
    });
    
    it('should handle negative scale (reflection)', () => {
      const s = scale(-1, 1);
      const point: Point = { x: 10, y: 20 };
      const result = applyToPoint(s, point);
      
      expect(result.x).toBeCloseTo(-10);
      expect(result.y).toBeCloseTo(20);
    });
    
    it('should handle fractional scale', () => {
      const s = scale(0.5, 0.25);
      const point: Point = { x: 10, y: 20 };
      const result = applyToPoint(s, point);
      
      expect(result.x).toBeCloseTo(5);
      expect(result.y).toBeCloseTo(5);
    });
    
    it('should create identity for scale(1, 1)', () => {
      const s = scale(1, 1);
      expect(s).toEqual(identity());
    });
  });
  
  describe('rotate', () => {
    it('should create a rotation matrix', () => {
      const r = rotate(0);
      const id = identity();
      // Check each component is close to identity (handles -0 vs +0)
      for (let i = 0; i < 6; i++) {
        expect(r[i]).toBeCloseTo(id[i]);
      }
    });
    
    it('should rotate 90 degrees', () => {
      const r = rotate(Math.PI / 2);
      const point: Point = { x: 1, y: 0 };
      const result = applyToPoint(r, point);
      
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(1);
    });
    
    it('should rotate 180 degrees', () => {
      const r = rotate(Math.PI);
      const point: Point = { x: 1, y: 0 };
      const result = applyToPoint(r, point);
      
      expect(result.x).toBeCloseTo(-1);
      expect(result.y).toBeCloseTo(0);
    });
    
    it('should rotate 270 degrees', () => {
      const r = rotate(3 * Math.PI / 2);
      const point: Point = { x: 1, y: 0 };
      const result = applyToPoint(r, point);
      
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(-1);
    });
    
    it('should rotate 360 degrees to identity', () => {
      const r = rotate(2 * Math.PI);
      const point: Point = { x: 1, y: 0 };
      const result = applyToPoint(r, point);
      
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(0);
    });
    
    it('should rotate 45 degrees', () => {
      const r = rotate(Math.PI / 4);
      const point: Point = { x: 1, y: 0 };
      const result = applyToPoint(r, point);
      
      const sqrt2over2 = Math.sqrt(2) / 2;
      expect(result.x).toBeCloseTo(sqrt2over2);
      expect(result.y).toBeCloseTo(sqrt2over2);
    });
    
    it('should handle negative rotation (clockwise)', () => {
      const r = rotate(-Math.PI / 2);
      const point: Point = { x: 1, y: 0 };
      const result = applyToPoint(r, point);
      
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(-1);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle very large values', () => {
      const t = translate(1e10, 1e10);
      const point: Point = { x: 1, y: 1 };
      const result = applyToPoint(t, point);
      
      expect(result.x).toBeCloseTo(1e10 + 1);
      expect(result.y).toBeCloseTo(1e10 + 1);
    });
    
    it('should handle very small values', () => {
      const t = translate(1e-10, 1e-10);
      const point: Point = { x: 0, y: 0 };
      const result = applyToPoint(t, point);
      
      expect(result.x).toBeCloseTo(1e-10);
      expect(result.y).toBeCloseTo(1e-10);
    });
    
    it('should compose multiple transformations', () => {
      const t = translate(10, 20);
      const s = scale(2, 2);
      const r = rotate(Math.PI / 4);
      
      // Compose all three: first rotate, then scale, then translate
      const composed = compose(t, compose(s, r));
      
      const point: Point = { x: 1, y: 0 };
      const result = applyToPoint(composed, point);
      
      // First rotate 45°: (1, 0) -> (√2/2, √2/2)
      // Then scale by 2: (√2/2, √2/2) -> (√2, √2)
      // Then translate: (√2, √2) -> (√2 + 10, √2 + 20)
      const sqrt2 = Math.sqrt(2);
      expect(result.x).toBeCloseTo(sqrt2 + 10);
      expect(result.y).toBeCloseTo(sqrt2 + 20);
    });
  });

  describe('decompose', () => {
    it('should decompose identity matrix', () => {
      const id = identity();
      const components = decompose(id);
      
      expect(components.translateX).toBeCloseTo(0);
      expect(components.translateY).toBeCloseTo(0);
      expect(components.scaleX).toBeCloseTo(1);
      expect(components.scaleY).toBeCloseTo(1);
      expect(components.rotation).toBeCloseTo(0);
      expect(components.skew).toBeCloseTo(0);
    });
    
    it('should decompose pure translation', () => {
      const t = translate(10, 20);
      const components = decompose(t);
      
      expect(components.translateX).toBeCloseTo(10);
      expect(components.translateY).toBeCloseTo(20);
      expect(components.scaleX).toBeCloseTo(1);
      expect(components.scaleY).toBeCloseTo(1);
      expect(components.rotation).toBeCloseTo(0);
      expect(components.skew).toBeCloseTo(0);
    });
    
    it('should decompose pure scale', () => {
      const s = scale(2, 3);
      const components = decompose(s);
      
      expect(components.translateX).toBeCloseTo(0);
      expect(components.translateY).toBeCloseTo(0);
      expect(components.scaleX).toBeCloseTo(2);
      expect(components.scaleY).toBeCloseTo(3);
      expect(components.rotation).toBeCloseTo(0);
      expect(components.skew).toBeCloseTo(0);
    });
    
    it('should decompose pure rotation', () => {
      const r = rotate(Math.PI / 4); // 45 degrees
      const components = decompose(r);
      
      expect(components.translateX).toBeCloseTo(0);
      expect(components.translateY).toBeCloseTo(0);
      expect(components.scaleX).toBeCloseTo(1);
      expect(components.scaleY).toBeCloseTo(1);
      expect(components.rotation).toBeCloseTo(Math.PI / 4);
      expect(components.skew).toBeCloseTo(0);
    });
    
    it('should decompose rotation at 90 degrees', () => {
      const r = rotate(Math.PI / 2);
      const components = decompose(r);
      
      expect(components.translateX).toBeCloseTo(0);
      expect(components.translateY).toBeCloseTo(0);
      expect(components.scaleX).toBeCloseTo(1);
      expect(components.scaleY).toBeCloseTo(1);
      expect(components.rotation).toBeCloseTo(Math.PI / 2);
      expect(components.skew).toBeCloseTo(0);
    });
    
    it('should decompose rotation at 180 degrees', () => {
      const r = rotate(Math.PI);
      const components = decompose(r);
      
      expect(components.translateX).toBeCloseTo(0);
      expect(components.translateY).toBeCloseTo(0);
      expect(components.scaleX).toBeCloseTo(1);
      expect(components.scaleY).toBeCloseTo(1);
      expect(Math.abs(components.rotation)).toBeCloseTo(Math.PI);
      expect(components.skew).toBeCloseTo(0);
    });
    
    it('should decompose scale and translate', () => {
      const m = compose(translate(10, 20), scale(2, 3));
      const components = decompose(m);
      
      expect(components.translateX).toBeCloseTo(10);
      expect(components.translateY).toBeCloseTo(20);
      expect(components.scaleX).toBeCloseTo(2);
      expect(components.scaleY).toBeCloseTo(3);
      expect(components.rotation).toBeCloseTo(0);
      expect(components.skew).toBeCloseTo(0);
    });
    
    it('should decompose rotate and translate', () => {
      const m = compose(translate(10, 20), rotate(Math.PI / 4));
      const components = decompose(m);
      
      expect(components.translateX).toBeCloseTo(10);
      expect(components.translateY).toBeCloseTo(20);
      expect(components.scaleX).toBeCloseTo(1);
      expect(components.scaleY).toBeCloseTo(1);
      expect(components.rotation).toBeCloseTo(Math.PI / 4);
      expect(components.skew).toBeCloseTo(0);
    });
    
    it('should decompose rotate and scale', () => {
      // When composing non-uniform scale with rotation, the result is complex
      // Let's test with uniform scale instead for a clearer test
      const m = compose(scale(2, 2), rotate(Math.PI / 6));
      const components = decompose(m);
      
      expect(components.translateX).toBeCloseTo(0);
      expect(components.translateY).toBeCloseTo(0);
      expect(components.scaleX).toBeCloseTo(2);
      expect(components.scaleY).toBeCloseTo(2);
      expect(components.rotation).toBeCloseTo(Math.PI / 6);
      expect(components.skew).toBeCloseTo(0);
    });
    
    it('should decompose complex transformation', () => {
      // Create: translate(10, 20) * rotate(π/4) * scale(2, 3)
      const m = compose(
        translate(10, 20),
        compose(rotate(Math.PI / 4), scale(2, 3))
      );
      const components = decompose(m);
      
      expect(components.translateX).toBeCloseTo(10);
      expect(components.translateY).toBeCloseTo(20);
      expect(components.scaleX).toBeCloseTo(2);
      expect(components.scaleY).toBeCloseTo(3);
      expect(components.rotation).toBeCloseTo(Math.PI / 4);
      expect(components.skew).toBeCloseTo(0);
    });
    
    it('should handle negative scale (reflection)', () => {
      const s = scale(-2, 3);
      const components = decompose(s);
      
      expect(components.translateX).toBeCloseTo(0);
      expect(components.translateY).toBeCloseTo(0);
      expect(components.scaleX).toBeCloseTo(2);
      // Negative determinant means reflection, which affects scaleY
      expect(Math.abs(components.scaleY)).toBeCloseTo(3);
      expect(components.skew).toBeCloseTo(0);
    });
    
    it('should handle uniform negative scale', () => {
      const s = scale(-1, -1);
      const components = decompose(s);
      
      expect(components.translateX).toBeCloseTo(0);
      expect(components.translateY).toBeCloseTo(0);
      expect(components.scaleX).toBeCloseTo(1);
      expect(components.scaleY).toBeCloseTo(1);
      // Rotation by π is equivalent to scale(-1, -1)
      expect(Math.abs(components.rotation)).toBeCloseTo(Math.PI);
    });
    
    it('should decompose skewed matrix', () => {
      // Create a matrix with skew: [1, 0, 0.5, 1, 0, 0]
      // This represents a horizontal skew
      const skewed: Matrix = [1, 0, 0.5, 1, 0, 0];
      const components = decompose(skewed);
      
      expect(components.translateX).toBeCloseTo(0);
      expect(components.translateY).toBeCloseTo(0);
      expect(components.scaleX).toBeCloseTo(1);
      expect(components.scaleY).toBeCloseTo(1);
      expect(components.rotation).toBeCloseTo(0);
      expect(components.skew).toBeCloseTo(0.5);
    });
    
    it('should handle zero scale in x', () => {
      const zeroScaleX: Matrix = [0, 0, 1, 2, 5, 10];
      const components = decompose(zeroScaleX);
      
      expect(components.translateX).toBeCloseTo(5);
      expect(components.translateY).toBeCloseTo(10);
      expect(components.scaleX).toBeCloseTo(0);
      // Should still extract meaningful values for other components
      expect(components.scaleY).not.toBeNaN();
    });
    
    it('should handle very small values', () => {
      const t = translate(1e-10, 1e-10);
      const components = decompose(t);
      
      expect(components.translateX).toBeCloseTo(1e-10);
      expect(components.translateY).toBeCloseTo(1e-10);
      expect(components.scaleX).toBeCloseTo(1);
      expect(components.scaleY).toBeCloseTo(1);
    });
    
    it('should handle very large values', () => {
      const t = translate(1e10, 1e10);
      const components = decompose(t);
      
      expect(components.translateX).toBeCloseTo(1e10);
      expect(components.translateY).toBeCloseTo(1e10);
      expect(components.scaleX).toBeCloseTo(1);
      expect(components.scaleY).toBeCloseTo(1);
    });
    
    it('should decompose arbitrary matrix', () => {
      // Arbitrary matrix with all components
      const m: Matrix = [2, 1, -1, 2, 10, 20];
      const components = decompose(m);
      
      // Verify translation
      expect(components.translateX).toBeCloseTo(10);
      expect(components.translateY).toBeCloseTo(20);
      
      // Verify all components are finite numbers
      expect(components.scaleX).toBeGreaterThan(0);
      expect(components.scaleY).not.toBeNaN();
      expect(components.rotation).not.toBeNaN();
      expect(components.skew).not.toBeNaN();
    });
    
    it('should preserve transformation when recomposed', () => {
      // Create a complex transformation
      const original = compose(
        translate(15, 25),
        compose(rotate(Math.PI / 3), scale(1.5, 2.5))
      );
      
      // Decompose it
      const components = decompose(original);
      
      // Recompose using the components
      const recomposed = compose(
        translate(components.translateX, components.translateY),
        compose(
          rotate(components.rotation),
          scale(components.scaleX, components.scaleY)
        )
      );
      
      // Apply both to a test point and verify they produce the same result
      const testPoint: Point = { x: 10, y: 5 };
      const originalResult = applyToPoint(original, testPoint);
      const recomposedResult = applyToPoint(recomposed, testPoint);
      
      expect(recomposedResult.x).toBeCloseTo(originalResult.x, 5);
      expect(recomposedResult.y).toBeCloseTo(originalResult.y, 5);
    });
  });
});
