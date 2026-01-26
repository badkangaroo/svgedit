# Core Types

This directory contains the fundamental type definitions for the SVG Edit core engine.

## Overview

The type system is designed with the following principles:

- **Type Safety**: Strict TypeScript types with no implicit `any`
- **Discriminated Unions**: Element types use discriminated unions for type narrowing
- **Result Pattern**: Operations that can fail return `Result<T, E>` instead of throwing exceptions
- **Immutability**: All types are designed to support immutable update patterns

## Files

### `result.ts`

Defines the `Result<T, E>` type for type-safe error handling:

```typescript
type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Also defines `ErrorCode` enum and `ErrorDetails` interface for structured error information.

### `node.ts`

Defines the SVG node types:

- `SVGElementType`: Union of all supported element types
- `SVGNode`: Base interface for all nodes
- Specific node types: `RectNode`, `CircleNode`, `PathNode`, etc.
- `SpecificSVGNode`: Union type of all specific node types

All nodes have:
- `id`: Stable unique identifier
- `type`: Element type (discriminator)
- `attributes`: Map of attribute key-value pairs
- `children`: Array of child nodes
- `parent`: Reference to parent node (null for root)

### `document.ts`

Defines the document model:

- `SVGDocument`: Complete document with root node, node index, and version
- `ParseError`: Error information for parsing failures

## Usage Examples

### Creating a Result

```typescript
import type { Result, ErrorDetails } from './result.js';
import { ErrorCode } from './result.js';

function divide(a: number, b: number): Result<number, ErrorDetails> {
  if (b === 0) {
    return {
      ok: false,
      error: {
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Division by zero'
      }
    };
  }
  return { ok: true, value: a / b };
}

const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // 5
} else {
  console.error(result.error.message);
}
```

### Creating Nodes

```typescript
import type { SVGNode, RectNode } from './node.js';

const rectNode: RectNode = {
  id: 'rect_1',
  type: 'rect',
  attributes: new Map([
    ['x', '10'],
    ['y', '20'],
    ['width', '100'],
    ['height', '50']
  ]),
  children: [],
  parent: null
};
```

### Type Narrowing

```typescript
function getWidth(node: SVGNode): string | undefined {
  if (node.type === 'rect') {
    // TypeScript knows this is a RectNode
    return node.attributes.get('width');
  }
  return undefined;
}
```

### Creating a Document

```typescript
import type { SVGDocument, SVGNode } from './index.js';

const root: SVGNode = {
  id: 'root',
  type: 'svg',
  attributes: new Map([['width', '100'], ['height', '100']]),
  children: [],
  parent: null
};

const document: SVGDocument = {
  root: root,
  nodes: new Map([['root', root]]),
  version: 0
};
```

## Design Decisions

### Why Result<T, E> instead of exceptions?

The Result type provides:
- Explicit error handling in function signatures
- Type-safe error information
- No unexpected exceptions
- Better composability

### Why Map for attributes?

Using `Map<string, string>` for attributes provides:
- Efficient key-value lookups
- Preservation of insertion order
- Clear API for attribute manipulation
- Type safety

### Why discriminated unions?

Discriminated unions enable:
- Type narrowing based on element type
- Exhaustive type checking
- Better IDE autocomplete
- Compile-time guarantees

## Testing

All types have comprehensive unit tests in their corresponding `.test.ts` files:

- `result.test.ts`: Tests Result type and ErrorCode enum
- `node.test.ts`: Tests SVGNode types and discriminated unions
- `document.test.ts`: Tests SVGDocument and ParseError types

Run tests with:

```bash
npm test
```
