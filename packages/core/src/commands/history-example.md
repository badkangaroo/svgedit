# HistoryManager Usage Examples

This document provides practical examples of using the HistoryManager for undo/redo functionality.

## Basic Usage

```typescript
import { HistoryManagerImpl } from '@svg-edit/core';
import { CreateElementCommand, UpdateAttributeCommand, DeleteElementCommand } from '@svg-edit/core';

// Create a history manager with an initial document
const history = new HistoryManagerImpl(initialDocument);

// Execute a command
const createCmd = new CreateElementCommand(
  'rect',
  new Map([
    ['x', '10'],
    ['y', '20'],
    ['width', '100'],
    ['height', '50'],
    ['fill', 'blue']
  ]),
  'root'
);

const result = history.execute(createCmd);
if (result.ok) {
  console.log('Rectangle created');
  console.log('Current document:', history.getCurrentDocument());
}

// Undo the command
if (history.canUndo()) {
  const undoResult = history.undo();
  if (undoResult.ok) {
    console.log('Rectangle removed');
  }
}

// Redo the command
if (history.canRedo()) {
  const redoResult = history.redo();
  if (redoResult.ok) {
    console.log('Rectangle restored');
  }
}
```

## Complex Workflow

```typescript
// Create multiple elements
const rect = new CreateElementCommand('rect', new Map([['x', '0']]), 'root');
const circle = new CreateElementCommand('circle', new Map([['cx', '50']]), 'root');
const path = new CreateElementCommand('path', new Map([['d', 'M 0 0 L 100 100']]), 'root');

history.execute(rect);
const rectId = rect.getCreatedNodeId()!;

history.execute(circle);
const circleId = circle.getCreatedNodeId()!;

history.execute(path);

// Update attributes
history.execute(new UpdateAttributeCommand(rectId, 'fill', 'red'));
history.execute(new UpdateAttributeCommand(circleId, 'r', '25'));

// Current state: 3 elements with updated attributes
console.log('Elements:', history.getCurrentDocument().root.children.length); // 3

// Undo the last two updates
history.undo(); // Undo circle radius update
history.undo(); // Undo rect fill update

// Redo one of them
history.redo(); // Redo rect fill update

// Execute a new command - this clears the redo stack
history.execute(new DeleteElementCommand(pathId));

// Now we can't redo the circle radius update anymore
console.log('Can redo:', history.canRedo()); // false
```

## Batch Operations

```typescript
import { BatchCommand } from '@svg-edit/core';

// Create multiple elements as a single undo/redo unit
const batch = new BatchCommand([
  new CreateElementCommand('rect', new Map([['x', '0'], ['y', '0']]), 'root'),
  new CreateElementCommand('rect', new Map([['x', '10'], ['y', '10']]), 'root'),
  new CreateElementCommand('rect', new Map([['x', '20'], ['y', '20']]), 'root'),
]);

history.execute(batch);
console.log('Created 3 rectangles');

// Undo all 3 creations at once
history.undo();
console.log('Removed all 3 rectangles');

// Redo all 3 creations at once
history.redo();
console.log('Restored all 3 rectangles');
```

## Error Handling

```typescript
// Attempt to execute an invalid command
const invalidCmd = new CreateElementCommand(
  'rect',
  new Map([['x', '10']]),
  'non-existent-parent-id'
);

const result = history.execute(invalidCmd);
if (!result.ok) {
  console.error('Command failed:', result.error.message);
  console.log('Document unchanged');
}

// Attempt to undo when nothing to undo
if (!history.canUndo()) {
  const undoResult = history.undo();
  if (!undoResult.ok) {
    console.error('Nothing to undo:', undoResult.error.message);
  }
}
```

## Clearing History

```typescript
// Execute some commands
history.execute(new CreateElementCommand('rect', new Map(), 'root'));
history.execute(new CreateElementCommand('circle', new Map(), 'root'));

console.log('Can undo:', history.canUndo()); // true

// Clear all history
history.clear();

console.log('Can undo:', history.canUndo()); // false
console.log('Can redo:', history.canRedo()); // false

// The current document is not affected
console.log('Elements still exist:', history.getCurrentDocument().root.children.length); // 2
```

## Inspecting History

```typescript
// Execute several commands
history.execute(new CreateElementCommand('rect', new Map(), 'root'));
history.execute(new CreateElementCommand('circle', new Map(), 'root'));
history.execute(new CreateElementCommand('path', new Map([['d', 'M 0 0']]), 'root'));

// Get the history (for debugging or UI display)
const commandHistory = history.getHistory();
console.log('Number of commands:', commandHistory.length); // 3

// The returned array is a copy - modifying it doesn't affect the history
commandHistory.pop();
console.log('History still has:', history.getHistory().length); // 3
```

## Integration with UI

```typescript
// Example: Connecting history to UI buttons
class EditorUI {
  private history: HistoryManagerImpl;
  
  constructor(initialDocument: SVGDocument) {
    this.history = new HistoryManagerImpl(initialDocument);
    this.updateUI();
  }
  
  executeCommand(command: Command) {
    const result = this.history.execute(command);
    if (result.ok) {
      this.updateUI();
      this.renderDocument(result.value);
    } else {
      this.showError(result.error.message);
    }
  }
  
  undo() {
    if (this.history.canUndo()) {
      const result = this.history.undo();
      if (result.ok) {
        this.updateUI();
        this.renderDocument(result.value);
      }
    }
  }
  
  redo() {
    if (this.history.canRedo()) {
      const result = this.history.redo();
      if (result.ok) {
        this.updateUI();
        this.renderDocument(result.value);
      }
    }
  }
  
  private updateUI() {
    // Enable/disable undo/redo buttons based on stack state
    const undoButton = document.getElementById('undo-btn');
    const redoButton = document.getElementById('redo-btn');
    
    if (undoButton) {
      undoButton.disabled = !this.history.canUndo();
    }
    if (redoButton) {
      redoButton.disabled = !this.history.canRedo();
    }
  }
  
  private renderDocument(document: SVGDocument) {
    // Render the document to the UI
    // ...
  }
  
  private showError(message: string) {
    // Show error to user
    console.error(message);
  }
}
```

## Key Points

1. **Immutability**: The HistoryManager maintains immutable document state. Each command execution returns a new document instance.

2. **Redo Invalidation**: Executing a new command after undo operations clears the redo stack. This is standard undo/redo behavior.

3. **Error Handling**: Commands that fail to execute are not added to the history. The document remains unchanged.

4. **Atomic Operations**: Use BatchCommand to group multiple operations into a single undo/redo unit.

5. **State Consistency**: The history manager ensures the document is always in a consistent state, even when commands fail.

6. **Performance**: The history manager uses efficient stack operations (O(1) for push/pop) and maintains a node index for fast lookups.
