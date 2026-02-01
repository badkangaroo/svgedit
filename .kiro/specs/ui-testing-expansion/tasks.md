# UI Testing Expansion - Tasks

## Phase 1: Core Functionality (Priority: High)

### 1. Setup Helper Function Library
- [x] 1.1 Create `tests/helpers/selection-helpers.ts`
  - [x] 1.1.1 Implement `selectElement(page, elementId)` function
  - [x] 1.1.2 Implement `selectMultipleElements(page, elementIds)` function
  - [x] 1.1.3 Implement `verifySelectionSync(page, elementIds)` function
  - [x] 1.1.4 Implement `getSelectedElements(page)` function
  - [x] 1.1.5 Add unit tests for helper functions

- [x] 1.2 Create `tests/helpers/attribute-helpers.ts`
  - [x] 1.2.1 Implement `editAttribute(page, attributeName, value)` function
  - [x] 1.2.2 Implement `verifyAttributeValue(page, elementId, attributeName, expectedValue)` function
  - [x] 1.2.3 Implement `expectValidationError(page, attributeName, errorMessage)` function
  - [x] 1.2.4 Add unit tests for helper functions

- [x] 1.3 Create `tests/helpers/tool-helpers.ts`
  - [x] 1.3.1 Implement `selectTool(page, toolName)` function
  - [x] 1.3.2 Implement `drawPrimitive(page, toolName, startX, startY, endX, endY)` function
  - [x] 1.3.3 Implement `verifyPrimitiveCreated(page, elementType)` function
  - [x] 1.3.4 Add unit tests for helper functions

- [x] 1.4 Create `tests/helpers/test-data-generators.ts`
  - [x] 1.4.1 Implement `generateLargeSVG(elementCount)` functio
  - [x] 1.4.2 Implement `generateTestSVG()` function
  - [x] 1.4.3 Add validation tests for generated SVG

- [x] 1.5 Update `tests/helpers/svg-helpers.ts`
  - [x] 1.5.1 Refactor existing `loadTestSVG()` to use programmatic loading
  - [x] 1.5.2 Add `loadSVGContent(page, content)` function
  - [x] 1.5.3 Ensure compatibility with new helper functions

### 2. Element Selection Tests
- [x] 2.1 Create `tests/e2e/playwright/element-selection.spec.ts`
  - [x] 2.1.1 Write test: "should select element on canvas click"
  - [x] 2.1.2 Write test: "should synchronize selection across all panels"
  - [x] 2.1.3 Write test: "should support multi-select with Ctrl key"
  - [x] 2.1.4 Write test: "should clear selection on empty canvas click"
  - [x] 2.1.5 Write test: "should show selection highlights correctly"
  - [x] 2.1.6 Run tests across all browsers (Chromium, Firefox, WebKit)

### 3. Attribute Editing Tests
- [x] 3.1 Create `tests/e2e/playwright/attribute-editing.spec.ts`
  - [x] 3.1.1 Write test: "should edit numeric attributes (x, y, width, height)"
  - [x] 3.1.2 Write test: "should edit color attributes (fill, stroke)"
  - [x] 3.1.3 Write test: "should update canvas when attribute changes"
  - [x] 3.1.4 Write test: "should update raw SVG when attribute changes"
  - [x] 3.1.5 Write test: "should validate numeric attribute ranges"
  - [x] 3.1.6 Write test: "should validate color attribute formats"
  - [x] 3.1.7 Write test: "should show validation errors for invalid input"
  - [x] 3.1.8 Write test: "should rollback invalid changes"
  - [x] 3.1.9 Run tests across all browsers

