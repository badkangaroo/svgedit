# UI Testing Expansion - Design Document

## Overview
This design document outlines the implementation strategy for expanding the Playwright UI test suite to comprehensively cover SVG editing functions in the editor application.

## Architecture

### Test Organization Structure
```
apps/frontend/tests/e2e/playwright/
├── svg-editor.spec.ts              # Existing basic tests
├── element-selection.spec.ts       # NEW: Selection tests
├── attribute-editing.spec.ts       # NEW: Attribute modification tests
├── tool-palette.spec.ts            # NEW: Primitive creation tests
├── drag-operations.spec.ts         # NEW: Drag-to-move tests
├── keyboard-shortcuts.spec.ts      # NEW: Keyboard interaction tests
├── file-operations.spec.ts         # NEW: File menu tests
├── hierarchy-panel.spec.ts         # NEW: Hierarchy interaction tests
├── raw-svg-panel.spec.ts           # NEW: Raw SVG editing tests
├── performance.spec.ts             # NEW: Performance benchmarks
└── accessibility.spec.ts           # NEW: A11y tests
```

### Helper Functions Structure
```
apps/frontend/tests/helpers/
├── svg-helpers.ts                  # Existing helpers
├── selection-helpers.ts            # NEW: Selection utilities
├── attribute-helpers.ts            # NEW: Attribute editing utilities
├── tool-helpers.ts                 # NEW: Tool palette utilities
├── drag-helpers.ts                 # NEW: Drag operation utilities
└── test-data-generators.ts         # NEW: Test SVG generation
```

## Component Interaction Map

### Shadow DOM Navigation Strategy

The SVG editor uses Web Components with Shadow DOM. Tests must pierce shadow boundaries:

```typescript
// Pattern for accessing shadow DOM elements
const app = page.locator('svg-editor-app');
const canvas = app.locator('svg-canvas');
const hierarchy = app.locator('svg-hierarchy-panel');
const inspector = app.locator('svg-attribute-inspector');
const toolPalette = app.locator('svg-tool-palette');
```

### State Synchronization Points
Tests must verify synchronization across:
1. **Canvas** ↔ **Hierarchy Panel** ↔ **Attribute Inspector**
2. **Attribute Inspector** ↔ **Raw SVG Panel**
3. **Tool Palette** ↔ **Canvas** (active tool state)

## Detailed Component Designs

### 1. Element Selection Tests (`element-selection.spec.ts`)

**Test Strategy:**
- Use programmatic SVG loading to ensure consistent test data
- Verify visual indicators (selection outlines, highlights)
- Test synchronization across all panels

**Key Test Cases:**
```typescript
test.describe('Element Selection', () => {
  test('should select element on canvas click', async ({ page }) => {
    // Load test SVG with known elements
    await loadTestSVG(page);
    
    // Click element in canvas
    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator('svg rect[id="test-rect"]');
    await rect.click();
    
    // Verify selection in canvas (outline visible)
    const selectionOutline = canvas.locator('.selection-outline');
    await expect(selectionOutline).toBeVisible();
    
    // Verify selection in hierarchy
    const hierarchy = page.locator('svg-hierarchy-panel');
    const selectedNode = hierarchy.locator('.node-content.selected');
    await expect(selectedNode).toContainText('rect');
    
    // Verify selection in inspector
    const inspector = page.locator('svg-attribute-inspector');
    await expect(inspector.locator('.element-tag')).toContainText('rect');
  });
  
  test('should support multi-select with Ctrl key', async ({ page }) => {
    // Implementation details...
  });
});
```

**Helper Functions Needed:**
- `selectElement(page, elementId)` - Select element by ID
- `verifySelectionSync(page, elementIds)` - Verify selection across panels
- `getSelectedElements(page)` - Get currently selected element IDs

### 2. Attribute Editing Tests (`attribute-editing.spec.ts`)

**Test Strategy:**
- Focus on common attribute types: numeric, color, text
- Test validation and error handling
- Verify updates propagate to all views

