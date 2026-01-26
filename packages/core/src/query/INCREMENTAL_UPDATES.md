# Incremental Index Updates

The `HierarchyIndex` class now supports incremental updates, allowing efficient modifications to the index without rebuilding the entire structure. This is crucial for performance when making small changes to large documents.

## Overview

The `HierarchyIndex` class provides efficient parent-child relationship lookups and supports incremental updates. This allows you to query the document hierarchy and make modifications without rebuilding the entire structure.

### Query Methods

- `getParent(nodeId)` - Get the parent ID of a node (O(1))
- `getChildren(nodeId)` - Get the child IDs of a node (O(1))
- `getAncestors(nodeId)` - Get all ancestor IDs from parent to root (O(h) where h is depth)
- `getDescendants(nodeId)` - Get all descendant IDs in depth-first order (O(k) where k is descendants)

### Update Methods

- `addNode(node, parentId)` - Add a new node to the index
- `removeNode(nodeId)` - Remove a node and its descendants from the index
- `moveNode(nodeId, newParentId)` - Move a node to a new parent

## Performance Characteristics

### Query Operations

- **getParent**: O(1) - constant time lookup
- **getChildren**: O(1) - constant time lookup (returns copy of array)
- **getAncestors**: O(h) where h is the depth/height of the node in the tree
- **getDescendants**: O(k) where k is the number of descendants

### Update Operations

- **addNode**: O(k) where k is the number of descendants of the added node
- **removeNode**: O(k) where k is the number of descendants of the removed node
- **moveNode**: O(1) - constant time operation

These operations are significantly faster than rebuilding the entire index, which is O(n) where n is the total number of nodes in the document.

## Usage Examples

### Querying Ancestors

```typescript
const index = new HierarchyIndex(document);

// Get all ancestors of a deeply nested node
const ancestors = index.getAncestors('deeply_nested_node');
// Returns: ['parent_id', 'grandparent_id', 'root_id']

// Ancestors are returned in order from immediate parent to root
console.log(ancestors[0]); // immediate parent
console.log(ancestors[ancestors.length - 1]); // root
```

### Querying Descendants

```typescript
// Get all descendants of a node
const descendants = index.getDescendants('group_id');
// Returns all child IDs in depth-first order

// Useful for operations that affect entire subtrees
for (const descendantId of descendants) {
  // Process each descendant
  console.log(`Processing ${descendantId}`);
}
```

### Adding a Node

```typescript
const index = new HierarchyIndex(document);

// Create a new node
const newRect = createNode('rect1', 'rect');

// Add it to the index under a specific parent
index.addNode(newRect, 'parent_id');

// The node and all its descendants are now indexed
console.log(index.getParent('rect1')); // 'parent_id'
```

### Removing a Node

```typescript
// Remove a node and all its descendants
index.removeNode('node_to_remove');

// The node is no longer in the index
console.log(index.getParent('node_to_remove')); // null
```

### Moving a Node

```typescript
// Move a node from one parent to another
index.moveNode('node_id', 'new_parent_id');

// The node now has a new parent
console.log(index.getParent('node_id')); // 'new_parent_id'
```

## Real-World Scenarios

### Finding All Nodes in a Subtree

When you need to apply an operation to all nodes in a subtree:

```typescript
// Get all descendants of a group
const groupDescendants = index.getDescendants('group_id');

// Apply a transformation to all shapes in the group
for (const nodeId of groupDescendants) {
  const node = document.nodes.get(nodeId);
  if (node && isShape(node)) {
    applyTransform(node, matrix);
  }
}
```

### Checking if a Node is an Ancestor

```typescript
function isAncestor(index: HierarchyIndex, ancestorId: string, nodeId: string): boolean {
  const ancestors = index.getAncestors(nodeId);
  return ancestors.includes(ancestorId);
}

// Prevent circular references when moving nodes
if (isAncestor(index, nodeToMove, newParent)) {
  throw new Error('Cannot move a node into its own descendant');
}
```

### Building a Document Incrementally

Instead of creating the entire document structure upfront and then building the index, you can build both incrementally:

```typescript
const root = createNode('root', 'svg');
const doc = createDocument(root);
const index = new HierarchyIndex(doc);

// Add elements as they're created
const toolbar = createNode('toolbar', 'g');
index.addNode(toolbar, 'root');

const button1 = createNode('button1', 'rect');
index.addNode(button1, 'toolbar');

const button2 = createNode('button2', 'rect');
index.addNode(button2, 'toolbar');
```

### Moving Shapes Between Layers

A common operation in SVG editors is moving shapes between layers:

```typescript
// Move a shape from layer1 to layer2
index.moveNode('shape_id', 'layer2');

// The index is updated instantly without rebuilding
```

### Deleting Groups

When deleting a group, all its descendants are automatically removed from the index:

```typescript
// Get all descendants before deletion (for undo support)
const descendants = index.getDescendants('group_id');
console.log(`Deleting group with ${descendants.length} descendants`);

// Remove a group and all its contents
index.removeNode('group_id');

// All descendants are removed from the index
```

### Finding the Path to Root

```typescript
// Get the full path from a node to the root
function getPathToRoot(index: HierarchyIndex, nodeId: string): string[] {
  const ancestors = index.getAncestors(nodeId);
  return [nodeId, ...ancestors];
}

const path = getPathToRoot(index, 'leaf_node');
// Returns: ['leaf_node', 'parent', 'grandparent', 'root']
```

### Complex Editing Workflows

The incremental updates can be combined to handle complex editing workflows efficiently:

```typescript
// User creates a group
const group = createNode('group', 'g');
index.addNode(group, 'root');

// User moves existing shapes into the group
index.moveNode('shape1', 'group');
index.moveNode('shape2', 'group');

// User adds a new shape to the group
const newShape = createNode('shape3', 'circle');
index.addNode(newShape, 'group');

// User decides to ungroup - moves all children back
index.moveNode('shape1', 'root');
index.moveNode('shape2', 'root');
index.moveNode('shape3', 'root');

// User deletes the empty group
index.removeNode('group');
```

## Implementation Details

### Internal Data Structures

The index maintains two maps:
- `parentMap: Map<string, string>` - Maps node ID to parent ID
- `childrenMap: Map<string, string[]>` - Maps node ID to array of child IDs

### Invalidation Strategy

The incremental update methods only modify the affected portions of the index:

- **addNode**: Updates the parent's children list and recursively indexes the new subtree
- **removeNode**: Removes the node and all descendants from both maps
- **moveNode**: Updates the old parent's children list, the new parent's children list, and the node's parent reference

This approach ensures that only the minimum necessary work is performed, maintaining excellent performance even for large documents.

## Testing

The hierarchy index functionality is thoroughly tested with:

- **Unit tests**: 61 tests covering all query and update operations
- **Integration tests**: 11 tests demonstrating real-world usage scenarios with parsed documents
- **Performance tests**: Verifying O(1), O(h), and O(k) complexity guarantees

All tests are located in:
- `packages/core/src/query/hierarchy-index.test.ts` - Comprehensive unit tests
- `packages/core/src/query/hierarchy-index-incremental.test.ts` - Incremental update tests
- `packages/core/src/query/integration.test.ts` - Integration tests with parser

## Future Enhancements

Potential future improvements:
- Batch update operations for multiple changes
- Change tracking to support undo/redo
- Event notifications for index changes
- Optimized bulk operations for large-scale modifications
