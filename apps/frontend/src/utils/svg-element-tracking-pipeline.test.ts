/**
 * Unit tests for the internal pipeline that tracks SVG elements via data-uuid.
 * Ensures: parser assigns/preserves data-uuid, serialize→parse round-trip keeps
 * data-uuid, newly created elements get data-uuid through the pipeline, and
 * element registry only indexes elements with data-uuid.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPrimitiveElement } from './primitive-tools-simple';
import { svgParser } from './svg-parser';
import { svgSerializer } from './svg-serializer';
import { elementRegistry } from '../state/element-registry';
import type { DocumentNode } from '../types';

describe('SVG element tracking pipeline (data-uuid)', () => {
  describe('serialize → parse round-trip', () => {
    it('should preserve data-uuid on all elements when serializing with keepUUID and parsing', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100');
      svg.setAttribute('height', '100');
      const uuid1 = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee';
      const uuid2 = '11111111-2222-43333-4444-555555555555';
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('data-uuid', uuid1);
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '10');
      rect.setAttribute('width', '50');
      rect.setAttribute('height', '50');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('data-uuid', uuid2);
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '50');
      circle.setAttribute('r', '20');
      svg.appendChild(rect);
      svg.appendChild(circle);

      const serialized = svgSerializer.serialize(svg, { keepUUID: true });
      expect(serialized).toContain('data-uuid');
      const parseResult = svgParser.parse(serialized);
      expect(parseResult.success).toBe(true);
      expect(parseResult.document).not.toBeNull();

      const parsedRect = parseResult.document!.querySelector('rect');
      const parsedCircle = parseResult.document!.querySelector('circle');
      expect(parsedRect!.getAttribute('data-uuid')).toBe(uuid1);
      expect(parsedCircle!.getAttribute('data-uuid')).toBe(uuid2);
    });

    it('should give newly created primitive data-uuid through append → serialize(keepUUID) → parse', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '800');
      svg.setAttribute('height', '600');
      const rect = createPrimitiveElement('rectangle', 100, 100, 200, 180);
      const originalUuid = rect.getAttribute('data-uuid');
      expect(originalUuid).toBeTruthy();

      svg.appendChild(rect);
      const serialized = svgSerializer.serialize(svg, { keepUUID: true });
      expect(serialized).toContain(originalUuid!);
      const parseResult = svgParser.parse(serialized);
      expect(parseResult.success).toBe(true);
      expect(parseResult.document).not.toBeNull();

      const parsedRects = parseResult.document!.querySelectorAll('rect');
      expect(parsedRects.length).toBeGreaterThanOrEqual(1);
      const newRect = Array.from(parsedRects).find(
        (r) => r.getAttribute('data-uuid') === originalUuid
      );
      expect(newRect).not.toBeUndefined();
      expect(newRect!.getAttribute('data-uuid')).toBe(originalUuid);
    });

    it('should have last direct child rect with same data-uuid after round-trip (finalizePrimitiveCreation path)', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '800');
      svg.setAttribute('height', '600');
      const rect = createPrimitiveElement('rectangle', 50, 50, 150, 120);
      const newElementUUID = rect.getAttribute('data-uuid');
      rect.setAttribute('id', 'temp-12345-abc');
      svg.appendChild(rect);

      const serialized = svgSerializer.serialize(svg, { keepUUID: true });
      const parseResult = svgParser.parse(serialized);
      expect(parseResult.success).toBe(true);
      expect(parseResult.document).not.toBeNull();

      const root = parseResult.document!;
      const lastChild = root.children[root.children.length - 1];
      const tagName = rect.tagName.toLowerCase();
      const parsedNewElement =
        lastChild && (lastChild as Element).tagName?.toLowerCase() === tagName
          ? (lastChild as SVGElement)
          : (root.querySelector(`[data-original-id="temp-12345-abc"]`) ||
              root.querySelector('#temp-12345-abc')) as SVGElement | undefined;

      expect(parsedNewElement).not.toBeUndefined();
      expect(parsedNewElement!.getAttribute('data-uuid')).toBe(newElementUUID);
    });
  });

  describe('element registry and data-uuid', () => {
    beforeEach(() => {
      elementRegistry.rebuild(null, []);
    });

    it('should only index elements that have data-uuid when rebuilding from document', () => {
      const doc = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      doc.setAttribute('width', '100');
      doc.setAttribute('height', '100');
      doc.setAttribute('data-uuid', 'root-uuid');

      const withUuid = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      withUuid.setAttribute('data-uuid', 'rect-uuid');
      withUuid.setAttribute('x', '10');
      withUuid.setAttribute('y', '10');
      withUuid.setAttribute('width', '50');
      withUuid.setAttribute('height', '50');

      const withoutUuid = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      withoutUuid.setAttribute('cx', '50');
      withoutUuid.setAttribute('cy', '50');
      withoutUuid.setAttribute('r', '20');

      doc.appendChild(withUuid);
      doc.appendChild(withoutUuid);

      elementRegistry.rebuild(doc, []);

      // querySelectorAll('[data-uuid]') does not include the root; only descendants are indexed
      expect(elementRegistry.size).toBeGreaterThanOrEqual(1);
      expect(elementRegistry.has('rect-uuid')).toBe(true);
      expect(elementRegistry.getElement('rect-uuid')).toBe(withUuid);
      expect(elementRegistry.getUUID(withoutUuid)).toBeNull();
    });

    it('should only index nodes with data-uuid when rebuilding from tree', () => {
      const doc = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      doc.setAttribute('data-uuid', 'root-uuid');
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rectEl.setAttribute('data-uuid', 'rect-uuid');
      doc.appendChild(rectEl);

      const tree: DocumentNode[] = [
        {
          id: 'svg-node-1',
          type: 'svg',
          tagName: 'svg',
          attributes: new Map([
            ['data-uuid', 'root-uuid'],
            ['width', '100'],
            ['height', '100'],
          ]),
          children: [
            {
              id: 'svg-node-2',
              type: 'rect',
              tagName: 'rect',
              attributes: new Map([
                ['data-uuid', 'rect-uuid'],
                ['x', '10'],
                ['y', '10'],
                ['width', '50'],
                ['height', '50'],
              ]),
              children: [],
              element: rectEl,
            },
          ],
          element: doc,
        },
      ];
      rectEl.setAttribute('data-uuid', 'rect-uuid');
      doc.setAttribute('data-uuid', 'root-uuid');

      elementRegistry.rebuild(doc, tree);

      expect(elementRegistry.size).toBe(2);
      expect(elementRegistry.getUUID(rectEl)).toBe('rect-uuid');
      expect(elementRegistry.getElement('rect-uuid')).toBe(rectEl);
    });
  });
});
