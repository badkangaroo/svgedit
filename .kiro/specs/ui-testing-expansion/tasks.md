# UI Testing Expansion - Implementation Tasks

## Overview

This task list implements comprehensive Playwright UI tests for the SVG editor, covering element selection, attribute editing, tool palette, drag operations, keyboard shortcuts, file operations, hierarchy panel, raw SVG editing, performance, and accessibility.

**Key Implementation Strategy:**
- **Element Identification:** All tests and helpers use `data-uuid` for element identification (Requirements 11.1, 11.4)
- **Element Registry:** The Element Registry (`element-registry.ts`) maps `data-uuid` ↔ SVG element ↔ DocumentNode
- **Stable Selectors:** Using `data-uuid` avoids selecting UI overlays (selection handles, etc.) and provides stable test selectors
- **Documentation:** See `apps/frontend/src/docs/DATA_UUID_AND_REGISTRY.md` for complete mapping details

## Tasks

- [x] 1. Setup helper function library
  - Create reusable helper functions for test operations
  - Implement selection, attribute, tool, drag, and test data generation helpers
  - All helpers prioritize `data-uuid` for element identification
  - _Requirements: 11.1, 11.4_

- [x] 2. Implement selection helper functions
  - [x] 2.1 Create `tests/helpers/selection-helpers.ts` with core selection utilities
    - Implement `selectElement()`, `selectMultipleElements()`, `verifySelectionSync()`, `getSelectedElements()`
    - **CRITICAL:** Use `data-uuid` selectors (e.g., `svg [data-uuid="${uuid}"]`) to avoid UI overlays
    - Support fallback to `id` attribute when UUID not available
    - Helpers query content SVG (`.svg-content` or `svg [data-uuid]`) to exclude selection handles
    - _Requirements: 11.1, 11.4_
  
  - [x] 2.2 Write unit tests for selection helpers
    - Test helper functions with mock page objects
    - Verify UUID-based selection works correctly
    - _Requirements: 11.1_

- [x] 3. Implement attribute helper functions
  - [x] 3.1 Create `tests/helpers/attribute-helpers.ts` with attribute editing utilities
    - Implement `editAttribute()`, `verifyAttributeValue()`, `expectValidationError()`
    - **CRITICAL:** Support UUID-based element lookup via Element Registry
    - `verifyAttributeValue()` accepts `data-uuid` or `id` as elementId parameter
    - Use `svg [data-uuid="${uuid}"]` or `svg [id="${id}"]` selectors in content SVG
    - _Requirements: 2.1, 2.2, 2.5, 11.1, 11.4_
  
  - [x] 3.2 Write unit tests for attribute helpers
    - Test validation and error handling
    - Verify UUID-based attribute updates work correctly
    - _Requirements: 2.5, 2.6_

- [x] 4. Implement tool palette helper functions
  - [x] 4.1 Create `tests/helpers/tool-helpers.ts` with tool interaction utilities
    - Implement `selectTool()`, `drawPrimitive()`, `verifyPrimitiveCreated()`
    - **NEW:** Implement `getLastCreatedElementUUID()` to retrieve `data-uuid` of newly created elements
    - Primitive tools (rect, circle, ellipse, line) assign `data-uuid` on creation
    - Use `querySelectorAll('svg [data-uuid]')` to find newly created elements
    - Handle tool activation and primitive creation workflows
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 11.3_
  
  - [x] 4.2 Write unit tests for tool helpers
    - Test tool selection and primitive creation logic
    - Verify `data-uuid` assignment on new elements
    - _Requirements: 3.1, 11.3_

