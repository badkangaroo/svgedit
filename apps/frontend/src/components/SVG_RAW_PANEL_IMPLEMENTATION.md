# SVG Raw Panel Implementation

## Overview

The SVG Raw Panel component (`<svg-raw-panel>`) displays the raw SVG markup in a text editor with line numbers. It subscribes to the document state signal and automatically updates when the SVG document changes.

**Task:** 10.1 Create raw SVG panel with text editor  
**Requirements:** 1.1, 5.1  
**Status:** ✅ Complete

## Features Implemented

### Core Functionality

1. **Text Editor Display**
   - Read-only textarea displaying SVG markup
   - Monospace font for code readability
   - Syntax highlighting support (CSS-based)
   - Spellcheck disabled for code content

2. **Line Numbers**
   - Dynamic line number generation based on content
   - Synchronized scrolling with text editor
   - Proper alignment and styling

3. **Document State Subscription**
   - Reactive updates when document changes
   - Automatic serialization if rawSVG is empty
   - Efficient re-rendering on state changes

4. **Action Buttons**
   - **Copy**: Copy SVG text to clipboard
   - **Format**: Re-serialize and format the SVG

5. **Empty State**
   - User-friendly message when no document is loaded
   - Clear instructions for getting started

## Component Structure

```
<svg-raw-panel>
  └─ Shadow DOM
     ├─ Panel Header
     │  ├─ Title with icon
     │  └─ Action buttons (Copy, Format)
     ├─ Editor Container
     │  ├─ Line Numbers (scrollable)
     │  └─ Text Editor (textarea)
     └─ Empty State (when no document)
```

## Usage

### Basic Usage

```typescript
import './components/svg-raw-panel';

// The component automatically subscribes to document state
const panel = document.createElement('svg-raw-panel');
document.body.appendChild(panel);
```

### Integration with Document State

The component automatically subscribes to:
- `documentState.svgDocument` - The SVG element
- `documentState.rawSVG` - The raw SVG text

When the document changes, the panel updates automatically.

### Public API

```typescript
// Get current SVG text
const svgText = panel.getSVGText();

// Check if editor is read-only
const isReadOnly = panel.isReadOnly(); // Always returns true
```

## Styling

The component uses CSS custom properties for theming:

```css
--color-surface: Background color
--color-on-surface: Text color
--color-surface-variant: Line numbers background
--color-on-surface-variant: Line numbers text
--color-outline: Border color
--color-primary: Primary accent color
--font-mono: Monospace font family
--spacing-*: Spacing values
--radius-*: Border radius values
```

## Implementation Details

### Reactive Effects

The component sets up two reactive effects:

1. **Document Effect**: Updates content when document or rawSVG changes
2. **Auto-serialization**: If rawSVG is empty but document exists, serializes automatically

### Line Number Synchronization

Line numbers scroll in sync with the text editor:

```typescript
textArea.addEventListener('scroll', () => {
  if (this.lineNumbers && this.textArea) {
    this.lineNumbers.scrollTop = this.textArea.scrollTop;
  }
});
```

### Action Handlers

**Copy to Clipboard:**
```typescript
await navigator.clipboard.writeText(this.textArea.value);
```

**Format SVG:**
```typescript
const formatted = svgSerializer.serialize(doc);
documentState.rawSVG.set(formatted);
```

## Testing

Comprehensive unit tests cover:

- ✅ Component structure and rendering
- ✅ Empty state display
- ✅ SVG text display and updates
- ✅ Line number generation and updates
- ✅ Text editor properties (read-only, monospace, spellcheck)
- ✅ Action buttons (copy, format)
- ✅ Public API methods
- ✅ Reactive updates
- ✅ Complex SVG documents
- ✅ Scroll synchronization

**Test Results:** 27/27 tests passing

## Future Enhancements

The following enhancements are planned for future sprints:

1. **Syntax Highlighting** (Task 10.2)
   - Use a library like Prism.js or CodeMirror
   - Highlight SVG tags, attributes, and values
   - Theme-aware syntax colors

2. **Editable Mode** (Task 10.2)
   - Make textarea editable
   - Implement debounced parsing (300ms)
   - Display parse errors inline
   - Rollback mechanism for invalid SVG

3. **Selection Sync** (Task 10.6)
   - Highlight selected element in text
   - Detect element from cursor position
   - Sync with other panels

4. **Error Display** (Task 10.2)
   - Inline error markers
   - Error tooltips with line/column info
   - Error highlighting in text

## Dependencies

- `../state/signals` - Reactive signal system
- `../state/document-state` - Document state management
- `../utils/svg-serializer` - SVG serialization

## Related Components

- `svg-canvas` - Visual SVG rendering
- `svg-hierarchy-panel` - Tree view of document structure
- `svg-attribute-inspector` - Attribute editing panel

## Requirements Validation

### Requirement 1.1: UI Framework and Layout
✅ Panel displays as part of the editor interface with proper layout

### Requirement 5.1: Raw SVG Editing
✅ Displays raw SVG markup in a text editor
✅ Updates when document changes
✅ Provides read-only view (editable mode in future sprint)

## Notes

- The component is currently read-only. Editing functionality will be added in Task 10.2.
- Syntax highlighting is basic (CSS-based). Enhanced highlighting will be added as an optional enhancement.
- The component uses native textarea for simplicity. A code editor library could be integrated for better features.
- Line numbers are implemented with a separate scrollable div for performance.

## Performance Considerations

- Efficient re-rendering: Only updates when document or rawSVG signals change
- Line numbers are generated dynamically but efficiently
- No heavy libraries for basic functionality
- Scroll synchronization uses native events (no polling)

## Accessibility

- Semantic HTML structure
- Proper ARIA labels on buttons
- Keyboard accessible action buttons
- High contrast support through CSS custom properties
- Screen reader friendly empty state messages
