# UI Testing Expansion - Requirements

## Overview
Expand the Playwright UI test suite to cover SVG editing functions including element selection, attribute editing, primitive creation with tools, drag-to-move operations, undo/redo, and keyboard shortcuts.

## Implementation status (alignment with frontend)

The following are implemented and aligned with `apps/frontend`:

- **Element identification:** Elements use `data-uuid`; the Element Registry (`element-registry.ts`) maps UUID ↔ SVG element and UUID ↔ document tree node. See `apps/frontend/src/docs/DATA_UUID_AND_REGISTRY.md`.
- **Implemented test suites:** Element selection, attribute editing, tool palette, hierarchy panel, drag operations, keyboard shortcuts, file operations (Phases 1–3). Helpers: selection, attribute, tool, drag, svg-helpers, test-data-generators.
- **Unit tests for data-uuid pipeline:** Parser assign/preserve `data-uuid` (`src/utils/svg-parser.test.ts`), serialize→parse round-trip and element registry indexing (`src/utils/svg-element-tracking-pipeline.test.ts`), and primitive creation `data-uuid` (`src/utils/primitive-tools-simple.test.ts`). Run with `npm test -- src/utils/svg-parser.test.ts src/utils/svg-element-tracking-pipeline.test.ts src/utils/primitive-tools-simple.test.ts`.
- **Pending:** Raw SVG panel E2E, performance, accessibility, CI/CD workflow, documentation polish (Phases 4–5).

## User Stories

### 1. Element Selection Testing
**As a developer**, I want comprehensive tests for element selection so that I can ensure users can reliably select and interact with SVG elements.

**Acceptance Criteria:**
- 1.1 Test should verify clicking an element in the canvas selects it
- 1.2 Test should verify selection is synchronized across canvas, hierarchy panel, and attribute inspector
- 1.3 Test should verify multi-select with Ctrl/Cmd key works correctly
- 1.4 Test should verify clicking empty canvas clears selection
- 1.5 Test should verify selection highlights appear correctly in all panels

### 2. Attribute Editing Testing
**As a developer**, I want tests for attribute editing so that I can ensure users can modify element properties correctly.

**Acceptance Criteria:**
- 2.1 Test should verify editing numeric attributes (x, y, width, height, radius) updates the element
- 2.2 Test should verify editing color attributes (fill, stroke) updates the element visually
- 2.3 Test should verify changes in attribute inspector update the canvas immediately
- 2.4 Test should verify changes in attribute inspector update the raw SVG panel
- 2.5 Test should verify invalid attribute values are rejected with appropriate error messages
- 2.6 Test should verify attribute validation for different types (number, color, text)

### 3. Tool Palette and Primitive Creation Testing
**As a developer**, I want tests for creating SVG primitives so that I can ensure the tool palette works correctly.

**Acceptance Criteria:**
- 3.1 Test should verify selecting a tool from the palette activates it
- 3.2 Test should verify creating a rectangle by dragging on canvas
- 3.3 Test should verify creating a circle by dragging on canvas
- 3.4 Test should verify creating an ellipse by dragging on canvas
- 3.5 Test should verify creating a line by dragging on canvas
- 3.6 Test should verify newly created elements appear in hierarchy panel
- 3.7 Test should verify newly created elements are auto-selected after creation
- 3.8 Test should verify preview appears during drag operation

### 4. Drag-to-Move Testing
**As a developer**, I want tests for drag-to-move functionality so that I can ensure users can reposition elements.

**Acceptance Criteria:**
- 4.1 Test should verify dragging a selected element moves it
- 4.2 Test should verify element position updates in attribute inspector during drag
- 4.3 Test should verify dragging multiple selected elements moves them together
- 4.4 Test should verify drag operation can be cancelled by pressing Escape
- 4.5 Test should verify selection outline follows the element during drag

### 5. Keyboard Shortcuts Testing
**As a developer**, I want tests for keyboard shortcuts so that I can ensure power users can work efficiently.