- [x] 5. Implement drag operation helper functions
  - [x] 5.1 Create `tests/helpers/drag-helpers.ts` with drag utilities
    - Implement `dragElement()`, `getElementPosition()`, `verifyElementMoved()`
    - **CRITICAL:** Support lookup by `data-uuid`, `id`, or `data-original-id`
    - Use `svg [data-uuid="${identifier}"], svg [id="${identifier}"], svg [data-original-id="${identifier}"]` selector pattern
    - `getElementPosition()` handles different element types (rect: x/y, circle: cx/cy, etc.)
    - Prioritize `data-uuid` for stability; fallback to `id` for compatibility
    - _Requirements: 4.1, 4.2, 11.4_
  
  - [x] 5.2 Write unit tests for drag helpers
    - Test position calculations and drag operations
    - Verify UUID-based drag operations work correctly
    - _Requirements: 4.1, 11.4_

- [x] 6. Implement test data generators
  - [x] 6.1 Create `tests/helpers/test-data-generators.ts` with SVG generation utilities
    - Implement `generateLargeSVG()` for performance testing (1000+ elements)
    - Implement `generateTestSVG()` for standard test scenarios
    - **CRITICAL:** All generated elements MUST include `data-uuid` attributes
    - Use `crypto.randomUUID()` or similar to assign unique UUIDs
    - Generated SVG should match parser output (elements have `data-uuid` on load)
    - _Requirements: 9.4, 11.2, 11.3_
  
  - [x] 6.2 Write validation tests for generated SVG
    - Verify SVG structure and UUID assignment
    - Ensure all elements have valid `data-uuid` attributes
    - _Requirements: 11.3_

- [x] 7. Update existing SVG helpers
  - [x] 7.1 Refactor `tests/helpers/svg-helpers.ts` for programmatic loading
    - Update `loadTestSVG()` to use programmatic loading instead of file uploads
    - Add `loadSVGContent(page, content)` function
    - **CRITICAL:** Ensure loaded SVG elements receive `data-uuid` (parser assigns them)
    - Verify Element Registry is rebuilt after loading
    - Ensure compatibility with new helper functions
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 8. Implement element selection tests
  - [x] 8.1 Create `tests/e2e/playwright/element-selection.spec.ts`
    - Write test: "should select element on canvas click"
    - Write test: "should synchronize selection across all panels"
    - Write test: "should support multi-select with Ctrl key"
    - Write test: "should clear selection on empty canvas click"
    - Write test: "should show selection highlights correctly"
    - **Tests use `data-uuid` selectors for element identification**
    - Verify selection works with UUID-based helpers
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.1_
  
  - [x] 8.2 Run selection tests across all browsers
    - Verify tests pass in Chromium, Firefox, and WebKit
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 9. Implement attribute editing tests
  - [x] 9.1 Create `tests/e2e/playwright/attribute-editing.spec.ts`
    - Write test: "should edit numeric attributes (x, y, width, height)"
    - Write test: "should edit color attributes (fill, stroke)"
    - Write test: "should update canvas when attribute changes"
    - Write test: "should update raw SVG when attribute changes"
    - Write test: "should validate numeric attribute ranges"
    - Write test: "should validate color attribute formats"
    - Write test: "should show validation errors for invalid input"
    - Write test: "should rollback invalid changes"
    - **Tests verify attributes on elements using `data-uuid` selectors**
    - Attribute inspector operates on selected UUID via Element Registry
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 11.1, 11.4_
  
  - [x] 9.2 Run attribute editing tests across all browsers
    - Verify tests pass in Chromium, Firefox, and WebKit
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 10. Implement tool palette tests
  - [x] 10.1 Create `tests/e2e/playwright/tool-palette.spec.ts`
    - Write test: "should activate tool on click"
    - Write test: "should create rectangle with drag"
    - Write test: "should create circle with drag"
    - Write test: "should create ellipse with drag"
    - Write test: "should create line with drag"
    - Write test: "should show preview during drag"
    - Write test: "should auto-select newly created element"
    - Write test: "should update hierarchy panel after creation"
    - **Tests verify new elements have `data-uuid` assigned by primitive tools**
    - Use `getLastCreatedElementUUID()` helper for assertions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 11.3_
  
  - [x] 10.2 Run tool palette tests across all browsers
    - Verify tests pass in Chromium, Firefox, and WebKit
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 11. Checkpoint - Verify core functionality tests
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all helpers correctly use `data-uuid` for element identification

