import type { SVGDocument, SVGNode, SVGElementType } from '../types/index.js';

/**
 * Selector criteria for multi-criteria queries.
 * All specified criteria must match (AND logic).
 */
export interface Selector {
  /** Filter by element type (e.g., 'rect', 'circle', 'path') */
  type?: SVGElementType;
  /** Filter by stable ID */
  id?: string;
  /** Filter by attribute name and optional value */
  attribute?: {
    name: string;
    value?: string;
  };
}

/**
 * Query engine for finding nodes in the document tree.
 * Provides efficient lookup by ID, type, and attributes.
 */
export class QueryEngine {
  /**
   * Query a document for a node by its stable ID.
   * Uses the document's node index for O(1) lookup.
   * 
   * @param document - The SVG document to query
   * @param id - The stable ID of the node to find
   * @returns The node with the given ID, or null if not found
   * 
   * @example
   * ```typescript
   * const node = queryEngine.queryById(document, 'node_123');
   * if (node) {
   *   console.log('Found node:', node.type);
   * } else {
   *   console.log('Node not found');
   * }
   * ```
   */
  queryById(document: SVGDocument, id: string): SVGNode | null {
    return document.nodes.get(id) ?? null;
  }

  /**
   * Query a document for all nodes of a specific element type.
   * Filters all nodes in the document by their type property.
   * 
   * @param document - The SVG document to query
   * @param type - The element type to search for (e.g., 'rect', 'circle', 'path')
   * @returns Array of all nodes matching the specified type (empty array if none found)
   * 
   * @example
   * ```typescript
   * const rectangles = queryEngine.queryByType(document, 'rect');
   * console.log(`Found ${rectangles.length} rectangles`);
   * ```
   */
  queryByType(document: SVGDocument, type: SVGElementType): SVGNode[] {
    const results: SVGNode[] = [];
    
    // Iterate through all nodes in the document's node index
    for (const node of document.nodes.values()) {
      if (node.type === type) {
        results.push(node);
      }
    }
    
    return results;
  }

  /**
   * Query a document for all nodes that have a specific attribute.
   * Optionally filter by attribute value as well.
   * 
   * @param document - The SVG document to query
   * @param name - The attribute name to search for
   * @param value - Optional attribute value to match (if omitted, matches any value)
   * @returns Array of all nodes with the specified attribute (empty array if none found)
   * 
   * @example
   * ```typescript
   * // Find all nodes with a 'fill' attribute
   * const filledNodes = queryEngine.queryByAttribute(document, 'fill');
   * 
   * // Find all nodes with fill='red'
   * const redNodes = queryEngine.queryByAttribute(document, 'fill', 'red');
   * ```
   */
  queryByAttribute(document: SVGDocument, name: string, value?: string): SVGNode[] {
    const results: SVGNode[] = [];
    
    // Iterate through all nodes in the document's node index
    for (const node of document.nodes.values()) {
      // Check if the node has the specified attribute
      if (node.attributes.has(name)) {
        // If value is specified, check if it matches
        if (value === undefined || node.attributes.get(name) === value) {
          results.push(node);
        }
      }
    }
    
    return results;
  }

  /**
   * Query a document using multiple criteria.
   * All specified criteria must match (AND logic).
   * 
   * This method combines type, ID, and attribute filters to find nodes
   * that match all specified criteria. It's more efficient than running
   * multiple separate queries and intersecting the results.
   * 
   * @param document - The SVG document to query
   * @param selector - Selector object with optional type, id, and attribute criteria
   * @returns Array of all nodes matching all specified criteria (empty array if none found)
   * 
   * @example
   * ```typescript
   * // Find all rectangles with fill='red'
   * const redRects = queryEngine.query(document, {
   *   type: 'rect',
   *   attribute: { name: 'fill', value: 'red' }
   * });
   * 
   * // Find a specific node by ID (returns array with 0 or 1 element)
   * const nodes = queryEngine.query(document, { id: 'node_123' });
   * 
   * // Find all circles with a 'stroke' attribute (any value)
   * const strokedCircles = queryEngine.query(document, {
   *   type: 'circle',
   *   attribute: { name: 'stroke' }
   * });
   * ```
   */
  query(document: SVGDocument, selector: Selector): SVGNode[] {
    // If ID is specified, use fast O(1) lookup
    if (selector.id !== undefined) {
      const node = this.queryById(document, selector.id);
      
      // If node not found, return empty array
      if (!node) {
        return [];
      }
      
      // Check if node matches other criteria
      if (selector.type !== undefined && node.type !== selector.type) {
        return [];
      }
      
      if (selector.attribute !== undefined) {
        const { name, value } = selector.attribute;
        if (!node.attributes.has(name)) {
          return [];
        }
        if (value !== undefined && node.attributes.get(name) !== value) {
          return [];
        }
      }
      
      return [node];
    }
    
    // Otherwise, iterate through all nodes and filter
    const results: SVGNode[] = [];
    
    for (const node of document.nodes.values()) {
      // Check type criteria
      if (selector.type !== undefined && node.type !== selector.type) {
        continue;
      }
      
      // Check attribute criteria
      if (selector.attribute !== undefined) {
        const { name, value } = selector.attribute;
        if (!node.attributes.has(name)) {
          continue;
        }
        if (value !== undefined && node.attributes.get(name) !== value) {
          continue;
        }
      }
      
      // Node matches all criteria
      results.push(node);
    }
    
    return results;
  }
}
