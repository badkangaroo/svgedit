/**
 * SVG Raw Panel Component
 * 
 * Displays the raw SVG markup in a text editor.
 * Subscribes to document state signal to display SVG text.
 * Provides editable view with debounced parsing.
 * 
 * Requirements: 1.1, 5.1, 5.2, 13.4
 */

import { effect } from '../state/signals';
import { documentState, documentStateUpdater } from '../state/document-state';
import { svgSerializer } from '../utils/svg-serializer';
import { svgParser } from '../utils/svg-parser';
import { selectionManager } from '../state/selection-manager';
import type { ParseError } from '../types';

/**
 * Interface for element position mapping
 */
interface ElementPosition {
  id: string;
  startOffset: number;
  endOffset: number;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

/**
 * SVGRawPanel Web Component
 * 
 * Displays the raw SVG markup with syntax highlighting.
 * Automatically updates when the document state changes.
 * Supports editing with debounced parsing.
 */
export class SVGRawPanel extends HTMLElement {
  private textArea: HTMLTextAreaElement | null = null;
  private disposeEffects: (() => void)[] = [];
  private lineNumbers: HTMLDivElement | null = null;
  private debounceTimer: number | undefined;
  private isParsing: boolean = false;
  private isUpdatingFromState: boolean = false;
  private lastValidSVG: string = '';
  private errorContainer: HTMLDivElement | null = null;
  private elementPositions: ElementPosition[] = [];
  private isUpdatingSelection: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEffects();
  }

  disconnectedCallback() {
    // Clean up debounce timer
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
    }
    
