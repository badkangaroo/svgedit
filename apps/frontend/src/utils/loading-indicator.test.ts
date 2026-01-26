/**
 * Loading Indicator Tests
 * 
 * Tests for the loading indicator utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadingIndicator, withLoadingIndicator } from './loading-indicator';

describe('LoadingIndicator', () => {
  beforeEach(() => {
    // Clean up any existing indicators
    loadingIndicator.reset();
    
    // Clear document body
    document.body.innerHTML = '';
  });

  afterEach(() => {
    loadingIndicator.reset();
  });

  describe('show', () => {
    it('should create a loading indicator with default options', () => {
      const handle = loadingIndicator.show();
      
      expect(handle).toBeDefined();
      expect(handle.hide).toBeInstanceOf(Function);
      expect(handle.updateMessage).toBeInstanceOf(Function);
      expect(handle.updateProgress).toBeInstanceOf(Function);
      
      handle.hide();
    });

    it('should show indicator after delay', async () => {
      const handle = loadingIndicator.show({ delay: 50 });
      
      // Should not be visible immediately
      let container = document.getElementById('loading-indicator-container');
      expect(container?.children.length || 0).toBe(0);
      
      // Wait for delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should be visible now
      container = document.getElementById('loading-indicator-container');
      expect(container?.children.length || 0).toBeGreaterThan(0);
      
      handle.hide();
    });

    it('should show indicator immediately with delay 0', () => {
      const handle = loadingIndicator.show({ delay: 0 });
      
      // Should be visible immediately
      const container = document.getElementById('loading-indicator-container');
      expect(container?.children.length || 0).toBeGreaterThan(0);
      
      handle.hide();
    });

    it('should display custom message', async () => {
      const handle = loadingIndicator.show({
        message: 'Custom loading message',
        delay: 0,
      });
      
      const container = document.getElementById('loading-indicator-container');
      expect(container?.textContent).toContain('Custom loading message');
      
      handle.hide();
    });

    it('should support different indicator types', async () => {
      const spinnerHandle = loadingIndicator.show({ type: 'spinner', delay: 0 });
      expect(document.querySelector('.loading-indicator-spinner')).toBeTruthy();
      spinnerHandle.hide();

      const progressHandle = loadingIndicator.show({ type: 'progress', delay: 0 });
      expect(document.querySelector('.loading-indicator-progress')).toBeTruthy();
      progressHandle.hide();

      const inlineHandle = loadingIndicator.show({ type: 'inline', delay: 0 });
      expect(document.querySelector('.loading-indicator-inline')).toBeTruthy();
      inlineHandle.hide();
    });
  });

  describe('handle', () => {
    it('should update message', async () => {
      const handle = loadingIndicator.show({
        message: 'Initial message',
        delay: 0,
      });
      
      const container = document.getElementById('loading-indicator-container');
      expect(container?.textContent).toContain('Initial message');
      
      handle.updateMessage('Updated message');
      expect(container?.textContent).toContain('Updated message');
      
      handle.hide();
    });

    it('should update progress', async () => {
      const handle = loadingIndicator.show({
        type: 'progress',
        progress: 0,
        delay: 0,
      });
      
      const progressFill = document.querySelector('.loading-progress-fill') as HTMLElement;
      expect(progressFill?.style.width).toBe('0%');
      
      handle.updateProgress(50);
      expect(progressFill?.style.width).toBe('50%');
      
      handle.updateProgress(100);
      expect(progressFill?.style.width).toBe('100%');
      
      handle.hide();
    });

    it('should hide indicator', async () => {
      const handle = loadingIndicator.show({ delay: 0 });
      
      let container = document.getElementById('loading-indicator-container');
      expect(container?.children.length || 0).toBeGreaterThan(0);
      
      handle.hide();
      
      container = document.getElementById('loading-indicator-container');
      expect(container?.children.length || 0).toBe(0);
    });

    it('should prevent showing if hidden before delay', async () => {
      const handle = loadingIndicator.show({ delay: 100 });
      
      // Hide immediately
      handle.hide();
      
      // Wait for delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should not be visible
      const container = document.getElementById('loading-indicator-container');
      expect(container?.children.length || 0).toBe(0);
    });
  });

  describe('hideAll', () => {
    it('should hide all active indicators', async () => {
      const handle1 = loadingIndicator.show({ delay: 0 });
      const handle2 = loadingIndicator.show({ delay: 0 });
      const handle3 = loadingIndicator.show({ delay: 0 });
      
      let container = document.getElementById('loading-indicator-container');
      expect(container?.children.length || 0).toBe(3);
      
      loadingIndicator.hideAll();
      
      container = document.getElementById('loading-indicator-container');
      expect(container?.children.length || 0).toBe(0);
    });
  });

  describe('getActiveCount', () => {
    it('should return the number of active indicators', () => {
      expect(loadingIndicator.getActiveCount()).toBe(0);
      
      const handle1 = loadingIndicator.show();
      expect(loadingIndicator.getActiveCount()).toBe(1);
      
      const handle2 = loadingIndicator.show();
      expect(loadingIndicator.getActiveCount()).toBe(2);
      
      handle1.hide();
      expect(loadingIndicator.getActiveCount()).toBe(1);
      
      handle2.hide();
      expect(loadingIndicator.getActiveCount()).toBe(0);
    });
  });

  describe('withLoadingIndicator', () => {
    it('should wrap async operation with loading indicator', async () => {
      const operation = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      });

      const result = await withLoadingIndicator(operation, {
        message: 'Processing...',
        delay: 0,
      });

      expect(operation).toHaveBeenCalled();
      expect(result).toBe('result');
      
      // Indicator should be hidden after operation completes
      expect(loadingIndicator.getActiveCount()).toBe(0);
    });

    it('should hide indicator even if operation throws', async () => {
      const operation = vi.fn(async () => {
        throw new Error('Operation failed');
      });

      await expect(
        withLoadingIndicator(operation, { delay: 0 })
      ).rejects.toThrow('Operation failed');

      // Indicator should still be hidden
      expect(loadingIndicator.getActiveCount()).toBe(0);
    });
  });
});
