/**
 * Document State Model
 * 
 * Manages the SVG document state using reactive signals.
 * Provides centralized state for document, selection, and raw SVG text.
 * 
 * Requirements: 3.1-3.5, 4.1
 */

import { signal, computed, Signal, Computed } from './signals';
import type { DocumentNode } from '../types';
import { elementRegistry } from './element-registry';

/**
 * Core document state signals
 */
export interface DocumentState {
  // Document signals
  svgDocument: Signal<SVGElement | null>;
  documentTree: Signal<DocumentNode[]>;
  rawSVG: Signal<string>;
  
  // Selection signals
  selectedUUIDs: Signal<Set<string>>;
  hoveredUUID: Signal<string | null>;
  
  // Computed values
  selectedIds: Computed<Set<string>>;
  hasSelection: Computed<boolean>;
  selectionCount: Computed<number>;
  selectedElements: Computed<SVGElement[]>;
  selectedNodes: Computed<DocumentNode[]>;
}

/**
 * Create the document state with reactive signals
 */
export function createDocumentState(): DocumentState {
  // Document signals
  const svgDocument = signal<SVGElement | null>(null);
  const documentTree = signal<DocumentNode[]>([]);
  const rawSVG = signal<string>('');
  
  // Selection signals
  const selectedUUIDs = signal<Set<string>>(new Set());
  const hoveredUUID = signal<string | null>(null);
  
  // Computed: Get selected element IDs from UUIDs (uses ElementRegistry)
  const selectedIds = computed(() => {
    elementRegistry.structureVersion.get(); // Track registry changes
    const uuids = selectedUUIDs.get();
    if (uuids.size === 0) return new Set<string>();

    const ids = new Set<string>();
    uuids.forEach(uuid => {
      const id = elementRegistry.getId(uuid);
      if (id) ids.add(id);
    });
    return ids;
  });
  
  // Computed: Check if any elements are selected
  const hasSelection = computed(() => selectedUUIDs.get().size > 0);
  
  // Computed: Count of selected elements
  const selectionCount = computed(() => selectedUUIDs.get().size);
  
  // Computed: Get selected SVG elements (uses ElementRegistry)
  const selectedElements = computed(() => {
    elementRegistry.structureVersion.get(); // Track registry changes
    const uuids = selectedUUIDs.get();
    if (uuids.size === 0) return [];

    const elements: SVGElement[] = [];
    uuids.forEach(uuid => {
      const el = elementRegistry.getElement(uuid);
      if (el) elements.push(el);
    });
    return elements;
  });
  
  // Computed: Get selected document nodes (uses ElementRegistry)
  const selectedNodes = computed(() => {
    elementRegistry.structureVersion.get(); // Track registry changes
    const uuids = selectedUUIDs.get();
    if (uuids.size === 0) return [];

    const nodes: DocumentNode[] = [];
    uuids.forEach(uuid => {
      const node = elementRegistry.getNode(uuid);
      if (node) nodes.push(node);
    });
    return nodes;
  });
  
  return {
    svgDocument,
    documentTree,
    rawSVG,
    selectedUUIDs,
    hoveredUUID,
    selectedIds,
    hasSelection,
    selectionCount,
    selectedElements,
    selectedNodes,
  };
}

/**
 * State update functions for document operations
 */
export interface DocumentStateUpdater {
  // Document updates
  setDocument(doc: SVGElement | null, tree: DocumentNode[], svg: string): void;
  updateDocumentTree(tree: DocumentNode[]): void;
  updateRawSVG(svg: string): void;
  clearDocument(): void;
  
  // Selection updates
  select(uuids: string[]): void;
  selectByIds(ids: string[]): void;
  addToSelection(uuids: string[]): void;
  removeFromSelection(uuids: string[]): void;
  clearSelection(): void;
  toggleSelection(uuid: string): void;
  setHoveredUUID(uuid: string | null): void;
}

/**
 * Create state updater functions for the document state
 */
export function createDocumentStateUpdater(state: DocumentState): DocumentStateUpdater {
  // Helper to convert IDs to UUIDs (uses ElementRegistry)
  const idsToUUIDs = (ids: string[]): string[] => elementRegistry.idsToUUIDs(ids);

  return {
    // Document updates
    setDocument(doc: SVGElement | null, tree: DocumentNode[], svg: string): void {
      state.svgDocument.set(doc);
      state.documentTree.set(tree);
      state.rawSVG.set(svg);
      elementRegistry.rebuild(doc, tree);
    },
    
    updateDocumentTree(tree: DocumentNode[]): void {
      state.documentTree.set(tree);
      const doc = state.svgDocument.get();
      elementRegistry.rebuild(doc, tree);
    },
    
    updateRawSVG(svg: string): void {
      state.rawSVG.set(svg);
    },
    
    clearDocument(): void {
      state.svgDocument.set(null);
      state.documentTree.set([]);
      state.rawSVG.set('');
      state.selectedUUIDs.set(new Set());
      elementRegistry.rebuild(null, []);
    },
    
    // Selection updates
    select(uuids: string[]): void {
      state.selectedUUIDs.set(new Set(uuids));
    },
    
    selectByIds(ids: string[]): void {
      const uuids = idsToUUIDs(ids);
      state.selectedUUIDs.set(new Set(uuids));
    },
    
    addToSelection(uuids: string[]): void {
      const current = new Set(state.selectedUUIDs.get());
      uuids.forEach(uuid => current.add(uuid));
      state.selectedUUIDs.set(current);
    },
    
    removeFromSelection(uuids: string[]): void {
      const current = new Set(state.selectedUUIDs.get());
      uuids.forEach(uuid => current.delete(uuid));
      state.selectedUUIDs.set(current);
    },
    
    clearSelection(): void {
      state.selectedUUIDs.set(new Set());
    },
    
    toggleSelection(uuid: string): void {
      const current = new Set(state.selectedUUIDs.get());
      if (current.has(uuid)) {
        current.delete(uuid);
      } else {
        current.add(uuid);
      }
      state.selectedUUIDs.set(current);
    },
    
    setHoveredUUID(uuid: string | null): void {
      state.hoveredUUID.set(uuid);
    },
  };
}

/**
 * Global document state instance
 * This is the single source of truth for the document state
 */
export const documentState = createDocumentState();

/**
 * Global document state updater
 * Provides convenient functions to update the document state
 */
export const documentStateUpdater = createDocumentStateUpdater(documentState);