**Key Test Cases:**
```typescript
test.describe('Attribute Editing', () => {
  test('should edit numeric attributes', async ({ page }) => {
    await loadTestSVG(page);
    await selectElement(page, 'test-rect');
    
    const inspector = page.locator('svg-attribute-inspector');
    
    // Edit width attribute
    const widthInput = inspector.getByLabel('Width');
    await widthInput.fill('200');
    await widthInput.blur();
    
    // Verify canvas updated
    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator('svg rect[id="test-rect"]');
    await expect(rect).toHaveAttribute('width', '200');
    
    // Verify raw SVG updated
    const rawPanel = page.locator('svg-raw-panel');
    const rawText = await rawPanel.textContent();
    expect(rawText).toContain('width="200"');
  });
  
  test('should validate color attributes', async ({ page }) => {
    // Test valid and invalid color formats
    // Verify error messages for invalid input
  });
  
  test('should reject invalid numeric values', async ({ page }) => {
    // Test validation for negative values, non-numbers, etc.
  });
});
```

**Helper Functions Needed:**
- `editAttribute(page, attributeName, value)` - Edit attribute value
- `verifyAttributeValue(page, elementId, attributeName, expectedValue)` - Verify attribute
- `expectValidationError(page, attributeName, errorMessage)` - Check validation

### 3. Tool Palette Tests (`tool-palette.spec.ts`)

**Test Strategy:**
- Test each primitive creation tool (rectangle, circle, ellipse, line, path)
- Verify preview during drag
- Verify auto-selection after creation

**Key Test Cases:**
```typescript
test.describe('Tool Palette', () => {
  test('should create rectangle with drag', async ({ page }) => {
    await page.goto('/');
    
    // Select rectangle tool
    const toolPalette = page.locator('svg-tool-palette');
    const rectTool = toolPalette.locator('[data-tool="rectangle"]');
    await rectTool.click();
    
    // Verify tool is active
    await expect(rectTool).toHaveClass(/active/);
    
    // Draw rectangle on canvas
    const canvas = page.locator('svg-canvas');
    const canvasBox = await canvas.boundingBox();
    
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 200, canvasBox.y + 200);
    await page.mouse.up();
    
    // Verify rectangle created
    const svg = canvas.locator('svg');
    const newRect = svg.locator('rect').last();
    await expect(newRect).toBeVisible();
    
    // Verify auto-selected
    const inspector = page.locator('svg-attribute-inspector');
    await expect(inspector.locator('.element-tag')).toContainText('rect');
  });
  
  test('should show preview during drag', async ({ page }) => {
    // Verify preview element appears with opacity and dashed stroke
  });
});
```

**Helper Functions Needed:**
- `selectTool(page, toolName)` - Activate a tool
- `drawPrimitive(page, toolName, startX, startY, endX, endY)` - Create primitive
- `verifyPrimitiveCreated(page, elementType)` - Verify creation

### 4. Drag Operations Tests (`drag-operations.spec.ts`)

**Test Strategy:**
- Test single and multi-element dragging
- Verify position updates in real-time
- Test drag cancellation

**Key Test Cases:**
```typescript
test.describe('Drag Operations', () => {
  test('should move element by dragging', async ({ page }) => {
    await loadTestSVG(page);
    await selectElement(page, 'test-rect');
    
    const canvas = page.locator('svg-canvas');
    const rect = canvas.locator('svg rect[id="test-rect"]');
    
    // Get initial position
    const initialX = await rect.getAttribute('x');
    
    // Drag element
    const rectBox = await rect.boundingBox();
    await page.mouse.move(rectBox.x + 10, rectBox.y + 10);
    await page.mouse.down();
    await page.mouse.move(rectBox.x + 60, rectBox.y + 60);
    await page.mouse.up();
    
    // Verify position changed
    const newX = await rect.getAttribute('x');
    expect(parseFloat(newX)).toBeGreaterThan(parseFloat(initialX));
    
    // Verify inspector updated
    const inspector = page.locator('svg-attribute-inspector');
    const xInput = inspector.getByLabel('X Position');
    expect(await xInput.inputValue()).toBe(newX);
  });
  
  test('should drag multiple selected elements together', async ({ page }) => {
    // Select multiple elements
    // Drag one of them
    // Verify all move together
  });
});
```

**Helper Functions Needed:**
- `dragElement(page, elementId, deltaX, deltaY)` - Drag element
- `getElementPosition(page, elementId)` - Get element coordinates
- `verifyElementMoved(page, elementId, expectedX, expectedY)` - Verify position

### 5. Keyboard Shortcuts Tests (`keyboard-shortcuts.spec.ts`)

**Test Strategy:**
- Test all documented keyboard shortcuts
- Verify shortcuts work from different focus contexts
- Test modifier key combinations

