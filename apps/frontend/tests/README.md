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
│   ├── playwright/               # Playwright browser tests
│   │   └── svg-editor.spec.ts   # Full browser E2E tests
│   ├── test-svg-loading.test.ts # test.svg loading tests ✅
│   └── sprint2-checkpoint.test.ts
├── unit/                         # Component unit tests
│   └── setup.test.ts
├── properties/                   # Property-based tests
│   └── example.properties.test.ts
├── utils/                        # Test utilities
│   └── test-svg-loader.ts       # Helper for loading test.svg ✅
├── setup.ts                      # Global test setup
├── vitest.d.ts                   # TypeScript definitions
├── UI_TESTING_SPEC.md           # Comprehensive testing spec ✅
├── UI_TESTING_SETUP.md          # Setup guide ✅
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

#### Playwright E2E (`playwright/svg-editor.spec.ts`)
- ✅ Application loading
- ✅ Panel visibility
- ✅ Theme switching
- ✅ Panel resizing
- ✅ Visual regression (screenshots)
- ✅ Accessibility checks

### 🚧 To Be Implemented

- File operations (open, save, save as)
- Canvas interaction (click, drag, zoom, pan)
- Attribute editing in inspector
- Raw SVG text editing
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

- **[UI_TESTING_SPEC.md](./UI_TESTING_SPEC.md)** - Comprehensive testing strategy and scenarios
- **[UI_TESTING_SETUP.md](./UI_TESTING_SETUP.md)** - Setup guide and troubleshooting

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Use Utilities**: Leverage `test-svg-loader.ts` for consistent test data
3. **Performance Testing**: Measure and log critical operations
4. **Meaningful Names**: Use descriptive test names
5. **Clean State**: Clear state between tests

## Next Steps

1. ✅ Install Playwright: `npm install -D @playwright/test`
2. ✅ Run existing tests: `npm test test-svg-loading` (20/20 passing)
3. 🚧 Implement file loading UI
4. 🚧 Write canvas interaction tests
5. 🚧 Add attribute editing tests
6. 🚧 Set up CI/CD pipeline

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [test.svg](../../../test.svg)