**Acceptance Criteria:**
- 5.1 Test should verify Ctrl+N creates a new document
- 5.2 Test should verify Ctrl+O opens file dialog
- 5.3 Test should verify Ctrl+S saves the document
- 5.4 Test should verify Ctrl+Z performs undo
- 5.5 Test should verify Ctrl+Shift+Z performs redo
- 5.6 Test should verify Delete key deletes selected elements
- 5.7 Test should verify tool shortcuts (V for select, R for rectangle, C for circle, etc.)

### 6. File Operations Testing
**As a developer**, I want tests for file operations so that I can ensure users can save and load their work.

**Acceptance Criteria:**
- 6.1 Test should verify "New" creates a blank document
- 6.2 Test should verify "Save" downloads the SVG file
- 6.3 Test should verify "Save As" allows choosing a new filename
- 6.4 Test should verify saved file contains all edits made
- 6.5 Test should verify file menu dropdown opens and closes correctly

### 7. Hierarchy Panel Interaction Testing
**As a developer**, I want tests for hierarchy panel interactions so that I can ensure the tree view works correctly.

**Acceptance Criteria:**
- 7.1 Test should verify clicking a node in hierarchy selects the element
- 7.2 Test should verify expanding/collapsing nodes works correctly
- 7.3 Test should verify hierarchy updates when elements are created
- 7.4 Test should verify hierarchy updates when elements are deleted
- 7.5 Test should verify virtual scrolling activates for large documents (>1000 nodes)

### 8. Raw SVG Panel Testing
**As a developer**, I want tests for raw SVG editing so that I can ensure advanced users can edit SVG markup directly.

**Acceptance Criteria:**
- 8.1 Test should verify raw SVG panel displays current document markup
- 8.2 Test should verify editing raw SVG updates the canvas
- 8.3 Test should verify syntax errors in raw SVG show error messages
- 8.4 Test should verify raw SVG updates when elements are modified via inspector

### 9. Performance Testing
**As a developer**, I want performance tests so that I can ensure the editor remains responsive.

**Acceptance Criteria:**
- 9.1 Test should verify selection of elements completes within 100ms
- 9.2 Test should verify attribute updates complete within 50ms
- 9.3 Test should verify drag operations maintain 60fps
- 9.4 Test should verify large documents (1000+ elements) load within 2 seconds

### 10. Accessibility Testing
**As a developer**, I want accessibility tests so that I can ensure the editor is usable by everyone.

**Acceptance Criteria:**
- 10.1 Test should verify all interactive elements have proper ARIA labels
- 10.2 Test should verify keyboard navigation works for all controls
- 10.3 Test should verify focus indicators are visible
- 10.4 Test should verify screen reader announcements for state changes

### 11. Element Identification Strategy
**As a developer**, I want a reliable way to identify and interact with SVG elements in tests so that I can write stable and deterministic tests.

**Acceptance Criteria:**
- 11.1 Test helpers must use `data-uuid` for finding elements whenever possible (see `apps/frontend/src/docs/DATA_UUID_AND_REGISTRY.md`).
- 11.2 `data-uuid` must be preserved in-memory during state updates; serialization strips it by default on save/export (optional `keepUUID` for tests).
- 11.3 Newly created elements (via tools or raw edit) must have a `data-uuid` assigned (parser and primitive tools assign it).
- 11.4 Helper functions like `getElementPosition` and `dragElement` must support lookup by `data-uuid` (and optionally by `id` or `data-original-id`).
- 11.5 `getElementCount` helpers must differentiate between content elements (with `data-uuid`) and UI overlays (handles, selection boxes).

## Non-Functional Requirements

### Performance
- Tests should complete in under 5 minutes total
- Individual test suites should run in parallel when possible
- Tests should use efficient selectors and minimize wait times

### Reliability
- Tests should be deterministic and not flaky
- Tests should handle timing issues with proper waits
- Tests should clean up state between tests

### Maintainability
- Tests should use helper functions to reduce duplication
- Tests should have clear, descriptive names
- Tests should be organized by feature area

## Technical Constraints
- Must use Playwright test framework
- Must work across Chromium, Firefox, and WebKit browsers
- Must integrate with existing CI/CD pipeline
- Must generate HTML reports for test results

## Success Metrics
- Test coverage for editing functions reaches 90%+
- All tests pass consistently across all browsers
- Test execution time remains under 5 minutes
- Zero flaky tests in CI/CD pipeline