**Key Test Cases:**
```typescript
test.describe('Keyboard Shortcuts', () => {
  test('should create new document with Ctrl+N', async ({ page }) => {
    await loadTestSVG(page);
    
    // Trigger new document
    await page.keyboard.press('Control+N');
    
    // Verify canvas is empty
    const canvas = page.locator('svg-canvas');
    const emptyState = canvas.locator('.empty-state');
    await expect(emptyState).toBeVisible();
  });
  
  test('should save with Ctrl+S', async ({ page }) => {
    await loadTestSVG(page);
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    await page.keyboard.press('Control+S');
    const download = await downloadPromise;
    
    // Verify download occurred
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
  });
  
  test('should switch tools with keyboard shortcuts', async ({ page }) => {
    await page.goto('/');
    
    // Press 'R' for rectangle tool
    await page.keyboard.press('r');
    
    const toolPalette = page.locator('svg-tool-palette');
    const rectTool = toolPalette.locator('[data-tool="rectangle"]');
    await expect(rectTool).toHaveClass(/active/);
  });
});
```

**Helper Functions Needed:**
- `pressShortcut(page, shortcut)` - Press keyboard shortcut
- `verifyShortcutAction(page, action)` - Verify shortcut effect

### 6. File Operations Tests (`file-operations.spec.ts`)

**Test Strategy:**
- Test file menu interactions
- Verify file downloads contain correct content
- Test file upload/open functionality

**Key Test Cases:**
```typescript
test.describe('File Operations', () => {
  test('should open file menu', async ({ page }) => {
    await page.goto('/');
    
    const app = page.locator('svg-editor-app');
    const fileMenu = app.locator('#file-menu');
    await fileMenu.click();
    
    const dropdown = app.locator('#file-menu-dropdown');
    await expect(dropdown).toHaveClass(/show/);
    
    // Verify menu items
    await expect(app.locator('#file-new')).toBeVisible();
    await expect(app.locator('#file-open')).toBeVisible();
    await expect(app.locator('#file-save')).toBeVisible();
  });
  
  test('should save edited document', async ({ page }) => {
    await loadTestSVG(page);
    
    // Make an edit
    await selectElement(page, 'test-rect');
    await editAttribute(page, 'fill', 'red');
    
    // Save
    const downloadPromise = page.waitForEvent('download');
    await page.keyboard.press('Control+S');
    const download = await downloadPromise;
    
    // Verify content
    const path = await download.path();
    const content = await fs.readFile(path, 'utf-8');
    expect(content).toContain('fill="red"');
  });
});
```

**Helper Functions Needed:**
- `openFileMenu(page)` - Open file menu
- `clickMenuItem(page, itemName)` - Click menu item
- `verifyFileDownload(download, expectedContent)` - Verify download

### 7. Hierarchy Panel Tests (`hierarchy-panel.spec.ts`)

**Test Strategy:**
- Test tree navigation and interaction
- Verify expand/collapse functionality
- Test virtual scrolling for large documents

**Key Test Cases:**
```typescript
test.describe('Hierarchy Panel', () => {
  test('should select element from hierarchy', async ({ page }) => {
    await loadTestSVG(page);
    
    const hierarchy = page.locator('svg-hierarchy-panel');
    const node = hierarchy.locator('[data-node-id="test-rect"]');
    await node.click();
    
    // Verify canvas selection
    const canvas = page.locator('svg-canvas');
    const selectionOutline = canvas.locator('.selection-outline');
    await expect(selectionOutline).toBeVisible();
  });
  
  test('should expand and collapse nodes', async ({ page }) => {
    await loadTestSVG(page);
    
    const hierarchy = page.locator('svg-hierarchy-panel');
    const groupNode = hierarchy.locator('[data-node-id="test-group"]');
    const toggle = groupNode.locator('.expand-toggle');
    
    // Expand
    await toggle.click();
    await expect(toggle).toHaveClass(/expanded/);
    
    // Verify children visible
    const children = hierarchy.locator('.node-children.expanded');
    await expect(children).toBeVisible();
  });
  
  test('should enable virtual scrolling for large documents', async ({ page }) => {
    // Generate large SVG with 1500 elements
    const largeSVG = generateLargeSVG(1500);
    await loadSVGContent(page, largeSVG);
    
    const hierarchy = page.locator('svg-hierarchy-panel');
    const indicator = hierarchy.locator('.performance-indicator');
    await expect(indicator).toContainText('Virtual scrolling enabled');
  });
});
```

