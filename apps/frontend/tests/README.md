# SVG Editor Testing

## Overview

This directory contains automated tests for the SVG Editor application. Tests are organized by type and use multiple testing tools to ensure comprehensive coverage.

## Quick Start

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test test-svg-loading

# Run Playwright E2E tests (after installing)
npx playwright test
```

## Test Structure

```
tests/
├── e2e/                          # End-to-end tests
│   ├── playwright/               # Playwright browser E2E tests
│   │   ├── svg-editor.spec.ts   # App load, panels, theme, resize
│   │   ├── element-selection.spec.ts   # Canvas click, multi-select, sync ✅
│   │   ├── attribute-editing.spec.ts   # Inspector edits, validation ✅
│   │   ├── tool-palette.spec.ts        # Tools, primitives, preview ✅
│   │   ├── hierarchy-panel.spec.ts     # Tree select, expand/collapse ✅
│   │   ├── drag-operations.spec.ts     # Drag to move, sync ✅
│   │   ├── keyboard-shortcuts.spec.ts  # Shortcuts (V, R, C, E, L, file) ✅
│   │   ├── file-operations.spec.ts     # Menu, New, Save, Save As ✅
│   │   └── *-helpers.spec.ts    # Helper unit tests
│   ├── test-svg-loading.test.ts # test.svg loading tests ✅
│   └── sprint2-checkpoint.test.ts
├── helpers/                      # Shared E2E/unit helpers
│   ├── selection-helpers.ts     # selectElement, verifySelectionSync ✅
│   ├── attribute-helpers.ts     # editAttribute, verifyAttributeValue ✅
│   ├── tool-helpers.ts          # selectTool, drawPrimitive, getLastCreatedElementUUID ✅
│   ├── drag-helpers.ts          # dragElement, getElementPosition ✅
│   ├── svg-helpers.ts           # loadSVGContent, loadTestSVG ✅
│   └── test-data-generators.ts  # generateTestSVG, generateLargeSVG ✅
├── unit/                         # Unit tests for helpers and components
│   └── ...
├── properties/                   # Property-based tests
│   └── example.properties.test.ts
├── utils/                        # Test utilities
│   └── test-svg-loader.ts       # Helper for loading test.svg ✅
├── setup.ts                      # Global test setup
├── vitest.d.ts                   # TypeScript definitions
├── UI_TESTING_SPEC.md            # Comprehensive testing spec ✅
├── UI_TESTING_SETUP.md           # Setup guide ✅
└── README.md                     # This file
```

## Testing Tools

### Current Stack
- **Vitest**: Fast unit test runner with jsdom
- **jsdom**: DOM environment for component testing
- **fast-check**: Property-based testing

### Recommended Additions
- **Playwright**: Real browser E2E testing (see setup guide)
- **Testing Library**: User-centric component testing

## Test Coverage

### ✅ Implemented Tests

#### test.svg Loading (`test-svg-loading.test.ts`)
- ✅ Load test.svg from filesystem (20 tests passing)
- ✅ Parse SVG content without errors
- ✅ Create document tree (81 nodes)
- ✅ Element selection (single and multi-select)
- ✅ Performance benchmarks:
  - Parse time: ~10ms (target: <500ms) ✅
  - Load time: ~0.08ms (target: <100ms) ✅
  - Selection time: ~4ms (target: <50ms) ✅
- ✅ Advanced features (gradients, masks, clips, patterns, transforms)

#### Sprint 2 Checkpoint (`sprint2-checkpoint.test.ts`)
- ✅ Selection synchronization
- ✅ Attribute editing performance
- ✅ Raw SVG parsing with error handling

#### Playwright E2E (`playwright/*.spec.ts`)
- ✅ Application loading, panels, theme, resize (`svg-editor.spec.ts`)
- ✅ Element selection: canvas click, multi-select, sync (`element-selection.spec.ts`)
- ✅ Attribute editing: numeric/color, validation, rollback (`attribute-editing.spec.ts`)
- ✅ Tool palette: activate tool, create rect/circle/ellipse/line, preview, hierarchy update (`tool-palette.spec.ts`)
- ✅ Hierarchy panel: select from tree, expand/collapse, virtual scrolling (`hierarchy-panel.spec.ts`)
- ✅ Drag operations: move element, sync to inspector (`drag-operations.spec.ts`)
- ✅ Keyboard shortcuts: tools (V, R, C, E, L), file (Ctrl+N, O, S, Shift+S) (`keyboard-shortcuts.spec.ts`)
- ✅ File operations: menu, New, Save, Save As, download (`file-operations.spec.ts`)
- ✅ Helper unit tests: selection, attribute, tool, drag helpers

### Element selection and data-uuid

Tests and helpers target elements by **`data-uuid`** when possible so selectors stay stable and UI overlays (e.g. selection handles) are not matched. The frontend assigns `data-uuid` on load (parser) and when creating primitives (tool palette). See **[Data UUID and Registry](../src/docs/DATA_UUID_AND_REGISTRY.md)** for the mapping table and usage.

- **Selection helpers:** Prefer `svg [data-uuid="${uuid}"]` inside the content SVG.
- **Drag helpers:** Resolve by `id`, `data-original-id`, or `data-uuid`.
- **Tool helpers:** New elements are found via `... [data-uuid]`; e.g. `getLastCreatedElementUUID()` returns the new element’s `data-uuid`.

### 🚧 To Be Implemented

- Raw SVG panel E2E tests (display, edit, parse errors)
- Performance and accessibility E2E suites
- CI/CD workflow and test reporting
- Component unit tests with Testing Library

## Test Asset: test.svg

The primary test file is located at `/test.svg` (project root).

**Contents**:
- 70+ SVG elements
- 81 nodes in document tree
- Multiple element types (rect, circle, ellipse, line, polyline, polygon, path, text, image)
- Advanced features (gradients, patterns, clipPath, mask)
- Nested groups with transforms
- Embedded image reference

**Usage**:
```typescript
import { loadTestSVG } from '../utils/test-svg-loader';

const svgContent = loadTestSVG();
// Use in tests...
```

## Running Tests

### Vitest Tests (Fast)

```bash
# All tests
npm test

# Specific test file
npm test test-svg-loading

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# With UI
npm test -- --ui
```

### Playwright Tests (Browser)

```bash
# Install first
npm install -D @playwright/test
npx playwright install

# Run tests
npx playwright test

# With UI (best for debugging)
npx playwright test --ui

# Headed mode (see browser)
npx playwright test --headed

# Specific test
npx playwright test svg-editor.spec.ts
```

## Test Results

### Current Status (test.svg Loading)

```
✓ tests/e2e/test-svg-loading.test.ts (20)
  ✓ test.svg Loading and Display (20)
    ✓ File Loading (5)
    ✓ Parsing test.svg (3)
    ✓ Element Selection in test.svg (3)
    ✓ Performance with test.svg (3)
    ✓ Advanced Features in test.svg (6)

Test Files  1 passed (1)
Tests       20 passed (20)
Duration    1.64s
```

### Performance Metrics

| Operation | Time | Target | Status |
|-----------|------|--------|--------|
| Parse test.svg | ~10ms | <500ms | ✅ |
| Load into state | ~0.08ms | <100ms | ✅ |
| Select 5 elements | ~4ms | <50ms | ✅ |

## Documentation

- **[UI_TESTING_SPEC.md](./UI_TESTING_SPEC.md)** — Comprehensive testing strategy and scenarios
- **[UI_TESTING_SETUP.md](./UI_TESTING_SETUP.md)** — Setup guide and troubleshooting
- **[Data UUID and Registry](../src/docs/DATA_UUID_AND_REGISTRY.md)** — `data-uuid` attribute, Element Registry maps, and how tests/helpers use them

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Use Utilities**: Leverage `test-svg-loader.ts` for consistent test data
3. **Performance Testing**: Measure and log critical operations
4. **Meaningful Names**: Use descriptive test names
5. **Clean State**: Clear state between tests

## Next Steps

1. ✅ Install Playwright and run E2E: `npx playwright test`
2. ✅ Run Vitest: `npm test` (unit + test-svg-loading, etc.)
3. 🚧 Raw SVG panel E2E tests
4. 🚧 Performance and accessibility E2E suites
5. 🚧 Set up CI/CD pipeline and test reporting

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [test.svg](../../../test.svg)
