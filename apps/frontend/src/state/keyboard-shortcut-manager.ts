/**
 * Keyboard Shortcut Manager
 * 
 * Manages global keyboard shortcuts for the SVG editor.
 * Handles platform differences (Ctrl on Windows/Linux, Cmd on macOS).
 * Maps keyboard shortcuts to editor actions like undo, redo, delete, copy, paste, and save.
 * 
 * Requirements: 9.4, 10.1, 10.2, 10.3, 10.4, 12.5
 */

import { editorController } from './editor-controller';
import { transformEngine } from './transform-engine';
import { selectionManager } from './selection-manager';
import { toolPaletteState } from '../components/svg-tool-palette';

/**
 * Keyboard shortcut action types
 */
export type ShortcutAction = 
  | 'undo' 
  | 'redo' 
  | 'delete' 
  | 'copy' 
  | 'cut' 
  | 'paste' 
  | 'save'
  | 'saveAs'
  | 'new'
  | 'open'
  | 'selectAll'
  | 'deselectAll'
  | 'toolSelect'
  | 'toolRectangle'
  | 'toolCircle'
  | 'toolEllipse'
  | 'toolLine';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: ShortcutAction;
  description: string;
  preventDefault?: boolean;
}

/**
 * Shortcut handler callback
 */
export type ShortcutHandler = (action: ShortcutAction, event: KeyboardEvent) => void;

/**
 * Clipboard data for copy/paste operations
 */
interface ClipboardData {
  elementIds: string[];
  timestamp: number;
}

/**
 * KeyboardShortcutManager class
 * 
 * Manages keyboard shortcuts for the editor, handling:
 * - Platform-specific modifier keys (Ctrl vs Cmd)
 * - Shortcut registration and execution
 * - Integration with editor operations (undo, redo, delete, etc.)
 * - Copy/paste functionality
 */
export class KeyboardShortcutManager {
  private shortcuts: KeyboardShortcut[] = [];
  private customHandlers: Map<ShortcutAction, ShortcutHandler> = new Map();
  private clipboard: ClipboardData | null = null;
  private isEnabled = true;
  private isMac: boolean;

  constructor() {
    // Detect platform
    this.isMac = this.detectMacPlatform();
    
    // Register default shortcuts
    this.registerDefaultShortcuts();
  }

  /**
   * Detect if the platform is macOS
   * @returns true if running on macOS
   */
  private detectMacPlatform(): boolean {
    return typeof navigator !== 'undefined' && 
           /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  }

