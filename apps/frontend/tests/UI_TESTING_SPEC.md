# UI Testing Specification for SVG Editor

## Overview

This document outlines the strategy and tools for automated UI testing of the SVG Editor application. The goal is to ensure the editor can correctly load, display, and edit SVG files like `test.svg` in the repository root.

## Testing Pyramid

```
        /\
       /  \      E2E Tests (Few)
      /----\     - Full user workflows
     /      \    - Browser automation
    /--------\   Integration Tests (Some)
   /          \  - Component interactions
  /------------\ Unit Tests (Many)
 /              \ - Individual components
/________________\ - State management
```

## Testing Tools & Stack

### 1. **Playwright** (Recommended for E2E Testing)

**Why Playwright:**
- Modern, fast, and reliable browser automation
- Built-in test runner with great DX
- Auto-waiting and retry mechanisms
- Cross-browser support (Chromium, Firefox, WebKit)
- Screenshot and video recording for debugging
- Network interception for API mocking
- Component testing support

**Installation:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Alternative:** Cypress (more mature ecosystem, but slower)

### 2. **Vitest** (Already Configured)

**Current Usage:**
- Unit tests for state management
- Component logic testing with jsdom
- Fast feedback during development

**Limitations:**
- jsdom doesn't support full SVG rendering
- No visual regression testing
- Limited for testing canvas interactions

### 3. **Testing Library** (Recommended Addition)

**Why Testing Library:**
- User-centric testing approach
- Works with Web Components
- Encourages accessibility best practices
- Integrates with Vitest

**Installation:**
```bash
npm install -D @testing-library/dom @testing-library/user-event
```

### 4. **Percy or Chromatic** (Visual Regression Testing)

**Why Visual Regression:**
- Catch unintended visual changes
- Verify SVG rendering accuracy
- Compare screenshots across commits

**Installation (Percy):**
```bash
npm install -D @percy/cli @percy/playwright
```

## Test Structure

```
apps/frontend/tests/
├── e2e/                          # End-to-end tests with Playwright
│   ├── svg-loading.spec.ts       # Load and display test.svg
│   ├── svg-editing.spec.ts       # Edit operations
│   ├── selection.spec.ts         # Selection synchronization
│   ├── file-operations.spec.ts   # New, Open, Save, Save As
│   └── visual-regression.spec.ts # Visual comparison tests
├── integration/                  # Component integration tests
│   ├── canvas-hierarchy.spec.ts  # Canvas ↔ Hierarchy sync
│   ├── canvas-inspector.spec.ts  # Canvas ↔ Inspector sync
│   └── raw-svg-sync.spec.ts      # Raw SVG ↔ Document sync
├── unit/                         # Unit tests (existing)
│   └── ...
└── fixtures/                     # Test data
    ├── test.svg                  # Copy of root test.svg
    ├── simple.svg                # Minimal test case
    └── complex.svg               # Large document test
```

## Test Scenarios Using test.svg

### Scenario 1: Load and Display SVG

**Test:** `e2e/svg-loading.spec.ts`

```typescript
test('should load and display test.svg correctly', async ({ page }) => {
  await page.goto('/');
  
  // Load test.svg
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles('../../test.svg');
  
  // Verify canvas shows SVG
  const canvas = page.locator('svg-canvas');
  await expect(canvas).toBeVisible();
  
  // Verify SVG elements are rendered
  const svg = canvas.locator('svg');
  await expect(svg).toHaveAttribute('width', '1200');
  await expect(svg).toHaveAttribute('height', '800');
  
  // Verify specific elements exist
  await expect(svg.locator('#header')).toBeVisible();
  await expect(svg.locator('#scene')).toBeVisible();
  await expect(svg.locator('#shapes')).toBeVisible();
  
  // Take screenshot for visual regression
  await expect(page).toHaveScreenshot('test-svg-loaded.png');
});
```

### Scenario 2: Hierarchy Panel Population

