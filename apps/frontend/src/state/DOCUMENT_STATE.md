# Document State Model

The document state model provides centralized, reactive state management for the SVG editor's document, selection, and related data.

## Overview

The document state uses the reactive signal system to manage:
- **SVG Document**: The actual SVG DOM element
- **Document Tree**: A structured representation of the SVG document
- **Raw SVG**: The text representation of the SVG
- **Selection**: Currently selected element IDs
- **Hover State**: Currently hovered element ID

All state is reactive, meaning changes automatically propagate to subscribed components.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Document State                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Signals (Mutable State):                              │
│  • svgDocument: Signal<SVGElement | null>              │
│  • documentTree: Signal<DocumentNode[]>                │
│  • rawSVG: Signal<string>                              │
│  • selectedIds: Signal<Set<string>>                    │
│  • hoveredId: Signal<string | null>                    │
│                                                         │
│  Computed (Derived State):                             │
│  • hasSelection: Computed<boolean>                     │
│  • selectionCount: Computed<number>                    │
│  • selectedElements: Computed<SVGElement[]>            │
│  • selectedNodes: Computed<DocumentNode[]>             │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Updates via
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Document State Updater                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Document Operations:                                   │
│  • setDocument(doc, tree, svg)                         │
│  • updateDocumentTree(tree)                            │
│  • updateRawSVG(svg)                                   │
│  • clearDocument()                                     │
│                                                         │
│  Selection Operations:                                  │
│  • select(ids)                                         │
│  • addToSelection(ids)                                 │
│  • removeFromSelection(ids)                            │
│  • clearSelection()                                    │
│  • toggleSelection(id)                                 │
│  • setHoveredId(id)                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Usage

### Importing

```typescript
import {
  documentState,
  documentStateUpdater,
} from './state';
```

### Reading State

```typescript
// Get current document
const doc = documentState.svgDocument.get();

// Get document tree
const tree = documentState.documentTree.get();

// Get raw SVG text
const svg = documentState.rawSVG.get();

// Get selected IDs
const selectedIds = documentState.selectedIds.get();

// Check if anything is selected
const hasSelection = documentState.hasSelection.get();

// Get count of selected elements
const count = documentState.selectionCount.get();

// Get selected SVG elements
const elements = documentState.selectedElements.get();

// Get selected document nodes
const nodes = documentState.selectedNodes.get();
```

### Updating State

```typescript
// Set complete document state
documentStateUpdater.setDocument(svgElement, documentTree, rawSVGText);

// Update just the tree
documentStateUpdater.updateDocumentTree(newTree);

// Update just the raw SVG
documentStateUpdater.updateRawSVG(newSVGText);

// Clear everything
documentStateUpdater.clearDocument();

// Select elements
documentStateUpdater.select(['rect1', 'circle1']);

// Add to selection
documentStateUpdater.addToSelection(['ellipse1']);

// Remove from selection
documentStateUpdater.removeFromSelection(['rect1']);

// Clear selection
documentStateUpdater.clearSelection();

// Toggle selection
documentStateUpdater.toggleSelection('rect1');

// Set hovered element
documentStateUpdater.setHoveredId('circle1');
```

### Reactive Updates with Effects

```typescript
import { effect } from './state';

// React to selection changes
effect(() => {
  const selectedIds = documentState.selectedIds.get();
  console.log('Selection changed:', selectedIds);
  // Update UI to reflect selection
});

// React to document changes
effect(() => {
  const doc = documentState.svgDocument.get();
  if (doc) {
    console.log('Document loaded');
    // Update canvas rendering
  }
});

// React to computed values
effect(() => {
  const count = documentState.selectionCount.get();
  console.log(`${count} element(s) selected`);
  // Update status bar
});
```

## API Reference

### DocumentState Interface

```typescript
interface DocumentState {
  // Document signals
  svgDocument: Signal<SVGElement | null>;
  documentTree: Signal<DocumentNode[]>;
  rawSVG: Signal<string>;
  
  // Selection signals
  selectedIds: Signal<Set<string>>;
  hoveredId: Signal<string | null>;
  
  // Computed values
  hasSelection: Computed<boolean>;
  selectionCount: Computed<number>;
  selectedElements: Computed<SVGElement[]>;
  selectedNodes: Computed<DocumentNode[]>;
}
```

### DocumentStateUpdater Interface

```typescript
interface DocumentStateUpdater {
  // Document updates
  setDocument(doc: SVGElement | null, tree: DocumentNode[], svg: string): void;
  updateDocumentTree(tree: DocumentNode[]): void;
  updateRawSVG(svg: string): void;
  clearDocument(): void;
  
  // Selection updates
  select(ids: string[]): void;
  addToSelection(ids: string[]): void;
  removeFromSelection(ids: string[]): void;
  clearSelection(): void;
  toggleSelection(id: string): void;
  setHoveredId(id: string | null): void;
}
```

