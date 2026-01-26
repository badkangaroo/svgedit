/**
 * Immutable update utilities for SVG documents.
 * 
 * These utilities follow the immutable update pattern where all operations
 * return new document instances rather than mutating existing state.
 * The version counter is incremented on each change to track modifications.
 */

import type { SVGDocument, SVGNode } from '../types/index.js';

/**
 * Update a node in the document using an updater function.
 * Returns a new document with the updated node and incremented version.
 * 
 * @param document - The document to update
 * @param nodeId - The ID of the node to update
 * @param updater - Function that takes the current node and returns the updated node
 * @returns A new document with the updated node, or the original document if node not found
 * 
 * @example
 * ```typescript
 * const newDoc = updateNode(doc, 'node_1', (node) => ({
 *   ...node,
 *   attributes: new Map([...node.attributes, ['fill', 'red']])
 * }));
 * ```
 */
export function updateNode(
  document: SVGDocument,
  nodeId: string,
  updater: (node: SVGNode) => SVGNode
): SVGDocument {
  const node = document.nodes.get(nodeId);
  if (!node) {
    return document;
  }
  
  const updatedNode = updater(node);
  const newNodes = new Map(document.nodes);
  newNodes.set(nodeId, updatedNode);
  
  return {
    ...document,
    nodes: newNodes,
    version: document.version + 1
  };
}

/**
 * Update a node's attributes immutably.
 * Returns a new document with the node's attributes updated.
 * 
 * @param document - The document to update
 * @param nodeId - The ID of the node to update
 * @param attributeName - The name of the attribute to update
 * @param attributeValue - The new value for the attribute
 * @returns A new document with the updated attribute, or the original document if node not found
 * 
 * @example
 * ```typescript
 * const newDoc = updateNodeAttribute(doc, 'node_1', 'fill', 'blue');
 * ```
 */
export function updateNodeAttribute(
  document: SVGDocument,
  nodeId: string,
  attributeName: string,
  attributeValue: string
): SVGDocument {
  return updateNode(document, nodeId, (node) => {
    const newAttributes = new Map(node.attributes);
    newAttributes.set(attributeName, attributeValue);
    
    return {
      ...node,
      attributes: newAttributes
    };
  });
}

/**
 * Remove an attribute from a node immutably.
 * Returns a new document with the attribute removed.
 * 
 * @param document - The document to update
 * @param nodeId - The ID of the node to update
 * @param attributeName - The name of the attribute to remove
 * @returns A new document with the attribute removed, or the original document if node not found
 * 
 * @example
 * ```typescript
 * const newDoc = removeNodeAttribute(doc, 'node_1', 'fill');
 * ```
 */
export function removeNodeAttribute(
  document: SVGDocument,
  nodeId: string,
  attributeName: string
): SVGDocument {
  return updateNode(document, nodeId, (node) => {
    const newAttributes = new Map(node.attributes);
    newAttributes.delete(attributeName);
    
    return {
      ...node,
      attributes: newAttributes
    };
  });
}

/**
 * Add a child node to a parent node immutably.
 * Returns a new document with the child added to the parent's children array.
 * 
 * @param document - The document to update
 * @param parentId - The ID of the parent node
 * @param child - The child node to add
 * @param index - Optional index at which to insert the child (defaults to end)
 * @returns A new document with the child added, or the original document if parent not found
 * 
 * @example
 * ```typescript
 * const newDoc = addChildNode(doc, 'parent_1', childNode);
 * const newDocAtIndex = addChildNode(doc, 'parent_1', childNode, 0);
 * ```
 */
export function addChildNode(
  document: SVGDocument,
  parentId: string,
  child: SVGNode,
  index?: number
): SVGDocument {
  const parent = document.nodes.get(parentId);
  if (!parent) {
    return document;
  }
  
  // Update child's parent reference
  const updatedChild = {
    ...child,
    parent
  };
  
  // Update parent's children array
  const newChildren = [...parent.children];
  if (index !== undefined && index >= 0 && index <= newChildren.length) {
    newChildren.splice(index, 0, updatedChild);
  } else {
    newChildren.push(updatedChild);
  }
  
  const updatedParent = {
    ...parent,
    children: newChildren
  };
  
  // Update both parent and child in the nodes map
  const newNodes = new Map(document.nodes);
  newNodes.set(parentId, updatedParent);
  newNodes.set(child.id, updatedChild);
  
  // Update root reference if the parent is the root
  const newRoot = parentId === document.root.id ? updatedParent : document.root;
  
  return {
    ...document,
    root: newRoot,
    nodes: newNodes,
    version: document.version + 1
  };
}