**Helper Functions Needed:**
- `expandNode(page, nodeId)` - Expand hierarchy node
- `collapseNode(page, nodeId)` - Collapse hierarchy node
- `generateLargeSVG(elementCount)` - Generate test SVG with many elements

### 8. Raw SVG Panel Tests (`raw-svg-panel.spec.ts`)

**Test Strategy:**
- Test direct SVG markup editing
- Verify syntax error handling
- Test synchronization with visual views

**Key Test Cases:**
```typescript
test.describe('Raw SVG Panel', () => {
  test('should display current SVG markup', async ({ page }) => {
    await loadTestSVG(page);
    
    const rawPanel = page.locator('svg-raw-panel');
    const textarea = rawPanel.locator('textarea');
    const content = await textarea.inputValue();
    
    // Verify contains expected elements
    expect(content).toContain('<svg');
    expect(content).toContain('</svg>');
  });
  
  test('should update canvas when raw SVG edited', async ({ page }) => {
    await loadTestSVG(page);
    
    const rawPanel = page.locator('svg-raw-panel');
    const textarea = rawPanel.locator('textarea');
    
    // Add new element
    let content = await textarea.inputValue();
    content = content.replace('</svg>', 
      '<circle cx="100" cy="100" r="50" fill="blue" id="new-circle"/></svg>');
    
    await textarea.fill(content);
    await page.keyboard.press('Control+Enter'); // Trigger parse
    
    // Verify canvas updated
    const canvas = page.locator('svg-canvas');
    const newCircle = canvas.locator('svg #new-circle');
    await expect(newCircle).toBeVisible();
  });
  
  test('should show error for invalid SVG', async ({ page }) => {
    await loadTestSVG(page);
    
    const rawPanel = page.locator('svg-raw-panel');
    const textarea = rawPanel.locator('textarea');
    
    // Create invalid SVG
    await textarea.fill('<svg><rect></svg>'); // Missing closing tag
    await page.keyboard.press('Control+Enter');
    
    // Verify error message
    const errorMessage = rawPanel.locator('.error-message');
    await expect(errorMessage).toBeVisible();
  });
});
```

**Helper Functions Needed:**
- `getRawSVG(page)` - Get raw SVG content
- `setRawSVG(page, content)` - Set raw SVG content
- `triggerRawSVGParse(page)` - Trigger parsing

### 9. Performance Tests (`performance.spec.ts`)

**Test Strategy:**
- Measure operation timing
- Test with various document sizes
- Verify responsiveness benchmarks

**Key Test Cases:**
```typescript
test.describe('Performance', () => {
  test('should select elements quickly', async ({ page }) => {
    await loadTestSVG(page);
    
    const startTime = Date.now();
    await selectElement(page, 'test-rect');
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(100); // 100ms threshold
  });
  
  test('should handle large documents efficiently', async ({ page }) => {
    const largeSVG = generateLargeSVG(1000);
    
    const startTime = Date.now();
    await loadSVGContent(page, largeSVG);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000); // 2 second threshold
    
    // Test selection performance
    const selectStart = Date.now();
    await selectElement(page, 'rect500');
    const selectTime = Date.now() - selectStart;
    
    expect(selectTime).toBeLessThan(100);
  });
  
  test('should maintain smooth drag operations', async ({ page }) => {
    await loadTestSVG(page);
    await selectElement(page, 'test-rect');
    
    // Measure frame rate during drag
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frames = 0;
        const startTime = performance.now();
        
        const countFrames = () => {
          frames++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frames);
          }
        };
        
        requestAnimationFrame(countFrames);
      });
    });
    
    expect(metrics).toBeGreaterThan(55); // ~60fps
  });
});
```

**Performance Thresholds:**
- Element selection: < 100ms
- Attribute update: < 50ms
- Large document load (1000 elements): < 2s
- Drag operations: 55+ fps

### 10. Accessibility Tests (`accessibility.spec.ts`)

**Test Strategy:**
- Verify ARIA labels and roles
- Test keyboard navigation
- Verify focus management

