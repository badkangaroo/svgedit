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

  it('should create an instance', () => {
    expect(manager).toBeDefined();
  });

  it('should detect platform', () => {
    const modifierKey = manager.getModifierKeyName();
    expect(['Ctrl', 'Cmd']).toContain(modifierKey);
  });

  it('should register default shortcuts', () => {
    const shortcuts = manager.getShortcuts();
    expect(shortcuts.length).toBeGreaterThan(0);
  });

  it('should be enabled by default', () => {
    expect(manager.isShortcutsEnabled()).toBe(true);
  });

  it('should allow custom handlers', () => {
    const handler = vi.fn();
    manager.registerHandler('save', handler);

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });

    manager.handleKeyboardEvent(event);
    expect(handler).toHaveBeenCalled();
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