### 4. Tool Palette Tests
- [x] 4.1 Create `tests/e2e/playwright/tool-palette.spec.ts`
  - [x] 4.1.1 Write test: "should activate tool on click"
  - [x] 4.1.2 Write test: "should create rectangle with drag"
  - [x] 4.1.3 Write test: "should create circle with drag"
  - [x] 4.1.4 Write test: "should create ellipse with drag"
  - [x] 4.1.5 Write test: "should create line with drag"
  - [x] 4.1.6 Write test: "should show preview during drag"
  - [x] 4.1.7 Write test: "should auto-select newly created element"
  - [x] 4.1.8 Write test: "should update hierarchy panel after creation"
  - [x] 4.1.9 Run tests across all browsers



## Phase 2: Advanced Interactions (Priority: High)

### 5. Drag Operations Tests
- [ ] 5.1 Create `tests/helpers/drag-helpers.ts`
  - [ ] 5.1.1 Implement `dragElement(page, elementId, deltaX, deltaY)` function
  - [ ] 5.1.2 Implement `getElementPosition(page, elementId)` function
  - [ ] 5.1.3 Implement `verifyElementMoved(page, elementId, expectedX, expectedY)` function
  - [ ] 5.1.4 Add unit tests for helper functions

- [ ] 5.2 Create `tests/e2e/playwright/drag-operations.spec.ts`
  - [ ] 5.2.1 Write test: "should move element by dragging"
  - [ ] 5.2.2 Write test: "should update position in attribute inspector during drag"
  - [ ] 5.2.3 Write test: "should drag multiple selected elements together"
  - [ ] 5.2.4 Write test: "should show dragging visual feedback"
  - [ ] 5.2.5 Write test: "should update selection outline during drag"
  - [ ] 5.2.6 Run tests across all browsers

### 6. Keyboard Shortcuts Tests
- [ ] 6.1 Create `tests/e2e/playwright/keyboard-shortcuts.spec.ts`
  - [ ] 6.1.1 Write test: "should create new document with Ctrl+N"
  - [ ] 6.1.2 Write test: "should trigger open dialog with Ctrl+O"
  - [ ] 6.1.3 Write test: "should save document with Ctrl+S"
  - [ ] 6.1.4 Write test: "should save as with Ctrl+Shift+S"
  - [ ] 6.1.5 Write test: "should switch to select tool with 'V' key"
  - [ ] 6.1.6 Write test: "should switch to rectangle tool with 'R' key"
  - [ ] 6.1.7 Write test: "should switch to circle tool with 'C' key"
  - [ ] 6.1.8 Write test: "should switch to ellipse tool with 'E' key"
  - [ ] 6.1.9 Write test: "should switch to line tool with 'L' key"
  - [ ] 6.1.10 Run tests across all browsers

### 7. File Operations Tests
- [ ] 7.1 Create `tests/e2e/playwright/file-operations.spec.ts`
  - [ ] 7.1.1 Write test: "should open file menu on click"
  - [ ] 7.1.2 Write test: "should close file menu on outside click"
  - [ ] 7.1.3 Write test: "should show all menu items (New, Open, Save, Save As)"
  - [ ] 7.1.4 Write test: "should create new document from menu"
  - [ ] 7.1.5 Write test: "should save document and download file"
  - [ ] 7.1.6 Write test: "should save edited document with changes"
  - [ ] 7.1.7 Write test: "should verify downloaded file contains correct SVG"
  - [ ] 7.1.8 Run tests across all browsers



## Phase 3: Panel Interactions (Priority: Medium)

### 8. Hierarchy Panel Tests
- [ ] 8.1 Create `tests/e2e/playwright/hierarchy-panel.spec.ts`
  - [ ] 8.1.1 Write test: "should select element from hierarchy click"
  - [ ] 8.1.2 Write test: "should expand node on toggle click"
  - [ ] 8.1.3 Write test: "should collapse node on toggle click"
  - [ ] 8.1.4 Write test: "should show children when node expanded"
  - [ ] 8.1.5 Write test: "should update hierarchy when element created"
  - [ ] 8.1.6 Write test: "should update hierarchy when element deleted"
  - [ ] 8.1.7 Write test: "should enable virtual scrolling for large documents (>1000 nodes)"
  - [ ] 8.1.8 Write test: "should show performance indicator for virtual scrolling"
  - [ ] 8.1.9 Write test: "should scroll to selected node in virtual mode"
  - [ ] 8.1.10 Run tests across all browsers