**Key Test Cases:**
```typescript
test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Verify tool palette buttons
    const toolPalette = page.locator('svg-tool-palette');
    const selectTool = toolPalette.locator('[aria-label="Select tool"]');
    await expect(selectTool).toBeVisible();
    
    const rectTool = toolPalette.locator('[aria-label="Rectangle tool"]');
    await expect(rectTool).toBeVisible();
    
    // Verify theme toggle
    const app = page.locator('svg-editor-app');
    const themeToggle = app.locator('[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeVisible();
  });
  
  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
    
    // Verify focus visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
  
  test('should announce state changes', async ({ page }) => {
    await loadTestSVG(page);
    
    // Select element
    await selectElement(page, 'test-rect');
    
    // Verify aria-pressed state on tool buttons
    const toolPalette = page.locator('svg-tool-palette');
    const selectTool = toolPalette.locator('[data-tool="select"]');
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
  });
});
```

**Accessibility Requirements:**
- All interactive elements must have ARIA labels
- Keyboard navigation must work for all controls
- Focus indicators must be visible
- State changes must be announced

## Helper Functions Design

### Selection Helpers (`selection-helpers.ts`)

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * Select an element by ID in the canvas
 */
export async function selectElement(page: Page, elementId: string): Promise<void> {
  const canvas = page.locator('svg-canvas');
  const element = canvas.locator(`svg [id="${elementId}"]`);
  await element.click();
}

/**
 * Select multiple elements with Ctrl+Click
 */
export async function selectMultipleElements(page: Page, elementIds: string[]): Promise<void> {
  for (let i = 0; i < elementIds.length; i++) {
    const canvas = page.locator('svg-canvas');
    const element = canvas.locator(`svg [id="${elementIds[i]}"]`);
    
    if (i === 0) {
      await element.click();
    } else {
      await element.click({ modifiers: ['Control'] });
    }
  }
}

/**
 * Verify selection is synchronized across all panels
 */
export async function verifySelectionSync(
  page: Page, 
  elementIds: string[]
): Promise<void> {
  // Verify canvas selection
  const canvas = page.locator('svg-canvas');
  const selectionOutlines = canvas.locator('.selection-outline');
  const count = await selectionOutlines.count();
  expect(count).toBe(elementIds.length);
  
  // Verify hierarchy selection
  const hierarchy = page.locator('svg-hierarchy-panel');
  for (const id of elementIds) {
    const node = hierarchy.locator(`[data-node-id="${id}"]`);
    await expect(node).toHaveClass(/selected/);
  }
  
  // Verify inspector (single selection only)
  if (elementIds.length === 1) {
    const inspector = page.locator('svg-attribute-inspector');
    await expect(inspector.locator('.element-info')).toBeVisible();
  }
}

/**
 * Get currently selected element IDs
 */
export async function getSelectedElements(page: Page): Promise<string[]> {
  const hierarchy = page.locator('svg-hierarchy-panel');
  const selectedNodes = hierarchy.locator('.node-content.selected');
  const count = await selectedNodes.count();
  
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const node = selectedNodes.nth(i);
    const id = await node.getAttribute('data-node-id');
    if (id) ids.push(id);
  }
  
  return ids;
}
```

### Attribute Helpers (`attribute-helpers.ts`)

```typescript
import { Page } from '@playwright/test';

/**
 * Edit an attribute value in the inspector
 */
export async function editAttribute(
  page: Page, 
  attributeName: string, 
  value: string
): Promise<void> {
  const inspector = page.locator('svg-attribute-inspector');
  const input = inspector.locator(`[data-attribute-name="${attributeName}"] input`);
  
  await input.fill(value);
  await input.blur(); // Trigger change event
}

/**
 * Verify attribute value in canvas element
 */
export async function verifyAttributeValue(
  page: Page,
  elementId: string,
  attributeName: string,
  expectedValue: string
): Promise<void> {
  const canvas = page.locator('svg-canvas');
  const element = canvas.locator(`svg [id="${elementId}"]`);
  await expect(element).toHaveAttribute(attributeName, expectedValue);
}

/**
 * Expect validation error for attribute
 */
export async function expectValidationError(
  page: Page,
  attributeName: string,
  errorMessage: string
): Promise<void> {
  const inspector = page.locator('svg-attribute-inspector');
  const field = inspector.locator(`[data-attribute-name="${attributeName}"]`);
  await expect(field).toHaveClass(/error/);
  
  const error = field.locator('.attribute-error');
  await expect(error).toContainText(errorMessage);
}
```

### Tool Helpers (`tool-helpers.ts`)

```typescript
import { Page } from '@playwright/test';

/**
 * Select a tool from the palette
 */
