/**
 * Selection Manager Tests
 * 
 * Unit tests for the SelectionManager class.
 * Tests selection operations and cross-view synchronization.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SelectionManager } from './selection-manager';
import { documentStateUpdater } from './document-state';
import type { DocumentNode } from '../types';

describe('SelectionManager', () => {
  let manager: SelectionManager;

  beforeEach(() => {
    // Clear document state before each test
    documentStateUpdater.clearDocument();
    
    // Create a fresh selection manager
    manager = new SelectionManager();
  });

  describe('Basic Selection Operations', () => {
    it('should select elements by IDs', () => {
      manager.select(['elem1', 'elem2']);
      
      const selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(2);
      expect(selectedIds.has('elem1')).toBe(true);
      expect(selectedIds.has('elem2')).toBe(true);
    });

    it('should replace previous selection when selecting new elements', () => {
      manager.select(['elem1', 'elem2']);
      manager.select(['elem3']);
      
      const selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(1);
      expect(selectedIds.has('elem3')).toBe(true);
      expect(selectedIds.has('elem1')).toBe(false);
    });

    it('should add elements to existing selection', () => {
      manager.select(['elem1']);
      manager.addToSelection(['elem2', 'elem3']);
      
      const selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(3);
      expect(selectedIds.has('elem1')).toBe(true);
      expect(selectedIds.has('elem2')).toBe(true);
      expect(selectedIds.has('elem3')).toBe(true);
    });

    it('should not duplicate IDs when adding to selection', () => {
      manager.select(['elem1']);
      manager.addToSelection(['elem1', 'elem2']);
      
      const selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(2);
    });

    it('should remove elements from selection', () => {
      manager.select(['elem1', 'elem2', 'elem3']);
      manager.removeFromSelection(['elem2']);
      
      const selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(2);
      expect(selectedIds.has('elem1')).toBe(true);
      expect(selectedIds.has('elem3')).toBe(true);
      expect(selectedIds.has('elem2')).toBe(false);
    });

    it('should clear all selections', () => {
      manager.select(['elem1', 'elem2', 'elem3']);
      manager.clearSelection();
      
      const selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(0);
    });

    it('should toggle selection of a single element', () => {
      manager.select(['elem1']);
      
      // Toggle elem2 on
      manager.toggleSelection('elem2');
      let selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(2);
      expect(selectedIds.has('elem2')).toBe(true);
      
      // Toggle elem2 off
      manager.toggleSelection('elem2');
      selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(1);
      expect(selectedIds.has('elem2')).toBe(false);
    });
  });

  describe('Selection Queries', () => {
    it('should return empty set when nothing is selected', () => {
      const selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(0);
    });

    it('should report hasSelection correctly', () => {
      expect(manager.hasSelection()).toBe(false);
      
      manager.select(['elem1']);
      expect(manager.hasSelection()).toBe(true);
      
      manager.clearSelection();
      expect(manager.hasSelection()).toBe(false);
    });

    it('should return correct selection count', () => {
      expect(manager.getSelectionCount()).toBe(0);
      
      manager.select(['elem1', 'elem2', 'elem3']);
      expect(manager.getSelectionCount()).toBe(3);
      
      manager.removeFromSelection(['elem2']);
      expect(manager.getSelectionCount()).toBe(2);
    });

    it('should return selected elements from document', () => {
      // Create a mock SVG document
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect1.setAttribute('id', 'rect1');
      const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect2.setAttribute('id', 'rect2');
      svg.appendChild(rect1);
      svg.appendChild(rect2);
      
      // Set document state
      documentStateUpdater.setDocument(svg, [], '');
      
      // Select elements
      manager.select(['rect1', 'rect2']);
      
      const selectedElements = manager.getSelectedElements();
      expect(selectedElements.length).toBe(2);
      expect(selectedElements[0].id).toBe('rect1');
      expect(selectedElements[1].id).toBe('rect2');
    });

    it('should return selected nodes from document tree', () => {
      // Create mock document nodes
      const node1: DocumentNode = {
        id: 'node1',
        type: 'element',
        tagName: 'rect',
        attributes: new Map(),
        children: [],
        element: document.createElementNS('http://www.w3.org/2000/svg', 'rect'),
      };
      
      const node2: DocumentNode = {
        id: 'node2',
        type: 'element',
        tagName: 'circle',
        attributes: new Map(),
        children: [],
        element: document.createElementNS('http://www.w3.org/2000/svg', 'circle'),
      };
      
      // Set document state
      documentStateUpdater.setDocument(null, [node1, node2], '');
      
      // Select nodes
      manager.select(['node1', 'node2']);
      
      const selectedNodes = manager.getSelectedNodes();
      expect(selectedNodes.length).toBe(2);
      expect(selectedNodes[0].id).toBe('node1');
      expect(selectedNodes[1].id).toBe('node2');
    });
  });

  describe('Cross-View Synchronization', () => {
    it('should call canvas sync callback when selection changes', async () => {
      const onCanvasSync = vi.fn();
      manager.registerSyncCallbacks({ onCanvasSync });
      
      manager.select(['elem1']);
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      expect(onCanvasSync).toHaveBeenCalled();
      const event = onCanvasSync.mock.calls[0][0];
      expect(event.selectedIds.has('elem1')).toBe(true);
    });

    it('should call hierarchy sync callback when selection changes', async () => {
      const onHierarchySync = vi.fn();
      manager.registerSyncCallbacks({ onHierarchySync });
      
      manager.select(['elem1']);
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      expect(onHierarchySync).toHaveBeenCalled();
      const event = onHierarchySync.mock.calls[0][0];
      expect(event.selectedIds.has('elem1')).toBe(true);
    });

    it('should call raw SVG sync callback when selection changes', async () => {
      const onRawSVGSync = vi.fn();
      manager.registerSyncCallbacks({ onRawSVGSync });
      
      manager.select(['elem1']);
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      expect(onRawSVGSync).toHaveBeenCalled();
      const event = onRawSVGSync.mock.calls[0][0];
      expect(event.selectedIds.has('elem1')).toBe(true);
    });

    it('should call inspector sync callback when selection changes', async () => {
      const onInspectorSync = vi.fn();
      manager.registerSyncCallbacks({ onInspectorSync });
      
      manager.select(['elem1']);
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      expect(onInspectorSync).toHaveBeenCalled();
      const event = onInspectorSync.mock.calls[0][0];
      expect(event.selectedIds.has('elem1')).toBe(true);
    });

    it('should call all sync callbacks when selection changes', async () => {
      const onCanvasSync = vi.fn();
      const onHierarchySync = vi.fn();
      const onRawSVGSync = vi.fn();
      const onInspectorSync = vi.fn();
      
      manager.registerSyncCallbacks({
        onCanvasSync,
        onHierarchySync,
        onRawSVGSync,
        onInspectorSync,
      });
      
      manager.select(['elem1']);
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      expect(onCanvasSync).toHaveBeenCalled();
      expect(onHierarchySync).toHaveBeenCalled();
      expect(onRawSVGSync).toHaveBeenCalled();
      expect(onInspectorSync).toHaveBeenCalled();
    });

    it('should sync automatically when selection is added', async () => {
      const onCanvasSync = vi.fn();
      manager.registerSyncCallbacks({ onCanvasSync });
      
      manager.select(['elem1']);
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      const callCount1 = onCanvasSync.mock.calls.length;
      
      manager.addToSelection(['elem2']);
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      const callCount2 = onCanvasSync.mock.calls.length;
      
      expect(callCount2).toBeGreaterThan(callCount1);
    });

    it('should sync automatically when selection is cleared', async () => {
      const onCanvasSync = vi.fn();
      manager.registerSyncCallbacks({ onCanvasSync });
      
      manager.select(['elem1']);
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      const callCount1 = onCanvasSync.mock.calls.length;
      
      manager.clearSelection();
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      const callCount2 = onCanvasSync.mock.calls.length;
      
      expect(callCount2).toBeGreaterThan(callCount1);
    });

    it('should provide selection data in sync events', async () => {
      // Create a mock SVG document
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      svg.appendChild(rect);
      
      const node: DocumentNode = {
        id: 'rect1',
        type: 'element',
        tagName: 'rect',
        attributes: new Map(),
        children: [],
        element: rect,
      };
      
      documentStateUpdater.setDocument(svg, [node], '');
      
      const onCanvasSync = vi.fn();
      manager.registerSyncCallbacks({ onCanvasSync });
      
      manager.select(['rect1']);
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      const event = onCanvasSync.mock.calls[onCanvasSync.mock.calls.length - 1][0];
      expect(event.selectedIds.has('rect1')).toBe(true);
      expect(event.selectedElements.length).toBe(1);
      expect(event.selectedElements[0].id).toBe('rect1');
      expect(event.selectedNodes.length).toBe(1);
      expect(event.selectedNodes[0].id).toBe('rect1');
    });
  });

  describe('Manual Sync Methods', () => {
    it('should manually sync to canvas', () => {
      const onCanvasSync = vi.fn();
      manager.registerSyncCallbacks({ onCanvasSync });
      
      // Clear previous calls from auto-sync
      onCanvasSync.mockClear();
      
      manager.syncToCanvas();
      
      expect(onCanvasSync).toHaveBeenCalledTimes(1);
    });

    it('should manually sync to hierarchy', () => {
      const onHierarchySync = vi.fn();
      manager.registerSyncCallbacks({ onHierarchySync });
      
      onHierarchySync.mockClear();
      
      manager.syncToHierarchy();
      
      expect(onHierarchySync).toHaveBeenCalledTimes(1);
    });

    it('should manually sync to raw SVG', () => {
      const onRawSVGSync = vi.fn();
      manager.registerSyncCallbacks({ onRawSVGSync });
      
      onRawSVGSync.mockClear();
      
      manager.syncToRawSVG();
      
      expect(onRawSVGSync).toHaveBeenCalledTimes(1);
    });

    it('should manually sync to inspector', () => {
      const onInspectorSync = vi.fn();
      manager.registerSyncCallbacks({ onInspectorSync });
      
      onInspectorSync.mockClear();
      
      manager.syncToInspector();
      
      expect(onInspectorSync).toHaveBeenCalledTimes(1);
    });

    it('should manually sync to all views', async () => {
      const onCanvasSync = vi.fn();
      const onHierarchySync = vi.fn();
      const onRawSVGSync = vi.fn();
      const onInspectorSync = vi.fn();
      
      manager.registerSyncCallbacks({
        onCanvasSync,
        onHierarchySync,
        onRawSVGSync,
        onInspectorSync,
      });
      
      // Clear previous calls
      onCanvasSync.mockClear();
      onHierarchySync.mockClear();
      onRawSVGSync.mockClear();
      onInspectorSync.mockClear();
      
      manager.syncToAllViews();
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      expect(onCanvasSync).toHaveBeenCalledTimes(1);
      expect(onHierarchySync).toHaveBeenCalledTimes(1);
      expect(onRawSVGSync).toHaveBeenCalledTimes(1);
      expect(onInspectorSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selection array', () => {
      manager.select([]);
      
      expect(manager.getSelectionCount()).toBe(0);
      expect(manager.hasSelection()).toBe(false);
    });

    it('should handle selecting non-existent elements', () => {
      manager.select(['nonexistent']);
      
      const selectedIds = manager.getSelectedIds();
      expect(selectedIds.has('nonexistent')).toBe(true);
      
      // Elements won't be found in document
      const selectedElements = manager.getSelectedElements();
      expect(selectedElements.length).toBe(0);
    });

    it('should handle removing non-selected elements', () => {
      manager.select(['elem1']);
      manager.removeFromSelection(['elem2']);
      
      const selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(1);
      expect(selectedIds.has('elem1')).toBe(true);
    });

    it('should handle multiple calls to clearSelection', () => {
      manager.select(['elem1']);
      manager.clearSelection();
      manager.clearSelection();
      
      expect(manager.getSelectionCount()).toBe(0);
    });

    it('should not fail when sync callbacks are not registered', () => {
      expect(() => {
        manager.select(['elem1']);
        manager.syncToCanvas();
        manager.syncToHierarchy();
        manager.syncToRawSVG();
        manager.syncToInspector();
        manager.syncToAllViews();
      }).not.toThrow();
    });

    it('should handle partial callback registration', async () => {
      const onCanvasSync = vi.fn();
      manager.registerSyncCallbacks({ onCanvasSync });
      
      expect(() => {
        manager.syncToAllViews();
      }).not.toThrow();
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      expect(onCanvasSync).toHaveBeenCalled();
    });
  });

  describe('Resource Management', () => {
    it('should dispose properly', () => {
      const onCanvasSync = vi.fn();
      manager.registerSyncCallbacks({ onCanvasSync });
      
      manager.dispose();
      
      // After dispose, callbacks should not be called
      onCanvasSync.mockClear();
      manager.select(['elem1']);
      
      // Note: The effect might still trigger once more due to timing,
      // but after dispose, the manager should not maintain references
      expect(manager['syncCallbacks']).toEqual({});
    });

    it('should allow creating new manager after disposing old one', async () => {
      manager.dispose();
      
      const newManager = new SelectionManager();
      const onCanvasSync = vi.fn();
      newManager.registerSyncCallbacks({ onCanvasSync });
      
      newManager.select(['elem1']);
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      expect(onCanvasSync).toHaveBeenCalled();
    });
  });

  describe('Multi-Selection Scenarios', () => {
    it('should handle selecting multiple elements at once', () => {
      manager.select(['elem1', 'elem2', 'elem3', 'elem4', 'elem5']);
      
      expect(manager.getSelectionCount()).toBe(5);
    });

    it('should handle adding multiple elements to selection', () => {
      manager.select(['elem1', 'elem2']);
      manager.addToSelection(['elem3', 'elem4', 'elem5']);
      
      expect(manager.getSelectionCount()).toBe(5);
    });

    it('should handle removing multiple elements from selection', () => {
      manager.select(['elem1', 'elem2', 'elem3', 'elem4', 'elem5']);
      manager.removeFromSelection(['elem2', 'elem4']);
      
      const selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(3);
      expect(selectedIds.has('elem1')).toBe(true);
      expect(selectedIds.has('elem3')).toBe(true);
      expect(selectedIds.has('elem5')).toBe(true);
    });
  });

  describe('Integration with Document State', () => {
    it('should reflect changes made directly to document state', () => {
      // Directly update document state
      documentStateUpdater.select(['elem1', 'elem2']);
      
      // Selection manager should reflect the change
      const selectedIds = manager.getSelectedIds();
      expect(selectedIds.size).toBe(2);
      expect(selectedIds.has('elem1')).toBe(true);
      expect(selectedIds.has('elem2')).toBe(true);
    });

    it('should trigger sync when document state changes externally', async () => {
      const onCanvasSync = vi.fn();
      manager.registerSyncCallbacks({ onCanvasSync });
      
      onCanvasSync.mockClear();
      
      // Change selection through document state updater
      documentStateUpdater.select(['elem1']);
      
      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      expect(onCanvasSync).toHaveBeenCalled();
    });
  });
});