- [x] 12. Implement drag operation tests
  - [x] 12.1 Create `tests/e2e/playwright/drag-operations.spec.ts`
    - Write test: "should move element by dragging"
    - Write test: "should update position in attribute inspector during drag"
    - Write test: "should drag multiple selected elements together"
    - Write test: "should show dragging visual feedback"
    - Write test: "should update selection outline during drag"
    - **Tests use `data-uuid` to identify and drag elements**
    - Drag helpers support UUID, id, and data-original-id lookup
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 11.4_
  
  - [ ]* 12.2 Run drag operation tests across all browsers
    - Verify tests pass in Chromium, Firefox, and WebKit
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 13. Implement keyboard shortcuts tests
  - [x] 13.1 Create `tests/e2e/playwright/keyboard-shortcuts.spec.ts`
    - Write test: "should create new document with Ctrl+N"
    - Write test: "should trigger open dialog with Ctrl+O"
    - Write test: "should save document with Ctrl+S"
    - Write test: "should save as with Ctrl+Shift+S"
    - Write test: "should switch to select tool with 'V' key"
    - Write test: "should switch to rectangle tool with 'R' key"
    - Write test: "should switch to circle tool with 'C' key"
    - Write test: "should switch to ellipse tool with 'E' key"
    - Write test: "should switch to line tool with 'L' key"
    - Tests verify tool activation and document operations
    - _Requirements: 5.1, 5.2, 5.3, 5.7_
  
  - [x] 13.2 Run keyboard shortcuts tests across all browsers
    - Verify tests pass in Chromium, Firefox, and WebKit
    - _Requirements: 5.1, 5.2, 5.3, 5.7_

- [x] 14. Implement file operations tests
  - [x] 14.1 Create `tests/e2e/playwright/file-operations.spec.ts`
    - Write test: "should open file menu on click"
    - Write test: "should close file menu on outside click"
    - Write test: "should show all menu items (New, Open, Save, Save As)"
    - Write test: "should create new document from menu"
    - Write test: "should save document and download file"
    - Write test: "should save edited document with changes"
    - Write test: "should verify downloaded file contains correct SVG"
    - **Note:** Serializer strips `data-uuid` by default on save/export (clean output)
    - Tests verify functional file operations, not UUID preservation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.2_
  
  - [x] 14.2 Run file operations tests across all browsers
    - Verify tests pass in Chromium, Firefox, and WebKit
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 15. Checkpoint - Verify advanced interaction tests
  - Ensure all tests pass, ask the user if questions arise.
  - Verify file operations correctly handle UUID lifecycle (strip on export)

