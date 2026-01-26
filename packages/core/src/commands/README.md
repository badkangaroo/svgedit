# Command System

The command system provides a robust pattern for all document modifications with full undo/redo support.

## Overview

All changes to the SVG document must go through commands. This ensures:
- **Reversibility**: Every change can be undone
- **History**: All changes are tracked for replay
- **Atomicity**: Operations are all-or-nothing
- **Consistency**: Document state is always valid

## Command Interface

Every command implements the `Command` interface with four key methods:

```typescript
interface Command {
  execute(document: SVGDocument): Result<SVGDocument, CommandError>;
  undo(document: SVGDocument): Result<SVGDocument, CommandError>;
  canExecute(document: SVGDocument): boolean;
  canUndo(document: SVGDocument): boolean;
}
```

### Methods

#### `execute(document)`
Applies the command's changes to the document.
- Returns a new document instance (immutable)
- Stores information needed for undo
- Returns error if validation fails

#### `undo(document)`
Reverses the command's changes.
- Restores the document to its exact previous state
- Returns a new document instance (immutable)
- Must satisfy the inverse property: `execute` then `undo` restores original state

#### `canExecute(document)`
Validates if the command can be executed.
- Checks preconditions (nodes exist, valid parameters, etc.)
- Does not modify the document
- Use before calling `execute()` to avoid errors

#### `canUndo(document)`
Validates if the command can be undone.
- Checks if command has been executed
- Verifies document state allows undo
- Use before calling `undo()` to avoid errors

## Error Handling

Commands use the `Result<T, E>` type for error handling:

```typescript
const result = command.execute(document);

if (result.ok) {
  const newDocument = result.value;
  // Use the updated document
} else {
  const error = result.error;
  console.error(`Command failed: ${error.message} (${error.code})`);
}
```

### CommandError

All command errors include:
- `code`: Error code from `ErrorCode` enum
- `message`: Human-readable description
- `nodeId`: (optional) Related node ID
- `context`: (optional) Additional debugging info

## Usage Example

```typescript
import { Command, CommandError } from '@svg-edit/core';

// Implement a custom command
class MyCommand implements Command {
  private executed = false;
  private savedState?: any;
  
  canExecute(document: SVGDocument): boolean {
    // Validate preconditions
    return !this.executed && /* other checks */;
  }
  
  execute(document: SVGDocument): Result<SVGDocument, CommandError> {
    if (!this.canExecute(document)) {
      return {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Cannot execute command',
        },
      };
    }
    
    // Save state for undo
    this.savedState = /* ... */;
    this.executed = true;
    
    // Apply changes and return new document
    return {
      ok: true,
      value: /* modified document */,
    };
  }
  
  canUndo(document: SVGDocument): boolean {
    return this.executed && this.savedState !== undefined;
  }
  
  undo(document: SVGDocument): Result<SVGDocument, CommandError> {
    if (!this.canUndo(document)) {
      return {
        ok: false,
        error: {
          code: ErrorCode.COMMAND_NOT_EXECUTED,
          message: 'Command was not executed',
        },
      };
    }
    
    // Restore previous state
    this.executed = false;
    
    return {
      ok: true,
      value: /* restored document */,
    };
  }
}
```

## Design Principles

### Immutability
Commands never modify the input document. They always return a new document instance.

### Inverse Property
For any command and document D:
```
undo(execute(D)) === D
```

This property is critical for correct undo/redo behavior.

### Validation
Always validate before execution:
```typescript
if (command.canExecute(document)) {
  const result = command.execute(document);
  // ...
}
```

### State Consistency
If a command fails, the document remains unchanged. Commands are atomic.

## Next Steps

See the following command implementations:
- `CreateElementCommand` - Add new elements
- `DeleteElementCommand` - Remove elements
- `UpdateAttributeCommand` - Modify attributes
- `BatchCommand` - Group multiple commands

See also:
- `HistoryManager` - Manages undo/redo stacks
- Design document for complete architecture


## Command Validation

