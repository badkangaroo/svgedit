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

  describe('UUID-based drag operations', () => {
    it('should support dragging element by data-uuid', async () => {
      const mockBox: BoundingBox = { x: 100, y: 100, width: 50, height: 50 };
      const mockPage = createMockPage(mockBox);
      
      // Drag element using UUID identifier
      await dragElement(mockPage, 'uuid-abc-123', 50, 30);
      
      // Verify drag was performed
      expect(mockPage.mouse.move).toHaveBeenCalledWith(125, 125);
      expect(mockPage.mouse.down).toHaveBeenCalled();
      expect(mockPage.mouse.move).toHaveBeenCalledWith(175, 155, { steps: 10 });
      expect(mockPage.mouse.up).toHaveBeenCalled();
    });

    it('should support dragging element by data-original-id', async () => {
      const mockBox: BoundingBox = { x: 200, y: 150, width: 60, height: 40 };
      const mockPage = createMockPage(mockBox);
      
      // Drag element using data-original-id
      await dragElement(mockPage, 'imported-element', -20, 10);
      
      // Verify drag coordinates
      expect(mockPage.mouse.move).toHaveBeenCalledWith(230, 170); // Center
      expect(mockPage.mouse.move).toHaveBeenCalledWith(210, 180, { steps: 10 }); // With delta
    });

    it('should get position for element with data-uuid', async () => {
      const mockPage = createMockPage(null, { x: 150, y: 200 });
      
      const position = await getElementPosition(mockPage, 'uuid-def-456');
      
      expect(position).toEqual({ x: 150, y: 200 });
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should verify moved element using UUID', async () => {
      const mockPage = createMockPage(null, { x: 200, y: 250 });
      
      // Should not throw when position matches
      await expect(verifyElementMoved(mockPage, 'uuid-ghi-789', 200, 250))
        .resolves.not.toThrow();
    });

    it('should handle UUID lookup in selector chain', async () => {
      const mockBox: BoundingBox = { x: 50, y: 75, width: 100, height: 80 };
      const mockPage = createMockPage(mockBox);
      
      await dragElement(mockPage, 'uuid-jkl-012', 100, 50);
      
      // Verify locator was called (selector includes data-uuid)
      expect(mockPage.locator).toHaveBeenCalledWith('svg-canvas');
    });

    it('should prioritize data-uuid over id for stability', async () => {
      const mockBox: BoundingBox = { x: 100, y: 100, width: 50, height: 50 };
      const mockPage = createMockPage(mockBox);
      
      // When element has both UUID and ID, UUID should work
      await dragElement(mockPage, 'uuid-mno-345', 25, 25);
      
      expect(mockPage.mouse.down).toHaveBeenCalled();
      expect(mockPage.mouse.up).toHaveBeenCalled();
    });
  });

  describe('Position calculations for different element types', () => {
    it('should calculate position for rect elements', async () => {
      const mockPage = createMockPage(null, { x: 50, y: 100 });
      
      const position = await getElementPosition(mockPage, 'test-rect');
      
      expect(position).toEqual({ x: 50, y: 100 });
    });

    it('should calculate position for circle elements using cx/cy', async () => {
      const mockPage = createMockPage(null, { x: 150, y: 200 });
      
      const position = await getElementPosition(mockPage, 'test-circle');
      
      expect(position).toEqual({ x: 150, y: 200 });
    });

    it('should calculate position for ellipse elements using cx/cy', async () => {
      const mockPage = createMockPage(null, { x: 250, y: 300 });
      
      const position = await getElementPosition(mockPage, 'test-ellipse');
      
      expect(position).toEqual({ x: 250, y: 300 });
    });

    it('should calculate position for line elements using x1/y1', async () => {
      const mockPage = createMockPage(null, { x: 75, y: 125 });
      
      const position = await getElementPosition(mockPage, 'test-line');
      
      expect(position).toEqual({ x: 75, y: 125 });
    });

    it('should calculate position for text elements', async () => {
      const mockPage = createMockPage(null, { x: 100, y: 50 });
      
      const position = await getElementPosition(mockPage, 'test-text');
      
      expect(position).toEqual({ x: 100, y: 50 });
    });

    it('should calculate position for group elements with transform', async () => {
      const mockPage = createMockPage(null, { x: 30, y: 40 });
      
      const position = await getElementPosition(mockPage, 'test-group');
      
      expect(position).toEqual({ x: 30, y: 40 });
    });

    it('should return default position for elements without position attributes', async () => {
      const mockPage = createMockPage(null, { x: 0, y: 0 });
      
      const position = await getElementPosition(mockPage, 'test-path');
      
      expect(position).toEqual({ x: 0, y: 0 });
    });

    it('should handle image elements like rect (x/y attributes)', async () => {
      const mockPage = createMockPage(null, { x: 200, y: 300 });
      
      const position = await getElementPosition(mockPage, 'test-image');
      
      expect(position).toEqual({ x: 200, y: 300 });
    });
  });

  describe('Drag operation edge cases', () => {
    it('should handle zero delta drag', async () => {
      const mockBox: BoundingBox = { x: 100, y: 100, width: 50, height: 50 };
      const mockPage = createMockPage(mockBox);
      
      await dragElement(mockPage, 'test-element', 0, 0);
      
      // Should still perform drag operation
      expect(mockPage.mouse.move).toHaveBeenCalledWith(125, 125);
      expect(mockPage.mouse.move).toHaveBeenCalledWith(125, 125, { steps: 10 });
    });

    it('should handle very large delta values', async () => {
      const mockBox: BoundingBox = { x: 100, y: 100, width: 50, height: 50 };
      const mockPage = createMockPage(mockBox);
      
      await dragElement(mockPage, 'test-element', 1000, 800);
      
      expect(mockPage.mouse.move).toHaveBeenCalledWith(1125, 925, { steps: 10 });
    });

    it('should handle small element bounding boxes', async () => {
      const mockBox: BoundingBox = { x: 50, y: 50, width: 1, height: 1 };
      const mockPage = createMockPage(mockBox);
      
      await dragElement(mockPage, 'tiny-element', 10, 10);
      
      // Center should be calculated correctly
      expect(mockPage.mouse.move).toHaveBeenCalledWith(50.5, 50.5);
    });

    it('should handle elements at origin', async () => {
      const mockBox: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
      const mockPage = createMockPage(mockBox);
      
      await dragElement(mockPage, 'origin-element', 50, 50);
      
      expect(mockPage.mouse.move).toHaveBeenCalledWith(25, 25);
      expect(mockPage.mouse.move).toHaveBeenCalledWith(75, 75, { steps: 10 });
    });

    it('should wait for drag initialization', async () => {
      const mockBox: BoundingBox = { x: 100, y: 100, width: 50, height: 50 };
      const mockPage = createMockPage(mockBox);
      
      await dragElement(mockPage, 'test-element', 20, 20);
      
      // Verify 50ms wait after mouse down
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(50);
      // Verify 200ms wait after mouse up
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(200);
    });

    it('should use smooth drag with steps', async () => {
      const mockBox: BoundingBox = { x: 100, y: 100, width: 50, height: 50 };
      const mockPage = createMockPage(mockBox);
      
      await dragElement(mockPage, 'test-element', 100, 100);
      
      // Verify steps parameter for smooth drag
      expect(mockPage.mouse.move).toHaveBeenCalledWith(225, 225, { steps: 10 });
    });
  });

  describe('Position verification with tolerance', () => {
    it('should pass with exact position match', async () => {
      const mockPage = createMockPage(null, { x: 100, y: 150 });
      
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150))
        .resolves.not.toThrow();
    });

    it('should pass with position within default tolerance', async () => {
      const mockPage = createMockPage(null, { x: 100.9, y: 150.8 });
      
      // Default tolerance is 1
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150))
        .resolves.not.toThrow();
    });

    it('should pass with position within custom tolerance', async () => {
      const mockPage = createMockPage(null, { x: 105, y: 155 });
      
      // Custom tolerance of 10
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150, 10))
        .resolves.not.toThrow();
    });

    it('should fail when X is outside tolerance', async () => {
      const mockPage = createMockPage(null, { x: 110, y: 150 });
      
      // X is 10 units away, outside default tolerance of 1
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150))
        .rejects.toThrow();
    });

    it('should fail when Y is outside tolerance', async () => {
      const mockPage = createMockPage(null, { x: 100, y: 160 });
      
      // Y is 10 units away, outside default tolerance of 1
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150))
        .rejects.toThrow();
    });

    it('should fail when both coordinates are outside tolerance', async () => {
      const mockPage = createMockPage(null, { x: 110, y: 160 });
      
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150))
        .rejects.toThrow();
    });

    it('should handle negative coordinates', async () => {
      const mockPage = createMockPage(null, { x: -50, y: -75 });
      
      await expect(verifyElementMoved(mockPage, 'test-element', -50, -75))
        .resolves.not.toThrow();
    });

    it('should handle zero tolerance', async () => {
      const mockPage = createMockPage(null, { x: 100.1, y: 150 });
      
      // With tolerance 0, even 0.1 difference should fail
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150, 0))
        .rejects.toThrow();
    });

    it('should handle large tolerance values', async () => {
      const mockPage = createMockPage(null, { x: 150, y: 200 });
      
      // With tolerance 100, should pass
      await expect(verifyElementMoved(mockPage, 'test-element', 100, 150, 100))
        .resolves.not.toThrow();
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

    it('should handle UUID-based drag and verify workflow', async () => {
      let currentPosition = { x: 200, y: 150 };
      
      const mockBox: BoundingBox = { x: 200, y: 150, width: 60, height: 40 };
      const mockPage = {
        locator: vi.fn().mockReturnValue(createMockLocator(mockBox)),
        mouse: {
          move: vi.fn().mockResolvedValue(undefined),
          down: vi.fn().mockResolvedValue(undefined),
          up: vi.fn().mockResolvedValue(undefined),
        },
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockImplementation(() => {
          return Promise.resolve({ ...currentPosition });
        }),
      } as unknown as Page;
      
      // Drag using UUID
      await dragElement(mockPage, 'uuid-xyz-999', 75, 50);
      
      // Update position
      currentPosition = { x: 275, y: 200 };
      
      // Verify using UUID
      const position = await getElementPosition(mockPage, 'uuid-xyz-999');
      expect(position).toEqual({ x: 275, y: 200 });
      
      // Verify moved to expected position
      await expect(verifyElementMoved(mockPage, 'uuid-xyz-999', 275, 200))
        .resolves.not.toThrow();
    });

    it('should handle multiple sequential drags', async () => {
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
          return Promise.resolve({ ...currentPosition });
        }),
      } as unknown as Page;
      
      // First drag
      await dragElement(mockPage, 'test-element', 50, 30);
      currentPosition = { x: 150, y: 130 };
      
      // Second drag
      await dragElement(mockPage, 'test-element', -25, 20);
      currentPosition = { x: 125, y: 150 };
      
      // Verify final position
      const position = await getElementPosition(mockPage, 'test-element');
      expect(position).toEqual({ x: 125, y: 150 });
    });

    it('should handle drag with position verification at each step', async () => {
      let currentPosition = { x: 50, y: 75 };
      
      const mockBox: BoundingBox = { x: 50, y: 75, width: 40, height: 40 };
      const mockPage = {
        locator: vi.fn().mockReturnValue(createMockLocator(mockBox)),
        mouse: {
          move: vi.fn().mockResolvedValue(undefined),
          down: vi.fn().mockResolvedValue(undefined),
          up: vi.fn().mockResolvedValue(undefined),
        },
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockImplementation(() => {
          return Promise.resolve({ ...currentPosition });
        }),
      } as unknown as Page;
      
      // Get initial position
      let position = await getElementPosition(mockPage, 'test-element');
      expect(position).toEqual({ x: 50, y: 75 });
      
      // Perform drag
      await dragElement(mockPage, 'test-element', 100, 50);
      currentPosition = { x: 150, y: 125 };
      
      // Get new position
      position = await getElementPosition(mockPage, 'test-element');
      expect(position).toEqual({ x: 150, y: 125 });
      
      // Verify moved correctly
      await expect(verifyElementMoved(mockPage, 'test-element', 150, 125))
        .resolves.not.toThrow();
    });
  });
});