    // Clean up effects
    this.disposeEffects.forEach(dispose => dispose());
    this.disposeEffects = [];
  }

  /**
   * Render the raw SVG panel component structure
   */
  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          background-color: var(--color-surface);
          color: var(--color-on-surface);
          overflow: hidden;
        }

        .panel-header {
          padding: var(--spacing-sm) var(--spacing-md);
          font-weight: 600;
          font-size: 14px;
          border-bottom: 1px solid var(--color-outline);
          background-color: var(--color-surface);
          color: var(--color-on-surface);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .panel-icon {
          font-size: 16px;
        }

        .panel-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .action-button {
          padding: var(--spacing-xs) var(--spacing-sm);
          background-color: transparent;
          border: 1px solid var(--color-outline);
          border-radius: var(--radius-sm);
          color: var(--color-on-surface);
          cursor: pointer;
          font-size: 12px;
          transition: background-color var(--transition-fast);
        }

        .action-button:hover {
          background-color: var(--color-surface-variant);
        }

        .action-button:active {
          background-color: var(--color-primary-container);
        }

        .action-button.rollback {
          background-color: var(--color-error, #f44336);
          color: white;
          border-color: var(--color-error, #f44336);
        }

        .action-button.rollback:hover {
          background-color: var(--color-error-dark, #d32f2f);
        }

        .action-button.hidden {
          display: none;
        }

        .editor-container {
          display: flex;
          height: calc(100% - 45px);
          position: relative;
          overflow: hidden;
        }

        .line-numbers {
          padding: var(--spacing-md) var(--spacing-sm);
          background-color: var(--color-surface-variant);
          color: var(--color-on-surface-variant);
          font-family: var(--font-mono, 'Courier New', monospace);
          font-size: 13px;
          line-height: 1.5;
          text-align: right;
          user-select: none;
          overflow: hidden;
          border-right: 1px solid var(--color-outline);
          min-width: 40px;
        }

        .line-number {
          display: block;
          height: 19.5px;
        }

        .text-editor {
          flex: 1;
          padding: var(--spacing-md);
          background-color: var(--color-surface);
          color: var(--color-on-surface);
          font-family: var(--font-mono, 'Courier New', monospace);
          font-size: 13px;
          line-height: 1.5;
          border: none;
          outline: none;
          resize: none;
          overflow: auto;
          white-space: pre;
          word-wrap: normal;
          tab-size: 2;
        }

        .text-editor::selection {
          background-color: var(--color-primary-container, #e3f2fd);
          color: var(--color-on-primary-container, #1565c0);
        }

        .text-editor::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .text-editor::-webkit-scrollbar-track {
          background-color: var(--color-surface-variant);
        }

        .text-editor::-webkit-scrollbar-thumb {
          background-color: var(--color-outline);
          border-radius: 6px;
        }

        .text-editor::-webkit-scrollbar-thumb:hover {
          background-color: var(--color-on-surface-variant);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--color-on-surface-variant);
          text-align: center;
          padding: var(--spacing-xl);
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: var(--spacing-md);
          opacity: 0.5;
        }

        .empty-state-text {
          font-size: 16px;
          margin-bottom: var(--spacing-sm);
        }

        .empty-state-hint {
          font-size: 14px;
          opacity: 0.7;
        }

        .status-bar {
          padding: var(--spacing-xs) var(--spacing-md);
          background-color: var(--color-surface-variant);
          color: var(--color-on-surface-variant);
          font-size: 11px;
          border-top: 1px solid var(--color-outline);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-info {
          display: flex;
          gap: var(--spacing-md);
        }

        .error-container {
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: var(--color-error, #f44336);
          color: white;
          font-size: 12px;
          border-bottom: 1px solid var(--color-outline);
          display: none;
        }

        .error-container.visible {
          display: block;
        }

        .error-message {
          margin: 0;
          padding: var(--spacing-xs) 0;
        }

        .error-location {
          font-weight: 600;
          margin-right: var(--spacing-xs);
        }

        .loading-indicator {
          display: none;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          background-color: var(--color-primary-container, #e3f2fd);
          color: var(--color-on-primary-container, #1565c0);
          font-size: 12px;
          border-radius: var(--radius-sm);
        }

        .loading-indicator.visible {
          display: flex;
        }

        .loading-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Syntax highlighting (basic) */
        .text-editor {
          /* SVG tags */
          --syntax-tag: var(--color-primary, #2196F3);
          /* Attributes */
          --syntax-attr: var(--color-accent, #FF9800);
          /* Values */
          --syntax-value: var(--color-success, #4CAF50);
        }
      </style>

      <div class="panel-header">
        <div class="panel-title">
          <span class="panel-icon">📝</span>
          <span>Raw SVG</span>
        </div>
        <div class="panel-actions">
          <div class="loading-indicator" id="loading-indicator">
            <div class="loading-spinner"></div>
            <span>Parsing...</span>
          </div>
          <button class="action-button rollback hidden" id="rollback-button" title="Revert to last valid SVG">
            ↩️ Rollback
          </button>
          <button class="action-button" id="copy-button" title="Copy to clipboard">
            📋 Copy
          </button>
          <button class="action-button" id="format-button" title="Format SVG">
            ✨ Format
          </button>
        </div>
      </div>

      <div class="error-container" id="error-container">
        <!-- Error messages will be displayed here -->
      </div>

      <div class="editor-container" id="editor-container">
        <!-- Content will be rendered here -->
      </div>
    `;

    this.setupActionButtons();
  }

  /**
   * Set up action button handlers
   */
  private setupActionButtons() {
    if (!this.shadowRoot) return;

    const copyButton = this.shadowRoot.querySelector('#copy-button');
    const formatButton = this.shadowRoot.querySelector('#format-button');
    const rollbackButton = this.shadowRoot.querySelector('#rollback-button');

    if (copyButton) {
      copyButton.addEventListener('click', () => this.handleCopy());
    }

    if (formatButton) {
      formatButton.addEventListener('click', () => this.handleFormat());
    }

    if (rollbackButton) {
      rollbackButton.addEventListener('click', () => this.handleRollback());
    }
  }

  /**
   * Handle copy to clipboard
   */
  private async handleCopy() {
    if (!this.textArea) return;

    try {
      await navigator.clipboard.writeText(this.textArea.value);
      this.showNotification('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.showNotification('Failed to copy');
    }
  }

  /**
   * Handle format SVG
   */
  private handleFormat() {
    const doc = documentState.svgDocument.get();
    if (!doc) return;

    // Re-serialize with formatting
    const formatted = svgSerializer.serialize(doc);
    documentState.rawSVG.set(formatted);
    this.showNotification('SVG formatted');
  }

  /**
   * Handle rollback to last valid SVG
   */
  private handleRollback() {
    if (!this.textArea || !this.lastValidSVG) return;

    // Restore textarea content to last valid SVG
    this.textArea.value = this.lastValidSVG;

    // Update line numbers
    this.updateLineNumbers(this.lastValidSVG);

    // Clear any displayed errors
    this.hideErrors();

    // Hide rollback button
    this.showRollbackButton(false);

    // Parse and update document state with last valid SVG
    this.parseSVGText(this.lastValidSVG);

    // Show notification
    this.showNotification('Reverted to last valid SVG');
  }

  /**
   * Show a temporary notification
   */
  private showNotification(message: string) {
    // Simple notification - could be enhanced with a toast component
    console.log(`[SVG Raw Panel] ${message}`);
  }

  /**
   * Set up reactive effects to respond to state changes
   */
  private setupEffects() {
    // Effect: Update text when document changes (but not when we're updating from parsing)
    const documentEffect = effect(() => {
      const doc = documentState.svgDocument.get();
      const rawSVG = documentState.rawSVG.get();
      
      // Only update if we're not currently parsing
      if (!this.isUpdatingFromState) {
        this.updateContent(doc, rawSVG);
      }
    });
    this.disposeEffects.push(documentEffect);

    // Effect: Update text selection when selection changes from other views
    const selectionEffect = effect(() => {
      const selectedIds = documentState.selectedIds.get();
      
      // Only update if we're not currently updating selection from this view
      if (!this.isUpdatingSelection && this.textArea) {
        this.highlightSelectedElements(selectedIds);
      }
    });
    this.disposeEffects.push(selectionEffect);

    // Register sync callback for selection manager
    selectionManager.registerSyncCallbacks({
      onRawSVGSync: (event) => {
        if (!this.isUpdatingSelection && this.textArea) {
          this.highlightSelectedElements(event.selectedIds);
        }
      }
    });
  }

  /**
   * Update the displayed content
   */
  private updateContent(doc: SVGElement | null, rawSVG: string) {
    if (!this.shadowRoot) return;

    const container = this.shadowRoot.querySelector('#editor-container');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    if (!doc) {
      // Show empty state
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <div class="empty-state-text">No document loaded</div>
          <div class="empty-state-hint">Open an SVG file or create a new document to view the raw SVG</div>
        </div>
      `;
      this.lastValidSVG = ''; // Clear last valid SVG if no document
      return;
    }

    // If rawSVG is empty, serialize the document
    let svgText = rawSVG;
    if (!svgText && doc) {
      svgText = svgSerializer.serialize(doc);
      documentState.rawSVG.set(svgText);
    }

    // Store last valid SVG
    this.lastValidSVG = svgText;

    // Build element position map for selection detection
    this.elementPositions = this.buildElementPositionMap(svgText);

    // Create line numbers container
    this.lineNumbers = document.createElement('div');
    this.lineNumbers.classList.add('line-numbers');

    // Create text editor
    this.textArea = document.createElement('textarea');
    this.textArea.classList.add('text-editor');
    this.textArea.value = svgText;
    this.textArea.readOnly = false; // Make editable
    this.textArea.spellcheck = false;

    // Update line numbers
    this.updateLineNumbers(svgText);

    // Add scroll sync between line numbers and text area
    this.textArea.addEventListener('scroll', () => {
      if (this.lineNumbers && this.textArea) {
        this.lineNumbers.scrollTop = this.textArea.scrollTop;
      }
    });

    // Add input event listener with debounce
    this.textArea.addEventListener('input', this.handleTextInput.bind(this));

    // Add cursor change event listeners for selection detection
    this.textArea.addEventListener('click', () => this.handleCursorChange());
    this.textArea.addEventListener('keyup', () => this.handleCursorChange());
    this.textArea.addEventListener('select', () => this.handleCursorChange());

    // Append to container
    container.appendChild(this.lineNumbers);
    container.appendChild(this.textArea);
  }

  /**
   * Handle text input with debouncing
   */
  private handleTextInput(event: Event) {
    if (!this.textArea) return;

    const svgText = this.textArea.value;

    // Update line numbers immediately
    this.updateLineNumbers(svgText);

    // Rebuild element position map for selection detection
    this.elementPositions = this.buildElementPositionMap(svgText);

    // Clear any existing debounce timer
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
    }

    // Set new debounce timer (300ms)
    this.debounceTimer = setTimeout(() => {
      this.parseSVGText(svgText);
    }, 300) as unknown as number;
  }

  /**
   * Parse SVG text and update document state
   */
  private async parseSVGText(svgText: string) {
    if (!this.shadowRoot) return;

    // Show loading indicator
    this.showLoadingIndicator(true);
    this.hideErrors();
    this.isParsing = true;

    try {
      // Parse the SVG text
      const parseResult = svgParser.parse(svgText);

      if (parseResult.success && parseResult.document) {
        // Update document state with parsed result
        this.isUpdatingFromState = true;
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        this.isUpdatingFromState = false;

        // Store as last valid SVG
        this.lastValidSVG = svgText;

        // Hide errors
        this.hideErrors();
      } else {
        // Display parse errors
        this.displayErrors(parseResult.errors);
      }
    } catch (error) {
      // Handle unexpected errors
      console.error('Error parsing SVG:', error);
      this.displayErrors([{
        line: 1,
        column: 1,
        message: error instanceof Error ? error.message : 'Unknown parsing error',
        severity: 'error',
      }]);
    } finally {
      // Hide loading indicator
      this.showLoadingIndicator(false);
      this.isParsing = false;
    }
  }

  /**
   * Display parse errors
   */
  private displayErrors(errors: ParseError[]) {
    if (!this.shadowRoot) return;

    const errorContainer = this.shadowRoot.querySelector('#error-container') as HTMLDivElement;
    if (!errorContainer) return;

    // Clear existing errors
    errorContainer.innerHTML = '';

    if (errors.length === 0) {
      errorContainer.classList.remove('visible');
      this.showRollbackButton(false);
      return;
    }

    // Display each error
    errors.forEach(error => {
      const errorMessage = document.createElement('div');
      errorMessage.classList.add('error-message');
      
      const location = document.createElement('span');
      location.classList.add('error-location');
      location.textContent = `Line ${error.line}, Column ${error.column}:`;
      
      const message = document.createElement('span');
      message.textContent = error.message;
      
      errorMessage.appendChild(location);
      errorMessage.appendChild(message);
      errorContainer.appendChild(errorMessage);
    });

    errorContainer.classList.add('visible');
    
    // Show rollback button when there are errors
    this.showRollbackButton(true);
  }

  /**
   * Hide error messages
   */
  private hideErrors() {
    if (!this.shadowRoot) return;

    const errorContainer = this.shadowRoot.querySelector('#error-container') as HTMLDivElement;
    if (errorContainer) {
      errorContainer.classList.remove('visible');
      errorContainer.innerHTML = '';
    }
    
    // Hide rollback button when errors are cleared
    this.showRollbackButton(false);
  }

  /**
   * Show or hide loading indicator
   */
  private showLoadingIndicator(show: boolean) {
    if (!this.shadowRoot) return;

    const loadingIndicator = this.shadowRoot.querySelector('#loading-indicator') as HTMLDivElement;
    if (loadingIndicator) {
      if (show) {
        loadingIndicator.classList.add('visible');
      } else {
        loadingIndicator.classList.remove('visible');
      }
    }
  }

  /**
   * Show or hide rollback button
   */
  private showRollbackButton(show: boolean) {
    if (!this.shadowRoot) return;

    const rollbackButton = this.shadowRoot.querySelector('#rollback-button') as HTMLButtonElement;
    if (rollbackButton) {
      if (show) {
        rollbackButton.classList.remove('hidden');
      } else {
        rollbackButton.classList.add('hidden');
      }
    }
  }

  /**
   * Update line numbers based on content
   */
  private updateLineNumbers(content: string) {
    if (!this.lineNumbers) return;

    const lines = content.split('\n');
    const lineCount = lines.length;

    this.lineNumbers.innerHTML = '';
    for (let i = 1; i <= lineCount; i++) {
      const lineNumber = document.createElement('div');
      lineNumber.classList.add('line-number');
      lineNumber.textContent = i.toString();
      this.lineNumbers.appendChild(lineNumber);
    }
  }

  /**
   * Build a map of element IDs to their text positions
   * This allows us to detect which element the cursor is in
   */
  private buildElementPositionMap(svgText: string): ElementPosition[] {
    const positions: ElementPosition[] = [];
    
    // Parse the SVG to get the DOM structure
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    
    // Check for parse errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return positions;
    }

    // Find all elements with IDs in the SVG text
    const elementsWithIds = doc.querySelectorAll('[id]');
    
    elementsWithIds.forEach((element) => {
      const id = element.getAttribute('id');
      if (!id) return;

      // Find the element's opening tag in the text
      const tagName = element.tagName.toLowerCase();
      
      // Build a regex to find the opening tag with this ID
      // This handles various formats: id="value", id='value', id=value
      const idPattern = `id\\s*=\\s*["']?${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?`;
      const tagPattern = `<${tagName}[^>]*${idPattern}[^>]*>`;
      const regex = new RegExp(tagPattern, 'i');
      
      const match = regex.exec(svgText);
      if (match) {
        const startOffset = match.index;
        const endOffset = startOffset + match[0].length;
        
        // Calculate line and column numbers
        const beforeMatch = svgText.substring(0, startOffset);
        const lines = beforeMatch.split('\n');
        const startLine = lines.length;
        const startColumn = lines[lines.length - 1].length + 1;
        
        const upToEnd = svgText.substring(0, endOffset);
        const endLines = upToEnd.split('\n');
        const endLine = endLines.length;
        const endColumn = endLines[endLines.length - 1].length + 1;
        
        positions.push({
          id,
          startOffset,
          endOffset,
          startLine,
          startColumn,
          endLine,
          endColumn,
        });
      }
    });

    return positions;
  }

  /**
   * Detect which element the cursor is in based on cursor position
   */
  private detectElementAtCursor(): string | null {
    if (!this.textArea) return null;

    const cursorPosition = this.textArea.selectionStart;
    
    // Find the element that contains the cursor position
    for (const position of this.elementPositions) {
      if (cursorPosition >= position.startOffset && cursorPosition <= position.endOffset) {
        return position.id;
      }
    }

    return null;
  }

  /**
   * Handle cursor position changes to detect element selection
   */
  private handleCursorChange(): void {
    if (!this.textArea || this.isUpdatingSelection) return;

    const elementId = this.detectElementAtCursor();
    
    if (elementId) {
      // Update selection manager
      this.isUpdatingSelection = true;
      selectionManager.select([elementId]);
      this.isUpdatingSelection = false;
    }
  }

  /**
   * Highlight selected elements in the text editor
   */
  private highlightSelectedElements(selectedIds: Set<string>): void {
    if (!this.textArea || selectedIds.size === 0) return;

    // Find the first selected element's position
    const firstSelectedId = Array.from(selectedIds)[0];
    const position = this.elementPositions.find(p => p.id === firstSelectedId);
    
    if (position) {
      // Set the textarea selection to highlight the element
      this.isUpdatingSelection = true;
      this.textArea.setSelectionRange(position.startOffset, position.endOffset);
      this.textArea.focus();
      this.isUpdatingSelection = false;
    }
  }

  /**
   * Get the current SVG text (for testing)
   */
  public getSVGText(): string {
    return this.textArea?.value || '';
  }

  /**
   * Check if the editor is read-only (for testing)
   */
  public isReadOnly(): boolean {
    return this.textArea?.readOnly ?? true;
  }

  /**
   * Get the last valid SVG text (for testing and rollback)
   */
  public getLastValidSVG(): string {
    return this.lastValidSVG;
  }

  /**
   * Check if currently parsing (for testing)
   */
  public isParsingSVG(): boolean {
    return this.isParsing;
  }

  /**
   * Check if rollback button is visible (for testing)
   */
  public isRollbackButtonVisible(): boolean {
    if (!this.shadowRoot) return false;
    
    const rollbackButton = this.shadowRoot.querySelector('#rollback-button') as HTMLButtonElement;
    return rollbackButton ? !rollbackButton.classList.contains('hidden') : false;
  }

  /**
   * Trigger rollback (for testing)
   */
  public triggerRollback(): void {
    this.handleRollback();
  }
}

// Register the custom element
customElements.define('svg-raw-panel', SVGRawPanel);
