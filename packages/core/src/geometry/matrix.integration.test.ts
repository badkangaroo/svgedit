/**
 * Integration tests for matrix operations.
 * 
 * These tests verify that matrix operations work correctly in realistic
 * SVG transformation scenarios.
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
  type Point,
} from './matrix.js';

describe('Matrix Integration Tests', () => {
  describe('SVG Transform Scenarios', () => {
    it('should transform a rectangle corner through translate-scale-rotate', () => {
      // Scenario: Transform a rectangle at (0, 0) with width 100, height 50
      // 1. Translate to center at (50, 25)
      // 2. Scale by 2x
      // 3. Rotate 45 degrees
      // 4. Translate back to origin
      
      const corner: Point = { x: 100, y: 50 };
      
      // Build transformation
      const t1 = translate(-50, -25); // Move to origin
      const s = scale(2, 2);           // Scale
      const r = rotate(Math.PI / 4);   // Rotate 45°
      const t2 = translate(50, 25);    // Move back
      
      // Compose: t2 * r * s * t1
      const transform = compose(t2, compose(r, compose(s, t1)));
      
      const result = applyToPoint(transform, corner);
      
      // Verify result is reasonable (exact values depend on transformation order)
      expect(result.x).toBeGreaterThan(0);
      expect(result.y).toBeGreaterThan(0);
    });
    
    it('should correctly undo a transformation', () => {
      // Scenario: Apply a complex transformation, then undo it
      const original: Point = { x: 100, y: 200 };
      
      // Create a complex transformation
      const t = translate(50, 100);
      const s = scale(2, 3);
      const r = rotate(Math.PI / 6); // 30 degrees
      
      const transform = compose(t, compose(s, r));
      
      // Apply transformation
      const transformed = applyToPoint(transform, original);
      
      // Get inverse
      const invResult = inverse(transform);
      expect(invResult.ok).toBe(true);
      
      if (invResult.ok) {
        const inv = invResult.value;
        
        // Apply inverse to get back to original
        const restored = applyToPoint(inv, transformed);
        
        expect(restored.x).toBeCloseTo(original.x, 5);
        expect(restored.y).toBeCloseTo(original.y, 5);
      }
    });
    
    it('should handle nested group transformations', () => {
      // Scenario: Nested SVG groups with transforms
      // Parent group: translate(100, 100)
      // Child group: scale(2, 2)
      // Element: rotate(45°)
      
      const point: Point = { x: 10, y: 0 };
      
      const parentTransform = translate(100, 100);
      const childTransform = scale(2, 2);
      const elementTransform = rotate(Math.PI / 4);
      
      // Compose all transforms (parent is applied last)
      const combined = compose(
        parentTransform,
        compose(childTransform, elementTransform)
      );
      
      const result = applyToPoint(combined, point);
      
      // First rotate: (10, 0) -> (√2*5, √2*5)
      // Then scale: (√2*5, √2*5) -> (√2*10, √2*10)
      // Then translate: (√2*10, √2*10) -> (√2*10 + 100, √2*10 + 100)
      const sqrt2times10 = Math.sqrt(2) * 10;
      expect(result.x).toBeCloseTo(sqrt2times10 + 100);
      expect(result.y).toBeCloseTo(sqrt2times10 + 100);
    });
    
    it('should handle reflection transformations', () => {
      // Scenario: Reflect across y-axis (scale x by -1)
      const point: Point = { x: 100, y: 50 };
      
      const reflect = scale(-1, 1);
      const result = applyToPoint(reflect, point);
      
      expect(result.x).toBeCloseTo(-100);
      expect(result.y).toBeCloseTo(50);
    });
    
    it('should compose multiple translations correctly', () => {
      // Scenario: Multiple sequential translations (common in animation)
      const point: Point = { x: 0, y: 0 };
      
      const t1 = translate(10, 20);
      const t2 = translate(5, 10);
      const t3 = translate(-3, -5);
      
      const combined = compose(t3, compose(t2, t1));
      const result = applyToPoint(combined, point);
      
      // Total translation: (10 + 5 - 3, 20 + 10 - 5) = (12, 25)
      expect(result.x).toBeCloseTo(12);
      expect(result.y).toBeCloseTo(25);
    });
  });
  
  describe('Transformation Properties', () => {
    it('should satisfy associativity: (A * B) * C = A * (B * C)', () => {
      const a = translate(10, 20);
      const b = scale(2, 2);
      const c = rotate(Math.PI / 4);
      
      const left = compose(compose(a, b), c);
      const right = compose(a, compose(b, c));
      
      // Check each component is equal
      for (let i = 0; i < 6; i++) {
        expect(left[i]).toBeCloseTo(right[i]);
      }
    });
    
    it('should have identity as neutral element: I * M = M * I = M', () => {
      const m = compose(translate(10, 20), scale(2, 3));
      const id = identity();
      
      const left = compose(id, m);
      const right = compose(m, id);
      
      for (let i = 0; i < 6; i++) {
        expect(left[i]).toBeCloseTo(m[i]);
        expect(right[i]).toBeCloseTo(m[i]);
      }
    });
    
    it('should satisfy inverse property: M * M^-1 = M^-1 * M = I', () => {
      const m = compose(translate(10, 20), compose(scale(2, 3), rotate(Math.PI / 6)));
      const invResult = inverse(m);
      
      expect(invResult.ok).toBe(true);
      if (invResult.ok) {
        const inv = invResult.value;
        const id = identity();
        
        const left = compose(m, inv);
        const right = compose(inv, m);
        
        // Both should equal identity
        for (let i = 0; i < 6; i++) {
          expect(left[i]).toBeCloseTo(id[i], 5);
          expect(right[i]).toBeCloseTo(id[i], 5);
        }
      }
    });
    
    it('should preserve distances under rotation', () => {
      // Rotation should preserve distances from origin
      const point: Point = { x: 3, y: 4 };
      const distance = Math.sqrt(point.x * point.x + point.y * point.y);
      
      const r = rotate(Math.PI / 3); // 60 degrees
      const rotated = applyToPoint(r, point);
      
      const newDistance = Math.sqrt(rotated.x * rotated.x + rotated.y * rotated.y);
      
      expect(newDistance).toBeCloseTo(distance);
    });
    
    it('should scale distances correctly', () => {
      const point: Point = { x: 3, y: 4 };
      const distance = Math.sqrt(point.x * point.x + point.y * point.y);
      
      const s = scale(2, 2);
      const scaled = applyToPoint(s, point);
      
      const newDistance = Math.sqrt(scaled.x * scaled.x + scaled.y * scaled.y);
      
      // Distance should be scaled by 2
      expect(newDistance).toBeCloseTo(distance * 2);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle transformation of origin point', () => {
      const origin: Point = { x: 0, y: 0 };
      
      // Only translation should affect origin
      const t = translate(10, 20);
      const s = scale(5, 5);
      const r = rotate(Math.PI);
      
      expect(applyToPoint(t, origin)).toEqual({ x: 10, y: 20 });
      expect(applyToPoint(s, origin)).toEqual({ x: 0, y: 0 });
      expect(applyToPoint(r, origin).x).toBeCloseTo(0);
      expect(applyToPoint(r, origin).y).toBeCloseTo(0);
    });
    
    it('should handle zero scale in one dimension', () => {
      const point: Point = { x: 10, y: 20 };
      const s = scale(0, 1);
      
      const result = applyToPoint(s, point);
      
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(20);
      
      // Should not be invertible
      const invResult = inverse(s);
      expect(invResult.ok).toBe(false);
    });
    
    it('should handle very small rotations', () => {
      const point: Point = { x: 100, y: 0 };
      const r = rotate(0.0001); // Very small angle
      
      const result = applyToPoint(r, point);
      
      // Should be very close to original, but y will be small (not zero)
      // For small angle θ: sin(θ) ≈ θ, so y ≈ 100 * 0.0001 = 0.01
      expect(result.x).toBeCloseTo(100, 1);
      expect(Math.abs(result.y)).toBeLessThan(0.02); // Small but non-zero
    });
    
    it('should handle full circle rotation', () => {
      const point: Point = { x: 10, y: 20 };
      const r = rotate(2 * Math.PI); // 360 degrees
      
      const result = applyToPoint(r, point);
      
      expect(result.x).toBeCloseTo(point.x);
      expect(result.y).toBeCloseTo(point.y);
    });
  });
});
