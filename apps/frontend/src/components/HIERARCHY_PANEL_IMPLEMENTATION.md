# SVG Hierarchy Panel Implementation

## Overview

The SVG Hierarchy Panel (`<svg-hierarchy-panel>`) is a Web Component that displays the SVG document structure as an interactive tree view. It provides users with a clear visualization of the document hierarchy and enables selection of elements through the tree interface.

## Features

### Core Functionality

1. **Tree View Display**
   - Displays SVG document structure as a hierarchical tree
   - Shows element tag names and IDs
   - Uses appropriate icons for different element types
   - Supports nested structures with proper indentation

2. **Expand/Collapse**
   - Interactive toggle buttons for nodes with children
   - Expand/collapse individual nodes
   - Public methods for expand all / collapse all
   - Maintains expand state during updates

3. **Selection Highlighting**
   - Highlights selected nodes with distinct styling
   - Supports multi-selection visualization
   - Auto-expands parent nodes to reveal selected children
   - Synchronizes with selection manager

4. **Reactive Updates**
   - Subscribes to document state signals
   - Automatically updates when document changes
   - Automatically updates when selection changes
   - Efficient re-rendering

## Architecture

### Component Structure

```
<svg-hierarchy-panel>
  └─ Shadow DOM
     ├─ .hierarchy-header (title)
     └─ .hierarchy-container
        └─ .tree-node (for each node)
           ├─ .node-content
           │  ├─ .expand-toggle (▶)
           │  ├─ .node-icon (emoji)
           │  └─ .node-label
           │     ├─ .node-tag (<tagName>)
           │     └─ .node-id (#id)
           └─ .node-children (nested nodes)
```

### State Management

The component uses reactive signals from the document state:

- **documentTree**: Array of DocumentNode objects representing the tree structure
- **selectedIds**: Set of selected element IDs
- **expandedNodes**: Internal Set tracking which nodes are expanded

### Integration Points

1. **Document State**: Subscribes to `documentState.documentTree` for tree updates
2. **Selection Manager**: Subscribes to `documentState.selectedIds` for selection updates
3. **User Interactions**: Dispatches selection changes through `selectionManager`

## Usage

### Basic Usage

```typescript
import './svg-hierarchy-panel';

// The component automatically registers itself
const panel = document.createElement('svg-hierarchy-panel');
document.body.appendChild(panel);
```

### Integration with Editor

```html
<div class="hierarchy-panel">
  <svg-hierarchy-panel></svg-hierarchy-panel>
</div>
```

### Programmatic Control

```typescript
const panel = document.querySelector('svg-hierarchy-panel');

// Expand all nodes
panel.expandAll();

// Collapse all nodes
panel.collapseAll();
```

## Implementation Details

### Node Icons

The component uses emoji icons to represent different SVG element types:

| Element Type | Icon | Description |
|-------------|------|-------------|
| svg | 📄 | Root SVG element |
| g | 📁 | Group element |
| rect | ▭ | Rectangle |
| circle | ⭕ | Circle |
| ellipse | ⬭ | Ellipse |
| line | ─ | Line |
| path | ✏️ | Path |
| text | 📝 | Text |
| image | 🖼️ | Image |
| defs | 📦 | Definitions |
| use | 🔗 | Use reference |
| symbol | 🔣 | Symbol |
| default | • | Other elements |

### Expand/Collapse Logic

1. **Toggle Button**: Only shown for nodes with children
2. **State Tracking**: Expanded state stored in `expandedNodes` Set
3. **Visual Indicator**: Rotated arrow (▶ → ▼) when expanded
4. **Children Display**: `.node-children` shown/hidden with CSS classes

### Selection Synchronization

1. **Click Handler**: Clicking a node selects it via `selectionManager.select()`
2. **Ctrl/Cmd+Click**: Toggles selection via `selectionManager.toggleSelection()`
3. **Auto-Expand**: When a child node is selected, parent nodes auto-expand
4. **Visual Feedback**: Selected nodes get `.selected` class with distinct styling