/**
 * Remove a child node from its parent immutably.
 * Returns a new document with the child removed from the parent's children array.
 * The child node is also removed from the document's nodes map.
 * 
 * @param document - The document to update
 * @param nodeId - The ID of the node to remove
 * @returns A new document with the node removed, or the original document if node not found
 * 
 * @example
 * ```typescript
 * const newDoc = removeChildNode(doc, 'node_1');
 * ```
 */
export function removeChildNode(
  document: SVGDocument,
  nodeId: string
): SVGDocument {
  const node = document.nodes.get(nodeId);
  if (!node || !node.parent) {
    return document;
  }
  
  const parent = node.parent;
  
  // Remove node from parent's children array
  const newChildren = parent.children.filter(child => child.id !== nodeId);
  
  const updatedParent = {
    ...parent,
    children: newChildren
  };
  
  // Remove node and all its descendants from the nodes map
  const newNodes = new Map(document.nodes);
  removeNodeAndDescendants(node, newNodes);
  newNodes.set(parent.id, updatedParent);
  
  // Update root reference if the parent is the root
  const newRoot = parent.id === document.root.id ? updatedParent : document.root;
  
  return {
    ...document,
    root: newRoot,
    nodes: newNodes,
    version: document.version + 1
  };
}

/**
 * Helper function to recursively remove a node and all its descendants from the nodes map.
 */
function removeNodeAndDescendants(node: SVGNode, nodes: Map<string, SVGNode>): void {
  nodes.delete(node.id);
  
  for (const child of node.children) {
    removeNodeAndDescendants(child, nodes);
  }
}

/**
 * Move a node to a new parent immutably.
 * Returns a new document with the node moved to the new parent.
 * 
 * @param document - The document to update
 * @param nodeId - The ID of the node to move
 * @param newParentId - The ID of the new parent node
 * @param index - Optional index at which to insert the node in the new parent (defaults to end)
 * @returns A new document with the node moved, or the original document if node or parent not found
 * 
 * @example
 * ```typescript
 * const newDoc = moveNode(doc, 'node_1', 'new_parent_1');
 * const newDocAtIndex = moveNode(doc, 'node_1', 'new_parent_1', 0);
 * ```
 */
export function moveNode(
  document: SVGDocument,
  nodeId: string,
  newParentId: string,
  index?: number
): SVGDocument {
  const node = document.nodes.get(nodeId);
  const newParent = document.nodes.get(newParentId);
  
  if (!node || !newParent || !node.parent) {
    return document;
  }
  
  // Don't move if already in the correct parent
  if (node.parent.id === newParentId) {
    return document;
  }
  
  const oldParent = node.parent;
  
  // Remove from old parent's children
  const oldParentNewChildren = oldParent.children.filter(child => child.id !== nodeId);
  const updatedOldParent = {
    ...oldParent,
    children: oldParentNewChildren
  };
  
  // Update node's parent reference
  const updatedNode = {
    ...node,
    parent: newParent
  };
  
  // Add to new parent's children
  const newParentNewChildren = [...newParent.children];
  if (index !== undefined && index >= 0 && index <= newParentNewChildren.length) {
    newParentNewChildren.splice(index, 0, updatedNode);
  } else {
    newParentNewChildren.push(updatedNode);
  }
  
  const updatedNewParent = {
    ...newParent,
    children: newParentNewChildren
  };
  
  // Update all affected nodes in the nodes map
  const newNodes = new Map(document.nodes);
  newNodes.set(oldParent.id, updatedOldParent);
  newNodes.set(newParent.id, updatedNewParent);
  newNodes.set(nodeId, updatedNode);
  
  // Update root reference if either parent is the root
  let newRoot = document.root;
  if (oldParent.id === document.root.id) {
    newRoot = updatedOldParent;
  }
  if (newParent.id === document.root.id) {
    newRoot = updatedNewParent;
  }
  
  return {
    ...document,
    root: newRoot,
    nodes: newNodes,
    version: document.version + 1
  };
}

/**
 * Clone a node deeply (including all descendants) with new IDs.
 * Returns the cloned node with a new ID and all descendants also cloned with new IDs.
 * 
 * @param node - The node to clone
 * @param idGenerator - Function to generate new IDs for the cloned nodes
 * @returns A new node with a new ID and all descendants cloned
 * 
 * @example
 * ```typescript
 * let counter = 100;
 * const cloned = cloneNode(node, () => `node_${++counter}`);
 * ```
 */
export function cloneNode(
  node: SVGNode,
  idGenerator: () => string
): SVGNode {
  const newId = idGenerator();
  
  const clonedChildren = node.children.map(child => cloneNode(child, idGenerator));
  
  const clonedNode: SVGNode = {
    id: newId,
    type: node.type,
    attributes: new Map(node.attributes),
    children: clonedChildren,
    parent: null // Parent will be set when added to a document
  };
  
  // Update parent references for cloned children
  for (const child of clonedChildren) {
    child.parent = clonedNode;
  }
  
  return clonedNode;
}