export async function selectTool(page: Page, toolName: string): Promise<void> {
  const toolPalette = page.locator('svg-tool-palette');
  const tool = toolPalette.locator(`[data-tool="${toolName}"]`);
  await tool.click();
}

/**
 * Draw a primitive on the canvas
 */
export async function drawPrimitive(
  page: Page,
  toolName: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): Promise<void> {
  await selectTool(page, toolName);
  
  const canvas = page.locator('svg-canvas');
  const canvasBox = await canvas.boundingBox();
  
  if (!canvasBox) throw new Error('Canvas not found');
  
  await page.mouse.move(canvasBox.x + startX, canvasBox.y + startY);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + endX, canvasBox.y + endY);
  await page.mouse.up();
}

/**
 * Verify a primitive was created
 */
export async function verifyPrimitiveCreated(
  page: Page,
  elementType: string
): Promise<void> {
  const canvas = page.locator('svg-canvas');
  const element = canvas.locator(`svg ${elementType}`).last();
  await expect(element).toBeVisible();
}
```

### Drag Helpers (`drag-helpers.ts`)

```typescript
import { Page } from '@playwright/test';

/**
 * Drag an element by delta
 */
export async function dragElement(
  page: Page,
  elementId: string,
  deltaX: number,
  deltaY: number
): Promise<void> {
  const canvas = page.locator('svg-canvas');
  const element = canvas.locator(`svg [id="${elementId}"]`);
  
  const box = await element.boundingBox();
  if (!box) throw new Error(`Element ${elementId} not found`);
  
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY);
  await page.mouse.up();
}

/**
 * Get element position
 */
export async function getElementPosition(
  page: Page,
  elementId: string
): Promise<{ x: number; y: number }> {
  const canvas = page.locator('svg-canvas');
  const element = canvas.locator(`svg [id="${elementId}"]`);
  
  const tagName = await element.evaluate(el => el.tagName.toLowerCase());
  
  if (tagName === 'rect' || tagName === 'image') {
    const x = await element.getAttribute('x');
    const y = await element.getAttribute('y');
    return { x: parseFloat(x || '0'), y: parseFloat(y || '0') };
  } else if (tagName === 'circle' || tagName === 'ellipse') {
    const cx = await element.getAttribute('cx');
    const cy = await element.getAttribute('cy');
    return { x: parseFloat(cx || '0'), y: parseFloat(cy || '0') };
  }
  
  return { x: 0, y: 0 };
}

/**
 * Verify element moved to expected position
 */
export async function verifyElementMoved(
  page: Page,
  elementId: string,
  expectedX: number,
  expectedY: number,
  tolerance: number = 1
): Promise<void> {
  const position = await getElementPosition(page, elementId);
  
  expect(Math.abs(position.x - expectedX)).toBeLessThan(tolerance);
  expect(Math.abs(position.y - expectedY)).toBeLessThan(tolerance);
}
```

### Test Data Generators (`test-data-generators.ts`)

```typescript
/**
 * Generate a large SVG document for performance testing
 */
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

/**
 * Generate a simple test SVG with known elements
 */
export function generateTestSVG(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect id="test-rect" x="100" y="100" width="100" height="100" fill="red"/>
  <circle id="test-circle" cx="300" cy="150" r="50" fill="blue"/>
  <g id="test-group">
    <rect id="group-rect-1" x="400" y="100" width="50" height="50" fill="green"/>
    <rect id="group-rect-2" x="460" y="100" width="50" height="50" fill="yellow"/>
  </g>
</svg>
  `.trim();
}
```

## Test Execution Strategy

### Parallel Execution
Tests will be organized to run in parallel where possible:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e/playwright',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  
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
});
```

### Test Isolation
Each test should:
1. Start with a clean state (fresh page load)
2. Load test data programmatically
3. Clean up after execution
4. Not depend on other tests

### Retry Strategy
```typescript
// For flaky tests in CI
retries: process.env.CI ? 2 : 0,
```

## CI/CD Integration

### GitHub Actions Workflow
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
        working-directory: apps/frontend
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        working-directory: apps/frontend
        
      - name: Run Playwright tests
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
          name: test-failures
          path: apps/frontend/test-results/
```

## Test Data Management

### SVG Test Fixtures
Store reusable test SVG files in `tests/fixtures/`:

```
tests/fixtures/
├── simple.svg          # Minimal SVG with basic shapes
├── complex.svg         # Complex nested structure
├── large.svg           # 1000+ elements for performance testing
└── test.svg            # Copy of root test.svg
```