**Test:** `e2e/svg-loading.spec.ts`

```typescript
test('should populate hierarchy panel with test.svg structure', async ({ page }) => {
  await page.goto('/');
  await loadTestSVG(page);
  
  // Verify hierarchy panel shows document structure
  const hierarchy = page.locator('svg-hierarchy-panel');
  
  // Check for main groups
  await expect(hierarchy.getByText('header')).toBeVisible();
  await expect(hierarchy.getByText('scene')).toBeVisible();
  await expect(hierarchy.getByText('shapes')).toBeVisible();
  await expect(hierarchy.getByText('icons')).toBeVisible();
  
  // Verify nested structure
  const sceneGroup = hierarchy.locator('[data-node-id*="scene"]');
  await sceneGroup.click();
  
  // Should show children (rect, circle, etc.)
  await expect(hierarchy.getByText('rect')).toBeVisible();
  await expect(hierarchy.getByText('circle')).toBeVisible();
});
```

### Scenario 3: Element Selection Synchronization

**Test:** `e2e/selection.spec.ts`

```typescript
test('should synchronize selection across all panels', async ({ page }) => {
  await page.goto('/');
  await loadTestSVG(page);
  
  // Select element in canvas
  const canvas = page.locator('svg-canvas svg');
  const headerRect = canvas.locator('#header rect').first();
  await headerRect.click();
  
  // Verify selection in hierarchy
  const hierarchy = page.locator('svg-hierarchy-panel');
  const selectedNode = hierarchy.locator('.selected');
  await expect(selectedNode).toContainText('rect');
  
  // Verify selection in inspector
  const inspector = page.locator('svg-attribute-inspector');
  await expect(inspector.getByLabel('x')).toHaveValue('0');
  await expect(inspector.getByLabel('y')).toHaveValue('0');
  await expect(inspector.getByLabel('width')).toHaveValue('1120');
  
  // Verify selection in raw SVG (highlighted)
  const rawPanel = page.locator('svg-raw-panel');
  const highlightedText = rawPanel.locator('.highlighted');
  await expect(highlightedText).toContainText('rect');
});
```

### Scenario 4: Attribute Editing

**Test:** `e2e/svg-editing.spec.ts`

```typescript
test('should edit element attributes and update all views', async ({ page }) => {
  await page.goto('/');
  await loadTestSVG(page);
  
  // Select the sun circle in the scene
  const canvas = page.locator('svg-canvas svg');
  const sunCircle = canvas.locator('circle[fill*="grad-sun"]');
  await sunCircle.click();
  
  // Edit radius in inspector
  const inspector = page.locator('svg-attribute-inspector');
  const radiusInput = inspector.getByLabel('r');
  await radiusInput.fill('60'); // Change from 44 to 60
  await radiusInput.press('Enter');
  
  // Verify canvas updated
  await expect(sunCircle).toHaveAttribute('r', '60');
  
  // Verify raw SVG updated
  const rawPanel = page.locator('svg-raw-panel');
  const rawText = await rawPanel.textContent();
  expect(rawText).toContain('r="60"');
  
  // Take screenshot to verify visual change
  await expect(canvas).toHaveScreenshot('sun-circle-enlarged.png');
});
```

### Scenario 5: Raw SVG Editing

**Test:** `e2e/svg-editing.spec.ts`

```typescript
test('should parse raw SVG edits and update document', async ({ page }) => {
  await page.goto('/');
  await loadTestSVG(page);
  
  // Edit raw SVG text
  const rawPanel = page.locator('svg-raw-panel');
  const textarea = rawPanel.locator('textarea');
  
  // Get current content
  let content = await textarea.inputValue();
  
  // Add a new circle
  content = content.replace(
    '</svg>',
    '  <circle cx="600" cy="400" r="50" fill="purple" id="test-circle"/>\n</svg>'
  );
  
  await textarea.fill(content);
  await textarea.press('Control+Enter'); // Trigger parse
  
  // Verify canvas shows new circle
  const canvas = page.locator('svg-canvas svg');
  const newCircle = canvas.locator('#test-circle');
  await expect(newCircle).toBeVisible();
  await expect(newCircle).toHaveAttribute('fill', 'purple');
  
  // Verify hierarchy shows new element
  const hierarchy = page.locator('svg-hierarchy-panel');
  await expect(hierarchy.getByText('test-circle')).toBeVisible();
});
```

