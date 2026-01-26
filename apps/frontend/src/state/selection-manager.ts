/**
 * Selection Manager
 * 
 * Manages element selection and synchronization across all views.
 * Provides methods for selecting, adding to selection, and clearing selection.
 * Implements sync methods for canvas, hierarchy, raw SVG, and inspector views.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */

import { effect } from './signals';
import { documentState, documentStateUpdater } from './document-state';
import type { DocumentNode } from '../types';

/**
 * Selection change event detail
 */
export interface SelectionChangeEvent {
  selectedIds: Set<string>;
  selectedElements: SVGElement[];
  selectedNodes: DocumentNode[];
}

/**
 * Sync callback functions for different views
 */
export interface SelectionSyncCallbacks {
  onCanvasSync?: (event: SelectionChangeEvent) => void;
  onHierarchySync?: (event: SelectionChangeEvent) => void;
  onRawSVGSync?: (event: SelectionChangeEvent) => void;
  onInspectorSync?: (event: SelectionChangeEvent) => void;
}

/**
 * SelectionManager class
 * 
 * Manages selection state and synchronization across all editor views.
 * Uses reactive signals for automatic propagation of selection changes.
 */
export class SelectionManager {
  private syncCallbacks: SelectionSyncCallbacks = {};
  private disposeEffect: (() => void) | null = null;

  constructor() {
    // Set up automatic synchronization when selection changes
    this.setupAutoSync();
  }

  /**
   * Select elements by their IDs (replaces current selection)
   * 
   * @param ids - Array of element IDs to select
   */
  select(ids: string[]): void {
    documentStateUpdater.select(ids);
  }

  /**
   * Add elements to the current selection
   * 
   * @param ids - Array of element IDs to add to selection
   */
  addToSelection(ids: string[]): void {
    documentStateUpdater.addToSelection(ids);
  }

  /**
   * Remove elements from the current selection
   * 
   * @param ids - Array of element IDs to remove from selection
   */
  removeFromSelection(ids: string[]): void {
    documentStateUpdater.removeFromSelection(ids);
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    documentStateUpdater.clearSelection();
  }

  /**
   * Toggle selection of a single element
   * 
   * @param id - Element ID to toggle
   */
  toggleSelection(id: string): void {
    documentStateUpdater.toggleSelection(id);
  }

  /**
   * Get the currently selected element IDs
   * 
   * @returns Set of selected element IDs
   */
  getSelectedIds(): Set<string> {
    return new Set(documentState.selectedIds.get());
  }

  /**
   * Get the currently selected SVG elements
   * 
   * @returns Array of selected SVG elements
   */
  getSelectedElements(): SVGElement[] {
    return documentState.selectedElements.get();
  }

  /**
   * Get the currently selected document nodes
   * 
   * @returns Array of selected document nodes
   */
  getSelectedNodes(): DocumentNode[] {
    return documentState.selectedNodes.get();
  }

  /**
   * Check if any elements are selected
   * 
   * @returns True if at least one element is selected
   */
  hasSelection(): boolean {
    return documentState.hasSelection.get();
  }

  /**
   * Get the count of selected elements
   * 
   * @returns Number of selected elements
   */
  getSelectionCount(): number {
    return documentState.selectionCount.get();
  }

  /**
   * Register sync callbacks for different views
   * 
   * @param callbacks - Object containing sync callback functions
   */
  registerSyncCallbacks(callbacks: SelectionSyncCallbacks): void {
    this.syncCallbacks = { ...this.syncCallbacks, ...callbacks };
  }

  /**
   * Sync selection to canvas view
   * 
   * Updates visual selection indicators on the canvas.
   * Requirements: 3.1
   */
  syncToCanvas(): void {
    if (this.syncCallbacks.onCanvasSync) {
      const event = this.createSelectionChangeEvent();
      this.syncCallbacks.onCanvasSync(event);
    }
  }

  /**
   * Sync selection to hierarchy panel
   * 
   * Updates highlighted nodes in the hierarchy tree view.
   * Requirements: 3.2
   */
  syncToHierarchy(): void {
    if (this.syncCallbacks.onHierarchySync) {
      const event = this.createSelectionChangeEvent();
      this.syncCallbacks.onHierarchySync(event);
    }
  }

  /**
   * Sync selection to raw SVG panel
   * 
   * Updates text selection/highlighting in the raw SVG editor.
   * Requirements: 3.3
   */
  syncToRawSVG(): void {
    if (this.syncCallbacks.onRawSVGSync) {
      const event = this.createSelectionChangeEvent();
      this.syncCallbacks.onRawSVGSync(event);
    }
  }

  /**
   * Sync selection to attribute inspector
   * 
   * Updates the inspector to show attributes of selected elements.
   * Requirements: 3.5
   */
  syncToInspector(): void {
    if (this.syncCallbacks.onInspectorSync) {
      const event = this.createSelectionChangeEvent();
      this.syncCallbacks.onInspectorSync(event);
    }
  }

  /**
   * Sync selection to all views
   * 
   * Triggers synchronization across canvas, hierarchy, raw SVG, and inspector.
   */
  syncToAllViews(): void {
    this.syncToCanvas();
    this.syncToHierarchy();
    this.syncToRawSVG();
    this.syncToInspector();
  }

  /**
   * Set up automatic synchronization when selection changes
   * 
   * Uses reactive effects to automatically sync all views when selection state changes.
   */
  private setupAutoSync(): void {
    // Clean up existing effect if any
    if (this.disposeEffect) {
      this.disposeEffect();
    }

    // Create effect that runs whenever selection changes
    this.disposeEffect = effect(() => {
      // Access selection signals to track dependencies
      documentState.selectedIds.get();
      documentState.selectedElements.get();
      documentState.selectedNodes.get();

      // Sync to all views
      this.syncToAllViews();
    });
  }

  /**
   * Create a selection change event with current selection data
   * 
   * @returns SelectionChangeEvent object
   */
  private createSelectionChangeEvent(): SelectionChangeEvent {
    return {
      selectedIds: this.getSelectedIds(),
      selectedElements: this.getSelectedElements(),
      selectedNodes: this.getSelectedNodes(),
    };
  }

  /**
   * Dispose of the selection manager and clean up resources
   */
  dispose(): void {
    if (this.disposeEffect) {
      this.disposeEffect();
      this.disposeEffect = null;
    }
    this.syncCallbacks = {};
  }
}

/**
 * Global selection manager instance
 * This is the single source of truth for selection management
 */
export const selectionManager = new SelectionManager();
