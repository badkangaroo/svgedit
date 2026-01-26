/**
 * Root application component for the SVG Editor
 * Manages the overall layout with menu bar, canvas, hierarchy panel, inspector, and tools
 * Implements CSS Grid layout with resizable panels
 */

import type { PanelLayout } from '../types';

const DEFAULT_LAYOUT: PanelLayout = {
  hierarchyWidth: 250,
  inspectorWidth: 300,
  rawSVGHeight: 200,
  hierarchyVisible: true,
  inspectorVisible: true,
  rawSVGVisible: true,
};

export class SVGEditorApp extends HTMLElement {
  private layout: PanelLayout = { ...DEFAULT_LAYOUT };
  private isDragging = false;
  private dragTarget: 'hierarchy' | 'inspector' | 'rawSVG' | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartSize = 0;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.loadLayout();
    this.render();
    this.attachEventListeners();
  }

  disconnectedCallback() {
    this.detachEventListeners();
  }

  private loadLayout() {
    try {
      const saved = localStorage.getItem('svg-editor-layout');
      if (saved) {
        this.layout = { ...DEFAULT_LAYOUT, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load layout from localStorage:', error);
    }
  }

  private saveLayout() {
    try {
      localStorage.setItem('svg-editor-layout', JSON.stringify(this.layout));
    } catch (error) {
      console.error('Failed to save layout to localStorage:', error);
    }
  }

  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .app-container {
          display: grid;
          width: 100%;
          height: 100%;
          grid-template-columns: ${this.layout.hierarchyVisible ? `${this.layout.hierarchyWidth}px` : '0px'} 4px 1fr 4px ${this.layout.inspectorVisible ? `${this.layout.inspectorWidth}px` : '0px'};
          grid-template-rows: auto 1fr ${this.layout.rawSVGVisible ? `4px ${this.layout.rawSVGHeight}px` : ''};
          grid-template-areas:
            "menu menu menu menu menu"
            "hierarchy divider-h canvas divider-i inspector"
            ${this.layout.rawSVGVisible ? '"hierarchy divider-h divider-v divider-v inspector" "hierarchy divider-h rawsvg rawsvg inspector"' : ''};
          background-color: var(--color-background);
          color: var(--color-on-background);
        }

        .menu-bar {
          grid-area: menu;
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-outline);
          padding: var(--spacing-sm) var(--spacing-md);
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .hierarchy-panel {
          grid-area: hierarchy;
          background-color: var(--color-surface);
          border-right: 1px solid var(--color-outline);
          overflow: auto;
          display: ${this.layout.hierarchyVisible ? 'block' : 'none'};
        }

        .canvas-area {
          grid-area: canvas;
          background-color: var(--color-background);
          overflow: auto;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .inspector-panel {
          grid-area: inspector;
          background-color: var(--color-surface);
          border-left: 1px solid var(--color-outline);
          overflow: auto;
          display: ${this.layout.inspectorVisible ? 'block' : 'none'};
        }

        .raw-svg-panel {
          grid-area: rawsvg;
          background-color: var(--color-surface);
          border-top: 1px solid var(--color-outline);
          overflow: auto;
          display: ${this.layout.rawSVGVisible ? 'block' : 'none'};
        }

        .divider {
          background-color: var(--color-outline);
          position: relative;
        }

        .divider-h {
          grid-area: divider-h;
          cursor: ew-resize;
          display: ${this.layout.hierarchyVisible ? 'block' : 'none'};
        }

        .divider-i {
          grid-area: divider-i;
          cursor: ew-resize;
          display: ${this.layout.inspectorVisible ? 'block' : 'none'};
        }

        .divider-v {
          grid-area: divider-v;
          cursor: ns-resize;
          display: ${this.layout.rawSVGVisible ? 'block' : 'none'};
        }

        .divider:hover {
          background-color: var(--color-primary);
        }

        .divider.dragging {
          background-color: var(--color-primary);
        }

        .tool-palette {
          position: absolute;
          top: var(--spacing-md);
          left: var(--spacing-md);
          background-color: var(--color-surface);
          border: 1px solid var(--color-outline);
          border-radius: var(--radius-md);
          padding: var(--spacing-sm);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        /* Placeholder styles for panels */
        .panel-placeholder {
          padding: var(--spacing-md);
          color: var(--color-on-surface-variant);
          font-style: italic;
        }

        .menu-item {
          background: none;
          border: none;
          color: var(--color-on-surface);
          cursor: pointer;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          font-size: 14px;
          transition: background-color var(--transition-fast);
        }

        .menu-item:hover {
          background-color: var(--color-surface-variant);
        }

        .menu-item:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          margin-left: auto;
        }

        .theme-toggle-icon {
          width: 20px;
          height: 20px;
          fill: currentColor;
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
      </style>

      <div class="app-container">
        <!-- Menu Bar -->
        <div class="menu-bar">
          <button class="menu-item" id="file-menu">File</button>
          <button class="menu-item" id="edit-menu">Edit</button>
          <button class="menu-item" id="view-menu">View</button>
          <button class="menu-item theme-toggle" id="theme-toggle" aria-label="Toggle theme">
            <svg class="theme-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="${this.getThemeIconPath()}"/>
            </svg>
            <span>${this.getCurrentThemeLabel()}</span>
          </button>
        </div>

        <!-- Hierarchy Panel -->
        <div class="hierarchy-panel">
          <div class="panel-placeholder">Hierarchy Panel</div>
        </div>

        <!-- Hierarchy Divider -->
        <div class="divider divider-h" data-divider="hierarchy"></div>

        <!-- Canvas Area -->
        <div class="canvas-area">
          <div class="tool-palette">
            <button class="tool-button" title="Select" aria-label="Select tool">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
              </svg>
            </button>
            <button class="tool-button" title="Rectangle" aria-label="Rectangle tool">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18"/>
              </svg>
            </button>
            <button class="tool-button" title="Circle" aria-label="Circle tool">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9"/>
              </svg>
            </button>
          </div>
          <div class="panel-placeholder">Canvas Area</div>
        </div>

        <!-- Inspector Divider -->
        <div class="divider divider-i" data-divider="inspector"></div>

        <!-- Inspector Panel -->
        <div class="inspector-panel">
          <div class="panel-placeholder">Attribute Inspector</div>
        </div>

        <!-- Raw SVG Divider -->
        ${this.layout.rawSVGVisible ? '<div class="divider divider-v" data-divider="rawSVG"></div>' : ''}

        <!-- Raw SVG Panel -->
        ${this.layout.rawSVGVisible ? '<div class="raw-svg-panel"><div class="panel-placeholder">Raw SVG Panel</div></div>' : ''}
      </div>
    `;
  }

  private attachEventListeners() {
    if (!this.shadowRoot) return;

    // Divider drag handlers
    const dividers = this.shadowRoot.querySelectorAll('.divider');
    dividers.forEach((divider) => {
      divider.addEventListener('mousedown', this.handleDividerMouseDown);
    });

    // Theme toggle
    const themeToggle = this.shadowRoot.querySelector('#theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', this.handleThemeToggle);
    }

    // Global mouse handlers for dragging
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  private detachEventListeners() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  private handleDividerMouseDown = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    const target = mouseEvent.currentTarget as HTMLElement;
    const dividerType = target.dataset.divider as 'hierarchy' | 'inspector' | 'rawSVG';

    if (!dividerType) return;

    this.isDragging = true;
    this.dragTarget = dividerType;
    this.dragStartX = mouseEvent.clientX;
    this.dragStartY = mouseEvent.clientY;

    // Store the starting size
    if (dividerType === 'hierarchy') {
      this.dragStartSize = this.layout.hierarchyWidth;
    } else if (dividerType === 'inspector') {
      this.dragStartSize = this.layout.inspectorWidth;
    } else if (dividerType === 'rawSVG') {
      this.dragStartSize = this.layout.rawSVGHeight;
    }

    target.classList.add('dragging');
    event.preventDefault();
  };

  private handleMouseMove = (event: MouseEvent) => {
    if (!this.isDragging || !this.dragTarget) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    if (this.dragTarget === 'hierarchy') {
      // Dragging left edge - increase width with positive delta
      const newWidth = Math.max(150, Math.min(600, this.dragStartSize + deltaX));
      this.layout.hierarchyWidth = newWidth;
    } else if (this.dragTarget === 'inspector') {
      // Dragging right edge - decrease width with positive delta (moving left)
      const newWidth = Math.max(200, Math.min(600, this.dragStartSize - deltaX));
      this.layout.inspectorWidth = newWidth;
    } else if (this.dragTarget === 'rawSVG') {
      // Dragging bottom edge - decrease height with positive delta (moving up)
      const newHeight = Math.max(100, Math.min(500, this.dragStartSize - deltaY));
      this.layout.rawSVGHeight = newHeight;
    }

    this.render();
    event.preventDefault();
  };

  private handleMouseUp = (event: MouseEvent) => {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.dragTarget = null;

    // Remove dragging class from all dividers
    if (this.shadowRoot) {
      const dividers = this.shadowRoot.querySelectorAll('.divider');
      dividers.forEach((divider) => divider.classList.remove('dragging'));
    }

    // Save the new layout
    this.saveLayout();
    event.preventDefault();
  };

  private handleThemeToggle = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save theme preference
    try {
      localStorage.setItem('svg-editor-theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }

    // Re-render to update the icon and label
    this.render();
  };

  private getCurrentTheme(): 'light' | 'dark' {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'dark' ? 'dark' : 'light';
  }

  private getCurrentThemeLabel(): string {
    return this.getCurrentTheme() === 'dark' ? 'Dark' : 'Light';
  }

  private getThemeIconPath(): string {
    // Sun icon for light theme, moon icon for dark theme
    if (this.getCurrentTheme() === 'dark') {
      // Moon icon
      return 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z';
    } else {
      // Sun icon
      return 'M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z';
    }
  }
}

// Register the custom element
customElements.define('svg-editor-app', SVGEditorApp);