### Scenario 6: Error Handling

**Test:** `e2e/svg-editing.spec.ts`

```typescript
test('should display parse errors for invalid SVG', async ({ page }) => {
  await page.goto('/');
  await loadTestSVG(page);
  
  // Edit raw SVG with invalid syntax
  const rawPanel = page.locator('svg-raw-panel');
  const textarea = rawPanel.locator('textarea');
  
  let content = await textarea.inputValue();
  // Remove closing tag to create error
  content = content.replace('</svg>', '');
  
  await textarea.fill(content);
  await textarea.press('Control+Enter');
  
  // Verify error message displayed
  const errorMessage = rawPanel.locator('.error-message');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('parse error');
  
  // Verify document state unchanged (rollback)
  const canvas = page.locator('svg-canvas svg');
  await expect(canvas).toBeVisible(); // Still shows valid SVG
});
```

### Scenario 7: Tool Palette Interactions

**Test:** `e2e/tool-palette.spec.ts`

```typescript
test('should create new elements using tool palette', async ({ page }) => {
  await page.goto('/');
  await loadTestSVG(page);
  
  // Select rectangle tool
  const toolPalette = page.locator('svg-tool-palette');
  const rectTool = toolPalette.getByRole('button', { name: /rectangle/i });
  await rectTool.click();
  
  // Draw rectangle on canvas
  const canvas = page.locator('svg-canvas');
  await canvas.click({ position: { x: 100, y: 100 } });
  await canvas.click({ position: { x: 200, y: 200 } });
  
  // Verify new rectangle created
  const svg = canvas.locator('svg');
  const newRects = svg.locator('rect');
  const count = await newRects.count();
  expect(count).toBeGreaterThan(0);
  
  // Verify hierarchy updated
  const hierarchy = page.locator('svg-hierarchy-panel');
  await expect(hierarchy.getByText(/rect/i)).toBeVisible();
});
```

### Scenario 8: File Operations

**Test:** `e2e/file-operations.spec.ts`

```typescript
test('should save edited SVG file', async ({ page }) => {
  await page.goto('/');
  await loadTestSVG(page);
  
  // Make an edit
  const canvas = page.locator('svg-canvas svg');
  const circle = canvas.locator('circle').first();
  await circle.click();
  
  const inspector = page.locator('svg-attribute-inspector');
  await inspector.getByLabel('fill').fill('red');
  
  // Trigger save
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press('Control+S');
  const download = await downloadPromise;
  
  // Verify file downloaded
  expect(download.suggestedFilename()).toMatch(/\.svg$/);
  
  // Verify content
  const path = await download.path();
  const content = await fs.readFile(path, 'utf-8');
  expect(content).toContain('fill="red"');
});
```

## Performance Testing

### Scenario 9: Large Document Performance

**Test:** `e2e/performance.spec.ts`

```typescript
test('should handle 1000+ element documents smoothly', async ({ page }) => {
  await page.goto('/');
  
  // Generate large SVG
  const largeSVG = generateLargeSVG(1000);
  await loadSVGContent(page, largeSVG);
  
  // Measure selection performance
  const startTime = Date.now();
  
  const canvas = page.locator('svg-canvas svg');
  const element = canvas.locator('rect').nth(500);
  await element.click();
  
  const inspector = page.locator('svg-attribute-inspector');
  await expect(inspector.getByLabel('x')).toBeVisible();
  
  const duration = Date.now() - startTime;
  
  // Should complete within 100ms
  expect(duration).toBeLessThan(100);
});
```

