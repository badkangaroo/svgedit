/**
 * Test setup file for Vitest
 * Configures the testing environment for Web Components and DOM testing
 */

// Configure fast-check for property-based testing
import fc from 'fast-check';

// Set default configuration for property tests
// Minimum 100 iterations per property test as per design document
fc.configureGlobal({
  numRuns: 100,
  verbose: true,
});

// Mock Web APIs that may not be available in jsdom
if (typeof window !== 'undefined') {
  // Mock File System Access API if not available
  if (!('showOpenFilePicker' in window)) {
    (window as any).showOpenFilePicker = undefined;
    (window as any).showSaveFilePicker = undefined;
  }

  // Mock localStorage if not available
  if (!window.localStorage || typeof window.localStorage.setItem !== 'function') {
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
        get length() {
          return Object.keys(store).length;
        },
        key: (index: number) => {
          const keys = Object.keys(store);
          return keys[index] || null;
        },
      };
    })();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  }

  // Mock requestAnimationFrame if not available
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      return setTimeout(() => callback(Date.now()), 16) as unknown as number;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id: number) => {
      clearTimeout(id);
    };
  }
}

// Custom matchers for testing
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
