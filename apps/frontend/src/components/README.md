# SVG Editor Components

This directory contains the Web Components that make up the SVG Editor application.

## Components

### `<svg-editor-app>` - Root Application Component

The main application shell that manages the overall layout and coordinates all panels.

**Features:**
- CSS Grid layout with 5 main areas:
  - Menu bar (top)
  - Hierarchy panel (left)
  - Canvas area (center)
  - Attribute inspector (right)
  - Raw SVG panel (bottom)
  - Tool palette (floating in canvas)

- **Resizable Panels**: Drag the dividers between panels to resize them
  - Hierarchy panel: 150px - 600px width
  - Inspector panel: 200px - 600px width
  - Raw SVG panel: 100px - 500px height

- **Layout Persistence**: Panel sizes are saved to localStorage and restored on reload

- **Theme Toggle**: Switch between light and dark themes via the menu bar

- **Keyboard Accessible**: All interactive elements support keyboard navigation

**Usage:**
```html
<svg-editor-app></svg-editor-app>
```

The component uses Shadow DOM for style encapsulation and automatically registers itself as a custom element.

**Implementation Details:**
- Built with vanilla TypeScript and Web Components API
- Uses CSS custom properties for theming (defined in `src/styles/main.css`)
- Implements drag-to-resize with mouse event handlers
- Persists state to localStorage for layout and theme preferences

**Testing:**
- Unit tests in `svg-editor-app.test.ts`
- Tests cover initialization, layout persistence, theme toggle, panel resizing, and accessibility

### `<svg-canvas>` - SVG Canvas Component ✅

The visual rendering area for SVG documents with interactive selection capabilities.

**Features:**
- **SVG Rendering**: Displays SVG documents from document state
- **Selection Indicators**: Visual outlines and handles for selected elements
- **Hover Effects**: Highlights elements on mouse hover
- **Mouse Interactions**: Click to select, Ctrl/Cmd+Click for multi-select
- **Reactive Updates**: Automatically updates when document or selection changes
- **Empty State**: Shows helpful message when no document is loaded

**Usage:**
```html
<svg-canvas></svg-canvas>
```

**Implementation Details:**
- Subscribes to document state signals for automatic updates
- Uses separate SVG overlay for selection indicators
- Clones SVG document to avoid modifying original
- Handles getBBox fallback for test environments
- Integrates with selection manager for cross-view sync

**Testing:**
- Unit tests in `svg-canvas.test.ts`
- Tests cover rendering, selection visuals, mouse interactions, and reactive updates
- 10 tests, all passing

**Requirements:** 1.1, 3.1  
**Task:** 8.1 ✅ Complete

## Future Components

The following components will be added in future tasks:

- `<svg-hierarchy-panel>` - Tree view of document structure
- `<svg-raw-panel>` - Text editor for raw SVG markup
- `<svg-attribute-inspector>` - Form-based attribute editing
- `<svg-tool-palette>` - Tool selection for creating primitives
- `<svg-menu-bar>` - File, edit, and view operations

## Development

To work on components:

1. Create a new component file: `component-name.ts`
2. Define the component class extending `HTMLElement`
3. Register it with `customElements.define('component-name', ComponentClass)`
4. Import it in `main.ts` to register it globally
5. Create tests in `component-name.test.ts`

## Architecture

Components follow these principles:

- **Web Components**: Use Custom Elements v1 API with Shadow DOM
- **Reactive Updates**: Subscribe to signals from the state management system
- **Accessibility**: ARIA labels, keyboard navigation, focus management
- **Theming**: Use CSS custom properties for all colors
- **Testing**: Unit tests for behavior, property tests for correctness properties
