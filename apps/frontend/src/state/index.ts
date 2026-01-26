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
