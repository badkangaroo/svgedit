import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Page, Locator } from '@playwright/test';

// Import the functions we're testing
import { dragElement, getElementPosition, verifyElementMoved } from '../helpers/drag-helpers';

// Define BoundingBox type (matches Playwright's return type)
type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Mock Playwright Page and Locator
const createMockLocator = (boundingBox: BoundingBox | null = null): Locator => {
  return {
    locator: vi.fn().mockReturnThis(),
    first: vi.fn().mockReturnThis(),
    boundingBox: vi.fn().mockResolvedValue(boundingBox),
  } as unknown as Locator;
};

const createMockPage = (
  boundingBox: BoundingBox | null = null,
  evaluateResult: any = { x: 0, y: 0 }
): Page => {
  const mockLocator = createMockLocator(boundingBox);
  
  return {
    locator: vi.fn().mockReturnValue(mockLocator),
    mouse: {
      move: vi.fn().mockResolvedValue(undefined),
      down: vi.fn().mockResolvedValue(undefined),
      up: vi.fn().mockResolvedValue(undefined),
    },
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(evaluateResult),
  } as unknown as Page;
};

describe('Drag Helpers', () => {
  describe('dragElement', () => {
    it('should perform drag operation with correct coordinates', async () => {
      const mockBox: BoundingBox = { x: 100, y: 100, width: 50, height: 50 };
      const mockPage = createMockPage(mockBox);
      
      await dragElement(mockPage, 'test-element', 50, 30);
      
      // Verify mouse operations were called
      expect(mockPage.mouse.move).toHaveBeenCalledWith(125, 125); // Center of element
      expect(mockPage.mouse.down).toHaveBeenCalled();
      expect(mockPage.mouse.move).toHaveBeenCalledWith(175, 155, { steps: 10 }); // Delta applied
      expect(mockPage.mouse.up).toHaveBeenCalled();
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(200);
    });

    it('should throw error if element not found', async () => {
      const mockPage = createMockPage(null); // No bounding box = element not found
      
      await expect(dragElement(mockPage, 'missing-element', 10, 10))
        .rejects.toThrow('Element missing-element not found or not visible');
    });

    it('should handle negative delta values', async () => {
      const mockBox: BoundingBox = { x: 200, y: 200, width: 40, height: 40 };
      const mockPage = createMockPage(mockBox);
      
      await dragElement(mockPage, 'test-element', -50, -30);
      
      // Verify negative deltas are applied correctly
      expect(mockPage.mouse.move).toHaveBeenCalledWith(220, 220); // Center
      expect(mockPage.mouse.move).toHaveBeenCalledWith(170, 190, { steps: 10 }); // Negative delta
    });
  });

  describe('getElementPosition', () => {
    it('should return position for rect element', async () => {
      const mockPage = createMockPage(null, { x: 100, y: 150 });
      
      const position = await getElementPosition(mockPage, 'test-rect');
      
      expect(position).toEqual({ x: 100, y: 150 });
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should return position for circle element', async () => {
      const mockPage = createMockPage(null, { x: 200, y: 250 });
      
      const position = await getElementPosition(mockPage, 'test-circle');
      
      expect(position).toEqual({ x: 200, y: 250 });
    });

    it('should return position for ellipse element', async () => {
      const mockPage = createMockPage(null, { x: 300, y: 350 });
      
      const position = await getElementPosition(mockPage, 'test-ellipse');
      
      expect(position).toEqual({ x: 300, y: 350 });
    });

    it('should return position for line element', async () => {
      const mockPage = createMockPage(null, { x: 50, y: 75 });
      
      const position = await getElementPosition(mockPage, 'test-line');
      
      expect(position).toEqual({ x: 50, y: 75 });
    });

    it('should return default position for unsupported elements', async () => {
      const mockPage = createMockPage(null, { x: 0, y: 0 });
      
      const position = await getElementPosition(mockPage, 'test-unknown');
      
      expect(position).toEqual({ x: 0, y: 0 });
    });
  });

  describe('verifyElementMoved', () => {
    it('should pass when element is at expected position', async () => {
      const mockPage = createMockPage(null, { x: 100, y: 150 });
      
      // Should not throw
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150))
        .resolves.not.toThrow();
    });

    it('should pass when element is within tolerance', async () => {
      const mockPage = createMockPage(null, { x: 100.5, y: 150.8 });
      
      // Should not throw with default tolerance of 1
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150))
        .resolves.not.toThrow();
    });

    it('should pass when element is within custom tolerance', async () => {
      const mockPage = createMockPage(null, { x: 104, y: 153 });
      
      // Should not throw with tolerance of 5
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150, 5))
        .resolves.not.toThrow();
    });

    it('should fail when element is outside tolerance', async () => {
      const mockPage = createMockPage(null, { x: 110, y: 150 });
      
      // Should throw because x is 10 units away (outside default tolerance of 1)
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150))
        .rejects.toThrow();
    });

    it('should fail when Y coordinate is outside tolerance', async () => {
      const mockPage = createMockPage(null, { x: 100, y: 160 });
      
      // Should throw because y is 10 units away
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150))
        .rejects.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete drag and verify workflow', async () => {
      // Initial position
      let currentPosition = { x: 100, y: 100 };
      
      const mockBox: BoundingBox = { x: 100, y: 100, width: 50, height: 50 };
      const mockPage = {
        locator: vi.fn().mockReturnValue(createMockLocator(mockBox)),
        mouse: {
          move: vi.fn().mockResolvedValue(undefined),
          down: vi.fn().mockResolvedValue(undefined),
          up: vi.fn().mockResolvedValue(undefined),
        },
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockImplementation(() => {
          // Simulate position update after drag
          return Promise.resolve({ ...currentPosition });
        }),
      } as unknown as Page;
      
      // Perform drag
      await dragElement(mockPage, 'test-element', 50, 30);
      
      // Update position to simulate successful drag
      currentPosition = { x: 150, y: 130 };
      
      // Verify new position
      const position = await getElementPosition(mockPage, 'test-element');
      expect(position).toEqual({ x: 150, y: 130 });
    });
  });
});
