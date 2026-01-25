# SVG Edit

A modern, browser-based SVG editor that rethinks 2D editing from the ground up. Built for developers, designers, and creators who want clean, optimized SVG files without the bloat of traditional design tools.

## Philosophy

SVG Edit breaks away from the conventions of traditional design tools to offer a fresh, streamlined approach:

- **Code-first mindset**: Direct manipulation of SVG structure alongside visual editing.
- **Performance-focused**: Every feature designed to produce lean, optimized output.
- **Web-native**: Built for the browser, leveraging modern web standards.
- **Clarity over complexity**: Intuitive tools that don't hide behind layers of menus.

```
+------------------------------------+
| menu bar                           |
+------------------------+-----------+
| edit view              | svg info  |
|                        | hierarchy/|
| (Visual Canvas)        | raw text  |
|                        +-----------+
|                        | element   |
|                        | attribute |
|                        | editor    |
+------------------------+-----------+
| tools (Plugin System)              |
+------------------------------------+
```

## Architecture & Technology Stack

To ensure scalability, testability, and perfect synchronization between views, SVG Edit employs a modern, reactive, framework-light architecture.

### Core Stack
- **TypeScript**: For type safety, maintainability, and easier refactoring while still shipping plain JavaScript.
- **Web Components**: Modular, framework-agnostic UI building blocks for the canvas, hierarchy, code view, and panels.
- **Monorepo Structure**: Separates concerns into distinct packages (Core Engine, UI, Backend, Tools/Plugins).
- **Vite**: Next-generation frontend tooling for instant feedback, fast HMR, and code-splitting.
- **SVG + Canvas**: SVG for the actual document, with optional Canvas overlays for guides, selection boxes, and helpers.
- **Web Workers**: Offload heavy tasks (SVGO, path simplification, batch transforms) for a responsive UI.
- **File System Access API**: Native-like open/save where supported, with graceful fallbacks.

### State Management & Sync
- **Single Source of Truth**: A central document store holds the SVG model, selection, viewport, tool settings, and history.
- **Unidirectional Data Flow**: Views dispatch actions/commands (e.g. `ADD_RECT`, `UPDATE_NODE_ATTR`, `SET_SELECTION`, `UNDO`), the store updates, and views re-render from the updated state.
- **View Projections**: The visual canvas, hierarchy tree, raw code editor, and attribute inspector each subscribe only to the slices of state they need, keeping all views in perfect sync.

### Extensibility Pattern
- **Command Pattern**: All document changes (create, move, delete, style, optimize) are encapsulated as command objects with `execute()` and `undo()` methods, powering robust undo/redo and deterministic behavior.
- **Tool & Plugin System**: Tools (Pen, Rect, Select, Cleanup, Optimize, etc.) implement a common interface and communicate only via the command/store APIs. New tools or panels can be added without modifying the core engine.
- **Stable Plugin API**: A small, documented surface (register tools, panels, commands, and react to editor events) keeps extensions powerful but isolated from internal implementation details.

### Testing Strategy
- **Vitest**: Fast unit testing for the core engine (math, geometry, commands, selection, transforms) in a Node-like environment.
- **Playwright/Cypress**: End-to-end testing for editor interactions across views (canvas, hierarchy, code, attributes) to guarantee synchronization and undo/redo correctness.

## Project Structure

The project is organized as a monorepo to handle the various components:

- **/packages/core**: Headless SVG manipulation logic, math helpers, and Command definitions. (Framework agnostic).
- **/apps/frontend**: The main editor application using Web Components.
- **/apps/dashboard**: Project manager and file browser.
- **/apps/backend**: API for persistence, collaboration, and export services.

## Core Features

### Cleanup Tools
Remove the cruft that export tools leave behind:
- Strip unused definitions, groups, and attributes
- Normalize poorly configured ViewBox settings
- Merge redundant transforms and simplify nested groups
- Remove invisible or duplicate elements
- Clean up metadata and comments

### Transform Tools
Precise control over element positioning and manipulation:
- Visual transform controls with numeric input
- Matrix decomposition and recomposition
- Batch transformations across multiple elements
- Transform origin manipulation
- Coordinate system normalization

### Optimize Tools
Reduce file size and improve rendering performance:
- Path simplification and optimization
- Decimal precision control
- Color palette reduction
- Attribute minification
- SVGO integration with custom presets

### Info Panel
Real-time insights into your SVG:
- File size metrics (before/after)
- Element count and hierarchy visualization
- Unused definition detection
- Accessibility audit
- Performance recommendations

## Edit Palette

A focused set of creation and editing tools:

**Primitives**
- Rectangle, Circle, Ellipse, Line, Polygon, Polyline
- Direct attribute editing alongside visual manipulation

**Path Tools**
- Pen tool with bezier curve support
- Node editing (add, remove, convert, align)
- Path operations (union, subtract, intersect, divide)
- Simplify and smooth operations

**Selection & Manipulation**
- Multi-select with group operations
- Alignment and distribution tools
- Z-index management
- Clone and duplicate with smart naming

## Design Principles

1. **Transparency**: Always make the underlying SVG structure visible and editable.
2. **Non-destructive**: Every change is expressed as a reversible command with full undo/redo history.
3. **Keyboard-first**: Rich keyboard shortcuts for power users and fast workflows.
4. **Responsive**: Designed primarily for desktop, with layouts and interactions that also work on tablets.
5. **Extensible**: A plugin-oriented architecture for custom tools, panels, and automation.

## Use Cases

- Clean up exported SVG files from design tools.
- Hand-craft icons and illustrations with precise control.
- Optimize SVG assets for web performance and accessibility.
- Learn SVG structure by editing code and visuals side-by-side.
- Batch process multiple files with consistent cleanup/optimization settings.

## Roadmap

Native SVG animation tools are planned, including:
- Timeline editing for attributes and transforms.
- Keyframe-based animation with easing controls.
- Motion paths and path-based interpolation.
- Preview and export of declarative SVG animations.

---

**Status**: In active development
**License**: MIT
**Contributions**: Welcome

## Planning & Milestones

Short, observable sprints (1-2 weeks each) with checkpoints that map to the
app/package READMEs below.

### Sprint 1 - Basic UI framework and theming
- Checkpoint: editor shell layout (menu, canvas, panels) renders in `apps/frontend`.
- Checkpoint: shared theme tokens with light/dark toggle and documented palette.
- Checkpoint: contrast targets met (>= 4.5:1 for body text) on key screens.

### Sprint 2 - View coordination across editor panels
- Checkpoint: selection syncs between canvas, hierarchy, raw text, and attributes.
- Checkpoint: attribute edits reflect in raw SVG text within 100ms for 1k nodes.
- Checkpoint: raw SVG edits re-parse with error surfacing and safe rollback.

### Sprint 3 - Core editing flows
- Checkpoint: create, move, and delete primitives with undo/redo.
- Checkpoint: open/save works via browser download and File System Access API.
- Checkpoint: history and selection state persist across view switches.

### Sprint 4 - Performance and reliability
- Checkpoint: open 1k-node SVG and keep selection updates under 200ms.
- Checkpoint: long-running tasks run in web workers with progress UI.
- Checkpoint: E2E tests cover cross-view sync and undo/redo invariants.
