# Frontend Editor

The main visual editor application.

## Tech Stack
- Web Components
- Reactive Signals for state management
- Canvas/SVG rendering

## Planning & Checkpoints

Short sprints with observable results aligned to the main roadmap.

### Sprint 1 - Basic UI framework and theming
- Checkpoint: editor shell layout (menu, canvas, inspectors, tools).
- Checkpoint: theme tokens with light/dark toggle and palette docs.
- Checkpoint: readability pass meets 4.5:1 contrast for body text.

### Sprint 2 - View coordination across panels
- Checkpoint: selection syncs across canvas, hierarchy, raw SVG, attributes.
- Checkpoint: attribute edits update raw SVG text within 100ms for 1k nodes.
- Checkpoint: raw SVG edits re-parse with error surface and safe rollback.

### Sprint 3 - Core editing flows
- Checkpoint: create/move/delete primitives with undo/redo.
- Checkpoint: keyboard shortcuts for selection, delete, and undo/redo.
- Checkpoint: open/save via browser download and File System Access API.

### Sprint 4 - Performance and stability
- Checkpoint: large SVGs remain interactive (< 200ms selection updates).
- Checkpoint: expensive operations run in workers with progress UI.
- Checkpoint: E2E tests cover cross-view sync and undo/redo.