  /**
   * Register default keyboard shortcuts
   * 
   * Shortcuts are platform-aware:
   * - macOS: Uses Cmd (meta) key
   * - Windows/Linux: Uses Ctrl key
   */
  private registerDefaultShortcuts(): void {
    const modifierKey = this.isMac ? 'meta' : 'ctrl';

    // Undo: Ctrl+Z / Cmd+Z
    this.registerShortcut({
      key: 'z',
      [modifierKey]: true,
      action: 'undo',
      description: `${this.isMac ? 'Cmd' : 'Ctrl'}+Z: Undo`,
      preventDefault: true,
    });

    // Redo: Ctrl+Shift+Z / Cmd+Shift+Z
    this.registerShortcut({
      key: 'z',
      [modifierKey]: true,
      shift: true,
      action: 'redo',
      description: `${this.isMac ? 'Cmd' : 'Ctrl'}+Shift+Z: Redo`,
      preventDefault: true,
    });

    // Alternative Redo: Ctrl+Y / Cmd+Y (Windows convention)
    if (!this.isMac) {
      this.registerShortcut({
        key: 'y',
        ctrl: true,
        action: 'redo',
        description: 'Ctrl+Y: Redo',
        preventDefault: true,
      });
    }

    // Delete: Delete key
    this.registerShortcut({
      key: 'Delete',
      action: 'delete',
      description: 'Delete: Delete selected elements',
      preventDefault: true,
    });

    // Delete: Backspace key (alternative)
    this.registerShortcut({
      key: 'Backspace',
      action: 'delete',
      description: 'Backspace: Delete selected elements',
      preventDefault: true,
    });

    // Copy: Ctrl+C / Cmd+C
    this.registerShortcut({
      key: 'c',
      [modifierKey]: true,
      action: 'copy',
      description: `${this.isMac ? 'Cmd' : 'Ctrl'}+C: Copy`,
      preventDefault: true,
    });

    // Cut: Ctrl+X / Cmd+X
    this.registerShortcut({
      key: 'x',
      [modifierKey]: true,
      action: 'cut',
      description: `${this.isMac ? 'Cmd' : 'Ctrl'}+X: Cut`,
      preventDefault: true,
    });

    // Paste: Ctrl+V / Cmd+V
    this.registerShortcut({
      key: 'v',
      [modifierKey]: true,
      action: 'paste',
      description: `${this.isMac ? 'Cmd' : 'Ctrl'}+V: Paste`,
      preventDefault: true,
    });

    // New: Ctrl+N / Cmd+N
    this.registerShortcut({
      key: 'n',
      [modifierKey]: true,
      action: 'new',
      description: `${this.isMac ? 'Cmd' : 'Ctrl'}+N: New Document`,
      preventDefault: true,
    });

    // Open: Ctrl+O / Cmd+O
    this.registerShortcut({
      key: 'o',
      [modifierKey]: true,
      action: 'open',
      description: `${this.isMac ? 'Cmd' : 'Ctrl'}+O: Open File`,
      preventDefault: true,
    });

    // Save: Ctrl+S / Cmd+S
    this.registerShortcut({
      key: 's',
      [modifierKey]: true,
      action: 'save',
      description: `${this.isMac ? 'Cmd' : 'Ctrl'}+S: Save`,
      preventDefault: true,
    });

    // Save As: Ctrl+Shift+S / Cmd+Shift+S
    this.registerShortcut({
      key: 's',
      [modifierKey]: true,
      shift: true,
      action: 'saveAs',
      description: `${this.isMac ? 'Cmd' : 'Ctrl'}+Shift+S: Save As`,
      preventDefault: true,
    });

    // Select All: Ctrl+A / Cmd+A
    this.registerShortcut({
      key: 'a',
      [modifierKey]: true,
      action: 'selectAll',
      description: `${this.isMac ? 'Cmd' : 'Ctrl'}+A: Select All`,
      preventDefault: true,
    });

    // Deselect All: Escape
    this.registerShortcut({
      key: 'Escape',
      action: 'deselectAll',
      description: 'Escape: Deselect all',
      preventDefault: false,
    });

    // Tool selection (no modifier - only when not typing in input)
    this.registerShortcut({
      key: 'v',
      ctrl: false,
      meta: false,
      action: 'toolSelect',
      description: 'V: Select tool',
      preventDefault: true,
    });
    this.registerShortcut({
      key: 'r',
      ctrl: false,
      meta: false,
      action: 'toolRectangle',
      description: 'R: Rectangle tool',
      preventDefault: true,
    });
    this.registerShortcut({
      key: 'c',
      ctrl: false,
      meta: false,
      action: 'toolCircle',
      description: 'C: Circle tool',
      preventDefault: true,
    });
    this.registerShortcut({
      key: 'e',
      ctrl: false,
      meta: false,
      action: 'toolEllipse',
      description: 'E: Ellipse tool',
      preventDefault: true,
    });
    this.registerShortcut({
      key: 'l',
      ctrl: false,
      meta: false,
      action: 'toolLine',
      description: 'L: Line tool',
      preventDefault: true,
    });
  }

  /**
   * Register a keyboard shortcut
   * 
   * @param shortcut The shortcut definition to register
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts.push(shortcut);
  }

  /**
   * Register a custom handler for a specific action
   * 
   * This allows components to override default behavior for specific actions.
   * For example, the save action might need to trigger a file save dialog.
   * 
   * @param action The action to handle
   * @param handler The handler function
   */
  registerHandler(action: ShortcutAction, handler: ShortcutHandler): void {
    this.customHandlers.set(action, handler);
  }

  /**
   * Unregister a custom handler
   * 
   * @param action The action to unregister
   */
  unregisterHandler(action: ShortcutAction): void {
    this.customHandlers.delete(action);
  }

