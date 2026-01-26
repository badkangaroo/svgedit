import type { SVGDocument, SVGNode } from '../types/index.js';

/**
 * Hierarchy index for efficient parent-child relationship lookups.
 * Maintains O(1) lookup maps for parent and children queries.
 * 
 * This index is built from an SVGDocument and provides fast access to:
 * - Parent of any node
 * - Children of any node
 * 
 * The index uses immutable operations and should be rebuilt when the document changes.
 */
export class HierarchyIndex {
  private parentMap: Map<string, string>;
  private childrenMap: Map<string, string[]>;

  /**
   * Creates a new HierarchyIndex from an SVG document.
   * Builds parent and children maps by traversing the document tree.
   * 
   * @param document - The SVG document to index
   * 
   * @example
   * ```typescript
   * const index = new HierarchyIndex(document);
   * const parent = index.getParent('node_123');
   * const children = index.getChildren('node_456');
   * ```
   */
  constructor(document: SVGDocument) {
    this.parentMap = new Map();
    this.childrenMap = new Map();
    this.buildIndex(document);
  }

  /**
   * Builds the hierarchy index by traversing the document tree.
   * Populates both parent and children maps.
   * 
   * @param document - The SVG document to index
   */
  private buildIndex(document: SVGDocument): void {
    // Traverse the tree starting from root
    this.indexNode(document.root, null);
  }

  /**
   * Recursively indexes a node and its children.
   * 
   * @param node - The node to index
   * @param parentId - The ID of the parent node (null for root)
   */
  private indexNode(node: SVGNode, parentId: string | null): void {
    // Record parent relationship (skip for root)
    if (parentId !== null) {
      this.parentMap.set(node.id, parentId);
    }

    // Record children relationship
    const childIds = node.children.map(child => child.id);
    this.childrenMap.set(node.id, childIds);

    // Recursively index children
    for (const child of node.children) {
      this.indexNode(child, node.id);
    }
  }

  /**
   * Gets the parent node ID for a given node.
   * Returns null if the node is the root or not found.
   * 
   * Time complexity: O(1)
   * 
   * @param nodeId - The ID of the node to get the parent for
   * @returns The parent node ID, or null if the node is the root or not found
   * 
   * @example
   * ```typescript
   * const parentId = index.getParent('node_123');
   * if (parentId) {
   *   console.log('Parent ID:', parentId);
   * } else {
   *   console.log('Node is root or not found');
   * }
   * ```
   */
  getParent(nodeId: string): string | null {
    return this.parentMap.get(nodeId) ?? null;
  }

  /**
   * Gets the child node IDs for a given node.
   * Returns an empty array if the node has no children or is not found.
   * 
   * Time complexity: O(1) for lookup, O(n) for array copy where n is number of children
   * 
   * @param nodeId - The ID of the node to get children for
   * @returns Array of child node IDs (empty if no children or not found)
   * 
   * @example
   * ```typescript
   * const childIds = index.getChildren('node_123');
   * console.log('Number of children:', childIds.length);
   * for (const childId of childIds) {
   *   console.log('Child ID:', childId);
   * }
   * ```
   */
  getChildren(nodeId: string): string[] {
    const children = this.childrenMap.get(nodeId);
    // Return a copy to prevent external modification of internal state
    return children ? [...children] : [];
  }

  /**
   * Incrementally adds a node to the index.
   * Updates both parent and children maps without rebuilding the entire index.
   * 
   * Time complexity: O(k) where k is the number of descendants of the added node
   * 
   * @param node - The node to add to the index
   * @param parentId - The ID of the parent node
   * 
   * @example
   * ```typescript
   * const newNode = createNode('new_node', 'rect');
   * index.addNode(newNode, 'parent_id');
   * ```
   */
  addNode(node: SVGNode, parentId: string): void {
    // Add parent relationship for the new node
    this.parentMap.set(node.id, parentId);

    // Update parent's children list
    const parentChildren = this.childrenMap.get(parentId) ?? [];
    this.childrenMap.set(parentId, [...parentChildren, node.id]);

    // Initialize children list for the new node
    const childIds = node.children.map(child => child.id);
    this.childrenMap.set(node.id, childIds);

    // Recursively add all descendants
    for (const child of node.children) {
      this.indexNode(child, node.id);
    }
  }

