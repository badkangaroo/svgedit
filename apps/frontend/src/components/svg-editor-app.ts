/**
 * Root application component for the SVG Editor
 * Manages the overall layout with menu bar, canvas, hierarchy panel, inspector, and tools
 * Implements CSS Grid layout with resizable panels
 * Manages global keyboard shortcuts
 */

import type { PanelLayout } from '../types';
import { keyboardShortcutManager } from '../state/keyboard-shortcut-manager';
import { fileManager } from '../utils/file-manager';
import { documentState } from '../state/document-state';
import { svgSerializer } from '../utils/svg-serializer';

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
    
    // Attach keyboard shortcut manager
    keyboardShortcutManager.attach();

    // Listen for save events from keyboard shortcuts
    document.addEventListener('editor:new', this.handleNewEvent);
    document.addEventListener('editor:save', this.handleSaveEvent);
    document.addEventListener('editor:saveAs', this.handleSaveAsEvent);
  }

  disconnectedCallback() {
    this.detachEventListeners();
    
    // Detach keyboard shortcut manager
    keyboardShortcutManager.detach();

    // Remove save event listeners
    document.removeEventListener('editor:new', this.handleNewEvent);
    document.removeEventListener('editor:save', this.handleSaveEvent);
    document.removeEventListener('editor:saveAs', this.handleSaveAsEvent);
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

        .tool-palette-container {
          position: absolute;
          top: var(--spacing-md);
          left: var(--spacing-md);
          z-index: 10;
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

        .menu-dropdown {
          position: relative;
          display: inline-block;
        }

        .menu-dropdown-content {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background-color: var(--color-surface);
          min-width: 200px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          border: 1px solid var(--color-outline);
          border-radius: var(--radius-sm);
          z-index: 1000;
          margin-top: var(--spacing-xs);
        }

        .menu-dropdown-content.show {
          display: block;
        }

        .menu-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          background: none;
          border: none;
          color: var(--color-on-surface);
          cursor: pointer;
          text-align: left;
          font-size: 14px;
          transition: background-color var(--transition-fast);
        }

        .menu-dropdown-item:hover {
          background-color: var(--color-surface-variant);
        }

        .menu-dropdown-item:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: -2px;
        }

        .menu-dropdown-item-shortcut {
          margin-left: var(--spacing-lg);
          color: var(--color-on-surface-variant);
          font-size: 12px;
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
      </style>

      <div class="app-container">
        <!-- Menu Bar -->
        <div class="menu-bar">
          <div class="menu-dropdown">
            <button class="menu-item" id="file-menu">File</button>
            <div class="menu-dropdown-content" id="file-menu-dropdown">
              <button class="menu-dropdown-item" id="file-new">
                <span>New</span>
                <span class="menu-dropdown-item-shortcut">Ctrl+N</span>
              </button>
              <button class="menu-dropdown-item" id="file-open">
                <span>Open...</span>
                <span class="menu-dropdown-item-shortcut">Ctrl+O</span>
              </button>
              <button class="menu-dropdown-item" id="file-save">
                <span>Save</span>
                <span class="menu-dropdown-item-shortcut">Ctrl+S</span>
              </button>
              <button class="menu-dropdown-item" id="file-save-as">
                <span>Save As...</span>
                <span class="menu-dropdown-item-shortcut">Ctrl+Shift+S</span>
              </button>
            </div>
          </div>
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
          <svg-hierarchy-panel></svg-hierarchy-panel>
        </div>

        <!-- Hierarchy Divider -->
        <div class="divider divider-h" data-divider="hierarchy"></div>

        <!-- Canvas Area -->
        <div class="canvas-area">
          <div class="tool-palette-container">
            <svg-tool-palette></svg-tool-palette>
          </div>
          <svg-canvas></svg-canvas>
        </div>

        <!-- Inspector Divider -->
        <div class="divider divider-i" data-divider="inspector"></div>

        <!-- Inspector Panel -->
        <div class="inspector-panel">
          <svg-attribute-inspector></svg-attribute-inspector>
        </div>

        <!-- Raw SVG Divider -->
        ${this.layout.rawSVGVisible ? '<div class="divider divider-v" data-divider="rawSVG"></div>' : ''}

        <!-- Raw SVG Panel -->
        ${this.layout.rawSVGVisible ? '<div class="raw-svg-panel"><svg-raw-panel></svg-raw-panel></div>' : ''}
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

    // File menu dropdown toggle
    const fileMenu = this.shadowRoot.querySelector('#file-menu');
    if (fileMenu) {
      fileMenu.addEventListener('click', this.handleFileMenuToggle);
    }

    // File menu items
    const fileNew = this.shadowRoot.querySelector('#file-new');
    if (fileNew) {
      fileNew.addEventListener('click', this.handleFileNew);
    }

    const fileOpen = this.shadowRoot.querySelector('#file-open');
    if (fileOpen) {
      fileOpen.addEventListener('click', this.handleFileOpen);
    }

    const fileSave = this.shadowRoot.querySelector('#file-save');
    if (fileSave) {
      fileSave.addEventListener('click', this.handleFileSave);
    }

    const fileSaveAs = this.shadowRoot.querySelector('#file-save-as');
    if (fileSaveAs) {
      fileSaveAs.addEventListener('click', this.handleFileSaveAs);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleDocumentClick);

    // Global mouse handlers for dragging
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  private detachEventListeners() {
    document.removeEventListener('click', this.handleDocumentClick);
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

  private handleFileMenuToggle = (event: Event) => {
    event.stopPropagation();
    if (!this.shadowRoot) return;

    const dropdown = this.shadowRoot.querySelector('#file-menu-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  };

  private handleDocumentClick = () => {
    // Close file menu dropdown when clicking outside
    if (!this.shadowRoot) return;

    const dropdown = this.shadowRoot.querySelector('#file-menu-dropdown');
    if (dropdown && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  };

  private handleFileNew = async (event: Event) => {
    event.stopPropagation();
    this.closeAllDropdowns();
    await this.performNew();
  };

  private handleFileOpen = async (event: Event) => {
    event.stopPropagation();
    this.closeAllDropdowns();

    try {
      const fileState = await fileManager.open();
      console.log('File opened successfully:', fileState.name);
      this.showNotification(`Opened: ${fileState.name}`, 'success');
    } catch (error) {
      if (error instanceof Error) {
        // Don't show error for user cancellation
        if (error.message.includes('cancelled')) {
          return;
        }
        console.error('Failed to open file:', error);
        this.showNotification(`Error: ${error.message}`, 'error');
      }
    }
  };

  private handleFileSave = async (event: Event) => {
    event.stopPropagation();
    this.closeAllDropdowns();
    await this.performSave();
  };

  private handleFileSaveAs = async (event: Event) => {
    event.stopPropagation();
    this.closeAllDropdowns();
    await this.performSaveAs();
  };

  private closeAllDropdowns() {
    if (!this.shadowRoot) return;

    const dropdowns = this.shadowRoot.querySelectorAll('.menu-dropdown-content');
    dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
  }

  private handleNewEvent = async () => {
    // Handle new document event from keyboard shortcut
    await this.performNew();
  };

  private handleSaveEvent = async () => {
    // Handle save event from keyboard shortcut
    await this.performSave();
  };

  private handleSaveAsEvent = async () => {
    // Handle save as event from keyboard shortcut
    await this.performSaveAs();
  };

  private async performNew(): Promise<void> {
    try {
      await fileManager.new();
      console.log('New document created successfully');
      this.showNotification('New document created', 'success');
    } catch (error) {
      if (error instanceof Error) {
        // Don't show error for user cancellation
        if (error.message.includes('cancelled')) {
          return;
        }
        console.error('Failed to create new document:', error);
        this.showNotification(`Error: ${error.message}`, 'error');
      }
    }
  }

  private async performSave(): Promise<void> {
    try {
      // Get the current document
      const doc = documentState.svgDocument.get();
      if (!doc) {
        this.showNotification('No document to save', 'error');
        return;
      }

      // Serialize the document to SVG markup
      const svgContent = svgSerializer.serialize(doc);

      // Save the document
      await fileManager.save(svgContent);
      
      const fileState = fileManager.getFileState();
      console.log('File saved successfully:', fileState.name);
      this.showNotification(`Saved: ${fileState.name || 'document.svg'}`, 'success');
    } catch (error) {
      if (error instanceof Error) {
        // Don't show error for user cancellation
        if (error.message.includes('cancelled')) {
          return;
        }
        console.error('Failed to save file:', error);
        this.showNotification(`Error: ${error.message}`, 'error');
      }
    }
  }

  private async performSaveAs(): Promise<void> {
    try {
      // Get the current document
      const doc = documentState.svgDocument.get();
      if (!doc) {
        this.showNotification('No document to save', 'error');
        return;
      }

      // Serialize the document to SVG markup
      const svgContent = svgSerializer.serialize(doc);

      // Save As the document
      const fileState = await fileManager.saveAs(svgContent);
      
      console.log('File saved as:', fileState.name);
      this.showNotification(`Saved as: ${fileState.name}`, 'success');
    } catch (error) {
      if (error instanceof Error) {
        // Don't show error for user cancellation
        if (error.message.includes('cancelled')) {
          return;
        }
        console.error('Failed to save file:', error);
        this.showNotification(`Error: ${error.message}`, 'error');
      }
    }
  }

  private showNotification(message: string, type: 'success' | 'error') {
    // Simple notification implementation
    // Could be enhanced with a proper notification system
    if (type === 'error') {
      alert(message);
    } else {
      console.log(message);
    }
  }

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