- [x] 16. Implement hierarchy panel tests
  - [x] 16.1 Create `tests/e2e/playwright/hierarchy-panel.spec.ts`
    - Write test: "should select element from hierarchy click"
    - Write test: "should expand node on toggle click"
    - Write test: "should collapse node on toggle click"
    - Write test: "should show children when node expanded"
    - Write test: "should update hierarchy when element created"
    - Write test: "should update hierarchy when element deleted"
    - Write test: "should enable virtual scrolling for large documents (>1000 nodes)"
    - Write test: "should show performance indicator for virtual scrolling"
    - Write test: "should scroll to selected node in virtual mode"
    - **Hierarchy nodes may use `data-node-id` (element id) or `data-uuid` depending on implementation**
    - Tests verify hierarchy-canvas-inspector synchronization via Element Registry
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 11.1_
  
  - [x] 16.2 Run hierarchy panel tests across all browsers
    - Verify tests pass in Chromium, Firefox, and WebKit
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 17. Implement raw SVG panel tests
  - [x] 17.1 Create `tests/e2e/playwright/raw-svg-panel.spec.ts`
    - Write test: "should display current SVG markup"
    - Write test: "should update canvas when raw SVG edited"
    - Write test: "should update hierarchy when raw SVG edited"
    - Write test: "should show error for invalid SVG syntax"
    - Write test: "should not update document on parse error"
    - Write test: "should update raw SVG when attribute edited"
    - Write test: "should update raw SVG when element created"
    - **Parser assigns `data-uuid` to elements when parsing raw SVG edits**
    - Element Registry is rebuilt after successful parse
    - Tests verify raw SVG ↔ canvas ↔ hierarchy synchronization
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 11.3_
  
  - [ ]* 17.2 Run raw SVG panel tests across all browsers
    - Verify tests pass in Chromium, Firefox, and WebKit
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 18. Implement performance tests
  - [x] 18.1 Create `tests/e2e/playwright/performance.spec.ts`
    - Write test: "should select elements within 100ms"
    - Write test: "should update attributes within 50ms"
    - Write test: "should load large document (1000 elements) within 2s"
    - Write test: "should maintain 55+ fps during drag operations"
    - Write test: "should handle selection in large documents efficiently"
    - Write test: "should render hierarchy for large documents quickly"
    - **Use `generateLargeSVG()` with `data-uuid` on all elements**
    - Element Registry O(1) lookups ensure performance at scale
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 11.3_
  
  - [ ]* 18.2 Document performance baselines
    - Record baseline metrics for each performance test
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 19. Implement accessibility tests
  - [ ] 19.1 Create `tests/e2e/playwright/accessibility.spec.ts`
    - Write test: "should have ARIA labels on all tool buttons"
    - Write test: "should have ARIA label on theme toggle"
    - Write test: "should support keyboard navigation with Tab"
    - Write test: "should show visible focus indicators"
    - Write test: "should have proper aria-pressed states on tools"
    - Write test: "should have proper ARIA roles on panels"
    - Write test: "should announce state changes"
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 19.2 Run accessibility tests across all browsers
    - Verify tests pass in Chromium, Firefox, and WebKit
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 19.3 Run axe-core accessibility audit
    - Integrate axe-core for automated accessibility testing
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 20. Checkpoint - Verify quality and performance tests
  - Ensure all tests pass, ask the user if questions arise.
  - Verify Element Registry performance with large documents (O(1) lookups)

- [ ] 21. Setup CI/CD integration
  - [ ] 21.1 Create GitHub Actions workflow file
    - Create `.github/workflows/ui-tests.yml`
    - Configure Node.js setup (version 18)
    - Configure Playwright browser installation
    - Configure test execution with proper working directory
    - _Requirements: Non-functional (CI/CD integration)_
  
  - [ ] 21.2 Configure test artifact uploads
    - Configure HTML report upload on test completion
    - Configure screenshot upload on test failure
    - Configure video upload on test failure
    - _Requirements: Non-functional (CI/CD integration)_
  
  - [ ] 21.3 Configure test reporting
    - Configure HTML reporter in `playwright.config.ts`
    - Configure JSON reporter for CI consumption
    - Set up test result summary in PR comments (optional)
    - _Requirements: Non-functional (CI/CD integration)_
  
  - [ ] 21.4 Optimize test execution for CI
    - Configure parallel execution settings (2 workers in CI)
    - Configure retry strategy (2 retries in CI)
    - Configure test timeouts (30s per test)
    - Verify total execution time < 5 minutes
    - _Requirements: Non-functional (Performance, Reliability)_