The `validation.ts` module provides helper functions for validating command preconditions. These utilities ensure commands fail gracefully with descriptive errors instead of modifying the document in invalid states.

### Available Validation Functions

#### `validateNodeExists(document, nodeId)`
Validates that a node exists in the document.

```typescript
const result = validateNodeExists(document, 'node-123');
if (!result.valid) {
  return { ok: false, error: result.error };
}
```

#### `validateParentNode(document, parentId)`
Validates that a parent node exists and can accept children.

```typescript
const result = validateParentNode(document, 'parent-123');
if (!result.valid) {
  return { ok: false, error: result.error };
}
```

#### `validateAttributeName(attributeName)`
Validates that an attribute name follows XML naming rules.

```typescript
const result = validateAttributeName('fill');
if (!result.valid) {
  return { ok: false, error: result.error };
}
```

#### `validateAttributeValue(attributeValue)`
Validates that an attribute value is a valid string.

```typescript
const result = validateAttributeValue('red');
if (!result.valid) {
  return { ok: false, error: result.error };
}
```

#### `validateElementType(elementType)`
Validates that an element type is a known SVG element.

```typescript
const result = validateElementType('rect');
if (!result.valid) {
  return { ok: false, error: result.error };
}
```

#### `validateInsertIndex(document, parentId, index?)`
Validates that an insert index is valid for a parent node.

```typescript
const result = validateInsertIndex(document, 'parent-123', 2);
if (!result.valid) {
  return { ok: false, error: result.error };
}
```

#### `combineValidations(validations)`
Combines multiple validation results, returning the first error or success.

```typescript
const result = combineValidations([
  validateNodeExists(document, nodeId),
  validateAttributeName(attrName),
  validateAttributeValue(attrValue),
]);
if (!result.valid) {
  return { ok: false, error: result.error };
}
```

### Using Validation in Commands

Commands should use validation utilities in their `canExecute()` and `execute()` methods:

```typescript
import {
  Command,
  CommandError,
  validateNodeExists,
  validateAttributeName,
  validateAttributeValue,
  combineValidations,
} from '@svg-edit/core';

class UpdateAttributeCommand implements Command {
  constructor(
    private nodeId: string,
    private attributeName: string,
    private newValue: string
  ) {}
  
  canExecute(document: SVGDocument): boolean {
    const result = combineValidations([
      validateNodeExists(document, this.nodeId),
      validateAttributeName(this.attributeName),
      validateAttributeValue(this.newValue),
    ]);
    return result.valid;
  }
  
  execute(document: SVGDocument): Result<SVGDocument, CommandError> {
    // Validate preconditions
    const validation = combineValidations([
      validateNodeExists(document, this.nodeId),
      validateAttributeName(this.attributeName),
      validateAttributeValue(this.newValue),
    ]);
    
    if (!validation.valid) {
      return { ok: false, error: validation.error };
    }
    
    // Perform the update...
    const node = document.nodes.get(this.nodeId)!;
    const updatedNode = {
      ...node,
      attributes: new Map(node.attributes).set(this.attributeName, this.newValue),
    };
    
    // Return new document
    return {
      ok: true,
      value: {
        ...document,
        nodes: new Map(document.nodes).set(this.nodeId, updatedNode),
        version: document.version + 1,
      },
    };
  }
  
  // ... undo and canUndo methods
}
```

### Validation Benefits

1. **Consistent Error Messages**: All validation errors follow the same format with appropriate error codes
2. **Reusable Logic**: Common validation patterns are centralized and tested
3. **Type Safety**: Validation results use discriminated unions for type-safe error handling
4. **Composability**: Multiple validations can be combined easily with `combineValidations()`
5. **Testability**: Validation logic can be tested independently from command implementations
6. **Early Detection**: Validation catches errors before document modification attempts

### Validation Testing

Validation utilities should be tested for:
- Valid inputs return success (`{ valid: true }`)
- Invalid inputs return appropriate errors with correct error codes
- Error messages are descriptive and include relevant context
- Edge cases are handled correctly (empty strings, null values, boundary conditions)
- Combined validations return the first error encountered
