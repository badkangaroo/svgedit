/**
 * State Management Module
 * 
 * Exports the reactive signal system and document state for use throughout the application.
 */

export { signal, computed, effect, batch, Signal, Computed, Effect } from './signals';
export {
  createDocumentState,
  createDocumentStateUpdater,
  documentState,
  documentStateUpdater,
  type DocumentState,
  type DocumentStateUpdater,
} from './document-state';
export {
  SelectionManager,
  selectionManager,
  type SelectionChangeEvent,
  type SelectionSyncCallbacks,
} from './selection-manager';
export {
  HistoryManager,
  historyManager,
} from './history-manager';
export {
  EditorController,
  editorController,
} from './editor-controller';
export {
  ElementRegistry,
  elementRegistry,
} from './element-registry';
export {
  TransformEngine,
  transformEngine,
} from './transform-engine';
export {
  KeyboardShortcutManager,
  keyboardShortcutManager,
  type ShortcutAction,
  type KeyboardShortcut,
  type ShortcutHandler,
} from './keyboard-shortcut-manager';