  /**
   * Enable keyboard shortcuts
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable keyboard shortcuts
   * 
   * Useful when a modal dialog or text input has focus
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Check if keyboard shortcuts are enabled
   * 
   * @returns true if shortcuts are enabled
   */
  isShortcutsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Handle keyboard event
   * 
   * This is the main entry point for keyboard event handling.
   * Should be attached to the document or root element.
   * 
   * @param event The keyboard event
   */
  handleKeyboardEvent = (event: KeyboardEvent): void => {
    // Don't handle shortcuts if disabled
    if (!this.isEnabled) {
      return;
    }

    // Don't handle shortcuts if user is typing in an input field
    if (this.isTypingInInput(event)) {
      return;
    }

    // Find matching shortcut
    const shortcut = this.findMatchingShortcut(event);
    
    if (shortcut) {
      // Prevent default browser behavior if specified
      if (shortcut.preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Execute the action
      this.executeAction(shortcut.action, event);
    }
  };

  /**
   * Check if the user is typing in an input field
   * 
   * @param event The keyboard event
   * @returns true if the event target is an input element
   */
  private isTypingInInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    
    if (!target) {
      return false;
    }

    const tagName = target.tagName.toLowerCase();
    const isContentEditable = target.isContentEditable;
    
    // Check if target is an input element
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      isContentEditable
    );
  }

  /**
   * Find a shortcut that matches the keyboard event
   * 
   * @param event The keyboard event
   * @returns The matching shortcut or undefined
   */
  private findMatchingShortcut(event: KeyboardEvent): KeyboardShortcut | undefined {
    return this.shortcuts.find(shortcut => {
      // Normalize key for comparison
      const eventKey = event.key.toLowerCase();
      const shortcutKey = shortcut.key.toLowerCase();
      
      // Check if keys match
      if (eventKey !== shortcutKey) {
        return false;
      }

      // Check modifier keys
      const ctrlMatch = (shortcut.ctrl ?? false) === event.ctrlKey;
      const shiftMatch = (shortcut.shift ?? false) === event.shiftKey;
      const altMatch = (shortcut.alt ?? false) === event.altKey;
      const metaMatch = (shortcut.meta ?? false) === event.metaKey;

      return ctrlMatch && shiftMatch && altMatch && metaMatch;
    });
  }

  /**
   * Execute a shortcut action
   * 
   * @param action The action to execute
   * @param event The keyboard event that triggered the action
   */
  private executeAction(action: ShortcutAction, event: KeyboardEvent): void {
    // Check if there's a custom handler for this action
    const customHandler = this.customHandlers.get(action);
    if (customHandler) {
      customHandler(action, event);
      return;
    }

    // Execute default action
    try {
      switch (action) {
        case 'undo':
          this.handleUndo();
          break;
        case 'redo':
          this.handleRedo();
          break;
        case 'delete':
          this.handleDelete();
          break;
        case 'copy':
          this.handleCopy();
          break;
        case 'cut':
          this.handleCut();
          break;
        case 'paste':
          this.handlePaste();
          break;
        case 'new':
          this.handleNew();
          break;
        case 'open':
          this.handleOpen();
          break;
        case 'save':
          this.handleSave();
          break;
        case 'saveAs':
          this.handleSaveAs();
          break;
        case 'toolSelect':
          toolPaletteState.activeTool.set('select');
          break;
        case 'toolRectangle':
          toolPaletteState.activeTool.set('rectangle');
          break;
        case 'toolCircle':
          toolPaletteState.activeTool.set('circle');
          break;
        case 'toolEllipse':
          toolPaletteState.activeTool.set('ellipse');
          break;
        case 'toolLine':
          toolPaletteState.activeTool.set('line');
          break;
        case 'selectAll':
          this.handleSelectAll();
          break;
        case 'deselectAll':
          this.handleDeselectAll();
          break;
        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Error executing action ${action}:`, error);
    }
  }

  /**
   * Handle undo action
   */
  private handleUndo(): void {
    if (editorController.canUndo()) {
      editorController.undo();
    }
  }

  /**
   * Handle redo action
   */
  private handleRedo(): void {
    if (editorController.canRedo()) {
      editorController.redo();
    }
  }

  /**
   * Handle delete action
   */
  private handleDelete(): void {
    const selectedIds = Array.from(selectionManager.getSelectedIds());
    
    if (selectedIds.length === 0) {
      return;
    }

    // Create delete operation
    const operation = transformEngine.delete(selectedIds);
    
    // Push to history
    editorController.pushOperation(operation);
    
    // Clear selection
    selectionManager.clearSelection();
  }

  /**
   * Handle copy action
   */
  private handleCopy(): void {
    const selectedIds = Array.from(selectionManager.getSelectedIds());
    
    if (selectedIds.length === 0) {
      return;
    }

    // Store selected element IDs in clipboard
    this.clipboard = {
      elementIds: selectedIds,
      timestamp: Date.now(),
    };
  }

  /**
   * Handle cut action
   */
  private handleCut(): void {
    const selectedIds = Array.from(selectionManager.getSelectedIds());
    
    if (selectedIds.length === 0) {
      return;
    }

    // Copy to clipboard
    this.clipboard = {
      elementIds: selectedIds,
      timestamp: Date.now(),
    };

    // Delete the elements
    const operation = transformEngine.delete(selectedIds);
    editorController.pushOperation(operation);
    
    // Clear selection
    selectionManager.clearSelection();
  }

  /**
   * Handle paste action
   * 
   * Note: This is a placeholder implementation.
   * Full paste functionality would require cloning elements and updating IDs.
   */
  private handlePaste(): void {
    if (!this.clipboard || this.clipboard.elementIds.length === 0) {
      return;
    }

    // TODO: Implement full paste functionality
    // This would involve:
    // 1. Cloning the elements from clipboard
    // 2. Generating new unique IDs
    // 3. Offsetting position slightly
    // 4. Adding to document
    // 5. Creating an operation for undo/redo
    
    console.log('Paste action triggered (not yet fully implemented)');
  }

  /**
   * Handle new document action
   * 
   * Note: This dispatches a custom event that the file manager can listen for.
   */
  private handleNew(): void {
    // Dispatch a custom event that the file manager can listen for
    const event = new CustomEvent('editor:new', {
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(event);
  }

  /**
   * Handle open file action
   */
  private handleOpen(): void {
    const event = new CustomEvent('editor:open', {
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(event);
  }

  /**
   * Handle save action
   * 
   * Note: This is a placeholder that dispatches a custom event.
   * The actual save logic should be implemented by the file manager.
   */
  private handleSave(): void {
    // Dispatch a custom event that the file manager can listen for
    const event = new CustomEvent('editor:save', {
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(event);
  }

  /**
   * Handle save as action
   * 
   * Note: This is a placeholder that dispatches a custom event.
   * The actual save logic should be implemented by the file manager.
   */
  private handleSaveAs(): void {
    // Dispatch a custom event that the file manager can listen for
    const event = new CustomEvent('editor:saveAs', {
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(event);
  }

  /**
   * Handle select all action
   * 
   * Note: This is a placeholder implementation.
   * Full implementation would select all elements in the document.
   */
  private handleSelectAll(): void {
    // TODO: Implement select all functionality
    // This would involve getting all element IDs from the document
    // and selecting them all
    
    console.log('Select all action triggered (not yet fully implemented)');
  }

  /**
   * Handle deselect all action
   */
  private handleDeselectAll(): void {
    selectionManager.clearSelection();
  }

  /**
   * Get all registered shortcuts
   * 
   * @returns Array of all registered shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }

  /**
   * Get shortcuts grouped by category
   * 
   * @returns Object with shortcuts grouped by category
   */
  getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
    return {
      'Edit': this.shortcuts.filter(s => 
        ['undo', 'redo', 'copy', 'cut', 'paste'].includes(s.action)
      ),
      'Selection': this.shortcuts.filter(s => 
        ['selectAll', 'deselectAll', 'delete'].includes(s.action)
      ),
      'File': this.shortcuts.filter(s => 
        ['new', 'open', 'save', 'saveAs'].includes(s.action)
      ),
      'Tools': this.shortcuts.filter(s => 
        ['toolSelect', 'toolRectangle', 'toolCircle', 'toolEllipse', 'toolLine'].includes(s.action)
      ),
    };
  }

  /**
   * Attach keyboard event listener to document
   */
  attach(): void {
    document.addEventListener('keydown', this.handleKeyboardEvent);
  }

  /**
   * Detach keyboard event listener from document
   */
  detach(): void {
    document.removeEventListener('keydown', this.handleKeyboardEvent);
  }

  /**
   * Get the platform-specific modifier key name
   * 
   * @returns 'Cmd' for macOS, 'Ctrl' for other platforms
   */
  getModifierKeyName(): string {
    return this.isMac ? 'Cmd' : 'Ctrl';
  }

  /**
   * Check if running on macOS
   * 
   * @returns true if running on macOS
   */
  isMacPlatform(): boolean {
    return this.isMac;
  }
}

/**
 * Global keyboard shortcut manager instance
 */
export const keyboardShortcutManager = new KeyboardShortcutManager();
