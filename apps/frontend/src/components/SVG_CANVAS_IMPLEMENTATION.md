# SVG Canvas Component Implementation

## Overview

The `<svg-canvas>` component is a Web Component that renders SVG documents and provides interactive selection capabilities. It subscribes to the document state signal for automatic updates and implements visual selection indicators including outlines and handles.

**Task:** 8.1 Create canvas component with SVG rendering  
**Requirements:** 1.1, 3.1  
**Status:** ✅ Complete

## Features

### 1. SVG Document Rendering
- Renders SVG documents from the document state signal
- Automatically updates when document state changes
- Handles SVG with various dimension specifications (width/height, viewBox)
- Provides default dimensions (800x600) if none specified
- Shows empty state when no document is loaded

### 2. Selection Visual Indicators
- **Selection Outlines**: Dashed blue rectangles around selected elements
- **Selection Handles**: Corner handles for resize operations (visual only in this task)
- **Hover Outlines**: Orange dashed rectangles for hovered elements
- Automatically updates visuals when selection changes
- Supports multiple selected elements simultaneously

### 3. Mouse Event Handling
- **Click Selection**: Click on SVG elements to select them
- **Multi-Select**: Ctrl/Cmd+Click to add/remove from selection
- **Clear Selection**: Click on empty canvas to clear selection
- **Hover Effects**: Visual feedback when hovering over elements
- Only elements with IDs are selectable

### 4. Reactive State Integration
- Uses reactive effects to subscribe to document state changes
- Automatically syncs with selection manager
- Efficient updates - only re-renders when necessary
- Proper cleanup on component disconnect

## Architecture

### Component Structure

```
<svg-canvas>
  #shadow-root
    <style>...</style>
    <div class="canvas-container">
      <div class="svg-wrapper">
        <svg class="svg-content">
          <!-- Cloned SVG document -->
        </svg>
        <svg class="selection-overlay">
          <!-- Selection indicators -->
          <rect class="selection-outline" />
          <rect class="selection-handle" />
          <rect class="hover-outline" />
        </svg>
      </div>
    </div>
```

### State Dependencies

The canvas component depends on:
- `documentState.svgDocument` - The SVG document to render
- `documentState.selectedIds` - Set of selected element IDs
- `documentState.selectedElements` - Array of selected SVG elements
- `documentState.hoveredId` - ID of currently hovered element

### Selection Manager Integration

The canvas registers with the selection manager to participate in cross-view synchronization:
- Receives selection change events
- Updates visual indicators automatically through reactive effects
- Triggers selection changes through user interactions

## Implementation Details

### SVG Cloning

The component clones the SVG document before rendering to avoid modifying the original:

```typescript
const svgClone = doc.cloneNode(true) as SVGElement;
svgClone.classList.add('svg-content');
```

This ensures the document state remains immutable and prevents side effects.

### Selection Overlay

A separate SVG element is used as an overlay for selection indicators:

```typescript
private createSelectionOverlay(svgElement: SVGElement) {
  const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  overlay.classList.add('selection-overlay');
  // Match dimensions of main SVG
  // ...
}
```

This approach:
- Keeps selection visuals separate from document content
- Allows pointer-events: none for non-interactive indicators
- Simplifies adding/removing selection visuals

### Element Selection Logic

Elements are selectable only if they:
1. Are SVG elements (not the root `<svg>`)
2. Have an `id` attribute
3. Are not in the `<defs>` section (handled gracefully)

```typescript
private findSVGElement(target: HTMLElement): SVGElement | null {
  if (target instanceof SVGElement && target.tagName !== 'svg') {
    if (target.hasAttribute('id')) {
      return target;
    }
  }
  // Check parent elements...
}
```

### Bounding Box Calculation

Selection indicators use `getBBox()` to determine element bounds:

```typescript
const bbox = element.getBBox();
const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
outline.setAttribute('x', bbox.x.toString());
outline.setAttribute('y', bbox.y.toString());
outline.setAttribute('width', bbox.width.toString());
outline.setAttribute('height', bbox.height.toString());
```

Error handling is included for elements that don't support `getBBox()` (like `<defs>`).

## Usage Example

