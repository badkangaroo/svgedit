/**
 * SVG Tool Palette Component
 * 
 * Provides tool selection UI for creating SVG primitives.
 * Displays tool buttons with icons and manages active tool state.
 * 
 * Requirements: 1.1, 6.1
 */

import { signal, effect } from '../state/signals';
import type { Tool, ToolType } from '../types';

/**
 * Tool palette state
 */
export const toolPaletteState = {
  activeTool: signal<ToolType>('select'),
};

/**
 * SVGToolPalette Web Component
 * 
 * Displays a vertical palette of tool buttons for creating SVG primitives.
 * Highlights the currently active tool.
 */
export class SVGToolPalette extends HTMLElement {
  private disposeEffects: (() => void)[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEffects();
    this.attachEventListeners();
  }

  disconnectedCallback() {
    this.disposeEffects.forEach(dispose => dispose());
    this.disposeEffects = [];
  }

  /**
   * Render the tool palette component structure
   */
  private render() {
    if (!this.shadowRoot) return;

    const activeTool = toolPaletteState.activeTool.get();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .tool-palette {
          background-color: var(--color-surface);
          border: 1px solid var(--color-outline);
          border-radius: var(--radius-md);
          padding: var(--spacing-sm);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .tool-button {
          width: 40px;
          height: 40px;
          background: var(--color-surface-variant);
          border: 1px solid var(--color-outline);
          border-radius: var(--radius-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          color: var(--color-on-surface);
          padding: 0;
        }

        .tool-button:hover {
          background: var(--color-primary-container);
          border-color: var(--color-primary);
        }

        .tool-button:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .tool-button.active {
          background: var(--color-primary);
          color: var(--color-on-primary);
          border-color: var(--color-primary);
        }

        .tool-icon {
          width: 24px;
          height: 24px;
          fill: currentColor;
          stroke: currentColor;
        }

        .tool-separator {
          height: 1px;
          background-color: var(--color-outline);
          margin: var(--spacing-xs) 0;
        }
      </style>

      <div class="tool-palette">
        <!-- Select Tool -->
        <button 
          class="tool-button ${activeTool === 'select' ? 'active' : ''}" 
          data-tool="select"
          title="Select (V)"
          aria-label="Select tool"
          aria-pressed="${activeTool === 'select'}">
          <svg class="tool-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          </svg>
        </button>

        <div class="tool-separator"></div>

        <!-- Rectangle Tool -->
        <button 
          class="tool-button ${activeTool === 'rectangle' ? 'active' : ''}" 
          data-tool="rectangle"
          title="Rectangle (R)"
          aria-label="Rectangle tool"
          aria-pressed="${activeTool === 'rectangle'}">
          <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18"/>
          </svg>
        </button>

        <!-- Circle Tool -->
        <button 
          class="tool-button ${activeTool === 'circle' ? 'active' : ''}" 
          data-tool="circle"
          title="Circle (C)"
          aria-label="Circle tool"
          aria-pressed="${activeTool === 'circle'}">
          <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9"/>
          </svg>
        </button>

        <!-- Ellipse Tool -->
        <button 
          class="tool-button ${activeTool === 'ellipse' ? 'active' : ''}" 
          data-tool="ellipse"
          title="Ellipse (E)"
          aria-label="Ellipse tool"
          aria-pressed="${activeTool === 'ellipse'}">
          <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="12" rx="9" ry="6"/>
          </svg>
        </button>

        <!-- Line Tool -->
        <button 
          class="tool-button ${activeTool === 'line' ? 'active' : ''}" 
          data-tool="line"
          title="Line (L)"
          aria-label="Line tool"
          aria-pressed="${activeTool === 'line'}">
          <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="21" x2="21" y2="3"/>
          </svg>
        </button>

        <!-- Path Tool -->
        <button 
          class="tool-button ${activeTool === 'path' ? 'active' : ''}" 
          data-tool="path"
          title="Path (P)"
          aria-label="Path tool"
          aria-pressed="${activeTool === 'path'}">
          <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12 Q 6 3, 12 12 T 21 12"/>
          </svg>
        </button>

        <div class="tool-separator"></div>

        <!-- Text Tool -->
        <button 
          class="tool-button ${activeTool === 'text' ? 'active' : ''}" 
          data-tool="text"
          title="Text (T)"
          aria-label="Text tool"
          aria-pressed="${activeTool === 'text'}">
          <svg class="tool-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4v3h5.5v12h3V7H19V4z"/>
          </svg>
        </button>

        <!-- Group Tool -->
        <button 
          class="tool-button ${activeTool === 'group' ? 'active' : ''}" 
          data-tool="group"
          title="Group (G)"
          aria-label="Group tool"
          aria-pressed="${activeTool === 'group'}">
          <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Set up reactive effects to respond to state changes
   */
  private setupEffects() {
    // Effect: Re-render when active tool changes
    const toolEffect = effect(() => {
      const activeTool = toolPaletteState.activeTool.get();
      this.updateActiveToolVisuals(activeTool);
    });
    this.disposeEffects.push(toolEffect);
  }

  /**
   * Update visual indicators for the active tool
   */
  private updateActiveToolVisuals(activeTool: ToolType) {
    if (!this.shadowRoot) return;

    // Remove active class from all buttons
    const buttons = this.shadowRoot.querySelectorAll('.tool-button');
    buttons.forEach(button => {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    });

    // Add active class to the current tool button
    const activeButton = this.shadowRoot.querySelector(`[data-tool="${activeTool}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
      activeButton.setAttribute('aria-pressed', 'true');
    }
  }

  /**
   * Attach event listeners for tool selection
   */
  private attachEventListeners() {
    if (!this.shadowRoot) return;

    const buttons = this.shadowRoot.querySelectorAll('.tool-button');
    buttons.forEach(button => {
      button.addEventListener('click', this.handleToolClick);
    });
  }

  /**
   * Handle tool button click
   */
  private handleToolClick = (event: Event) => {
    const button = event.currentTarget as HTMLElement;
    const tool = button.dataset.tool as ToolType;

    if (tool) {
      // Update the active tool state
      toolPaletteState.activeTool.set(tool);

      // Dispatch custom event for tool change
      this.dispatchEvent(new CustomEvent('tool-change', {
        detail: { tool },
        bubbles: true,
        composed: true,
      }));
    }
  };

  /**
   * Get the currently active tool (for testing)
   */
  public getActiveTool(): ToolType {
    return toolPaletteState.activeTool.get();
  }

  /**
   * Set the active tool programmatically (for testing)
   */
  public setActiveTool(tool: ToolType): void {
    toolPaletteState.activeTool.set(tool);
  }
}

// Register the custom element
customElements.define('svg-tool-palette', SVGToolPalette);
