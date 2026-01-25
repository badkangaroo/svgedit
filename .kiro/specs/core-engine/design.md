# Design Document: Core Engine

## Overview

The Core Engine is a headless, framework-agnostic TypeScript library that provides the business logic for SVG document manipulation. It implements a command pattern architecture with full undo/redo support, maintains immutable document state, and provides mathematical utilities for SVG geometry operations.

The design follows these key principles:

- **Pure Functions**: All operations are pure functions that return new state rather than mutating existing state
- **Command Pattern**: All document modifications are encapsulated as command objects with execute() and undo() methods
- **Single Source of Truth**: The document model is the authoritative source for all SVG content
- **Framework Independence**: No dependencies on browser APIs or UI frameworks
- **Type Safety**: Comprehensive TypeScript types throughout
- **Performance**: Efficient indexing and incremental updates for large documents

The package is organized into four main subsystems:
1. **Document Model**: Parsing, serialization, and tree structure
2. **Command System**: Command execution, undo/redo, and history management
3. **Geometry & Math**: Transform matrices, bounding boxes, and path operations
4. **Query & Index**: Efficient node lookup and hierarchy indexing

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Core Engine                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Document   │  │   Command    │  │   Geometry   │      │
│  │    Model     │  │    System    │  │   & Math     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                          │                                   │
│                  ┌──────────────┐                           │
│                  │  Query &     │                           │
│                  │  Index       │                           │
│                  └──────────────┘                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Parse SVG Text → Document Model → Commands → Updated Model → Serialize SVG Text
                       ↓              ↓
                   Query/Index    History Stack
```

All state changes flow through commands, ensuring:
- Every change is reversible (undo)
- History can be replayed deterministically
- State transitions are explicit and traceable

### Module Organization

```
packages/core/
├── src/
│   ├── document/          # Document model and tree structure
│   │   ├── parser.ts      # SVG parsing
│   │   ├── serializer.ts  # SVG serialization
│   │   ├── node.ts        # Node types and interfaces
│   │   └── document.ts    # Document model
│   ├── commands/          # Command system
│   │   ├── command.ts     # Base command interface
│   │   ├── history.ts     # History manager
│   │   ├── create.ts      # Create element commands
│   │   ├── delete.ts      # Delete element commands
│   │   ├── update.ts      # Update attribute commands
│   │   └── batch.ts       # Batch command
│   ├── geometry/          # Geometry and math utilities
│   │   ├── matrix.ts      # Matrix transformations
│   │   ├── bbox.ts        # Bounding box calculations
│   │   └── path.ts        # Path manipulation
│   ├── query/             # Query and indexing
│   │   ├── selector.ts    # Selector queries
│   │   └── index.ts       # Hierarchy indexing
│   └── index.ts           # Public API exports
└── tests/
    ├── unit/              # Unit tests
    └── properties/        # Property-based tests
```

## Components and Interfaces

### Document Model

#### Node Types

```typescript
// Base node interface
interface SVGNode {
  id: string;              // Stable unique identifier
  type: SVGElementType;    // Element type (rect, circle, path, etc.)
  attributes: Map<string, string>;  // Element attributes
  children: SVGNode[];     // Child nodes
  parent: SVGNode | null;  // Parent node reference
}

// Discriminated union for specific element types
type SVGElementType = 
  | 'svg'
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'polyline'
  | 'polygon'
  | 'path'
  | 'text'
  | 'g'
  | 'defs'
  | 'use';