## Design Decisions

### Why Signals?

Signals provide fine-grained reactivity, meaning only components that depend on changed values will update. This is more efficient than coarse-grained reactivity where entire component trees re-render.

### Why Computed Values?

Computed values automatically derive state from other signals and cache their results. They only recalculate when their dependencies change, avoiding unnecessary work.

### Why a Global Instance?

The document state is a singleton because:
1. There's only one document being edited at a time
2. Multiple components need to access the same state
3. It simplifies the API (no need to pass state through props)

### Why Separate Updater?

The updater provides a clean API for state mutations and:
1. Encapsulates update logic
2. Makes it easy to add validation or side effects
3. Provides a clear contract for state changes

## Integration with Components

### Canvas Component

```typescript
import { documentState, documentStateUpdater } from '../state';
import { effect } from '../state';

class SVGCanvas extends HTMLElement {
  connectedCallback() {
    // React to document changes
    effect(() => {
      const doc = documentState.svgDocument.get();
      this.renderDocument(doc);
    });
    
    // React to selection changes
    effect(() => {
      const selectedIds = documentState.selectedIds.get();
      this.updateSelectionVisuals(selectedIds);
    });
  }
  
  handleClick(event: MouseEvent) {
    const element = event.target as SVGElement;
    const id = element.getAttribute('id');
    if (id) {
      documentStateUpdater.select([id]);
    }
  }
}
```

### Hierarchy Panel

```typescript
import { documentState, documentStateUpdater } from '../state';
import { effect } from '../state';

class HierarchyPanel extends HTMLElement {
  connectedCallback() {
    // React to tree changes
    effect(() => {
      const tree = documentState.documentTree.get();
      this.renderTree(tree);
    });
    
    // React to selection changes
    effect(() => {
      const selectedIds = documentState.selectedIds.get();
      this.highlightNodes(selectedIds);
    });
  }
  
  handleNodeClick(nodeId: string) {
    documentStateUpdater.select([nodeId]);
  }
}
```

### Attribute Inspector

```typescript
import { documentState, documentStateUpdater } from '../state';
import { effect } from '../state';

class AttributeInspector extends HTMLElement {
  connectedCallback() {
    // React to selection changes
    effect(() => {
      const nodes = documentState.selectedNodes.get();
      if (nodes.length === 1) {
        this.displayAttributes(nodes[0]);
      } else if (nodes.length > 1) {
        this.displayMultipleSelection(nodes);
      } else {
        this.displayNoSelection();
      }
    });
  }
}
```

## Performance Considerations

### Computed Value Caching

Computed values are cached and only recalculate when dependencies change:

```typescript
// This is efficient - only recalculates when selectedIds changes
const count = documentState.selectionCount.get();
```

### Batch Updates

When making multiple related updates, consider batching them:

```typescript
import { batch } from './state';

batch(() => {
  documentStateUpdater.updateDocumentTree(newTree);
  documentStateUpdater.updateRawSVG(newSVG);
  documentStateUpdater.select(['rect1']);
});
```

### Peek Without Tracking

Use `peek()` to read values without creating dependencies:

```typescript
effect(() => {
  // This won't re-run when selectedIds changes
  const ids = documentState.selectedIds.peek();
  console.log('Initial selection:', ids);
});
```

## Testing

The document state model includes comprehensive unit tests covering:

- Initial state
- Document updates
- Selection updates
- Computed values
- Reactivity
- Edge cases

Run tests with:

```bash
npm test -- document-state.test.ts
```

## Requirements Validation

This implementation satisfies the following requirements:

- **3.1-3.5**: Selection synchronization across views (via reactive signals)
- **4.1**: Attribute display (via selectedNodes computed value)

The document state model provides the foundation for cross-view synchronization by ensuring all components observe the same reactive state.

## Future Enhancements

Potential improvements:

1. **Undo/Redo Integration**: Track state changes for history
2. **Validation**: Add validation to state updates
3. **Persistence**: Auto-save state to local storage
4. **Middleware**: Add hooks for logging, debugging, or analytics
5. **Transactions**: Support atomic multi-state updates
6. **Snapshots**: Create and restore state snapshots

## Related Files

- `signals.ts` - Reactive signal system implementation
- `signals.test.ts` - Signal system tests
- `document-state.test.ts` - Document state tests
- `../types.ts` - Type definitions for DocumentNode, etc.
