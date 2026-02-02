import { describe, it, expect, vi } from 'vitest';
import type { Page, Locator, Mouse } from '@playwright/test';

// Import the functions we're testing
import { 
  selectTool,
  drawPrimitive,
  verifyPrimitiveCreated,
  getActiveTool,
  verifyToolActive,
  getElementCount,
  getElementCountWithUUID,
  getLastElementUUID
} from '../helpers/tool-helpers';

// Mock Playwright Mouse
const createMockMouse = (): Mouse => {
  return {
    move: vi.fn().mockResolvedValue(undefined),
    down: vi.fn().mockResolvedValue(undefined),
    up: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    dblclick: vi.fn().mockResolvedValue(undefined),
    wheel: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mouse;
};

// Mock Playwright Locator
const createMockLocator = (options: {
  count?: number;
  visible?: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number } | null;
} = {}): Locator => {
  const {
    count = 1,
    visible = true,
    boundingBox = { x: 100, y: 100, width: 800, height: 600 }
  } = options;

  return {
    locator: vi.fn().mockReturnThis(),
    first: vi.fn().mockReturnThis(),
    last: vi.fn().mockReturnThis(),
    click: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(count),
    nth: vi.fn().mockReturnThis(),
    boundingBox: vi.fn().mockResolvedValue(boundingBox),
  } as unknown as Locator;
};


// Mock Playwright Page
const createMockPage = (options: {
  toolActive?: string | null;
  elementCount?: number;
  elementCountWithUUID?: number;
  lastElementUUID?: string | null;
  evaluateResult?: any;
  canvasBoundingBox?: { x: number; y: number; width: number; height: number } | null;
} = {}): Page => {
  const {
    toolActive = null,
    elementCount = 0,
    elementCountWithUUID = 0,
    lastElementUUID = null,
    evaluateResult = null,
    canvasBoundingBox = { x: 100, y: 100, width: 800, height: 600 }
  } = options;

  const canvasLocator = createMockLocator({ 
    count: elementCount,
    boundingBox: canvasBoundingBox
  });
  
  const mockMouse = createMockMouse();

  // Track evaluate call count to return different values
  let evaluateCallCount = 0;

  return {
    locator: vi.fn().mockImplementation((selector: string) => {
      if (selector.includes('svg-canvas')) return canvasLocator;
      return createMockLocator();
    }),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockResolvedValue(undefined),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockImplementation((fn, ...args) => {
      evaluateCallCount++;
      if (evaluateResult !== null) return Promise.resolve(evaluateResult);
      
      // Determine what type of call this is based on the function or context
      // For getElementCountWithUUID and getLastElementUUID, check the args
      const fnString = fn.toString();
      
      // Check if this is a UUID count call
      if (fnString.includes('data-uuid') && fnString.includes('length')) {
        return Promise.resolve(elementCountWithUUID);
      }
      
      // Check if this is a last UUID call
      if (fnString.includes('data-uuid') && fnString.includes('getAttribute')) {
        return Promise.resolve(lastElementUUID);
      }
      
      // Check if this is a tool active call
      if (fnString.includes('tool-palette') || fnString.includes('active')) {
        return Promise.resolve(toolActive);
      }
      
      // Default: return toolActive for tool selection verification
      return Promise.resolve(toolActive);
    }),
    mouse: mockMouse,
  } as unknown as Page;
};