- [ ] 22. Create test documentation
  - [ ] 22.1 Update test README
    - Update `tests/README.md` with new test suites
    - **CRITICAL:** Document `data-uuid` and Element Registry usage patterns
    - Document Element Registry mapping: UUID ↔ element, UUID ↔ node, id ↔ UUID
    - Document helper function usage (selection, attribute, tool, drag)
    - Document test data generators and UUID assignment
    - Reference `apps/frontend/src/docs/DATA_UUID_AND_REGISTRY.md` for complete details
    - Explain why `data-uuid` is preferred over `id` (stability, avoids UI overlays)
    - Document UUID lifecycle: assigned by parser/tools, stripped on export
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 22.2 Create test maintenance guide
    - Document how to add new tests
    - Document how to update tests when features change
    - Document how to handle flaky tests
    - Document browser-specific issues and workarounds
    - **Include section on Element Registry and UUID-based testing patterns**
    - _Requirements: Non-functional (Maintainability)_
  
  - [ ]* 22.3 Add troubleshooting guide
    - Document common test failures and solutions
    - Document debugging techniques
    - Include UUID-related debugging tips (verify UUID assignment, check Element Registry state)
    - _Requirements: Non-functional (Maintainability)_

- [ ] 23. Create test fixtures
  - [ ] 23.1 Create SVG test fixture files
    - Create `tests/fixtures/simple.svg` (minimal SVG with basic shapes)
    - Create `tests/fixtures/complex.svg` (complex nested structure)
    - Create `tests/fixtures/large.svg` (1000+ elements for performance testing)
    - Copy `test.svg` to `tests/fixtures/test.svg`
    - **IMPORTANT:** Fixture files do NOT need `data-uuid` attributes
    - Parser assigns `data-uuid` when loading fixtures into the editor
    - Test data generators (`generateTestSVG`, `generateLargeSVG`) include `data-uuid` for programmatic loading
    - _Requirements: 9.4, 11.2, 11.3_

- [ ] 24. Final validation and cleanup
  - [ ] 24.1 Run complete test suite validation
    - Run all tests in Chromium
    - Run all tests in Firefox
    - Run all tests in WebKit
    - Verify no flaky tests (run 3 times)
    - Verify total execution time < 5 minutes
    - _Requirements: Non-functional (Performance, Reliability)_
  
  - [ ] 24.2 Code review and cleanup
    - Review all test files for consistency
    - Review helper functions for reusability
    - Remove duplicate code
    - Add missing JSDoc comments
    - Format code with Prettier
    - _Requirements: Non-functional (Maintainability)_
  
  - [ ] 24.3 Coverage analysis
    - Verify all requirements have corresponding tests
    - Identify any missing test scenarios
    - Add tests for identified gaps
    - Document test coverage metrics (target: 90%+)
    - _Requirements: All requirements 1.1-11.5_
  
  - [ ] 24.4 Final CI/CD verification
    - Run complete test suite in CI environment
    - Verify test reports are generated correctly
    - Verify screenshots are captured on failure
    - Verify all documentation is up to date
    - _Requirements: Non-functional (CI/CD integration)_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All tests use TypeScript and Playwright test framework
- **CRITICAL:** Tests MUST use `data-uuid` for element identification (Requirements 11.1, 11.4)
- **Element Registry:** Maps `data-uuid` ↔ SVG element ↔ DocumentNode for O(1) lookups
- **UUID Assignment:** Parser assigns on load, primitive tools assign on creation
- **UUID Lifecycle:** Preserved in-memory during session, stripped on save/export by default
- **Selector Pattern:** Use `svg [data-uuid="${uuid}"]` to avoid UI overlays (selection handles)
- **Helper Functions:** All helpers (selection, attribute, tool, drag) prioritize `data-uuid` lookup
- **Test Data:** Generators include `data-uuid` on all elements for stable assertions
- **Documentation:** See `apps/frontend/src/docs/DATA_UUID_AND_REGISTRY.md` for complete details
- Helper functions reduce code duplication and improve maintainability
- Tests are organized by feature area for clarity
- Checkpoints ensure incremental validation throughout implementation
- CI/CD integration ensures automated testing on every PR
- Target: 90%+ test coverage, <5 minute execution time, zero flaky tests