// Specific node types with type-specific properties
interface RectNode extends SVGNode {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CircleNode extends SVGNode {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

interface PathNode extends SVGNode {
  type: 'path';
  d: string;  // Path data
}

// ... other specific node types
```

#### Document Model

```typescript
interface SVGDocument {
  root: SVGNode;           // Root <svg> element
  nodes: Map<string, SVGNode>;  // Index of all nodes by ID
  version: number;         // Version counter for change tracking
}

interface Parser {
  parse(svgText: string): Result<SVGDocument, ParseError>;
}

interface Serializer {
  serialize(document: SVGDocument): string;
}

type ParseError = {
  message: string;
  line: number;
  column: number;
};

type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### Command System

#### Command Interface

```typescript
interface Command {
  execute(document: SVGDocument): Result<SVGDocument, CommandError>;
  undo(document: SVGDocument): Result<SVGDocument, CommandError>;
  canExecute(document: SVGDocument): boolean;
  canUndo(document: SVGDocument): boolean;
}

type CommandError = {
  message: string;
  code: ErrorCode;
};

enum ErrorCode {
  NODE_NOT_FOUND = 'NODE_NOT_FOUND',
  INVALID_ATTRIBUTE = 'INVALID_ATTRIBUTE',
  INVALID_PARENT = 'INVALID_PARENT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}
```

#### Specific Commands

```typescript
// Create element command
class CreateElementCommand implements Command {
  constructor(
    private elementType: SVGElementType,
    private attributes: Map<string, string>,
    private parentId: string,
    private insertIndex?: number
  ) {}
  
  execute(document: SVGDocument): Result<SVGDocument, CommandError>;
  undo(document: SVGDocument): Result<SVGDocument, CommandError>;
}

// Delete element command
class DeleteElementCommand implements Command {
  constructor(private nodeId: string) {}
  
  execute(document: SVGDocument): Result<SVGDocument, CommandError>;
  undo(document: SVGDocument): Result<SVGDocument, CommandError>;
}

// Update attribute command
class UpdateAttributeCommand implements Command {
  constructor(
    private nodeId: string,
    private attributeName: string,
    private newValue: string
  ) {}
  
  execute(document: SVGDocument): Result<SVGDocument, CommandError>;
  undo(document: SVGDocument): Result<SVGDocument, CommandError>;
}

// Batch command
class BatchCommand implements Command {
  constructor(private commands: Command[]) {}
  
  execute(document: SVGDocument): Result<SVGDocument, CommandError>;
  undo(document: SVGDocument): Result<SVGDocument, CommandError>;
}
```

#### History Manager

```typescript
interface HistoryManager {
  execute(command: Command): Result<SVGDocument, CommandError>;
  undo(): Result<SVGDocument, CommandError>;
  redo(): Result<SVGDocument, CommandError>;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
  getHistory(): Command[];
}

class HistoryManagerImpl implements HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private currentDocument: SVGDocument;
  
  execute(command: Command): Result<SVGDocument, CommandError> {
    const result = command.execute(this.currentDocument);
    if (result.ok) {
      this.undoStack.push(command);
      this.redoStack = [];  // Clear redo stack on new command
      this.currentDocument = result.value;
    }
    return result;
  }
  
  undo(): Result<SVGDocument, CommandError> {
    if (this.undoStack.length === 0) {
      return { ok: false, error: { message: 'Nothing to undo', code: ErrorCode.VALIDATION_FAILED } };
    }
    const command = this.undoStack.pop()!;
    const result = command.undo(this.currentDocument);
    if (result.ok) {
      this.redoStack.push(command);
      this.currentDocument = result.value;
    }
    return result;
  }
  
  redo(): Result<SVGDocument, CommandError> {
    if (this.redoStack.length === 0) {
      return { ok: false, error: { message: 'Nothing to redo', code: ErrorCode.VALIDATION_FAILED } };
    }
    const command = this.redoStack.pop()!;
    const result = command.execute(this.currentDocument);
    if (result.ok) {
      this.undoStack.push(command);
      this.currentDocument = result.value;
    }
    return result;
  }
}
```

### Geometry and Math

#### Matrix Transformations

```typescript
// 2D affine transformation matrix [a, b, c, d, e, f]
// Represents: | a c e |
//             | b d f |
//             | 0 0 1 |
type Matrix = [number, number, number, number, number, number];

interface TransformComponents {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;  // in radians
  skewX: number;
  skewY: number;
}

interface MatrixUtils {
  identity(): Matrix;
  compose(m1: Matrix, m2: Matrix): Matrix;
  decompose(m: Matrix): TransformComponents;
  inverse(m: Matrix): Matrix | null;
  applyToPoint(m: Matrix, point: Point): Point;
  translate(tx: number, ty: number): Matrix;
  scale(sx: number, sy: number): Matrix;
  rotate(angle: number): Matrix;
}

type Point = { x: number; y: number };
```

#### Bounding Boxes

```typescript
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BBoxCalculator {
  calculate(node: SVGNode): BoundingBox;
  union(boxes: BoundingBox[]): BoundingBox;
  transform(box: BoundingBox, matrix: Matrix): BoundingBox;
}
```

#### Path Operations

```typescript
interface PathCommand {
  type: 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z';  // Move, Line, Cubic, Quadratic, Arc, Close
  points: number[];
  absolute: boolean;
}

interface PathUtils {
  parse(pathData: string): PathCommand[];
  serialize(commands: PathCommand[]): string;
  normalize(commands: PathCommand[]): PathCommand[];  // Convert to absolute
  simplify(commands: PathCommand[], tolerance: number): PathCommand[];
  split(commands: PathCommand[], t: number): [PathCommand[], PathCommand[]];
  merge(path1: PathCommand[], path2: PathCommand[]): PathCommand[];
}
```

### Query and Index

#### Selector Queries

```typescript
interface Selector {
  type?: SVGElementType;
  id?: string;
  attribute?: { name: string; value?: string };
}

interface QueryEngine {
  query(document: SVGDocument, selector: Selector): SVGNode[];
  queryById(document: SVGDocument, id: string): SVGNode | null;
  queryByType(document: SVGDocument, type: SVGElementType): SVGNode[];
  queryByAttribute(document: SVGDocument, name: string, value?: string): SVGNode[];
}
```

#### Hierarchy Index

```typescript
interface HierarchyIndex {
  getParent(nodeId: string): SVGNode | null;
  getChildren(nodeId: string): SVGNode[];
  getAncestors(nodeId: string): SVGNode[];
  getDescendants(nodeId: string): SVGNode[];
  update(document: SVGDocument): void;
  invalidate(nodeId: string): void;
}

class HierarchyIndexImpl implements HierarchyIndex {
  private parentMap: Map<string, string> = new Map();
  private childrenMap: Map<string, string[]> = new Map();
  
  update(document: SVGDocument): void {
    // Incrementally update index based on document changes
  }
  
  invalidate(nodeId: string): void {
    // Invalidate cached data for a specific node and its ancestors
  }
}
```

## Data Models

### Document State

The document state is immutable. All operations return a new document instance:

```typescript
// Immutable update pattern
function updateNode(document: SVGDocument, nodeId: string, updater: (node: SVGNode) => SVGNode): SVGDocument {
  const node = document.nodes.get(nodeId);
  if (!node) return document;
  
  const updatedNode = updater(node);
  const newNodes = new Map(document.nodes);
  newNodes.set(nodeId, updatedNode);
  
  return {
    ...document,
    nodes: newNodes,
    version: document.version + 1
  };
}
```

### ID Generation

Stable IDs are generated using a counter-based approach:

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

### Error Handling

All operations that can fail return a `Result<T, E>` type:

```typescript
type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

// Usage
const result = parser.parse(svgText);
if (result.ok) {
  const document = result.value;
  // ... use document
} else {
  console.error(result.error.message);
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Parsing and Serialization Properties

**Property 1: Complete element preservation**
*For any* valid SVG document, parsing should create nodes for all elements present in the input.
**Validates: Requirements 1.1**

**Property 2: Unique ID assignment**
*For any* parsed SVG document, all nodes should have unique Stable_IDs with no duplicates.
**Validates: Requirements 1.2, 3.1, 3.4**

**Property 3: Hierarchy preservation**
*For any* SVG document with nested elements, parsing should preserve all parent-child relationships from the input structure.
**Validates: Requirements 1.3**

**Property 4: Attribute preservation**
*For any* SVG element with attributes, parsing should extract and store all attribute key-value pairs.
**Validates: Requirements 1.4**

**Property 5: Parse error handling**
*For any* invalid SVG syntax, the parser should return a descriptive error (not throw an exception) indicating location and nature of the error.
**Validates: Requirements 1.5, 18.1**

**Property 6: Deterministic parsing**
*For any* SVG document, parsing it multiple times should produce identical node ordering.
**Validates: Requirements 1.6**

**Property 7: Valid serialization**
*For any* valid Document_Model, serialization should produce well-formed SVG text that can be parsed by standard XML parsers.
**Validates: Requirements 2.1**

**Property 8: Deterministic serialization**
*For any* Document_Model, serializing it multiple times should produce identical output.
**Validates: Requirements 2.2**

**Property 9: Consistent attribute formatting**
*For any* Document_Model with attributes, serialization should format all attributes consistently (e.g., same quote style, spacing).
**Validates: Requirements 2.3**

**Property 10: Proper XML hierarchy**
*For any* Document_Model with nested elements, serialization should produce properly indented, hierarchical XML.
**Validates: Requirements 2.4**

**Property 11: Round-trip fidelity (CRITICAL)**
*For any* valid Document_Model, parsing then serializing then parsing should produce an equivalent document structure (same nodes, attributes, and hierarchy).
**Validates: Requirements 2.6**

### Node Identity Properties

**Property 12: ID stability across modifications**
*For any* node in a document, performing any modification operation (move, update attributes, etc.) should preserve its Stable_ID.
**Validates: Requirements 3.2**

**Property 13: Query by ID correctness**
*For any* document and node ID, querying by that ID should return the correct node if it exists, or null if it doesn't.
**Validates: Requirements 3.3, 14.4**

### Command System Properties

**Property 14: Command execution applies changes**
*For any* valid command, executing it should modify the document in the expected way (e.g., create command adds a node, delete command removes a node).
**Validates: Requirements 4.1, 4.2**

**Property 15: Invalid commands preserve state**
*For any* invalid command, attempting to execute it should return an error and leave the document unchanged.
**Validates: Requirements 4.4, 18.2**

**Property 16: Command inverse property (CRITICAL)**
*For any* command, executing it then undoing it should restore the document to its original state (same nodes, attributes, hierarchy, and IDs).
**Validates: Requirements 5.1**

**Property 17: History tracking**
*For any* executed command, it should appear in the history manager's undo stack.
**Validates: Requirements 6.1**

**Property 18: Undo behavior**
*For any* history manager with commands in the undo stack, calling undo should reverse the most recent command and move it to the redo stack.
**Validates: Requirements 6.2, 6.3**

**Property 19: Redo behavior**
*For any* history manager with commands in the redo stack, calling redo should re-execute the most recent undone command and move it back to the undo stack.
**Validates: Requirements 6.4**

**Property 20: Redo invalidation**
*For any* history manager, executing a new command after undo operations should clear the redo stack.
**Validates: Requirements 6.5**

**Property 21: Deterministic replay**
*For any* sequence of commands, replaying them multiple times should produce identical final document states.
**Validates: Requirements 6.6**

**Property 22: Batch execution order**
*For any* batch command with multiple sub-commands, executing it should execute all sub-commands in the specified order.
**Validates: Requirements 7.2**

**Property 23: Batch undo order**
*For any* executed batch command, undoing it should undo all sub-commands in reverse order.
**Validates: Requirements 7.3**

**Property 24: Batch error handling**
*For any* batch command containing a failing sub-command, execution should halt at the failure and return an error without executing remaining sub-commands.
**Validates: Requirements 7.4**

### Specific Command Properties

**Property 25: Create element adds node**
*For any* create element command with valid parameters, executing it should add a new node with the specified type and attributes to the document.
**Validates: Requirements 8.1**

**Property 26: Create element undo removes node**
*For any* executed create element command, undoing it should remove the created node from the document.
**Validates: Requirements 8.2**

**Property 27: Create child adds to parent**
*For any* create element command specifying a parent, executing it should add the new node as a child of the specified parent.
**Validates: Requirements 8.4**

**Property 28: Delete element removes node**
*For any* delete element command with a valid node ID, executing it should remove the node and all its children from the document.
**Validates: Requirements 9.1, 9.3**

**Property 29: Delete element undo restores node**
*For any* executed delete element command, undoing it should restore the deleted node and all its children to their original positions.
**Validates: Requirements 9.2, 9.4**

**Property 30: Update attribute modifies value**
*For any* update attribute command, executing it should change the specified attribute to the new value (or create it if it doesn't exist).
**Validates: Requirements 10.1, 10.3**

**Property 31: Update attribute undo restores value**
*For any* executed update attribute command, undoing it should restore the attribute to its previous value (or remove it if it was newly created).
**Validates: Requirements 10.2, 10.4**

### Geometry and Transform Properties

**Property 32: Matrix composition**
*For any* two transformation matrices M1 and M2, composing them should produce a matrix that applies both transformations in sequence.
**Validates: Requirements 11.1**

**Property 33: Matrix decomposition**
*For any* transformation matrix, decomposing it should produce translate, rotate, scale, and skew components that, when recomposed, produce an equivalent transformation.
**Validates: Requirements 11.2, 11.5**

**Property 34: Matrix point transformation**
*For any* matrix and point, applying the transformation should produce a new point at the correct transformed location.
**Validates: Requirements 11.3**

**Property 35: Matrix inverse property**
*For any* invertible matrix M, composing M with its inverse should produce the identity matrix.
**Validates: Requirements 11.4**

**Property 36: Bounding box calculation**
*For any* SVG element (rect, circle, path, group, etc.), calculating its bounding box should return the smallest rectangle that completely contains the element, accounting for transforms if present.
**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

**Property 37: Path simplification preserves shape**
*For any* path with redundant points, simplifying it should produce a path with fewer points that has an equivalent or very similar bounding box (within tolerance).
**Validates: Requirements 13.1**

**Property 38: Path splitting**
*For any* path and split parameter t, splitting the path should produce two paths that, when their bounding boxes are unioned, cover the same area as the original path.
**Validates: Requirements 13.2**

**Property 39: Path merging**
*For any* two compatible paths, merging them should produce a single path that contains all the path commands from both inputs.
**Validates: Requirements 13.3**

**Property 40: Path normalization**
*For any* path with relative commands, normalizing it should convert all commands to absolute coordinates while preserving the visual path.
**Validates: Requirements 13.4**

### Query and Performance Properties

**Property 41: Query performance**
*For any* selector query on a document with 1000 nodes, the query should complete in under 50 milliseconds.
**Validates: Requirements 14.1**

**Property 42: Query by type correctness**
*For any* document and element type, querying by that type should return all and only the nodes with that type.
**Validates: Requirements 14.2**

**Property 43: Query by attribute correctness**
*For any* document and attribute name, querying by that attribute should return all and only the nodes that have that attribute.
**Validates: Requirements 14.3**

**Property 44: Multi-criteria query correctness**
*For any* document and multiple query criteria, the query should return all and only the nodes that match all criteria (intersection).
**Validates: Requirements 14.5**

### Validation and Error Handling Properties

**Property 45: Attribute type validation**
*For any* element attribute with an expected type, validation should reject values that don't match the expected type and return a descriptive error.
**Validates: Requirements 17.2**

**Property 46: Validation error messages**
*For any* validation failure, the error message should include line numbers (for parsing errors) and clear descriptions of what went wrong.
**Validates: Requirements 17.3**

**Property 47: Unknown element graceful handling**
*For any* SVG document containing unknown element types, parsing should continue successfully and issue warnings for unknown elements.
**Validates: Requirements 17.4**

**Property 48: Query null safety**
*For any* query with an invalid node reference, the query engine should return null rather than throwing an exception.
**Validates: Requirements 18.3**

**Property 49: Error state consistency**
*For any* command that fails during execution, the document should remain in a consistent state (unchanged from before the command was attempted).
**Validates: Requirements 18.4**

### Framework Independence Properties

**Property 50: Node.js compatibility**
*For any* core engine functionality, it should execute successfully in a Node.js environment without requiring browser APIs or a DOM implementation.
**Validates: Requirements 20.1, 20.2, 20.3, 20.4**


## Error Handling

The core engine uses a Result type pattern for all operations that can fail, avoiding exceptions for expected error cases:

### Error Types

```typescript
type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

enum ErrorCode {
  // Parsing errors
  INVALID_XML = 'INVALID_XML',
  MALFORMED_SVG = 'MALFORMED_SVG',
  INVALID_ATTRIBUTE = 'INVALID_ATTRIBUTE',
  