## Visual Regression Testing

### Scenario 10: Visual Consistency

**Test:** `e2e/visual-regression.spec.ts`

```typescript
test('should render test.svg consistently', async ({ page }) => {
  await page.goto('/');
  await loadTestSVG(page);
  
  // Wait for full render
  await page.waitForTimeout(500);
  
  // Compare full page
  await expect(page).toHaveScreenshot('full-editor.png', {
    maxDiffPixels: 100,
  });
  
  // Compare canvas only
  const canvas = page.locator('svg-canvas');
  await expect(canvas).toHaveScreenshot('canvas-only.png');
  
  // Compare hierarchy panel
  const hierarchy = page.locator('svg-hierarchy-panel');
  await expect(hierarchy).toHaveScreenshot('hierarchy-panel.png');
});
```

## Accessibility Testing

### Scenario 11: Keyboard Navigation

**Test:** `e2e/accessibility.spec.ts`

```typescript
test('should support keyboard navigation', async ({ page }) => {
  await page.goto('/');
  await loadTestSVG(page);
  
  // Tab through UI
  await page.keyboard.press('Tab'); // Focus on first element
  await page.keyboard.press('Tab'); // Move to next
  
  // Verify focus visible
  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
  
  // Test keyboard shortcuts
  await page.keyboard.press('Control+N'); // New document
  // Verify new document dialog or action
  
  await page.keyboard.press('Control+Z'); // Undo
  // Verify undo action
});
```

## Configuration Files

### Playwright Configuration

**File:** `apps/frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Utilities

### Helper Functions

**File:** `apps/frontend/tests/helpers/svg-helpers.ts`

```typescript
import { Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export async function loadTestSVG(page: Page): Promise<void> {
  const svgPath = resolve(__dirname, '../../../test.svg');
  const svgContent = readFileSync(svgPath, 'utf-8');
  await loadSVGContent(page, svgContent);
}

export async function loadSVGContent(page: Page, content: string): Promise<void> {
  // Simulate file upload or paste content
  await page.evaluate((svg) => {
    const event = new CustomEvent('svg:load', { detail: { content: svg } });
    document.dispatchEvent(event);
  }, content);
  
  // Wait for document to load
  await page.waitForSelector('svg-canvas svg', { state: 'visible' });
}

export function generateLargeSVG(elementCount: number): string {
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10000" height="10000">\n';
  
  for (let i = 0; i < elementCount; i++) {
    const x = (i % 100) * 100;
    const y = Math.floor(i / 100) * 100;
    svg += `  <rect id="rect${i}" x="${x}" y="${y}" width="50" height="50" fill="blue"/>\n`;
  }
  
  svg += '</svg>';
  return svg;
}
```

## CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/ui-tests.yml`

```yaml
name: UI Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Run unit tests
        run: npm run test
        working-directory: apps/frontend
        
      - name: Run E2E tests
        run: npx playwright test
        working-directory: apps/frontend
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: apps/frontend/playwright-report/
          
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: apps/frontend/test-results/
```

## Test Coverage Goals

- **Unit Tests:** 80%+ coverage for state management and utilities
- **Integration Tests:** Cover all component interactions
- **E2E Tests:** Cover all critical user workflows
- **Visual Regression:** Baseline for all major views

## Next Steps

1. Install Playwright: `npm install -D @playwright/test`
2. Create test fixtures (copy test.svg to tests/fixtures/)
3. Implement helper utilities
4. Write E2E tests for core workflows
5. Set up visual regression testing
6. Configure CI/CD pipeline
7. Document test maintenance procedures

## Maintenance

- Update visual baselines when intentional UI changes are made
- Review and update tests when features change
- Monitor test execution time and optimize slow tests
- Keep test data (fixtures) up to date with application changes