```typescript
import './components/svg-canvas';

// The canvas automatically connects to document state
const canvas = document.createElement('svg-canvas');
document.body.appendChild(canvas);

// Update document state to render SVG
import { documentStateUpdater } from './state/document-state';

const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('width', '400');
svg.setAttribute('height', '300');

const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
rect.setAttribute('id', 'rect1');
rect.setAttribute('x', '50');
rect.setAttribute('y', '50');
rect.setAttribute('width', '100');
rect.setAttribute('height', '100');
rect.setAttribute('fill', 'blue');
svg.appendChild(rect);

documentStateUpdater.setDocument(svg, [], '<svg>...</svg>');

// Canvas automatically renders the SVG
// Click on the rectangle to select it
// Selection indicators appear automatically
```

## Styling

The component uses CSS custom properties for theming:

- `--color-background` - Canvas background color
- `--color-primary` - Selection outline color
- `--color-accent` - Hover outline color
- `--color-on-surface-variant` - Empty state text color
- `--spacing-*` - Spacing values

## Testing

Comprehensive unit tests cover:

### Component Initialization
- ✅ Creates canvas element
- ✅ Has shadow root
- ✅ Renders canvas container
- ✅ Shows empty state when no document

### SVG Document Rendering
- ✅ Renders SVG when state updates
- ✅ Renders with correct dimensions
- ✅ Creates selection overlay
- ✅ Handles various dimension specifications

### Selection Visual Indicators
- ✅ Shows selection outline for selected elements
- ✅ Shows selection handles (4 corners)
- ✅ Removes visuals when selection cleared
- ✅ Supports multiple selected elements

### Reactive Updates
- ✅ Updates when document state changes
- ✅ Updates when selection state changes
- ✅ Cleans up effects on disconnect

### Edge Cases
- ✅ Handles elements without getBBox
- ✅ Handles elements without IDs
- ✅ Handles rapid selection changes

## Performance Considerations

1. **Cloning**: SVG is cloned once per update, not on every render
2. **Reactive Effects**: Fine-grained reactivity ensures only necessary updates
3. **Event Delegation**: Uses container-level event listeners
4. **Overlay Approach**: Selection visuals don't modify document DOM

## Future Enhancements

The following features are planned for future tasks:

1. **Drag-to-Move** (Task 15.4): Handle element dragging
2. **Resize Handles** (Task 15): Make handles interactive for resizing
3. **Transform Feedback** (Task 7.3): Visual feedback during transformations
4. **Zoom/Pan** (Future): Canvas navigation controls
5. **Grid/Guides** (Future): Alignment helpers

## Integration Points

### With Selection Manager (Task 7.1)
- ✅ Registers sync callbacks
- ✅ Triggers selection changes on user interaction
- ✅ Receives selection updates from other views

### With Document State (Task 6.1)
- ✅ Subscribes to document signal
- ✅ Subscribes to selection signals
- ✅ Subscribes to hover signal

### With SVG Editor App (Task 3.1)
- Ready to be integrated into canvas area
- Replaces placeholder content
- Fits within existing layout system

## Known Limitations

1. **Read-Only**: This task implements rendering and selection only, not editing
2. **No Transform Tools**: Resize handles are visual only
3. **No Drag-to-Move**: Element movement is implemented in Task 15.4
4. **Basic Selection**: No marquee selection or lasso tools
5. **No Zoom/Pan**: Canvas is scrollable but not zoomable

## Accessibility

- Semantic HTML structure
- Keyboard navigation support (planned for Task 17)
- ARIA labels for interactive elements (planned)
- Focus management (planned)
- Screen reader announcements (planned)

## Browser Compatibility

- ✅ Modern browsers with Web Components support
- ✅ Shadow DOM v1
- ✅ SVG 1.1 / SVG 2
- ✅ ES2020+ JavaScript features

## Related Files

- `apps/frontend/src/components/svg-canvas.ts` - Component implementation
- `apps/frontend/src/components/svg-canvas.test.ts` - Unit tests
- `apps/frontend/src/state/document-state.ts` - Document state management
- `apps/frontend/src/state/selection-manager.ts` - Selection coordination
- `apps/frontend/src/state/signals.ts` - Reactive primitives

## Validation

✅ **Requirement 1.1**: Canvas area displays SVG content  
✅ **Requirement 3.1**: Selection in canvas syncs to other views  
✅ **Task 8.1**: Canvas component with SVG rendering complete  

The canvas component successfully renders SVG documents, handles user selection interactions, and provides visual feedback through selection indicators. It integrates seamlessly with the reactive state management system and selection manager for cross-view synchronization.