### Programmatic Loading
Prefer programmatic loading over file uploads for consistency:

```typescript
// Load SVG content directly into document state
await page.evaluate((content) => {
  const parser = new window.SVGParser();
  const result = parser.parse(content);
  
  if (result.success) {
    window.documentStateUpdater.setDocument(
      result.document, 
      result.tree, 
      content
    );
  }
}, svgContent);
```

## Error Handling and Debugging

### Screenshot on Failure
```typescript
test('should do something', async ({ page }) => {
  try {
    // Test logic
  } catch (error) {
    await page.screenshot({ path: 'failure-screenshot.png' });
    throw error;
  }
});
```

### Video Recording
```typescript
// playwright.config.ts
use: {
  video: 'retain-on-failure',
  trace: 'on-first-retry',
}
```

### Console Logging
```typescript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', error => console.log('PAGE ERROR:', error));
```

## Maintenance Guidelines

### Updating Tests
When component behavior changes:
1. Update helper functions first
2. Run affected tests to identify failures
3. Update test expectations
4. Verify all browsers pass

### Adding New Tests
1. Identify the feature area
2. Add test to appropriate spec file
3. Use existing helper functions
4. Add new helpers if needed
5. Verify test passes in all browsers

### Handling Flaky Tests
1. Identify root cause (timing, race conditions)
2. Add explicit waits where needed
3. Use Playwright's auto-waiting features
4. Consider retry strategy for CI

## Implementation Phases

### Phase 1: Core Functionality (Priority: High)
- Element selection tests
- Attribute editing tests
- Tool palette tests
- Helper function library

**Estimated Effort:** 3-4 days

### Phase 2: Advanced Interactions (Priority: High)
- Drag operations tests
- Keyboard shortcuts tests
- File operations tests

**Estimated Effort:** 2-3 days

### Phase 3: Panel Interactions (Priority: Medium)
- Hierarchy panel tests
- Raw SVG panel tests

**Estimated Effort:** 2 days

### Phase 4: Quality & Performance (Priority: Medium)
- Performance tests
- Accessibility tests
- Visual regression tests

**Estimated Effort:** 2-3 days

### Phase 5: CI/CD Integration (Priority: High)
- GitHub Actions workflow
- Test reporting
- Failure notifications

**Estimated Effort:** 1 day

**Total Estimated Effort:** 10-13 days

## Success Criteria

### Test Coverage
- ✅ 90%+ coverage of editing functions
- ✅ All critical user workflows tested
- ✅ Edge cases and error conditions covered

### Test Quality
- ✅ Zero flaky tests in CI
- ✅ All tests pass across 3 browsers
- ✅ Test execution time < 5 minutes

### Maintainability
- ✅ Helper functions reduce duplication
- ✅ Clear test organization
- ✅ Comprehensive documentation

### CI/CD Integration
- ✅ Automated test execution on PR
- ✅ Test reports generated
- ✅ Failures block merges

## Risk Mitigation

### Risk: Shadow DOM Complexity
**Mitigation:** Create robust helper functions that handle shadow DOM piercing consistently

### Risk: Timing Issues
**Mitigation:** Use Playwright's built-in auto-waiting and explicit waits where needed

### Risk: Browser Inconsistencies
**Mitigation:** Test across all three browsers early and often

### Risk: Test Maintenance Burden
**Mitigation:** Invest in helper functions and clear test organization upfront

## Implementation Notes

### Reactivity and State Management
- `svg-canvas` relies on `svgDocument` signal for rendering.
- `SVGAttributeInspector` modifies the `svgDocument` DOM structure in-place.
- Signals (reference-based) do not automatically emit when an object property is mutated in-place.
- **CRITICAL**: `svg-canvas` MUST subscribe to `rawSVG` signal in addition to `svgDocument` to catch updates triggered by `SVGAttributeInspector`. The inspector updates `rawSVG` via `documentStateUpdater` after modifying attributes.
- This pattern ensures that `svg-canvas` re-renders (cloning the updated document) whenever attributes change, maintaining consistency across views.

### Tool Palette Testing
- Tool activation relies on `toolPaletteState.activeTool`.
- Drag operations in Playwright (headless) can be flaky if canvas dimensions or visibility are not fully stabilized.
- Ensure proper waits (`waitForEditorReady`, `waitForTimeout`) after selecting tools and before dragging to allow state propagation.
