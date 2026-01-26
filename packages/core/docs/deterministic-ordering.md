# Deterministic Node Ordering

## Overview

The SVG parser implements deterministic node ordering to ensure that parsing the same SVG document multiple times produces identical node structures with consistent ordering. This is critical for:

- **Predictable behavior**: Operations on the document tree produce consistent results
- **Testing**: Tests can rely on stable node ordering
- **Serialization**: Round-trip operations (parse → serialize → parse) maintain structure
- **Command replay**: History replay produces deterministic results

## Implementation

### Array-Based Children Storage

Children are stored in arrays (`SVGNode[]`) rather than sets or maps, which naturally preserves insertion order:

```typescript
interface SVGNode {
  id: string;
  type: SVGElementType;
  attributes: Map<string, string>;
  children: SVGNode[];  // Array preserves order
  parent: SVGNode | null;
}
```

### Document Order Preservation

The parser processes elements in document order (depth-first traversal):

1. Parse opening tag
2. Create node
3. Add node to parent's children array (in order)
4. Recursively parse children
5. Parse closing tag

This ensures that:
- Sibling elements appear in the order they were written
- Nested structures maintain their hierarchy
- The tree structure matches the source document

### Deterministic ID Generation

Node IDs are generated using a counter-based approach that resets for each parse:

```typescript
class IDGenerator {
  private counter: number = 0;
  
  generate(): string {
    return `node_${++this.counter}`;
  }
  
  reset(): void {
    this.counter = 0;
  }
}
```

IDs are assigned in document order (depth-first):
- Root element: `node_1`
- First child: `node_2`
- First child's first child: `node_3`
- First child's second child: `node_4`
- Second child: `node_5`
- etc.

This ensures that parsing the same document produces the same ID sequence.

## Examples

### Simple Siblings

```xml
<svg>
  <rect />
  <circle />
  <path />
</svg>
```

Children array: `[rect, circle, path]`
- Always in this order
- `rect` is always `children[0]`
- `circle` is always `children[1]`
- `path` is always `children[2]`

### Nested Structure

```xml
<svg>
  <g id="first">
    <rect />
    <circle />
  </g>
  <g id="second">
    <path />
  </g>
</svg>
```

Tree structure (with IDs):
```
svg (node_1)
├── g#first (node_2)
│   ├── rect (node_3)
│   └── circle (node_4)
└── g#second (node_5)
    └── path (node_6)
```

Parsing this document multiple times always produces:
- Same tree structure
- Same node ordering
- Same ID sequence

## Guarantees

The parser provides these guarantees:

1. **Consistent ordering**: Parsing the same document multiple times produces identical node ordering
2. **Document order**: Children appear in the order they were written in the source
3. **Array access**: Children can be accessed by index (`node.children[0]`)
4. **Iteration order**: Iterating over children always produces the same order
5. **Deterministic IDs**: Same document produces same ID sequence

## Testing

The deterministic ordering implementation is verified by comprehensive tests:

- **Consistency tests**: Parse same document multiple times, verify identical ordering
- **Document order tests**: Verify children appear in source order
- **Array storage tests**: Verify children are stored in arrays and support array operations
- **ID sequence tests**: Verify IDs are assigned in deterministic order
- **Edge case tests**: Empty parents, single children, large sibling lists

See `tests/unit/deterministic-ordering.test.ts` for complete test coverage.

## Requirements Validation

This implementation validates **Requirement 1.6**:

> WHEN parsing completes, THE Parser SHALL maintain deterministic node ordering based on document order

The implementation ensures:
- ✅ Children are stored in arrays to preserve order
- ✅ Parsing is deterministic (same input → same output)
- ✅ Node ordering matches document order
- ✅ IDs are assigned deterministically
- ✅ Multiple parses produce identical structures

## Related Documentation

- [Parser Implementation](../src/document/parser.ts)
- [Node Types](../src/types/node.ts)
- [ID Generation Verification](./id-generation-verification.md)