### 9. Raw SVG Panel Tests
- [ ] 9.1 Create `tests/e2e/playwright/raw-svg-panel.spec.ts`
  - [ ] 9.1.1 Write test: "should display current SVG markup"
  - [ ] 9.1.2 Write test: "should update canvas when raw SVG edited"
  - [ ] 9.1.3 Write test: "should update hierarchy when raw SVG edited"
  - [ ] 9.1.4 Write test: "should show error for invalid SVG syntax"
  - [ ] 9.1.5 Write test: "should not update document on parse error"
  - [ ] 9.1.6 Write test: "should update raw SVG when attribute edited"
  - [ ] 9.1.7 Write test: "should update raw SVG when element created"
  - [ ] 9.1.8 Run tests across all browsers



## Phase 4: Quality & Performance (Priority: Medium)

### 10. Performance Tests
- [ ] 10.1 Create `tests/e2e/playwright/performance.spec.ts`
  - [ ] 10.1.1 Write test: "should select elements within 100ms"
  - [ ] 10.1.2 Write test: "should update attributes within 50ms"
  - [ ] 10.1.3 Write test: "should load large document (1000 elements) within 2s"
  - [ ] 10.1.4 Write test: "should maintain 55+ fps during drag operations"
  - [ ] 10.1.5 Write test: "should handle selection in large documents efficiently"
  - [ ] 10.1.6 Write test: "should render hierarchy for large documents quickly"
  - [ ] 10.1.7 Run tests across all browsers
  - [ ] 10.1.8 Document performance baselines

### 11. Accessibility Tests
- [ ] 11.1 Create `tests/e2e/playwright/accessibility.spec.ts`
  - [ ] 11.1.1 Write test: "should have ARIA labels on all tool buttons"
  - [ ] 11.1.2 Write test: "should have ARIA label on theme toggle"
  - [ ] 11.1.3 Write test: "should support keyboard navigation with Tab"
  - [ ] 11.1.4 Write test: "should show visible focus indicators"
  - [ ] 11.1.5 Write test: "should have proper aria-pressed states on tools"
  - [ ] 11.1.6 Write test: "should have proper ARIA roles on panels"
  - [ ] 11.1.7 Write test: "should announce state changes"
  - [ ] 11.1.8 Run tests across all browsers
  - [ ] 11.1.9 Run axe-core accessibility audit (optional)

### 12. Visual Regression Tests (Optional)
- [ ] 12.1* Setup visual regression testing with Percy or Chromatic
  - [ ] 12.1.1* Install Percy or Chromatic
  - [ ] 12.1.2* Configure visual regression settings
  - [ ] 12.1.3* Create baseline screenshots

- [ ] 12.2* Create visual regression test suite
  - [ ] 12.2.1* Write test: "should match initial layout screenshot"
  - [ ] 12.2.2* Write test: "should match dark theme screenshot"
  - [ ] 12.2.3* Write test: "should match canvas with loaded SVG"
  - [ ] 12.2.4* Write test: "should match hierarchy panel"
  - [ ] 12.2.5* Write test: "should match attribute inspector"



## Phase 5: CI/CD Integration (Priority: High)

### 13. CI/CD Setup
- [ ] 13.1 Create GitHub Actions workflow
  - [ ] 13.1.1 Create `.github/workflows/ui-tests.yml`
  - [ ] 13.1.2 Configure Node.js setup
  - [ ] 13.1.3 Configure Playwright browser installation
  - [ ] 13.1.4 Configure test execution
  - [ ] 13.1.5 Configure artifact upload for test reports
  - [ ] 13.1.6 Configure artifact upload for screenshots on failure
  - [ ] 13.1.7 Test workflow on pull request