  /**
   * Incrementally removes a node from the index.
   * Updates both parent and children maps without rebuilding the entire index.
   * Removes the node and all its descendants from the index.
   * 
   * Time complexity: O(k) where k is the number of descendants of the removed node
   * 
   * @param nodeId - The ID of the node to remove from the index
   * 
   * @example
   * ```typescript
   * index.removeNode('node_to_remove');
   * ```
   */
  removeNode(nodeId: string): void {
    // Get the parent ID before removing
    const parentId = this.parentMap.get(nodeId);

    // Remove from parent's children list
    if (parentId !== undefined) {
      const parentChildren = this.childrenMap.get(parentId);
      if (parentChildren) {
        this.childrenMap.set(
          parentId,
          parentChildren.filter(id => id !== nodeId)
        );
      }
    }

    // Get all descendants to remove them too
    const descendants = this.getAllDescendants(nodeId);

    // Remove the node and all descendants from both maps
    this.parentMap.delete(nodeId);
    this.childrenMap.delete(nodeId);

    for (const descendantId of descendants) {
      this.parentMap.delete(descendantId);
      this.childrenMap.delete(descendantId);
    }
  }

  /**
   * Incrementally moves a node to a new parent in the index.
   * Updates both parent and children maps without rebuilding the entire index.
   * 
   * Time complexity: O(1) - only updates the affected parent-child relationships
   * 
   * @param nodeId - The ID of the node to move
   * @param newParentId - The ID of the new parent node
   * 
   * @example
   * ```typescript
   * index.moveNode('node_to_move', 'new_parent_id');
   * ```
   */
  moveNode(nodeId: string, newParentId: string): void {
    // Get the old parent ID
    const oldParentId = this.parentMap.get(nodeId);

    // Remove from old parent's children list
    if (oldParentId !== undefined) {
      const oldParentChildren = this.childrenMap.get(oldParentId);
      if (oldParentChildren) {
        this.childrenMap.set(
          oldParentId,
          oldParentChildren.filter(id => id !== nodeId)
        );
      }
    }

    // Update parent relationship
    this.parentMap.set(nodeId, newParentId);

    // Add to new parent's children list
    const newParentChildren = this.childrenMap.get(newParentId) ?? [];
    this.childrenMap.set(newParentId, [...newParentChildren, nodeId]);
  }

  /**
   * Gets all ancestor node IDs for a given node, from parent to root.
   * Returns an empty array if the node is the root or not found.
   * 
   * The ancestors are returned in order from immediate parent to root.
   * For example, if the hierarchy is: root -> group -> rect,
   * calling getAncestors('rect') returns ['group', 'root'].
   * 
   * Time complexity: O(h) where h is the height/depth of the node in the tree
   * 
   * @param nodeId - The ID of the node to get ancestors for
   * @returns Array of ancestor node IDs from parent to root (empty if node is root or not found)
   * 
   * @example
   * ```typescript
   * // For hierarchy: root -> group -> rect
   * const ancestors = index.getAncestors('rect');
   * console.log(ancestors); // ['group', 'root']
   * ```
   */
  getAncestors(nodeId: string): string[] {
    const ancestors: string[] = [];
    let currentId: string | null = nodeId;

    // Traverse up the tree until we reach the root
    while (currentId !== null) {
      const parentId = this.parentMap.get(currentId);
      if (parentId === undefined) {
        // Reached root or node not found
        break;
      }
      ancestors.push(parentId);
      currentId = parentId;
    }

    return ancestors;
  }

  /**
   * Gets all descendant node IDs for a given node.
   * Returns an empty array if the node has no descendants or is not found.
   * 
   * The descendants are returned in depth-first order.
   * For example, if the hierarchy is:
   *     root
   *    /    \
   *   g1     g2
   *  / \      |
   * r1  r2   r3
   * 
   * calling getDescendants('root') returns ['g1', 'r1', 'r2', 'g2', 'r3'].
   * 
   * Time complexity: O(k) where k is the number of descendants
   * 
   * @param nodeId - The ID of the node to get descendants for
   * @returns Array of all descendant node IDs in depth-first order (empty if no descendants or not found)
   * 
   * @example
   * ```typescript
   * // For hierarchy: root -> group -> [rect1, rect2]
   * const descendants = index.getDescendants('root');
   * console.log(descendants); // ['group', 'rect1', 'rect2']
   * ```
   */
  getDescendants(nodeId: string): string[] {
    return this.getAllDescendants(nodeId);
  }

  /**
   * Helper method to get all descendant IDs of a node.
   * Used internally for efficient removal of subtrees and by getDescendants().
   * 
   * Time complexity: O(k) where k is the number of descendants
   * 
   * @param nodeId - The ID of the node to get descendants for
   * @returns Array of all descendant node IDs
   */
  private getAllDescendants(nodeId: string): string[] {
    const descendants: string[] = [];
    const children = this.childrenMap.get(nodeId) ?? [];

    for (const childId of children) {
      descendants.push(childId);
      // Recursively get descendants of each child
      descendants.push(...this.getAllDescendants(childId));
    }

    return descendants;
  }
}
