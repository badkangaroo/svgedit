/**
 * Tests for Document State Model
 * 
 * Validates the document state management using reactive signals.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDocumentState,
  createDocumentStateUpdater,
  type DocumentState,
  type DocumentStateUpdater,
} from './document-state';
import type { DocumentNode } from '../types';

describe('Document State Model', () => {
  let state: DocumentState;
  let updater: DocumentStateUpdater;

  beforeEach(() => {
    state = createDocumentState();
    updater = createDocumentStateUpdater(state);
  });

  describe('Initial State', () => {
    it('should initialize with null document', () => {
      expect(state.svgDocument.get()).toBeNull();
    });

    it('should initialize with empty document tree', () => {
      expect(state.documentTree.get()).toEqual([]);
    });

    it('should initialize with empty raw SVG', () => {
      expect(state.rawSVG.get()).toBe('');
    });

    it('should initialize with empty selection', () => {
      expect(state.selectedUUIDs.get().size).toBe(0);
      expect(state.selectedIds.get().size).toBe(0);
    });

    it('should initialize with null hovered UUID', () => {
      expect(state.hoveredUUID.get()).toBeNull();
    });

    it('should compute hasSelection as false initially', () => {
      expect(state.hasSelection.get()).toBe(false);
    });

    it('should compute selectionCount as 0 initially', () => {
      expect(state.selectionCount.get()).toBe(0);
    });

    it('should compute selectedElements as empty array initially', () => {
      expect(state.selectedElements.get()).toEqual([]);
    });

    it('should compute selectedNodes as empty array initially', () => {
      expect(state.selectedNodes.get()).toEqual([]);
    });
  });

  describe('Document Updates', () => {
    it('should set document, tree, and raw SVG together', () => {
      const mockSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const mockTree: DocumentNode[] = [{
        id: 'svg1',
        type: 'element',
        tagName: 'svg',
        attributes: new Map(),
        children: [],
        element: mockSVG,
      }];
      const rawSVG = '<svg></svg>';

      updater.setDocument(mockSVG, mockTree, rawSVG);

      expect(state.svgDocument.get()).toBe(mockSVG);
      expect(state.documentTree.get()).toBe(mockTree);
      expect(state.rawSVG.get()).toBe(rawSVG);
    });

    it('should update document tree independently', () => {
      const mockTree: DocumentNode[] = [{
        id: 'rect1',
        type: 'element',
        tagName: 'rect',
        attributes: new Map([['x', '10'], ['y', '20']]),
        children: [],
        element: document.createElementNS('http://www.w3.org/2000/svg', 'rect'),
      }];

      updater.updateDocumentTree(mockTree);

      expect(state.documentTree.get()).toBe(mockTree);
    });

    it('should update raw SVG independently', () => {
      const svg = '<svg><rect x="10" y="20" /></svg>';

      updater.updateRawSVG(svg);

      expect(state.rawSVG.get()).toBe(svg);
    });

    it('should clear document and reset all document state', () => {
      // Set up some state
      const mockSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      mockSVG.setAttribute('id', 'svg1');
      mockSVG.setAttribute('data-uuid', 'u1');
      
      const mockTree: DocumentNode[] = [{
        id: 'svg1',
        type: 'element',
        tagName: 'svg',
        attributes: new Map(),
        children: [],
        element: mockSVG,
      }];
      updater.setDocument(mockSVG, mockTree, '<svg></svg>');
      updater.select(['u1']);

      // Clear
      updater.clearDocument();

      expect(state.svgDocument.get()).toBeNull();
      expect(state.documentTree.get()).toEqual([]);
      expect(state.rawSVG.get()).toBe('');
      expect(state.selectedUUIDs.get().size).toBe(0);
    });
  });

  describe('Selection Updates', () => {
    // Helper to create a document with elements
    const createDoc = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('data-uuid', 'u1');
      svg.appendChild(rect);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('id', 'circle1');
      circle.setAttribute('data-uuid', 'u2');
      svg.appendChild(circle);
      
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('id', 'ellipse1');
      ellipse.setAttribute('data-uuid', 'u3');
      svg.appendChild(ellipse);
      
      return svg;
    };

    beforeEach(() => {
      updater.setDocument(createDoc(), [], '');
    });

    it('should select elements by IDs', () => {
      updater.selectByIds(['rect1', 'circle1']);

      const uuids = state.selectedUUIDs.get();
      expect(uuids.size).toBe(2);
      expect(uuids.has('u1')).toBe(true);
      expect(uuids.has('u2')).toBe(true);
      
      const ids = state.selectedIds.get();
      expect(ids.size).toBe(2);
      expect(ids.has('rect1')).toBe(true);
      expect(ids.has('circle1')).toBe(true);
    });

    it('should select elements by UUIDs', () => {
      updater.select(['u1', 'u2']);

      const uuids = state.selectedUUIDs.get();
      expect(uuids.size).toBe(2);
      expect(uuids.has('u1')).toBe(true);
      expect(uuids.has('u2')).toBe(true);
    });

    it('should replace previous selection when selecting', () => {
      updater.select(['u1']);
      updater.select(['u2']);

      const uuids = state.selectedUUIDs.get();
      expect(uuids.size).toBe(1);
      expect(uuids.has('u1')).toBe(false);
      expect(uuids.has('u2')).toBe(true);
    });

    it('should add to existing selection', () => {
      updater.select(['u1']);
      updater.addToSelection(['u2', 'u3']);

      const uuids = state.selectedUUIDs.get();
      expect(uuids.size).toBe(3);
      expect(uuids.has('u1')).toBe(true);
      expect(uuids.has('u2')).toBe(true);
      expect(uuids.has('u3')).toBe(true);
    });

    it('should remove from selection', () => {
      updater.select(['u1', 'u2', 'u3']);
      updater.removeFromSelection(['u2']);

      const uuids = state.selectedUUIDs.get();
      expect(uuids.size).toBe(2);
      expect(uuids.has('u1')).toBe(true);
      expect(uuids.has('u2')).toBe(false);
      expect(uuids.has('u3')).toBe(true);
    });

    it('should clear selection', () => {
      updater.select(['u1', 'u2']);
      updater.clearSelection();

      expect(state.selectedUUIDs.get().size).toBe(0);
    });

    it('should toggle selection on', () => {
      updater.toggleSelection('u1');

      const uuids = state.selectedUUIDs.get();
      expect(uuids.size).toBe(1);
      expect(uuids.has('u1')).toBe(true);
    });

    it('should toggle selection off', () => {
      updater.select(['u1']);
      updater.toggleSelection('u1');

      expect(state.selectedUUIDs.get().size).toBe(0);
    });

    it('should set hovered UUID', () => {
      updater.setHoveredUUID('u1');
      expect(state.hoveredUUID.get()).toBe('u1');

      updater.setHoveredUUID(null);
      expect(state.hoveredUUID.get()).toBeNull();
    });
  });

  describe('Computed Values', () => {
    // Helper to create a document with elements
    const createDoc = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('data-uuid', 'u1');
      svg.appendChild(rect);
      
      return svg;
    };

    beforeEach(() => {
      updater.setDocument(createDoc(), [], '');
    });

    it('should compute hasSelection correctly', () => {
      expect(state.hasSelection.get()).toBe(false);

      updater.select(['u1']);
      expect(state.hasSelection.get()).toBe(true);

      updater.clearSelection();
      expect(state.hasSelection.get()).toBe(false);
    });

    it('should compute selectionCount correctly', () => {
      expect(state.selectionCount.get()).toBe(0);

      updater.select(['u1']);
      expect(state.selectionCount.get()).toBe(1);
    });

    it('should compute selectedElements from document', () => {
      const svg = state.svgDocument.get()!;
      const rect = svg.querySelector('#rect1');

      // Select elements
      updater.select(['u1']);

      const elements = state.selectedElements.get();
      expect(elements.length).toBe(1);
      expect(elements[0]).toBe(rect);
    });

    it('should return empty array when no document exists', () => {
      updater.setDocument(null, [], '');
      updater.select(['u1']);
      expect(state.selectedElements.get()).toEqual([]);
    });

    it('should filter out non-existent UUIDs from selectedElements', () => {
      updater.select(['u1', 'nonexistent']);

      const elements = state.selectedElements.get();
      expect(elements.length).toBe(1);
    });

    it('should compute selectedNodes from document tree', () => {
      const rectElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rectElement.setAttribute('id', 'rect1');
      rectElement.setAttribute('data-uuid', 'u1');
      
      const circleElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleElement.setAttribute('id', 'circle1');
      circleElement.setAttribute('data-uuid', 'u2');

      const mockTree: DocumentNode[] = [
        {
          id: 'rect1',
          type: 'element',
          tagName: 'rect',
          attributes: new Map([['data-uuid', 'u1']]),
          children: [],
          element: rectElement,
        },
        {
          id: 'g1',
          type: 'element',
          tagName: 'g',
          attributes: new Map(),
          children: [
            {
              id: 'circle1',
              type: 'element',
              tagName: 'circle',
              attributes: new Map([['data-uuid', 'u2']]),
              children: [],
              element: circleElement,
            },
          ],
          element: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
        },
      ];

      updater.updateDocumentTree(mockTree);
      updater.select(['u1', 'u2']);

      const nodes = state.selectedNodes.get();
      expect(nodes.length).toBe(2);
      expect(nodes.find(n => n.id === 'rect1')).toBeDefined();
      expect(nodes.find(n => n.id === 'circle1')).toBeDefined();
    });
  });

  describe('Reactivity', () => {
    it('should trigger computed updates when selection changes', () => {
      // Setup doc
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('data-uuid', 'u1');
      svg.appendChild(rect);
      updater.setDocument(svg, [], '');

      let computedValue = state.hasSelection.get();
      expect(computedValue).toBe(false);

      updater.select(['u1']);
      computedValue = state.hasSelection.get();
      expect(computedValue).toBe(true);
    });

    it('should trigger computed updates when document changes', () => {
      // Initial empty state
      updater.setDocument(null, [], '');
      
      updater.select(['u1']);
      expect(state.selectedElements.get()).toEqual([]);

      // Set document
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('data-uuid', 'u1');
      svg.appendChild(rect);

      updater.setDocument(svg, [], '');
      
      const elements = state.selectedElements.get();
      expect(elements.length).toBe(1);
      expect(elements[0]).toBe(rect);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      // Setup doc
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'rect1');
      rect.setAttribute('data-uuid', 'u1');
      svg.appendChild(rect);
      updater.setDocument(svg, [], '');
    });

    it('should handle empty selection array', () => {
      updater.select([]);
      expect(state.selectedUUIDs.get().size).toBe(0);
    });

    it('should handle duplicate UUIDs in selection', () => {
      updater.select(['u1', 'u1', 'u1']);
      expect(state.selectedUUIDs.get().size).toBe(1);
    });

    it('should handle adding duplicate UUIDs to selection', () => {
      updater.select(['u1']);
      updater.addToSelection(['u1']);
      expect(state.selectedUUIDs.get().size).toBe(1);
    });

    it('should handle removing non-existent UUIDs', () => {
      updater.select(['u1']);
      updater.removeFromSelection(['nonexistent']);
      expect(state.selectedUUIDs.get().size).toBe(1);
      expect(state.selectedUUIDs.get().has('u1')).toBe(true);
    });
  });
});
