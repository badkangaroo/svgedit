/**
 * Basic test to verify the test setup is working correctly
 */

import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should run basic tests', () => {
    expect(true).toBe(true);
  });

  it('should have access to DOM APIs', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });

  it('should have localStorage available', () => {
    expect(window.localStorage).toBeDefined();
    window.localStorage.setItem('test', 'value');
    expect(window.localStorage.getItem('test')).toBe('value');
    window.localStorage.removeItem('test');
  });

  it('should support custom matchers', () => {
    expect(5).toBeWithinRange(1, 10);
    expect(100).toBeWithinRange(50, 150);
  });
});
