# Frontend Editor

The main visual editor application for SVG Edit.

## Tech Stack
- **Web Components** - Custom Elements v1 API for component architecture
- **Reactive Signals** - Fine-grained reactive state management
- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling and dev server
- **Vitest** - Unit and property-based testing with fast-check

## Project Structure

```
apps/frontend/
├── src/
│   ├── components/     # Web Components (canvas, panels, tools)
│   ├── docs/           # Design and architecture docs (e.g. data-uuid, registry)
│   ├── state/          # Reactive signal-based state management
│   ├── utils/          # Utility functions and helpers
│   ├── workers/        # Web Workers for expensive operations
│   ├── styles/         # CSS files for theming and global styles
│   └── main.ts         # Application entry point
├── tests/
│   ├── unit/           # Unit tests for specific examples
│   ├── properties/     # Property-based tests with fast-check
│   └── e2e/            # End-to-end workflow tests
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build configuration
└── vitest.config.ts    # Vitest test configuration
```

## Getting Started

### Installation

```bash
# Install dependencies (from workspace root)
npm install
```

### Development

```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Run tests once
npm run test

# Run tests with coverage
npm run test:coverage

# Type check
npm run type-check
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Element Identification and Registry

Each SVG element in the editor is assigned a stable **`data-uuid`** attribute used for selection, attribute edits, and cross-panel sync.

- **Assignment:** The UUID is set when an element is created (e.g. by the tool palette) or when SVG is loaded (parser assigns one if missing).
- **Registry:** The **Element Registry** (`src/state/element-registry.ts`) keeps in-memory maps: `data-uuid` ↔ SVG element, `data-uuid` ↔ document tree node, and `id` ↔ `data-uuid`. All lookups by UUID or element are O(1).
- **Export:** The `data-uuid` attribute is stripped when saving or exporting SVG by default, so output stays clean; the serializer can optionally keep it (e.g. for tests).
- **Why:** Using `data-uuid` instead of relying only on `id` handles missing or non-unique `id`s and gives tests a stable selector that avoids UI overlays (e.g. selection handles).

For full details (maps, lifecycle, tests), see **[Data UUID and Registry](src/docs/DATA_UUID_AND_REGISTRY.md)**.

## Documentation

- **[Data UUID and Registry](src/docs/DATA_UUID_AND_REGISTRY.md)** — `data-uuid` attribute, Element Registry maps, and test usage.
- **[Selection performance](src/docs/SELECTION_PERFORMANCE_OPTIMIZATIONS.md)** — Selection and sync optimizations.
- Component-level notes live in `src/components/` (e.g. `HIERARCHY_PANEL_IMPLEMENTATION.md`, `TOOL_PALETTE_IMPLEMENTATION.md`).

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

## Testing

The project uses a dual testing approach:

### Unit Tests
- Specific examples and edge cases
- Located in `tests/unit/`
- Run with `npm run test`

### Property-Based Tests
- Universal properties using fast-check
- Located in `tests/properties/`
- Minimum 100 iterations per test
- Tagged with feature name and property number

### End-to-End Tests
- Complete user workflows
- Located in `tests/e2e/`
- Cover cross-view synchronization and undo/redo

## Architecture

The application follows a component-based architecture:

- **App Shell** - Root component managing layout and theme
- **Canvas Component** - Interactive SVG rendering
- **Hierarchy Panel** - Tree view of document structure
- **Raw SVG Panel** - Text editor for direct markup editing
- **Attribute Inspector** - Form-based attribute editing
- **Tool Palette** - Tool selection for creating primitives
- **Menu Bar** - File operations and settings

All components communicate through a centralized reactive state management system using signals.

## Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- File System Access API with fallback to download
- Web Workers for performance optimization
- Custom Elements v1 API
