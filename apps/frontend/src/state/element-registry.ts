/**
 * Element Registry
 *
 * Central data-uuid mapping structure for the SVG editor.
 * Provides O(1) lookup of elements by UUID, ID, or element reference.
 * Serves as the single source of truth for "what elements exist" in the document.
 *
 * Used for: select, filter, search, and edit operations.
 */

import { signal, Signal } from './signals';
import type { DocumentNode } from '../types';

/**
 * Build index maps from a document tree.
 * Recursively walks the tree and indexes by uuid, id, and element.
 */
function buildMapsFromTree(
  nodeList: DocumentNode[],
  uuidToElement: Map<string, SVGElement>,
  uuidToNode: Map<string, DocumentNode>,
  idToUuid: Map<string, string>,
  elementToUuid: Map<SVGElement, string>
): void {
  for (const node of nodeList) {
    const uuid = node.attributes.get('data-uuid');
    if (uuid) {
      uuidToElement.set(uuid, node.element);
      uuidToNode.set(uuid, node);
      elementToUuid.set(node.element, uuid);

      const id = node.attributes.get('id') ?? node.id;
      if (id) {
        idToUuid.set(id, uuid);
      }
    }
    if (node.children.length > 0) {
      buildMapsFromTree(
        node.children,
        uuidToElement,
        uuidToNode,
        idToUuid,
        elementToUuid
      );
    }
  }
}

/**
 * Element Registry - central mapping of data-uuid to elements and nodes.
 */
export class ElementRegistry {
  private uuidToElement = new Map<string, SVGElement>();
  private uuidToNode = new Map<string, DocumentNode>();
  private idToUuid = new Map<string, string>();
  private elementToUuid = new Map<SVGElement, string>();

  /** Signal that increments when structure changes (add/remove/move). */
  readonly structureVersion: Signal<number> = signal(0);

  /** Optional callback when attributes change (for rawSVG sync). Set via setOnAttributeChange. */
  private onAttributeChange: (() => void) | null = null;

  /**
   * Set callback to run when attributes are modified via setAttribute/removeAttribute.
   * Used to sync rawSVG (avoids circular import with document-state).
   */
  setOnAttributeChange(handler: (() => void) | null): void {
    this.onAttributeChange = handler;
  }

  /**
   * Rebuild the registry from a document and tree.
   * Call this when the document is loaded or replaced.
   */
  rebuild(doc: SVGElement | null, tree: DocumentNode[]): void {
    this.uuidToElement.clear();
    this.uuidToNode.clear();
    this.idToUuid.clear();
    this.elementToUuid.clear();

    if (doc && tree.length > 0) {
      buildMapsFromTree(
        tree,
        this.uuidToElement,
        this.uuidToNode,
        this.idToUuid,
        this.elementToUuid
      );
    }

    this.structureVersion.set(this.structureVersion.peek() + 1);
  }

  /**
   * Get SVG element by UUID.
   */
  getElement(uuid: string): SVGElement | null {
    return this.uuidToElement.get(uuid) ?? null;
  }

  /**
   * Get DocumentNode by UUID.
   */
  getNode(uuid: string): DocumentNode | null {
    return this.uuidToNode.get(uuid) ?? null;
  }

  /**
   * Get element ID (for display/export) by UUID.
   */
  getId(uuid: string): string | null {
    const node = this.uuidToNode.get(uuid);
    if (node) {
      return node.attributes.get('id') ?? node.id ?? null;
    }
    return null;
  }

  /**
   * Get UUID for an element (reverse lookup).
   */
  getUUID(element: SVGElement): string | null {
    return this.elementToUuid.get(element) ?? element.getAttribute('data-uuid');
  }

  /**
   * Get UUID for an element by ID.
   */
  getUUIDById(id: string): string | null {
    return this.idToUuid.get(id) ?? null;
  }

  /**
   * Get all registered UUIDs.
   */
  getAllUUIDs(): string[] {
    return Array.from(this.uuidToElement.keys());
  }

  /**
   * Check if a UUID is registered.
   */
  has(uuid: string): boolean {
    return this.uuidToElement.has(uuid);
  }

  /**
   * Filter elements by predicate. Returns matching UUIDs.
   */
  filter(
    predicate: (element: SVGElement, node: DocumentNode) => boolean
  ): string[] {
    const result: string[] = [];
    for (const [uuid, element] of this.uuidToElement) {
      const node = this.uuidToNode.get(uuid);
      if (node && predicate(element, node)) {
        result.push(uuid);
      }
    }
    return result;
  }

  /**
   * Search by CSS selector. Returns matching UUIDs.
   * Requires the document to be in the DOM or uses element.matches.
   */
  search(selector: string): string[] {
    const result: string[] = [];
    try {
      for (const [uuid, element] of this.uuidToElement) {
        if (element.matches && element.matches(selector)) {
          result.push(uuid);
        }
      }
    } catch {
      // Invalid selector
    }
    return result;
  }

  /**
   * Convert element IDs to UUIDs.
   */
  idsToUUIDs(ids: string[]): string[] {
    const uuids: string[] = [];
    for (const id of ids) {
      const uuid = this.idToUuid.get(id);
      if (uuid) {
        uuids.push(uuid);
      }
    }
    return uuids;
  }

  /**
   * Get size of registry (number of elements).
   */
  get size(): number {
    return this.uuidToElement.size;
  }

  /**
   * Set an attribute on an element by UUID.
   * Triggers onAttributeChange callback for rawSVG sync.
   * @returns true if the element was found and updated
   */
  setAttribute(uuid: string, name: string, value: string): boolean {
    const element = this.uuidToElement.get(uuid);
    if (!element) return false;
    element.setAttribute(name, value);
    const node = this.uuidToNode.get(uuid);
    if (node) {
      node.attributes.set(name, value);
    }
    this.onAttributeChange?.();
    return true;
  }

  /**
   * Remove an attribute from an element by UUID.
   * Triggers onAttributeChange callback for rawSVG sync.
   * @returns true if the element was found and updated
   */
  removeAttribute(uuid: string, name: string): boolean {
    const element = this.uuidToElement.get(uuid);
    if (!element) return false;
    element.removeAttribute(name);
    const node = this.uuidToNode.get(uuid);
    if (node) {
      node.attributes.delete(name);
    }
    this.onAttributeChange?.();
    return true;
  }
}

/**
 * Global element registry instance.
 */
export const elementRegistry = new ElementRegistry();