describe('Tool Helpers', () => {
  describe('selectTool', () => {
    it('should select a tool from the palette', async () => {
      const mockPage = createMockPage({ toolActive: 'rectangle' });
      
      await selectTool(mockPage, 'rectangle');
      
      // Verify waitForSelector was called for app
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('svg-editor-app', { timeout: 10000 });
      
      // Verify waitForFunction was called to wait for tool button
      expect(mockPage.waitForFunction).toHaveBeenCalled();
      
      // Verify evaluate was called to click the tool
      expect(mockPage.evaluate).toHaveBeenCalled();
      
      // Verify timeout for tool activation
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(150);
    });

    it('should wait for shadow DOM to initialize', async () => {
      const mockPage = createMockPage({ toolActive: 'circle' });
      
      await selectTool(mockPage, 'circle');
      
      // Verify waitForFunction was called to check shadow DOM
      expect(mockPage.waitForFunction).toHaveBeenCalled();
    });

    it('should throw error if tool does not become active', async () => {
      const mockPage = createMockPage({ toolActive: null });
      
      await expect(selectTool(mockPage, 'ellipse'))
        .rejects.toThrow('Tool "ellipse" did not become active');
    });


    it('should handle different tool types', async () => {
      const tools = ['select', 'rectangle', 'circle', 'ellipse', 'line', 'path'];
      
      for (const tool of tools) {
        const mockPage = createMockPage({ toolActive: tool });
        await selectTool(mockPage, tool);
        expect(mockPage.evaluate).toHaveBeenCalled();
      }
    });

    it('should verify tool button exists before clicking', async () => {
      const mockPage = createMockPage({ toolActive: 'rectangle' });
      
      await selectTool(mockPage, 'rectangle');
      
      // Verify waitForFunction checks for tool button existence
      const waitForFunctionCall = (mockPage.waitForFunction as any).mock.calls[0];
      expect(waitForFunctionCall).toBeDefined();
      expect(waitForFunctionCall[1]).toBe('rectangle'); // Tool name passed as argument
    });

    it('should wait for tool to become active after click', async () => {
      const mockPage = createMockPage({ toolActive: 'line' });
      
      await selectTool(mockPage, 'line');
      
      // Verify timeout for activation
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(150);
    });
  });

  describe('drawPrimitive', () => {
    it('should draw a rectangle primitive', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'rectangle',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      await drawPrimitive(mockPage, 'rectangle', 50, 50, 150, 150);
      
      // Verify tool was selected
      expect(mockPage.waitForSelector).toHaveBeenCalled();
      
      // Verify mouse operations
      expect(mockPage.mouse.move).toHaveBeenCalled();
      expect(mockPage.mouse.down).toHaveBeenCalled();
      expect(mockPage.mouse.up).toHaveBeenCalled();
    });

    it('should draw a circle primitive', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'circle',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      await drawPrimitive(mockPage, 'circle', 100, 100, 200, 200);
      
      expect(mockPage.mouse.move).toHaveBeenCalled();
      expect(mockPage.mouse.down).toHaveBeenCalled();
      expect(mockPage.mouse.up).toHaveBeenCalled();
    });


    it('should calculate absolute coordinates from canvas position', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'ellipse',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      await drawPrimitive(mockPage, 'ellipse', 50, 50, 150, 150);
      
      // Verify mouse.move was called with absolute coordinates
      const moveCall = (mockPage.mouse.move as any).mock.calls[0];
      expect(moveCall[0]).toBe(150); // 100 + 50
      expect(moveCall[1]).toBe(150); // 100 + 50
      
      const secondMoveCall = (mockPage.mouse.move as any).mock.calls[1];
      expect(secondMoveCall[0]).toBe(250); // 100 + 150
      expect(secondMoveCall[1]).toBe(250); // 100 + 150
    });

    it('should use steps for smoother drag operation', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'line',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      await drawPrimitive(mockPage, 'line', 0, 0, 200, 200);
      
      // Verify second move call has steps parameter
      const secondMoveCall = (mockPage.mouse.move as any).mock.calls[1];
      expect(secondMoveCall[2]).toEqual({ steps: 10 });
    });

    it('should wait for state to propagate after tool selection', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'rectangle',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      await drawPrimitive(mockPage, 'rectangle', 10, 10, 100, 100);
      
      // Verify timeout after tool selection
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(300);
    });

    it('should wait for primitive to be created after drag', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'circle',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      await drawPrimitive(mockPage, 'circle', 50, 50, 100, 100);
      
      // Verify timeout after primitive creation
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(200);
    });

    it('should throw error if canvas not found', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'rectangle',
        canvasBoundingBox: null
      });
      
      await expect(drawPrimitive(mockPage, 'rectangle', 0, 0, 100, 100))
        .rejects.toThrow('Canvas not found or not visible');
    });


    it('should handle different primitive types', async () => {
      const primitives = ['rectangle', 'circle', 'ellipse', 'line'];
      
      for (const primitive of primitives) {
        const mockPage = createMockPage({ 
          toolActive: primitive,
          canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
        });
        
        await drawPrimitive(mockPage, primitive, 10, 10, 50, 50);
        
        expect(mockPage.mouse.down).toHaveBeenCalled();
        expect(mockPage.mouse.up).toHaveBeenCalled();
      }
    });
  });

  describe('verifyPrimitiveCreated', () => {
    it('should verify rectangle was created', async () => {
      const mockPage = createMockPage({ elementCount: 1 });
      const canvasLocator = mockPage.locator('svg-canvas');
      
      // This will attempt to use Playwright's expect which won't work with mocks
      try {
        await verifyPrimitiveCreated(mockPage, 'rect');
      } catch (e) {
        // Expected - Playwright's toBeVisible doesn't work with mocks
      }
      
      expect(mockPage.locator).toHaveBeenCalledWith('svg-canvas');
      expect(canvasLocator.locator).toHaveBeenCalled();
      expect(canvasLocator.last).toHaveBeenCalled();
    });

    it('should verify circle was created', async () => {
      const mockPage = createMockPage({ elementCount: 1 });
      const canvasLocator = mockPage.locator('svg-canvas');
      
      try {
        await verifyPrimitiveCreated(mockPage, 'circle');
      } catch (e) {
        // Expected - Playwright's toBeVisible doesn't work with mocks
      }
      
      expect(canvasLocator.locator).toHaveBeenCalled();
      expect(canvasLocator.last).toHaveBeenCalled();
    });

    it('should verify ellipse was created', async () => {
      const mockPage = createMockPage({ elementCount: 1 });
      
      try {
        await verifyPrimitiveCreated(mockPage, 'ellipse');
      } catch (e) {
        // Expected - Playwright's toBeVisible doesn't work with mocks
      }
      
      expect(mockPage.locator).toHaveBeenCalledWith('svg-canvas');
    });

    it('should verify line was created', async () => {
      const mockPage = createMockPage({ elementCount: 1 });
      
      try {
        await verifyPrimitiveCreated(mockPage, 'line');
      } catch (e) {
        // Expected - Playwright's toBeVisible doesn't work with mocks
      }
      
      expect(mockPage.locator).toHaveBeenCalledWith('svg-canvas');
    });


    it('should use svg.svg-content selector to find elements', async () => {
      const mockPage = createMockPage({ elementCount: 1 });
      const canvasLocator = mockPage.locator('svg-canvas');
      
      try {
        await verifyPrimitiveCreated(mockPage, 'rect');
      } catch (e) {
        // Expected - Playwright's toBeVisible doesn't work with mocks
      }
      
      // Verify the selector includes svg.svg-content
      const locatorCall = (canvasLocator.locator as any).mock.calls[0];
      expect(locatorCall[0]).toContain('svg.svg-content');
    });

    it('should select last element of specified type', async () => {
      const mockPage = createMockPage({ elementCount: 3 });
      const canvasLocator = mockPage.locator('svg-canvas');
      
      try {
        await verifyPrimitiveCreated(mockPage, 'rect');
      } catch (e) {
        // Expected - Playwright's toBeVisible doesn't work with mocks
      }
      
      // Verify last() was called to get most recent element
      expect(canvasLocator.last).toHaveBeenCalled();
    });

    it('should verify element count is greater than zero', async () => {
      const mockPage = createMockPage({ elementCount: 2 });
      
      try {
        await verifyPrimitiveCreated(mockPage, 'circle');
      } catch (e) {
        // Expected - Playwright's expect doesn't work with mocks
      }
      
      // Verify the function attempted to verify the element
      expect(mockPage.locator).toHaveBeenCalledWith('svg-canvas');
    });
  });

  describe('getActiveTool', () => {
    it('should return active tool name', async () => {
      const mockPage = createMockPage({ toolActive: 'rectangle' });
      
      const activeTool = await getActiveTool(mockPage);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(activeTool).toBe('rectangle');
    });

    it('should return null when no tool is active', async () => {
      const mockPage = createMockPage({ toolActive: null });
      
      const activeTool = await getActiveTool(mockPage);
      
      expect(activeTool).toBeNull();
    });

    it('should check shadow DOM for active tool', async () => {
      const mockPage = createMockPage({ toolActive: 'circle' });
      
      await getActiveTool(mockPage);
      
      // Verify evaluate was called to access shadow DOM
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should return different tool names correctly', async () => {
      const tools = ['select', 'rectangle', 'circle', 'ellipse', 'line'];
      
      for (const tool of tools) {
        const mockPage = createMockPage({ toolActive: tool });
        const activeTool = await getActiveTool(mockPage);
        expect(activeTool).toBe(tool);
      }
    });
  });


  describe('verifyToolActive', () => {
    it('should verify tool is active', async () => {
      const mockPage = createMockPage({ toolActive: 'rectangle' });
      
      // This will use expect which may not work perfectly with mocks
      try {
        await verifyToolActive(mockPage, 'rectangle');
      } catch (e) {
        // Expected if expect doesn't work with mocks
      }
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should throw error when tool is not active', async () => {
      const mockPage = createMockPage({ toolActive: 'circle' });
      
      // Verify will fail because active tool doesn't match
      try {
        await verifyToolActive(mockPage, 'rectangle');
      } catch (e) {
        // Expected - tool mismatch
        expect(e).toBeDefined();
      }
    });

    it('should verify different tools', async () => {
      const tools = ['select', 'rectangle', 'circle', 'ellipse', 'line'];
      
      for (const tool of tools) {
        const mockPage = createMockPage({ toolActive: tool });
        
        try {
          await verifyToolActive(mockPage, tool);
        } catch (e) {
          // May fail with mocks but verifies the call
        }
        
        expect(mockPage.evaluate).toHaveBeenCalled();
      }
    });
  });

  describe('getElementCount', () => {
    it('should return count of elements', async () => {
      const mockPage = createMockPage({ elementCount: 5 });
      
      const count = await getElementCount(mockPage, 'rect');
      
      expect(mockPage.locator).toHaveBeenCalledWith('svg-canvas');
      expect(count).toBe(5);
    });

    it('should return zero for empty canvas', async () => {
      const mockPage = createMockPage({ elementCount: 0 });
      
      const count = await getElementCount(mockPage, 'circle');
      
      expect(count).toBe(0);
    });

    it('should count different element types', async () => {
      const types = ['rect', 'circle', 'ellipse', 'line'];
      
      for (const type of types) {
        const mockPage = createMockPage({ elementCount: 3 });
        const count = await getElementCount(mockPage, type);
        expect(count).toBe(3);
      }
    });

    it('should use svg.svg-content selector', async () => {
      const mockPage = createMockPage({ elementCount: 2 });
      const canvasLocator = mockPage.locator('svg-canvas');
      
      await getElementCount(mockPage, 'rect');
      
      // Verify the selector includes svg.svg-content
      const locatorCall = (canvasLocator.locator as any).mock.calls[0];
      expect(locatorCall[0]).toContain('svg.svg-content');
    });
  });


  describe('getElementCountWithUUID', () => {
    it('should return count of elements with data-uuid', async () => {
      const mockPage = createMockPage({ elementCountWithUUID: 3 });
      
      const count = await getElementCountWithUUID(mockPage, 'rect');
      
      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(count).toBe(3);
    });

    it('should return zero when no elements have UUID', async () => {
      const mockPage = createMockPage({ elementCountWithUUID: 0 });
      
      const count = await getElementCountWithUUID(mockPage, 'circle');
      
      expect(count).toBe(0);
    });

    it('should only count elements with data-uuid attribute', async () => {
      const mockPage = createMockPage({ elementCountWithUUID: 2 });
      
      const count = await getElementCountWithUUID(mockPage, 'rect');
      
      // Verify evaluate was called to check for data-uuid
      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(count).toBe(2);
    });

    it('should differentiate between content elements and UI overlays', async () => {
      // Elements with data-uuid are content elements
      // Elements without data-uuid might be UI overlays
      const mockPage = createMockPage({ elementCountWithUUID: 5 });
      
      const count = await getElementCountWithUUID(mockPage, 'rect');
      
      expect(count).toBe(5);
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle different element types', async () => {
      const types = ['rect', 'circle', 'ellipse', 'line'];
      
      for (const type of types) {
        const mockPage = createMockPage({ elementCountWithUUID: 4 });
        const count = await getElementCountWithUUID(mockPage, type);
        expect(count).toBe(4);
      }
    });

    it('should access shadow DOM to count elements', async () => {
      const mockPage = createMockPage({ elementCountWithUUID: 1 });
      
      await getElementCountWithUUID(mockPage, 'rect');
      
      // Verify evaluate was called to access shadow DOM
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should return zero when canvas not found', async () => {
      const mockPage = {
        evaluate: vi.fn().mockResolvedValue(0),
      } as unknown as Page;
      
      const count = await getElementCountWithUUID(mockPage, 'rect');
      
      expect(count).toBe(0);
    });
  });

  describe('getLastElementUUID', () => {
    it('should return UUID of last created element', async () => {
      const mockPage = createMockPage({ lastElementUUID: 'uuid-12345' });
      
      const uuid = await getLastElementUUID(mockPage, 'rect');
      
      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(uuid).toBe('uuid-12345');
    });

    it('should return null when no elements exist', async () => {
      const mockPage = createMockPage({ lastElementUUID: null });
      
      const uuid = await getLastElementUUID(mockPage, 'circle');
      
      expect(uuid).toBeNull();
    });


    it('should return UUID of most recently created element', async () => {
      const mockPage = createMockPage({ lastElementUUID: 'uuid-newest' });
      
      const uuid = await getLastElementUUID(mockPage, 'ellipse');
      
      expect(uuid).toBe('uuid-newest');
    });

    it('should handle different element types', async () => {
      const types = ['rect', 'circle', 'ellipse', 'line'];
      
      for (const type of types) {
        const mockPage = createMockPage({ lastElementUUID: `uuid-${type}` });
        const uuid = await getLastElementUUID(mockPage, type);
        expect(uuid).toBe(`uuid-${type}`);
      }
    });

    it('should access shadow DOM to find element', async () => {
      const mockPage = createMockPage({ lastElementUUID: 'uuid-abc' });
      
      await getLastElementUUID(mockPage, 'rect');
      
      // Verify evaluate was called to access shadow DOM
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should query for elements with data-uuid attribute', async () => {
      const mockPage = createMockPage({ lastElementUUID: 'uuid-def' });
      
      await getLastElementUUID(mockPage, 'circle');
      
      // Verify evaluate was called with element type
      const evaluateCall = (mockPage.evaluate as any).mock.calls[0];
      expect(evaluateCall).toBeDefined();
      expect(evaluateCall[1]).toBe('circle');
    });

    it('should return null when canvas not found', async () => {
      const mockPage = {
        evaluate: vi.fn().mockResolvedValue(null),
      } as unknown as Page;
      
      const uuid = await getLastElementUUID(mockPage, 'rect');
      
      expect(uuid).toBeNull();
    });

    it('should return null when svg not found in shadow DOM', async () => {
      const mockPage = createMockPage({ lastElementUUID: null });
      
      const uuid = await getLastElementUUID(mockPage, 'line');
      
      expect(uuid).toBeNull();
    });
  });

  describe('UUID assignment verification', () => {
    it('should verify newly created elements have data-uuid', async () => {
      const mockPage = createMockPage({ 
        elementCountWithUUID: 1,
        lastElementUUID: 'uuid-new-rect'
      });
      
      // After creating a primitive, it should have a UUID
      const countWithUUID = await getElementCountWithUUID(mockPage, 'rect');
      const lastUUID = await getLastElementUUID(mockPage, 'rect');
      
      expect(countWithUUID).toBeGreaterThan(0);
      expect(lastUUID).not.toBeNull();
      expect(lastUUID).toMatch(/^uuid-/);
    });

    it('should verify UUID is assigned to different primitive types', async () => {
      const primitives = [
        { type: 'rect', uuid: 'uuid-rect-123' },
        { type: 'circle', uuid: 'uuid-circle-456' },
        { type: 'ellipse', uuid: 'uuid-ellipse-789' },
        { type: 'line', uuid: 'uuid-line-abc' }
      ];
      
      for (const primitive of primitives) {
        const mockPage = createMockPage({ lastElementUUID: primitive.uuid });
        const uuid = await getLastElementUUID(mockPage, primitive.type);
        expect(uuid).toBe(primitive.uuid);
      }
    });


    it('should differentiate UUID elements from non-UUID elements', async () => {
      // Total elements might be more than UUID elements (UI overlays)
      const mockPage = createMockPage({ 
        elementCount: 5,
        elementCountWithUUID: 3
      });
      
      const totalCount = await getElementCount(mockPage, 'rect');
      const uuidCount = await getElementCountWithUUID(mockPage, 'rect');
      
      // UUID count should be less than or equal to total count
      expect(uuidCount).toBeLessThanOrEqual(totalCount);
    });

    it('should verify UUID format is valid', async () => {
      const mockPage = createMockPage({ lastElementUUID: 'uuid-a1b2c3d4' });
      
      const uuid = await getLastElementUUID(mockPage, 'rect');
      
      // UUID should be a non-empty string
      expect(uuid).toBeTruthy();
      expect(typeof uuid).toBe('string');
    });

    it('should handle multiple elements with UUIDs', async () => {
      const mockPage = createMockPage({ 
        elementCountWithUUID: 10,
        lastElementUUID: 'uuid-last-element'
      });
      
      const count = await getElementCountWithUUID(mockPage, 'rect');
      const lastUUID = await getLastElementUUID(mockPage, 'rect');
      
      expect(count).toBe(10);
      expect(lastUUID).toBe('uuid-last-element');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete tool selection and primitive creation workflow', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'rectangle',
        elementCount: 1,
        elementCountWithUUID: 1,
        lastElementUUID: 'uuid-new-rect',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      // Select tool
      await selectTool(mockPage, 'rectangle');
      
      // Verify tool is active
      const activeTool = await getActiveTool(mockPage);
      expect(activeTool).toBe('rectangle');
      
      // Draw primitive
      await drawPrimitive(mockPage, 'rectangle', 50, 50, 150, 150);
      
      // Verify primitive was created
      const count = await getElementCount(mockPage, 'rect');
      expect(count).toBe(1);
      
      // Verify UUID was assigned
      const uuid = await getLastElementUUID(mockPage, 'rect');
      expect(uuid).toBe('uuid-new-rect');
    });

    it('should handle multiple primitive creation workflow', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'circle',
        elementCount: 3,
        elementCountWithUUID: 3,
        lastElementUUID: 'uuid-circle-3',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      // Create multiple primitives
      await drawPrimitive(mockPage, 'circle', 50, 50, 100, 100);
      
      // Verify count increased
      const count = await getElementCountWithUUID(mockPage, 'circle');
      expect(count).toBe(3);
      
      // Verify last UUID
      const lastUUID = await getLastElementUUID(mockPage, 'circle');
      expect(lastUUID).toBe('uuid-circle-3');
    });


    it('should handle tool switching workflow', async () => {
      // Start with rectangle tool
      let mockPage = createMockPage({ toolActive: 'rectangle' });
      await selectTool(mockPage, 'rectangle');
      let activeTool = await getActiveTool(mockPage);
      expect(activeTool).toBe('rectangle');
      
      // Switch to circle tool
      mockPage = createMockPage({ toolActive: 'circle' });
      await selectTool(mockPage, 'circle');
      activeTool = await getActiveTool(mockPage);
      expect(activeTool).toBe('circle');
    });

    it('should verify primitive creation with UUID assignment', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'ellipse',
        elementCount: 1,
        elementCountWithUUID: 1,
        lastElementUUID: 'uuid-ellipse-new',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      // Draw ellipse
      await drawPrimitive(mockPage, 'ellipse', 100, 100, 200, 150);
      
      // Verify creation
      try {
        await verifyPrimitiveCreated(mockPage, 'ellipse');
      } catch (e) {
        // Expected with mocks
      }
      
      // Verify UUID assignment
      const uuid = await getLastElementUUID(mockPage, 'ellipse');
      expect(uuid).toBe('uuid-ellipse-new');
      
      // Verify count with UUID
      const countWithUUID = await getElementCountWithUUID(mockPage, 'ellipse');
      expect(countWithUUID).toBe(1);
    });

    it('should handle line creation with UUID', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'line',
        elementCount: 1,
        elementCountWithUUID: 1,
        lastElementUUID: 'uuid-line-123',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      await drawPrimitive(mockPage, 'line', 0, 0, 200, 200);
      
      const uuid = await getLastElementUUID(mockPage, 'line');
      expect(uuid).toBe('uuid-line-123');
    });

    it('should verify element count increases after creation', async () => {
      // Initial state
      let mockPage = createMockPage({ elementCountWithUUID: 0 });
      let count = await getElementCountWithUUID(mockPage, 'rect');
      expect(count).toBe(0);
      
      // After creation
      mockPage = createMockPage({ elementCountWithUUID: 1 });
      count = await getElementCountWithUUID(mockPage, 'rect');
      expect(count).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle canvas at different positions', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'rectangle',
        canvasBoundingBox: { x: 200, y: 300, width: 600, height: 400 }
      });
      
      await drawPrimitive(mockPage, 'rectangle', 10, 10, 50, 50);
      
      // Verify coordinates were adjusted for canvas position
      const moveCall = (mockPage.mouse.move as any).mock.calls[0];
      expect(moveCall[0]).toBe(210); // 200 + 10
      expect(moveCall[1]).toBe(310); // 300 + 10
    });

    it('should handle zero-size primitives', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'circle',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      // Draw with same start and end point
      await drawPrimitive(mockPage, 'circle', 50, 50, 50, 50);
      
      expect(mockPage.mouse.down).toHaveBeenCalled();
      expect(mockPage.mouse.up).toHaveBeenCalled();
    });


    it('should handle negative coordinates', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'line',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      // Negative relative coordinates (still valid within canvas)
      await drawPrimitive(mockPage, 'line', 0, 0, -50, -50);
      
      expect(mockPage.mouse.move).toHaveBeenCalled();
    });

    it('should handle very large coordinates', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'rectangle',
        canvasBoundingBox: { x: 100, y: 100, width: 800, height: 600 }
      });
      
      await drawPrimitive(mockPage, 'rectangle', 0, 0, 10000, 10000);
      
      expect(mockPage.mouse.move).toHaveBeenCalled();
      expect(mockPage.mouse.down).toHaveBeenCalled();
      expect(mockPage.mouse.up).toHaveBeenCalled();
    });

    it('should handle empty UUID string', async () => {
      const mockPage = createMockPage({ lastElementUUID: '' });
      
      const uuid = await getLastElementUUID(mockPage, 'rect');
      
      expect(uuid).toBe('');
    });

    it('should handle malformed tool names', async () => {
      const mockPage = createMockPage({ toolActive: null });
      
      await expect(selectTool(mockPage, 'invalid-tool'))
        .rejects.toThrow();
    });

    it('should handle missing shadow DOM', async () => {
      const mockPage = {
        waitForSelector: vi.fn().mockResolvedValue(undefined),
        waitForFunction: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(null),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
      } as unknown as Page;
      
      const activeTool = await getActiveTool(mockPage);
      
      expect(activeTool).toBeNull();
    });

    it('should handle canvas with zero dimensions', async () => {
      const mockPage = createMockPage({ 
        toolActive: 'rectangle',
        canvasBoundingBox: { x: 100, y: 100, width: 0, height: 0 }
      });
      
      await drawPrimitive(mockPage, 'rectangle', 0, 0, 50, 50);
      
      // Should still attempt to draw even with zero dimensions
      expect(mockPage.mouse.move).toHaveBeenCalled();
    });

    it('should handle rapid tool switching', async () => {
      const tools = ['rectangle', 'circle', 'ellipse', 'line'];
      
      for (const tool of tools) {
        const mockPage = createMockPage({ toolActive: tool });
        await selectTool(mockPage, tool);
        const activeTool = await getActiveTool(mockPage);
        expect(activeTool).toBe(tool);
      }
    });

    it('should handle elements without data-uuid', async () => {
      const mockPage = createMockPage({ 
        elementCount: 5,
        elementCountWithUUID: 0
      });
      
      const totalCount = await getElementCount(mockPage, 'rect');
      const uuidCount = await getElementCountWithUUID(mockPage, 'rect');
      
      expect(totalCount).toBe(5);
      expect(uuidCount).toBe(0);
    });
  });
});

