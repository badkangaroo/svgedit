# UI Testing Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd apps/frontend

# Install Playwright for E2E testing
npm install -D @playwright/test

# Install Testing Library for component testing
npm install -D @testing-library/dom @testing-library/user-event

# Install Playwright browsers
npx playwright install
```

### 2. Run Tests

```bash
# Run existing unit/integration tests (Vitest)
npm test

# Run the new test.svg loading tests
npm test test-svg-loading

# Run Playwright E2E tests (after installing Playwright)
npx playwright test

# Run Playwright tests with UI
npx playwright test --ui

# Run Playwright tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test svg-editor.spec.ts
```

### 3. View Test Reports

```bash
# View Vitest coverage report
npm run test:coverage
open coverage/index.html

# View Playwright HTML report
npx playwright show-report
```

## Test Structure

```
apps/frontend/tests/
├── e2e/
│   ├── playwright/              # Playwright E2E tests (real browser)
│   │   └── svg-editor.spec.ts
│   ├── test-svg-loading.test.ts # Vitest E2E tests (jsdom)
│   └── sprint2-checkpoint.test.ts
├── unit/                        # Component unit tests
│   └── setup.test.ts
├── properties/                  # Property-based tests
│   └── example.properties.test.ts
├── utils/                       # Test utilities
│   └── test-svg-loader.ts
└── setup.ts                     # Global test setup
```

## Running Tests with test.svg

### Option 1: Vitest Tests (Fast, No Browser)

The `test-svg-loading.test.ts` file tests loading test.svg using the existing parser and state management:

```bash
npm test test-svg-loading
```

**What it tests**:
- ✅ Loading test.svg file
- ✅ Parsing SVG content
- ✅ Creating document tree
- ✅ Element selection
- ✅ Performance benchmarks
- ✅ Advanced features (gradients, masks, etc.)

**Limitations**:
- No visual rendering (jsdom doesn't render)
- No real browser APIs
- No user interaction simulation

### Option 2: Playwright Tests (Full Browser)

The Playwright tests run in real browsers and can test the complete UI:

```bash
npx playwright test
```

**What it tests**:
- ✅ Visual rendering
- ✅ User interactions (clicks, drags)
- ✅ Panel resizing
- ✅ Theme switching
- ✅ Screenshots/visual regression
- ✅ Cross-browser compatibility

**Note**: The current Playwright tests are examples. To fully test loading test.svg via the File menu, you'll need to:
1. Implement file loading in the app
2. Use Playwright's file chooser API
3. Or programmatically load the file

## Test Scenarios Implemented

### ✅ Currently Implemented (Vitest)

1. **File Loading** - `test-svg-loading.test.ts`
   - Load test.svg from filesystem
   - Verify content structure
   - Check element count

2. **Parsing** - `test-svg-loading.test.ts`
   - Parse test.svg without errors
   - Create document tree
   - Load into state

3. **Selection** - `test-svg-loading.test.ts`
   - Select elements by ID
   - Multi-select
   - Clear selection

4. **Performance** - `test-svg-loading.test.ts`
   - Parse time (<500ms)
   - Load time (<100ms)
   - Selection time (<50ms)

5. **Advanced Features** - `test-svg-loading.test.ts`
   - Gradients
   - Clip paths
   - Masks
   - Patterns
   - Transforms
   - Embedded images

### ✅ Currently Implemented (Playwright)

1. **Basic Functionality** - `svg-editor.spec.ts`
   - Application loads
   - Panels visible
   - Menu bar works
   - Theme toggle

2. **Panel Resizing** - `svg-editor.spec.ts`
   - Drag dividers
   - Verify size changes

3. **Performance** - `svg-editor.spec.ts`
   - Load time benchmark

4. **Visual Regression** - `svg-editor.spec.ts`
   - Initial layout screenshot
   - Dark theme screenshot

5. **Accessibility** - `svg-editor.spec.ts`
   - ARIA labels
   - Keyboard navigation

### 🚧 To Be Implemented

1. **File Operations** (Playwright)
   - Open test.svg via File menu
   - Save edited file
   - New document

2. **Canvas Interaction** (Playwright)
   - Click elements in canvas
   - Drag elements
   - Zoom/pan

3. **Attribute Editing** (Playwright)
   - Edit attributes in inspector
   - Verify canvas updates
   - Verify raw SVG updates

4. **Raw SVG Editing** (Playwright)
   - Edit raw SVG text
   - Verify parse errors
   - Verify rollback on error

5. **Component Unit Tests** (Testing Library)
   - Individual component tests
   - Isolated behavior testing

## Writing New Tests

### Example: Vitest Component Test

```typescript
// tests/unit/svg-canvas.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/components/svg-canvas';

describe('SVGCanvas', () => {
  beforeEach(() => {
    document.body.innerHTML = '<svg-canvas></svg-canvas>';
  });

  it('should render', () => {
    const canvas = document.querySelector('svg-canvas');
    expect(canvas).toBeTruthy();
  });
});
```

### Example: Playwright E2E Test

```typescript
// tests/e2e/playwright/my-test.spec.ts
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/');
  
  // Your test code here
  const element = page.locator('svg-canvas');
  await expect(element).toBeVisible();
});
```

## Debugging Tests

### Vitest

```bash
# Run tests in watch mode
npm run test:watch

# Run with UI
npm run test -- --ui

# Debug specific test
npm test -- --reporter=verbose test-svg-loading
```

### Playwright

```bash
# Run with UI (best for debugging)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Debug specific test
npx playwright test --debug svg-editor.spec.ts

# Run with trace
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      # Vitest tests
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test
      
      # Playwright tests
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npx playwright test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up state between tests
- Don't rely on test execution order

### 2. Use Test Utilities
- Create helpers for common operations
- Use the `test-svg-loader.ts` utility
- Share setup code

### 3. Meaningful Assertions
- Test behavior, not implementation
- Use descriptive test names
- Add console.log for performance metrics

### 4. Performance Testing
- Measure critical operations
- Set reasonable thresholds
- Log timing information

### 5. Visual Testing
- Take screenshots for visual regression
- Update baselines when UI changes intentionally
- Review diffs carefully

## Troubleshooting

### Vitest Tests Failing

**Problem**: Tests can't find test.svg
**Solution**: Check the path in `test-svg-loader.ts` is correct

**Problem**: jsdom doesn't support feature X
**Solution**: Mock the feature or use Playwright for that test

### Playwright Tests Failing

**Problem**: Timeout waiting for element
**Solution**: Increase timeout or check if element is in shadow DOM

**Problem**: Can't access shadow DOM
**Solution**: Use `.locator()` to pierce shadow DOM

**Problem**: Screenshots don't match
**Solution**: Update baseline with `npx playwright test --update-snapshots`

### General Issues

**Problem**: Tests are slow
**Solution**: 
- Run tests in parallel
- Use `test.only` for focused testing
- Optimize test setup

**Problem**: Flaky tests
**Solution**:
- Add proper waits
- Avoid hardcoded timeouts
- Check for race conditions

## Next Steps

1. **Install Playwright**: `npm install -D @playwright/test`
2. **Run existing tests**: `npm test test-svg-loading`
3. **Implement file loading**: Add ability to load test.svg via UI
4. **Write more E2E tests**: Cover remaining scenarios from spec
5. **Set up CI/CD**: Automate test execution
6. **Add visual regression**: Track UI changes over time

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Web Components Testing](https://open-wc.org/docs/testing/testing-package/)
- [test.svg Location](../../../test.svg)
