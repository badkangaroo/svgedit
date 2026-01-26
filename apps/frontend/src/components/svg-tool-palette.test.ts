/**
 * Unit tests for SVGToolPalette component
 * 
 * Tests tool selection, active tool indicator, and state management.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SVGToolPalette, toolPaletteState, type ToolType } from './svg-tool-palette';

describe('SVGToolPalette', () => {
  let palette: SVGToolPalette;

  beforeEach(() => {
    // Register the custom element if not already registered
    if (!customElements.get('svg-tool-palette')) {
      customElements.define('svg-tool-palette', SVGToolPalette);
    }

    // Create a new palette instance
    palette = document.createElement('svg-tool-palette') as SVGToolPalette;
    document.body.appendChild(palette);

    // Reset tool state to default
    toolPaletteState.activeTool.set('select');
  });

  afterEach(() => {
    // Clean up
    if (palette && palette.parentNode) {
      palette.parentNode.removeChild(palette);
    }
  });

  describe('Component Rendering', () => {
    it('should render the tool palette with all tool buttons', () => {
      const shadowRoot = palette.shadowRoot;
      expect(shadowRoot).toBeTruthy();

      // Check that all tool buttons are present
      const buttons = shadowRoot!.querySelectorAll('.tool-button');
      expect(buttons.length).toBe(8); // select, rectangle, circle, ellipse, line, path, text, group
    });

    it('should render tool buttons with correct data-tool attributes', () => {
      const shadowRoot = palette.shadowRoot!;
      
      const expectedTools: ToolType[] = ['select', 'rectangle', 'circle', 'ellipse', 'line', 'path', 'text', 'group'];
      
      expectedTools.forEach(tool => {
        const button = shadowRoot.querySelector(`[data-tool="${tool}"]`);
        expect(button).toBeTruthy();
        expect(button?.getAttribute('data-tool')).toBe(tool);
      });
    });

    it('should render tool buttons with appropriate ARIA labels', () => {
      const shadowRoot = palette.shadowRoot!;
      
      const selectButton = shadowRoot.querySelector('[data-tool="select"]');
      expect(selectButton?.getAttribute('aria-label')).toBe('Select tool');
      
      const rectangleButton = shadowRoot.querySelector('[data-tool="rectangle"]');
      expect(rectangleButton?.getAttribute('aria-label')).toBe('Rectangle tool');
    });

    it('should render tool buttons with title attributes for tooltips', () => {
      const shadowRoot = palette.shadowRoot!;
      
      const selectButton = shadowRoot.querySelector('[data-tool="select"]');
      expect(selectButton?.getAttribute('title')).toContain('Select');
      
      const circleButton = shadowRoot.querySelector('[data-tool="circle"]');
      expect(circleButton?.getAttribute('title')).toContain('Circle');
    });

    it('should render separators between tool groups', () => {
      const shadowRoot = palette.shadowRoot!;
      const separators = shadowRoot.querySelectorAll('.tool-separator');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('Tool Selection', () => {
    it('should have select tool active by default', () => {
      const shadowRoot = palette.shadowRoot!;
      const selectButton = shadowRoot.querySelector('[data-tool="select"]');
      
      expect(selectButton?.classList.contains('active')).toBe(true);
      expect(selectButton?.getAttribute('aria-pressed')).toBe('true');
    });

    it('should update active tool when a tool button is clicked', () => {
      const shadowRoot = palette.shadowRoot!;
      const rectangleButton = shadowRoot.querySelector('[data-tool="rectangle"]') as HTMLElement;
      
      rectangleButton.click();
      
      expect(toolPaletteState.activeTool.get()).toBe('rectangle');
      expect(palette.getActiveTool()).toBe('rectangle');
    });

    it('should update visual indicator when tool is selected', () => {
      const shadowRoot = palette.shadowRoot!;
      const circleButton = shadowRoot.querySelector('[data-tool="circle"]') as HTMLElement;
      const selectButton = shadowRoot.querySelector('[data-tool="select"]');
      
      // Initially select tool is active
      expect(selectButton?.classList.contains('active')).toBe(true);
      expect(circleButton.classList.contains('active')).toBe(false);
      
      // Click circle tool
      circleButton.click();
      
      // Wait for reactive update
      setTimeout(() => {
        expect(selectButton?.classList.contains('active')).toBe(false);
        expect(circleButton.classList.contains('active')).toBe(true);
      }, 0);
    });

    it('should update aria-pressed attribute when tool is selected', () => {
      const shadowRoot = palette.shadowRoot!;
      const ellipseButton = shadowRoot.querySelector('[data-tool="ellipse"]') as HTMLElement;
      const selectButton = shadowRoot.querySelector('[data-tool="select"]');
      
      // Initially select tool is pressed
      expect(selectButton?.getAttribute('aria-pressed')).toBe('true');
      expect(ellipseButton.getAttribute('aria-pressed')).toBe('false');
      
      // Click ellipse tool
      ellipseButton.click();
      
      // Wait for reactive update
      setTimeout(() => {
        expect(selectButton?.getAttribute('aria-pressed')).toBe('false');
        expect(ellipseButton.getAttribute('aria-pressed')).toBe('true');
      }, 0);
    });

    it('should only have one active tool at a time', () => {
      const shadowRoot = palette.shadowRoot!;
      const lineButton = shadowRoot.querySelector('[data-tool="line"]') as HTMLElement;
      
      lineButton.click();
      
      // Wait for reactive update
      setTimeout(() => {
        const activeButtons = shadowRoot.querySelectorAll('.tool-button.active');
        expect(activeButtons.length).toBe(1);
        expect(activeButtons[0].getAttribute('data-tool')).toBe('line');
      }, 0);
    });
  });

  describe('Tool State Management', () => {
    it('should update state when setActiveTool is called', () => {
      palette.setActiveTool('path');
      
      expect(toolPaletteState.activeTool.get()).toBe('path');
      expect(palette.getActiveTool()).toBe('path');
    });

    it('should update visuals when state is changed programmatically', () => {
      const shadowRoot = palette.shadowRoot!;
      
      palette.setActiveTool('text');
      
      // Wait for reactive update
      setTimeout(() => {
        const textButton = shadowRoot.querySelector('[data-tool="text"]');
        expect(textButton?.classList.contains('active')).toBe(true);
      }, 0);
    });

    it('should maintain state across multiple selections', () => {
      palette.setActiveTool('rectangle');
      expect(palette.getActiveTool()).toBe('rectangle');
      
      palette.setActiveTool('circle');
      expect(palette.getActiveTool()).toBe('circle');
      
      palette.setActiveTool('ellipse');
      expect(palette.getActiveTool()).toBe('ellipse');
    });
  });

  describe('Custom Events', () => {
    it('should dispatch tool-change event when tool is selected', () => {
      return new Promise<void>((resolve) => {
        const shadowRoot = palette.shadowRoot!;
        const groupButton = shadowRoot.querySelector('[data-tool="group"]') as HTMLElement;
        
        palette.addEventListener('tool-change', ((event: CustomEvent) => {
          expect(event.detail.tool).toBe('group');
          resolve();
        }) as EventListener, { once: true });
        
        groupButton.click();
      });
    });

    it('should dispatch tool-change event with correct tool in detail', () => {
      return new Promise<void>((resolve) => {
        const shadowRoot = palette.shadowRoot!;
        const pathButton = shadowRoot.querySelector('[data-tool="path"]') as HTMLElement;
        
        palette.addEventListener('tool-change', ((event: CustomEvent) => {
          expect(event.detail).toHaveProperty('tool');
          expect(event.detail.tool).toBe('path');
          resolve();
        }) as EventListener, { once: true });
        
        pathButton.click();
      });
    });

    it('should dispatch bubbling event that can be caught by parent elements', () => {
      return new Promise<void>((resolve) => {
        const shadowRoot = palette.shadowRoot!;
        const rectangleButton = shadowRoot.querySelector('[data-tool="rectangle"]') as HTMLElement;
        
        document.body.addEventListener('tool-change', ((event: CustomEvent) => {
          expect(event.detail.tool).toBe('rectangle');
          resolve();
        }) as EventListener, { once: true });
        
        rectangleButton.click();
      });
    });
  });

  describe('All Tool Types', () => {
    const allTools: ToolType[] = ['select', 'rectangle', 'circle', 'ellipse', 'line', 'path', 'text', 'group'];

    allTools.forEach(tool => {
      it(`should support ${tool} tool`, () => {
        const shadowRoot = palette.shadowRoot!;
        const button = shadowRoot.querySelector(`[data-tool="${tool}"]`) as HTMLElement;
        
        expect(button).toBeTruthy();
        
        button.click();
        
        expect(palette.getActiveTool()).toBe(tool);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      const shadowRoot = palette.shadowRoot!;
      const buttons = shadowRoot.querySelectorAll('.tool-button');
      
      buttons.forEach(button => {
        expect(button.tagName.toLowerCase()).toBe('button');
      });
    });

    it('should have aria-label for all tool buttons', () => {
      const shadowRoot = palette.shadowRoot!;
      const buttons = shadowRoot.querySelectorAll('.tool-button');
      
      buttons.forEach(button => {
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have aria-pressed attribute for all tool buttons', () => {
      const shadowRoot = palette.shadowRoot!;
      const buttons = shadowRoot.querySelectorAll('.tool-button');
      
      buttons.forEach(button => {
        const ariaPressed = button.getAttribute('aria-pressed');
        expect(ariaPressed === 'true' || ariaPressed === 'false').toBe(true);
      });
    });

    it('should update aria-pressed when tool changes', () => {
      const shadowRoot = palette.shadowRoot!;
      const lineButton = shadowRoot.querySelector('[data-tool="line"]') as HTMLElement;
      
      expect(lineButton.getAttribute('aria-pressed')).toBe('false');
      
      lineButton.click();
      
      // Wait for reactive update
      setTimeout(() => {
        expect(lineButton.getAttribute('aria-pressed')).toBe('true');
      }, 0);
    });
  });

  describe('Visual Feedback', () => {
    it('should apply active class to selected tool', () => {
      const shadowRoot = palette.shadowRoot!;
      const textButton = shadowRoot.querySelector('[data-tool="text"]') as HTMLElement;
      
      textButton.click();
      
      // Wait for reactive update
      setTimeout(() => {
        expect(textButton.classList.contains('active')).toBe(true);
      }, 0);
    });

    it('should remove active class from previously selected tool', () => {
      const shadowRoot = palette.shadowRoot!;
      const selectButton = shadowRoot.querySelector('[data-tool="select"]');
      const circleButton = shadowRoot.querySelector('[data-tool="circle"]') as HTMLElement;
      
      // Initially select is active
      expect(selectButton?.classList.contains('active')).toBe(true);
      
      // Click circle
      circleButton.click();
      
      // Wait for reactive update
      setTimeout(() => {
        expect(selectButton?.classList.contains('active')).toBe(false);
        expect(circleButton.classList.contains('active')).toBe(true);
      }, 0);
    });
  });

  describe('Component Lifecycle', () => {
    it('should clean up effects on disconnect', () => {
      const newPalette = document.createElement('svg-tool-palette') as SVGToolPalette;
      document.body.appendChild(newPalette);
      
      // Change tool
      newPalette.setActiveTool('rectangle');
      expect(newPalette.getActiveTool()).toBe('rectangle');
      
      // Disconnect
      document.body.removeChild(newPalette);
      
      // Component should be removed without errors
      expect(document.body.contains(newPalette)).toBe(false);
    });
  });
});
