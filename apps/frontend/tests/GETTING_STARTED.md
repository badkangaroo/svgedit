# Getting Started with UI Testing

## Quick Start

### 1. Install Playwright

```bash
cd apps/frontend
npm install -D @playwright/test
npx playwright install
```

This will install Playwright and download the necessary browser binaries (Chromium, Firefox, WebKit).

### 2. Run Your First Test

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see the browser)
npm run test:e2e:headed

# Debug a specific test
npm run test:e2e:debug
```

### 3. View Test Results

After running tests, open the HTML report:

```bash
npx playwright show-report
```

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests with Playwright
│   └── svg-loading.spec.ts # Example: Loading test.svg
├── helpers/                # Test utilities
│   └── svg-helpers.ts      # SVG-specific helpers
├── integration/            # Component integration tests
├── unit/                   # Unit tests (Vitest)
└── fixtures/               # Test data files
```

## Writing Your First Test

Create a new test file in `tests/e2e/`:

```typescript
import { test, expect } from '@playwright/test';
import { loadTestSVG, waitForEditorReady } from '../helpers/svg-helpers';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForEditorReady(page);
  });

  test('should do something', async ({ page }) => {
    await loadTestSVG(page);
    
    // Your test code here
    const canvas = page.locator('svg-canvas');
    await expect(canvas).toBeVisible();
  });
});
```

## Available Helper Functions

### Loading SVG Files

```typescript
// Load test.svg from repository root
await loadTestSVG(page);

// Load custom SVG content
await loadSVGContent(page, '<svg>...</svg>');

// Generate large SVG for performance testing
const largeSVG = generateLargeSVG(1000); // 1000 elements
```

### Working with Selection

```typescript
// Select an element by ID
await selectElementById(page, 'my-element');

// Get currently selected element
const selectedId = await getSelectedElementId(page);
```

### Inspecting Attributes

```typescript
// Get attribute value from inspector
const value = await getInspectorAttributeValue(page, 'fill');

// Set attribute value in inspector
await setInspectorAttributeValue(page, 'fill', 'red');
```

### Working with Hierarchy

```typescript
// Check if element exists in hierarchy
const exists = await hierarchyHasElement(page, 'my-element');

// Expand a node in hierarchy
await expandHierarchyNode(page, 'group-name');
```

### Getting Raw SVG

```typescript
// Get raw SVG text from document state
const svgText = await getRawSVGText(page);
```

## Common Test Patterns

### Testing Element Selection

```typescript
test('should select element', async ({ page }) => {
  await loadTestSVG(page);
  
  // Click element in canvas
  const canvas = page.locator('svg-canvas svg');
  await canvas.locator('#header').click();
  
  // Verify selection in hierarchy
  const hierarchy = page.locator('svg-hierarchy-panel');
  await expect(hierarchy.locator('.selected')).toContainText('header');
  
  // Verify selection in inspector
  const inspector = page.locator('svg-attribute-inspector');
  await expect(inspector).toBeVisible();
});
```

### Testing Attribute Editing

```typescript
test('should edit attributes', async ({ page }) => {
  await loadTestSVG(page);
  
  // Select element
  await selectElementById(page, 'my-rect');
  
  // Edit attribute
  await setInspectorAttributeValue(page, 'fill', 'blue');
  
  // Verify change in canvas
  const rect = page.locator('svg-canvas svg #my-rect');
  await expect(rect).toHaveAttribute('fill', 'blue');
  
  // Verify change in raw SVG
  const rawSVG = await getRawSVGText(page);
  expect(rawSVG).toContain('fill="blue"');
});
```

### Testing Raw SVG Editing

```typescript
test('should parse raw SVG edits', async ({ page }) => {
  await loadTestSVG(page);
  
  // Edit raw SVG
  const rawPanel = page.locator('svg-raw-panel');
  const textarea = rawPanel.locator('textarea');
  
  let content = await textarea.inputValue();
  content = content.replace('fill="red"', 'fill="green"');
  
  await textarea.fill(content);
  await textarea.press('Control+Enter'); // Trigger parse
  
  // Verify change in canvas
  const canvas = page.locator('svg-canvas svg');
  await expect(canvas.locator('[fill="green"]')).toBeVisible();
});
```

### Visual Regression Testing

```typescript
test('should match visual snapshot', async ({ page }) => {
  await loadTestSVG(page);
  
  // Wait for render
  await page.waitForTimeout(500);
  
  // Compare screenshot
  await expect(page).toHaveScreenshot('my-feature.png', {
    maxDiffPixels: 100,
  });
});
```

## Debugging Tests

### Using Playwright Inspector

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through tests
- Inspect the DOM
- View console logs
- Record new tests

### Using Browser DevTools

```bash
npm run test:e2e:headed
```

Add `await page.pause()` in your test to pause execution and inspect the page.

### Viewing Traces

When a test fails, Playwright automatically captures a trace. View it with:

```bash
npx playwright show-trace trace.zip
```

## Best Practices

1. **Use data-testid attributes** for stable selectors:
   ```html
   <button data-testid="save-button">Save</button>
   ```
   ```typescript
   await page.getByTestId('save-button').click();
   ```

2. **Wait for elements properly**:
   ```typescript
   // Good: Playwright auto-waits
   await expect(page.locator('.element')).toBeVisible();
   
   // Avoid: Manual timeouts
   await page.waitForTimeout(1000); // Only when necessary
   ```

3. **Use descriptive test names**:
   ```typescript
   test('should sync selection across canvas, hierarchy, and inspector', ...)
   ```

4. **Keep tests independent**:
   - Each test should work in isolation
   - Use `beforeEach` to set up clean state
   - Don't rely on test execution order

5. **Test user workflows, not implementation**:
   ```typescript
   // Good: Test what user sees/does
   await page.getByRole('button', { name: 'Save' }).click();
   
   // Avoid: Testing internal state
   expect(component.internalState).toBe(true);
   ```

## CI/CD Integration

Tests run automatically in CI when you push code. To run tests locally as they would in CI:

```bash
CI=true npm run test:e2e
```

## Troubleshooting

### Tests are flaky

- Add explicit waits: `await expect(element).toBeVisible()`
- Increase timeout for slow operations
- Check for race conditions

### Browser doesn't start

```bash
# Reinstall browsers
npx playwright install --force
```

### Tests pass locally but fail in CI

- Check for timing issues
- Verify test data is available
- Review CI logs and screenshots

## Next Steps

1. Read the [UI Testing Spec](./UI_TESTING_SPEC.md) for comprehensive test scenarios
2. Explore [Playwright documentation](https://playwright.dev)
3. Write tests for your features
4. Set up visual regression testing with Percy or Chromatic

## Resources

- [Playwright Docs](https://playwright.dev)
- [Testing Library](https://testing-library.com)
- [Web Component Testing](https://playwright.dev/docs/test-components)
- [Visual Regression Testing](https://playwright.dev/docs/test-snapshots)