- [ ] 13.2 Configure test reporting
  - [ ] 13.2.1 Configure HTML reporter in playwright.config.ts
  - [ ] 13.2.2 Configure JSON reporter for CI
  - [ ] 13.2.3 Set up test result summary in PR comments (optional)
  - [ ] 13.2.4 Configure failure notifications (optional)

- [ ] 13.3 Optimize test execution
  - [ ] 13.3.1 Configure parallel execution settings
  - [ ] 13.3.2 Configure retry strategy for CI
  - [ ] 13.3.3 Configure test timeouts
  - [ ] 13.3.4 Verify total execution time < 5 minutes

### 14. Documentation
- [ ] 14.1 Update test documentation
  - [ ] 14.1.1 Update `tests/README.md` with new test suites
  - [ ] 14.1.2 Document helper function usage
  - [ ] 14.1.3 Document test data generators
  - [ ] 14.1.4 Add troubleshooting guide for common issues

- [ ] 14.2 Create test maintenance guide
  - [ ] 14.2.1 Document how to add new tests
  - [ ] 14.2.2 Document how to update tests when features change
  - [ ] 14.2.3 Document how to handle flaky tests
  - [ ] 14.2.4 Document browser-specific issues and workarounds



## Phase 6: Validation & Cleanup (Priority: High)

### 15. Test Validation
- [ ] 15.1 Run complete test suite
  - [ ] 15.1.1 Run all tests in Chromium
  - [ ] 15.1.2 Run all tests in Firefox
  - [ ] 15.1.3 Run all tests in WebKit
  - [ ] 15.1.4 Verify no flaky tests (run 3 times)
  - [ ] 15.1.5 Verify total execution time < 5 minutes

- [ ] 15.2 Code review and cleanup
  - [ ] 15.2.1 Review all test files for consistency
  - [ ] 15.2.2 Review helper functions for reusability
  - [ ] 15.2.3 Remove duplicate code
  - [ ] 15.2.4 Add missing JSDoc comments
  - [ ] 15.2.5 Format code with Prettier

- [ ] 15.3 Coverage analysis
  - [ ] 15.3.1 Verify all requirements have corresponding tests
  - [ ] 15.3.2 Identify any missing test scenarios
  - [ ] 15.3.3 Add tests for identified gaps
  - [ ] 15.3.4 Document test coverage metrics

### 16. Final Integration
- [ ] 16.1 Integrate with existing test suite
  - [ ] 16.1.1 Ensure new tests don't conflict with existing tests
  - [ ] 16.1.2 Update package.json scripts if needed
  - [ ] 16.1.3 Verify all tests can run together
  - [ ] 16.1.4 Update CI/CD to run all tests

- [ ] 16.2 Create test fixtures
  - [ ] 16.2.1 Create `tests/fixtures/simple.svg`
  - [ ] 16.2.2 Create `tests/fixtures/complex.svg`
  - [ ] 16.2.3 Create `tests/fixtures/large.svg`
  - [ ] 16.2.4 Copy `test.svg` to `tests/fixtures/test.svg`

- [ ] 16.3 Final verification
  - [ ] 16.3.1 Run complete test suite in CI environment
  - [ ] 16.3.2 Verify test reports are generated correctly
  - [ ] 16.3.3 Verify screenshots are captured on failure
  - [ ] 16.3.4 Verify all documentation is up to date

## Summary

**Total Tasks:** 16 major tasks with 150+ subtasks
**Estimated Effort:** 10-13 days
**Priority Breakdown:**
- High Priority: Phases 1, 2, 5, 6 (Core functionality, advanced interactions, CI/CD, validation)
- Medium Priority: Phases 3, 4 (Panel interactions, quality & performance)

**Success Criteria:**
- ✅ All tests pass across 3 browsers
- ✅ Zero flaky tests
- ✅ Test execution time < 5 minutes
- ✅ 90%+ coverage of editing functions
- ✅ CI/CD integration complete
- ✅ Documentation complete

