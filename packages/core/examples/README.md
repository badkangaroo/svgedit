# SVG Edit Core - Examples

This directory contains example code demonstrating how to use the @svg-edit/core library.

## Running Examples

All examples are written in TypeScript and can be run using ts-node:

```bash
# Install dependencies first
npm install

# Run an example
npx ts-node examples/basic-usage.ts
npx ts-node examples/geometry-operations.ts
npx ts-node examples/query-operations.ts
```

## Examples

### basic-usage.ts

Demonstrates the fundamental operations:
- Parsing SVG documents
- Creating and executing commands (create, update, delete)
- Using the history manager for undo/redo
- Querying the document
- Serializing back to SVG

**Key concepts**: Parser, Serializer, Commands, HistoryManager, QueryEngine

### geometry-operations.ts

Shows geometric operations:
- Matrix transformations (translate, scale, rotate, compose)
- Matrix decomposition
- Applying transformations to points
- Calculating bounding boxes for shapes
- Path manipulation (parse, normalize, simplify, split, merge)

**Key concepts**: Matrix operations, bounding boxes, path utilities

### query-operations.ts

Demonstrates querying capabilities:
- Query by ID (O(1) lookup)
- Query by type (find all elements of a type)
- Query by attribute (with or without value)
- Multi-criteria queries (combine type + attribute filters)
- Hierarchy traversal (parents, children, ancestors, descendants)

**Key concepts**: QueryEngine, HierarchyIndex, Selector

## Common Patterns

### Error Handling

All operations that can fail return a `Result<T, E>` type:

```typescript
const result = parser.parse(svgText);
if (result.ok) {
  const document = result.value;
  // Use document
} else {
  console.error(result.error.message);
}
```

### Command Pattern

All document modifications must go through commands:

```typescript
// Create a command
const cmd = new CreateElementCommand('rect', attributes, parentId);

// Execute through history manager
const result = history.execute(cmd);

// Undo/redo
history.undo();
history.redo();
```

### Immutability

The library uses immutable data structures. Commands return new document instances:

```typescript
const doc1 = parseResult.value;
const result = history.execute(createCmd);
const doc2 = result.value;

// doc1 and doc2 are different instances
// doc1 is unchanged
```

## API Documentation

For complete API documentation, see the main package README and the TypeScript type definitions.

## More Examples

For more examples and use cases, check out:
- The test files in `src/**/*.test.ts`
- The integration tests in `tests/`
- The main package documentation
