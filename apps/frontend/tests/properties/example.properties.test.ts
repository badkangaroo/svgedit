/**
 * Example property-based test to verify fast-check is configured correctly
 * Feature: frontend-editor
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';

describe('Property-Based Testing Setup', () => {
  it('should run property tests with fast-check', () => {
    // Example property: reversing an array twice returns the original array
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const reversed = arr.slice().reverse();
        const doubleReversed = reversed.slice().reverse();
        return JSON.stringify(arr) === JSON.stringify(doubleReversed);
      })
    );
  });

  it('should run at least 100 iterations by default', () => {
    let runCount = 0;
    fc.assert(
      fc.property(fc.integer(), () => {
        runCount++;
        return true;
      })
    );
    // The default configuration should run at least 100 times
    expect(runCount).toBeGreaterThanOrEqual(100);
  });
});
