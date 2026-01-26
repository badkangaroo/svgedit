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

/**
 * Core document state signals
 */
export interface DocumentState {
  // Document signals
  svgDocument: Signal<SVGElement | null>;
  documentTree: Signal<DocumentNode[]>;
  rawSVG: Signal<string>;
  
  // Selection signals
  selectedIds: Signal<Set<string>>;
  hoveredId: Signal<string | null>;
  
  // Computed values
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
  const selectedIds = signal<Set<string>>(new Set());
  const hoveredId = signal<string | null>(null);
  
  // Computed: Check if any elements are selected
  const hasSelection = computed(() => selectedIds.get().size > 0);
  
  // Computed: Count of selected elements
  const selectionCount = computed(() => selectedIds.get().size);
  
  // Computed: Get selected SVG elements from the document
  const selectedElements = computed(() => {
    const doc = svgDocument.get();
    const ids = selectedIds.get();
    
    if (!doc || ids.size === 0) {
      return [];
    }
    
    const elements: SVGElement[] = [];
    ids.forEach(id => {
      const element = doc.querySelector(`[id="${id}"]`) as SVGElement | null;
      if (element) {
        elements.push(element);
      }
    });
    
    return elements;
  });
  
  // Computed: Get selected document nodes from the tree
  const selectedNodes = computed(() => {
    const tree = documentTree.get();
    const ids = selectedIds.get();
    
    if (tree.length === 0 || ids.size === 0) {
      return [];
    }
    
    const nodes: DocumentNode[] = [];
    
    // Recursive function to find nodes by ID
    const findNodes = (nodeList: DocumentNode[]) => {
      for (const node of nodeList) {
        if (ids.has(node.id)) {
          nodes.push(node);
        }
        if (node.children.length > 0) {
          findNodes(node.children);
        }
      }
    };
    
    findNodes(tree);
    return nodes;
  });
  
  return {
    svgDocument,
    documentTree,
    rawSVG,
    selectedIds,
    hoveredId,
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
  select(ids: string[]): void;
  addToSelection(ids: string[]): void;
  removeFromSelection(ids: string[]): void;
  clearSelection(): void;
  toggleSelection(id: string): void;
  setHoveredId(id: string | null): void;
}

/**
 * Create state updater functions for the document state
 */
export function createDocumentStateUpdater(state: DocumentState): DocumentStateUpdater {
  return {
    // Document updates
    setDocument(doc: SVGElement | null, tree: DocumentNode[], svg: string): void {
      state.svgDocument.set(doc);
      state.documentTree.set(tree);
      state.rawSVG.set(svg);
    },
    
    updateDocumentTree(tree: DocumentNode[]): void {
      state.documentTree.set(tree);
    },
    
    updateRawSVG(svg: string): void {
      state.rawSVG.set(svg);
    },
    
    clearDocument(): void {
      state.svgDocument.set(null);
      state.documentTree.set([]);
      state.rawSVG.set('');
      state.selectedIds.set(new Set());
    },
    
    // Selection updates
    select(ids: string[]): void {
      state.selectedIds.set(new Set(ids));
    },
    
    addToSelection(ids: string[]): void {
      const current = new Set(state.selectedIds.get());
      ids.forEach(id => current.add(id));
      state.selectedIds.set(current);
    },
    
    removeFromSelection(ids: string[]): void {
      const current = new Set(state.selectedIds.get());
      ids.forEach(id => current.delete(id));
      state.selectedIds.set(current);
    },
    
    clearSelection(): void {
      state.selectedIds.set(new Set());
    },
    
    toggleSelection(id: string): void {
      const current = new Set(state.selectedIds.get());
      if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }
      state.selectedIds.set(current);
    },
    
    setHoveredId(id: string | null): void {
      state.hoveredId.set(id);
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