  // Command errors
  NODE_NOT_FOUND = 'NODE_NOT_FOUND',
  INVALID_PARENT = 'INVALID_PARENT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  COMMAND_NOT_EXECUTED = 'COMMAND_NOT_EXECUTED',
  
  // Geometry errors
  INVALID_MATRIX = 'INVALID_MATRIX',
  INVALID_PATH_DATA = 'INVALID_PATH_DATA',
  
  // Query errors
  INVALID_SELECTOR = 'INVALID_SELECTOR',
}

interface ErrorDetails {
  code: ErrorCode;
  message: string;
  line?: number;      // For parsing errors
  column?: number;    // For parsing errors
  nodeId?: string;    // For command errors
  context?: any;      // Additional context
}
```

### Error Handling Strategies

**Parsing Errors:**
- Return detailed error with line/column information
- Continue parsing when possible (for unknown elements)
- Collect multiple errors rather than failing on first error

**Command Errors:**
- Validate before execution (canExecute() method)
- Return error without modifying document state
- Provide clear error messages with node IDs

**Geometry Errors:**
- Return null for invalid operations (e.g., inverse of singular matrix)
- Validate input parameters before computation
- Use tolerance for floating-point comparisons

**Query Errors:**
- Return empty array for queries with no matches
- Return null for single-node queries with no match
- Never throw exceptions for invalid selectors

### State Consistency

All operations maintain document consistency:
- Commands are atomic (all-or-nothing)
- Failed commands leave document unchanged
- Undo/redo operations are transactional
- No partial updates are visible

## Testing Strategy

The core engine uses a dual testing approach combining unit tests and property-based tests for comprehensive coverage.

### Property-Based Testing

Property-based tests validate universal properties across many generated inputs using the fast-check library. Each property test:
- Runs minimum 100 iterations with randomized inputs
- References its design document property number
- Uses descriptive tags for traceability

**Configuration:**
```typescript
import fc from 'fast-check';

// Example property test
describe('Feature: core-engine, Property 11: Round-trip fidelity', () => {
  it('should preserve document structure through parse-serialize-parse cycle', () => {
    fc.assert(
      fc.property(
        arbitraryDocument(),  // Generator for random documents
        (doc) => {
          const serialized = serializer.serialize(doc);
          const result = parser.parse(serialized);
          expect(result.ok).toBe(true);
          if (result.ok) {
            const reparsed = result.value;
            const reserialized = serializer.serialize(reparsed);
            expect(reserialized).toEqual(serialized);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Key Property Tests:**
- Round-trip properties (parse/serialize, execute/undo)
- Inverse properties (matrix inverse, command undo)
- Invariant properties (ID uniqueness, hierarchy consistency)
- Metamorphic properties (query result relationships)

### Unit Testing

Unit tests validate specific examples, edge cases, and error conditions:

**Focus Areas:**
- Specific examples demonstrating correct behavior
- Edge cases (empty documents, single nodes, deeply nested structures)
- Error conditions (invalid input, missing nodes, malformed data)
- Integration points between subsystems
- Boundary conditions (performance limits, maximum nesting depth)

**Example Unit Test:**
```typescript
describe('CreateElementCommand', () => {
  it('should add a rectangle to the document', () => {
    const doc = createEmptyDocument();
    const cmd = new CreateElementCommand(
      'rect',
      new Map([['x', '10'], ['y', '20'], ['width', '100'], ['height', '50']]),
      doc.root.id
    );
    
    const result = cmd.execute(doc);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const newDoc = result.value;
      expect(newDoc.root.children.length).toBe(1);
      expect(newDoc.root.children[0].type).toBe('rect');
    }
  });
  
  it('should return error for invalid parent', () => {
    const doc = createEmptyDocument();
    const cmd = new CreateElementCommand('rect', new Map(), 'invalid-id');
    
    const result = cmd.execute(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ErrorCode.NODE_NOT_FOUND);
    }
  });
});
```

### Test Organization

```
tests/
├── unit/
│   ├── document/
│   │   ├── parser.test.ts
│   │   ├── serializer.test.ts
│   │   └── document.test.ts
│   ├── commands/
│   │   ├── create.test.ts
│   │   ├── delete.test.ts
│   │   ├── update.test.ts
│   │   ├── batch.test.ts
│   │   └── history.test.ts
│   ├── geometry/
│   │   ├── matrix.test.ts
│   │   ├── bbox.test.ts
│   │   └── path.test.ts
│   └── query/
│       ├── selector.test.ts
│       └── index.test.ts
└── properties/
    ├── arbitraries.ts        # Generators for random test data
    ├── document.properties.ts
    ├── commands.properties.ts
    ├── geometry.properties.ts
    └── query.properties.ts
```

### Test Data Generators

Property-based tests require generators (arbitraries) for random test data:

```typescript
// Example generators
function arbitraryDocument(): fc.Arbitrary<SVGDocument> {
  return fc.record({
    root: arbitrarySVGNode(),
    nodes: fc.dictionary(fc.string(), arbitrarySVGNode()),
    version: fc.nat()
  });
}

function arbitrarySVGNode(): fc.Arbitrary<SVGNode> {
  return fc.oneof(
    arbitraryRectNode(),
    arbitraryCircleNode(),
    arbitraryPathNode(),
    arbitraryGroupNode()
  );
}

function arbitraryMatrix(): fc.Arbitrary<Matrix> {
  return fc.tuple(
    fc.float(), fc.float(), fc.float(),
    fc.float(), fc.float(), fc.float()
  ) as fc.Arbitrary<Matrix>;
}
```

### Performance Benchmarks

Performance benchmarks validate that the system meets performance targets:

```typescript
import { bench, describe } from 'vitest';

describe('Query Performance', () => {
  bench('selector query on 1000 nodes', () => {
    const doc = createDocumentWithNodes(1000);
    const results = queryEngine.queryByType(doc, 'rect');
  }, {
    time: 50  // Should complete in under 50ms
  });
});
```

**Benchmark Coverage:**
- Selector queries on 1k, 5k, 10k node documents
- Command execution and undo operations
- Parsing and serialization of various document sizes
- Matrix operations and bounding box calculations
- Path simplification and manipulation

### Coverage Goals

- **Overall coverage**: 90%+ for core logic
- **Critical paths**: 100% coverage for command system, parsing, serialization
- **Property tests**: All round-trip and inverse operations
- **Unit tests**: All edge cases and error conditions
- **Performance tests**: All operations with performance requirements

### CI Integration

All tests run in Node.js environment:
- No browser or DOM required
- Fast execution (< 2 minutes for full suite)
- Benchmarks run on every PR
- Coverage reports generated automatically
- Property test failures include counterexamples for debugging