### Performance Considerations

- **Efficient Re-rendering**: Only updates when signals change
- **Event Delegation**: Could be improved with event delegation for large trees
- **Virtual Scrolling**: Not yet implemented (planned for Task 9.2)

## Styling

### CSS Custom Properties

The component uses CSS custom properties for theming:

```css
--color-surface          /* Background color */
--color-on-surface       /* Text color */
--color-on-surface-variant /* Secondary text color */
--color-primary          /* Selection accent color */
--color-primary-container /* Selection background */
--color-surface-variant  /* Hover background */
--color-outline          /* Border color */
--spacing-*              /* Spacing values */
--radius-*               /* Border radius values */
--transition-fast        /* Transition duration */
--font-mono              /* Monospace font */
```

### Key Styles

- **Selected Node**: Blue background with left border accent
- **Hover State**: Subtle background color change
- **Expand Toggle**: Rotates 90° when expanded
- **Indentation**: 24px per level (via padding-left)

## Testing

### Test Coverage

The component has comprehensive unit tests covering:

1. **Component Rendering**
   - Shadow DOM creation
   - Header display
   - Empty state

2. **Document Tree Display**
   - Single node
   - Multiple nodes
   - Nested structures
   - Different element types

3. **Expand/Collapse Functionality**
   - Toggle interaction
   - Expand all / collapse all
   - Empty toggle for leaf nodes

4. **Selection Highlighting**
   - Single selection
   - Multi-selection
   - Selection clearing
   - Auto-expand parents

5. **User Interactions**
   - Click to select
   - Ctrl+click to toggle
   - Selection replacement

6. **Reactive Updates**
   - Document changes
   - Selection changes

7. **Edge Cases**
   - Empty tree
   - Deeply nested tree
   - Nodes without IDs

### Running Tests

```bash
npm test -- svg-hierarchy-panel.test.ts
```

## Requirements Validation

This implementation satisfies the following requirements:

### Requirement 1.1: UI Framework and Layout
✅ The hierarchy panel is displayed as part of the editor interface

### Requirement 3.2: Selection Synchronization
✅ When a user selects a node in the Hierarchy Panel, the Editor highlights the corresponding element in the Canvas, Raw SVG Panel, and Attribute Inspector

## Future Enhancements

### Task 9.2: Virtual Scrolling
- Implement virtual scrolling for documents with > 1000 nodes
- Only render visible nodes for performance
- Maintain scroll position during updates

### Additional Features
- Drag-and-drop reordering
- Context menu for node operations
- Search/filter functionality
- Keyboard navigation (arrow keys)
- Copy/paste node IDs
- Show/hide specific node types

## Related Components

- **SVGCanvas**: Displays visual representation of selected elements
- **SelectionManager**: Manages selection state across all views
- **DocumentState**: Provides reactive document tree data

## API Reference

### Public Methods

#### `expandAll(): void`
Expands all nodes in the tree that have children.

```typescript
panel.expandAll();
```

#### `collapseAll(): void`
Collapses all nodes in the tree.

```typescript
panel.collapseAll();
```

### Events

The component doesn't emit custom events. It uses the `selectionManager` for selection changes, which triggers reactive updates across all views.

### Properties

The component doesn't expose public properties. It reads state from the global `documentState` signals.

## Troubleshooting

### Issue: Tree not updating
**Solution**: Ensure document state is being updated via `documentStateUpdater.updateDocumentTree()`

### Issue: Selection not highlighting
**Solution**: Ensure elements have unique IDs and selection is set via `selectionManager.select()`

### Issue: Expand/collapse not working
**Solution**: Check that nodes have children and click events are not being prevented

### Issue: Styles not applying
**Solution**: Verify CSS custom properties are defined in the theme system

## Changelog

### Version 1.0.0 (Task 9.1)
- Initial implementation
- Tree view display
- Expand/collapse functionality
- Selection highlighting
- Reactive updates
- Comprehensive unit tests
