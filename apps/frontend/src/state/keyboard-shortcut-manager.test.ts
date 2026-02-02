/**
 * Tests for Keyboard Shortcut Manager
 * Requirements: 9.4, 10.1, 10.2, 10.3, 10.4, 12.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KeyboardShortcutManager } from './keyboard-shortcut-manager';

describe('KeyboardShortcutManager', () => {
  let manager: KeyboardShortcutManager;

  beforeEach(() => {
    manager = new KeyboardShortcutManager();
  });

  afterEach(() => {
    manager.detach();
    vi.restoreAllMocks();
  });

  describe('Platform Detection', () => {
    it('should detect platform and set modifier key name', () => {
      const modifierKey = manager.getModifierKeyName();
      expect(['Ctrl', 'Cmd']).toContain(modifierKey);
    });
  });

  describe('Shortcut Registration', () => {
    it('should register default shortcuts', () => {
      const shortcuts = manager.getShortcuts();
      expect(shortcuts.length).toBeGreaterThan(0);
    });

    it('should group shortcuts by category', () => {
      const grouped = manager.getShortcutsByCategory();
      expect(grouped.Edit).toBeDefined();
      expect(grouped.Selection).toBeDefined();
      expect(grouped.File).toBeDefined();
      expect(grouped.Tools).toBeDefined();
    });
  });

  describe('Custom Handlers', () => {
    it('should allow registering custom handlers', () => {
      const handler = vi.fn();
      manager.registerHandler('save', handler);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });

      manager.handleKeyboardEvent(event);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Enable/Disable', () => {
    it('should be enabled by default', () => {
      expect(manager.isShortcutsEnabled()).toBe(true);
    });

    it('should not handle shortcuts when disabled', () => {
      const handler = vi.fn();
      manager.registerHandler('save', handler);
      manager.disable();

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });

      manager.handleKeyboardEvent(event);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Input Field Detection', () => {
    it('should not handle shortcuts in input fields', () => {
      const handler = vi.fn();
      manager.registerHandler('save', handler);
      
      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', {
        value: input,
        writable: false,
      });

      manager.handleKeyboardEvent(event);
      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });
  });

  describe('Attach/Detach', () => {
    it('should attach event listener to document', () => {
      const spy = vi.spyOn(document, 'addEventListener');
      manager.attach();
      expect(spy).toHaveBeenCalledWith('keydown', manager.handleKeyboardEvent);
    });

    it('should detach event listener from document', () => {
      const spy = vi.spyOn(document, 'removeEventListener');
      manager.attach();
      manager.detach();
      expect(spy).toHaveBeenCalledWith('keydown', manager.handleKeyboardEvent);
    });
  });

  describe('Save Shortcut', () => {
    it('should dispatch save event', () => {
      const spy = vi.spyOn(document, 'dispatchEvent');
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });

      manager.handleKeyboardEvent(event);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'editor:save' })
      );
    });
  });
});
