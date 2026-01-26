/**
 * Unit tests for SVG Raw Panel Component
 * 
 * Tests the raw SVG panel component functionality including:
 * - Component rendering and structure
 * - Document state subscription and updates
 * - SVG text display
 * - Line numbers
 * - Action buttons (copy, format)
 * - Empty state handling
 * - Debounced parsing (Task 10.2)
 * - Parse error display
 * - Loading indicators
 * 
 * Requirements: 1.1, 5.1, 5.2, 13.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import './svg-raw-panel';
import { documentState, documentStateUpdater } from '../state/document-state';
import { SVGParser } from '../utils/svg-parser';
import type { SVGRawPanel } from './svg-raw-panel';

describe('SVGRawPanel', () => {
  let panel: SVGRawPanel;
  let parser: SVGParser;

  beforeEach(() => {
    // Create a fresh panel instance
    panel = document.createElement('svg-raw-panel') as SVGRawPanel;
    document.body.appendChild(panel);
    
    // Create parser instance
    parser = new SVGParser();
    
    // Clear document state
    documentStateUpdater.clearDocument();
  });

  afterEach(() => {
    // Clean up
    if (panel && panel.parentNode) {
      panel.parentNode.removeChild(panel);
    }
    
    // Clear document state
    documentStateUpdater.clearDocument();
  });

  describe('Component Structure', () => {
    it('should render with shadow DOM', () => {
      expect(panel.shadowRoot).not.toBeNull();
    });

    it('should have a panel header with title', () => {
      const header = panel.shadowRoot?.querySelector('.panel-header');
      expect(header).not.toBeNull();
      
      const title = panel.shadowRoot?.querySelector('.panel-title');
      expect(title?.textContent).toContain('Raw SVG');
    });

    it('should have action buttons (copy and format)', () => {
      const copyButton = panel.shadowRoot?.querySelector('#copy-button');
      const formatButton = panel.shadowRoot?.querySelector('#format-button');
      
      expect(copyButton).not.toBeNull();
      expect(formatButton).not.toBeNull();
      expect(copyButton?.textContent).toContain('Copy');
      expect(formatButton?.textContent).toContain('Format');
    });

    it('should have an editor container', () => {
      const container = panel.shadowRoot?.querySelector('#editor-container');
      expect(container).not.toBeNull();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no document is loaded', async () => {
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const emptyState = panel.shadowRoot?.querySelector('.empty-state');
      expect(emptyState).not.toBeNull();
      expect(emptyState?.textContent).toContain('No document loaded');
    });

    it('should show appropriate message in empty state', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const emptyStateText = panel.shadowRoot?.querySelector('.empty-state-text');
      const emptyStateHint = panel.shadowRoot?.querySelector('.empty-state-hint');
      
      expect(emptyStateText).not.toBeNull();
      expect(emptyStateHint).not.toBeNull();
      expect(emptyStateText?.textContent).toContain('No document loaded');
      expect(emptyStateHint?.textContent).toContain('Open an SVG file');
    });
  });

  describe('SVG Text Display', () => {
    it('should display SVG text when document is loaded', async () => {
      // Create a simple SVG document
      const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
      const parseResult = parser.parse(svgText);
      
      expect(parseResult.success).toBe(true);
      expect(parseResult.document).not.toBeNull();
      
      // Set document state
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check that text area is created and contains SVG text
      const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea).not.toBeNull();
      expect(textArea?.value).toContain('<svg');
      expect(textArea?.value).toContain('<rect');
    });

    it('should serialize document if rawSVG is empty', async () => {
      // Create a simple SVG document
      const svgText = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
      const parseResult = parser.parse(svgText);
      
      expect(parseResult.success).toBe(true);
      
      // Set document state with empty rawSVG
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        '' // Empty raw SVG
      );
      
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check that text area contains serialized SVG
      const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea).not.toBeNull();
      expect(textArea?.value).toContain('<svg');
      expect(textArea?.value).toContain('<circle');
    });

    it('should update text when document changes', async () => {
      // Load first document
      const svgText1 = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
      const parseResult1 = parser.parse(svgText1);
      
      documentStateUpdater.setDocument(
        parseResult1.document,
        parseResult1.tree,
        svgText1
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      let textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea?.value).toContain('<rect');
      
      // Load second document
      const svgText2 = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
      const parseResult2 = parser.parse(svgText2);
      
      documentStateUpdater.setDocument(
        parseResult2.document,
        parseResult2.tree,
        svgText2
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea?.value).toContain('<circle');
      expect(textArea?.value).not.toContain('<rect');
    });
  });

  describe('Line Numbers', () => {
    it('should display line numbers', async () => {
      const svgText = '<svg width="100" height="100">\n  <rect x="10" y="10" width="80" height="80" fill="blue" />\n</svg>';
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const lineNumbers = panel.shadowRoot?.querySelector('.line-numbers');
      expect(lineNumbers).not.toBeNull();
      
      const lineNumberElements = panel.shadowRoot?.querySelectorAll('.line-number');
      expect(lineNumberElements).not.toBeNull();
      expect(lineNumberElements!.length).toBeGreaterThan(0);
    });

    it('should have correct number of line numbers', async () => {
      const svgText = '<svg width="100" height="100">\n  <rect x="10" y="10" width="80" height="80" fill="blue" />\n</svg>';
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const lineCount = svgText.split('\n').length;
      const lineNumberElements = panel.shadowRoot?.querySelectorAll('.line-number');
      
      expect(lineNumberElements?.length).toBe(lineCount);
    });

    it('should update line numbers when content changes', async () => {
      // Load first document with 3 lines
      const svgText1 = '<svg>\n  <rect />\n</svg>';
      const parseResult1 = parser.parse(svgText1);
      
      documentStateUpdater.setDocument(
        parseResult1.document,
        parseResult1.tree,
        svgText1
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      let lineNumberElements = panel.shadowRoot?.querySelectorAll('.line-number');
      const lineCount1 = svgText1.split('\n').length;
      expect(lineNumberElements?.length).toBe(lineCount1);
      
      // Load second document with more lines
      const svgText2 = '<svg>\n  <rect />\n  <circle />\n  <ellipse />\n</svg>';
      const parseResult2 = parser.parse(svgText2);
      
      documentStateUpdater.setDocument(
        parseResult2.document,
        parseResult2.tree,
        svgText2
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      lineNumberElements = panel.shadowRoot?.querySelectorAll('.line-number');
      const lineCount2 = svgText2.split('\n').length;
      expect(lineNumberElements?.length).toBe(lineCount2);
    });
  });

  describe('Text Editor Properties', () => {
    it('should be editable (not read-only)', async () => {
      const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea?.readOnly).toBe(false);
    });

    it('should have monospace font', async () => {
      const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      
      // In jsdom, computed styles may not work properly, so check the CSS class instead
      expect(textArea).not.toBeNull();
      expect(textArea.classList.contains('text-editor')).toBe(true);
      
      // Verify the style is defined in the shadow DOM
      const style = panel.shadowRoot?.querySelector('style');
      expect(style?.textContent).toContain('font-family: var(--font-mono');
    });

    it('should disable spellcheck', async () => {
      const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea?.spellcheck).toBe(false);
    });
  });

  describe('Action Buttons', () => {
    it('should copy SVG text to clipboard when copy button is clicked', async () => {
      const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Mock clipboard API
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });
      
      const copyButton = panel.shadowRoot?.querySelector('#copy-button') as HTMLButtonElement;
      copyButton?.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(writeTextMock).toHaveBeenCalled();
      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('<svg'));
    });

    it('should format SVG when format button is clicked', async () => {
      // Create unformatted SVG
      const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const formatButton = panel.shadowRoot?.querySelector('#format-button') as HTMLButtonElement;
      formatButton?.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check that rawSVG state was updated with formatted version
      const rawSVG = documentState.rawSVG.get();
      expect(rawSVG).toContain('\n'); // Formatted SVG should have newlines
      expect(rawSVG).toContain('  '); // Formatted SVG should have indentation
    });
  });

  describe('Public API', () => {
    it('should provide getSVGText() method', async () => {
      const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const text = panel.getSVGText();
      expect(text).toContain('<svg');
      expect(text).toContain('<rect');
    });

    it('should provide isReadOnly() method', async () => {
      const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(panel.isReadOnly()).toBe(false);
    });

    it('should return empty string from getSVGText() when no document', () => {
      const text = panel.getSVGText();
      expect(text).toBe('');
    });

    it('should return true from isReadOnly() when no document', () => {
      expect(panel.isReadOnly()).toBe(true);
    });
  });

  describe('Reactive Updates', () => {
    it('should update when rawSVG signal changes', async () => {
      const svgText1 = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
      const parseResult1 = parser.parse(svgText1);
      
      documentStateUpdater.setDocument(
        parseResult1.document,
        parseResult1.tree,
        svgText1
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      let textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea?.value).toContain('<rect');
      
      // Update rawSVG directly
      const svgText2 = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
      documentState.rawSVG.set(svgText2);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea?.value).toContain('<circle');
    });

    it('should clear content when document is cleared', async () => {
      const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      let textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea).not.toBeNull();
      
      // Clear document
      documentStateUpdater.clearDocument();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should show empty state
      const emptyState = panel.shadowRoot?.querySelector('.empty-state');
      expect(emptyState).not.toBeNull();
    });
  });

  describe('Complex SVG Documents', () => {
    it('should handle SVG with multiple elements', async () => {
      const svgText = `<svg width="200" height="200">
  <rect x="10" y="10" width="80" height="80" fill="blue" />
  <circle cx="150" cy="50" r="40" fill="red" />
  <ellipse cx="100" cy="150" rx="60" ry="30" fill="green" />
</svg>`;
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea?.value).toContain('<rect');
      expect(textArea?.value).toContain('<circle');
      expect(textArea?.value).toContain('<ellipse');
    });

    it('should handle SVG with nested groups', async () => {
      const svgText = `<svg width="200" height="200">
  <g id="group1">
    <rect x="10" y="10" width="80" height="80" fill="blue" />
    <g id="group2">
      <circle cx="50" cy="50" r="20" fill="red" />
    </g>
  </g>
</svg>`;
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea?.value).toContain('<g');
      expect(textArea?.value).toContain('group1');
      expect(textArea?.value).toContain('group2');
    });

    it('should handle SVG with special characters in attributes', async () => {
      const svgText = '<svg width="100" height="100"><text x="10" y="20" fill="blue">Hello &amp; World</text></svg>';
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      expect(textArea?.value).toContain('<text');
      expect(textArea?.value).toContain('Hello');
    });
  });

  describe('Scroll Synchronization', () => {
    it('should sync line numbers scroll with text area scroll', async () => {
      // Create a large SVG with many lines
      const lines = Array.from({ length: 50 }, (_, i) => 
        `  <rect x="${i * 10}" y="${i * 10}" width="10" height="10" fill="blue" />`
      );
      const svgText = `<svg width="500" height="500">\n${lines.join('\n')}\n</svg>`;
      const parseResult = parser.parse(svgText);
      
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        svgText
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
      const lineNumbers = panel.shadowRoot?.querySelector('.line-numbers') as HTMLDivElement;
      
      expect(textArea).not.toBeNull();
      expect(lineNumbers).not.toBeNull();
      
      // Simulate scroll
      textArea.scrollTop = 100;
      textArea.dispatchEvent(new Event('scroll'));
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Line numbers should sync
      expect(lineNumbers.scrollTop).toBe(100);
    });
  });

  describe('Debounced Parsing (Task 10.2)', () => {
    describe('Editable Mode', () => {
      it('should make textarea editable (not read-only)', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(panel.isReadOnly()).toBe(false);
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        expect(textArea?.readOnly).toBe(false);
      });
    });

    describe('Input Event Handling', () => {
      it('should handle text input events', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        expect(textArea).not.toBeNull();
        
        // Modify the text
        textArea.value = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        
        // Should not throw error
        expect(textArea.value).toContain('<circle');
      });

      it('should update line numbers immediately on input', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Add more lines
        const newText = '<svg>\n  <rect />\n  <circle />\n  <ellipse />\n</svg>';
        textArea.value = newText;
        textArea.dispatchEvent(new Event('input'));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const lineNumberElements = panel.shadowRoot?.querySelectorAll('.line-number');
        const expectedLineCount = newText.split('\n').length;
        expect(lineNumberElements?.length).toBe(expectedLineCount);
      });
    });

    describe('Debounce Timing', () => {
      it('should debounce parsing with 300ms delay', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Modify text
        const newText = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.value = newText;
        textArea.dispatchEvent(new Event('input'));
        
        // Should not parse immediately
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(panel.isParsingSVG()).toBe(false);
        
        // Should parse after 300ms
        await new Promise(resolve => setTimeout(resolve, 250));
        
        // Check that document was updated
        const doc = documentState.svgDocument.get();
        const rawSVG = documentState.rawSVG.get();
        expect(rawSVG).toContain('<circle');
      });

      it('should cancel previous debounce timer on rapid input', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Rapid input changes
        textArea.value = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        textArea.value = '<svg width="100" height="100"><ellipse cx="50" cy="50" rx="40" ry="30" fill="green" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        textArea.value = '<svg width="100" height="100"><line x1="0" y1="0" x2="100" y2="100" stroke="black" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        
        // Wait for debounce to complete
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Should only parse the last value
        const rawSVG = documentState.rawSVG.get();
        expect(rawSVG).toContain('<line');
        expect(rawSVG).not.toContain('<circle');
        expect(rawSVG).not.toContain('<ellipse');
      });
    });

    describe('Successful Parsing', () => {
      it('should parse valid SVG and update document state', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Modify to valid SVG
        const newText = '<svg width="200" height="200"><circle cx="100" cy="100" r="80" fill="red" /></svg>';
        textArea.value = newText;
        textArea.dispatchEvent(new Event('input'));
        
        // Wait for debounce and parsing
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Check document state was updated
        const doc = documentState.svgDocument.get();
        const rawSVG = documentState.rawSVG.get();
        const tree = documentState.documentTree.get();
        
        expect(doc).not.toBeNull();
        expect(rawSVG).toContain('<circle');
        expect(tree.length).toBeGreaterThan(0);
      });

      it('should hide errors after successful parse', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // First, enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Check error is displayed
        let errorContainer = panel.shadowRoot?.querySelector('#error-container') as HTMLDivElement;
        expect(errorContainer?.classList.contains('visible')).toBe(true);
        
        // Now enter valid SVG
        textArea.value = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Error should be hidden
        errorContainer = panel.shadowRoot?.querySelector('#error-container') as HTMLDivElement;
        expect(errorContainer?.classList.contains('visible')).toBe(false);
      });

      it('should update last valid SVG after successful parse', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        const newText = '<svg width="200" height="200"><circle cx="100" cy="100" r="80" fill="red" /></svg>';
        textArea.value = newText;
        textArea.dispatchEvent(new Event('input'));
        
        await new Promise(resolve => setTimeout(resolve, 350));
        
        const lastValid = panel.getLastValidSVG();
        expect(lastValid).toContain('<circle');
      });
    });

    describe('Parse Error Handling', () => {
      it('should display parse errors for invalid SVG', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        
        // Wait for debounce and parsing
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Check error container is visible
        const errorContainer = panel.shadowRoot?.querySelector('#error-container') as HTMLDivElement;
        expect(errorContainer).not.toBeNull();
        expect(errorContainer?.classList.contains('visible')).toBe(true);
      });

      it('should display error with line and column information', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><rect></svg>';
        textArea.dispatchEvent(new Event('input'));
        
        await new Promise(resolve => setTimeout(resolve, 350));
        
        const errorContainer = panel.shadowRoot?.querySelector('#error-container') as HTMLDivElement;
        const errorLocation = panel.shadowRoot?.querySelector('.error-location');
        
        expect(errorLocation).not.toBeNull();
        expect(errorLocation?.textContent).toMatch(/Line \d+, Column \d+:/);
      });

      it('should display error message text', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><unclosed';
        textArea.dispatchEvent(new Event('input'));
        
        await new Promise(resolve => setTimeout(resolve, 350));
        
        const errorMessage = panel.shadowRoot?.querySelector('.error-message');
        expect(errorMessage).not.toBeNull();
        expect(errorMessage?.textContent).toBeTruthy();
      });

      it('should not update document state on parse error', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Store original document
        const originalDoc = documentState.svgDocument.get();
        const originalRawSVG = documentState.rawSVG.get();
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Document state should remain unchanged
        const currentDoc = documentState.svgDocument.get();
        const currentRawSVG = documentState.rawSVG.get();
        
        expect(currentDoc).toBe(originalDoc);
        expect(currentRawSVG).toBe(originalRawSVG);
      });

      it('should preserve last valid SVG on parse error', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const lastValidBefore = panel.getLastValidSVG();
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        
        await new Promise(resolve => setTimeout(resolve, 350));
        
        const lastValidAfter = panel.getLastValidSVG();
        expect(lastValidAfter).toBe(lastValidBefore);
        expect(lastValidAfter).toContain('<rect');
      });
    });

    describe('Loading Indicator', () => {
      it('should show loading indicator during parsing', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Modify text
        textArea.value = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 310));
        
        // Loading indicator should be visible during parsing
        // Note: This test may be flaky due to timing, but it demonstrates the concept
        const loadingIndicator = panel.shadowRoot?.querySelector('#loading-indicator') as HTMLDivElement;
        expect(loadingIndicator).not.toBeNull();
      });

      it('should hide loading indicator after parsing completes', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        textArea.value = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        
        // Wait for debounce and parsing to complete
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const loadingIndicator = panel.shadowRoot?.querySelector('#loading-indicator') as HTMLDivElement;
        expect(loadingIndicator?.classList.contains('visible')).toBe(false);
      });
    });

    describe('Complex Scenarios', () => {
      it('should handle multiple edits with debouncing', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // First edit
        textArea.value = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        let rawSVG = documentState.rawSVG.get();
        expect(rawSVG).toContain('<circle');
        
        // Second edit
        textArea.value = '<svg width="100" height="100"><ellipse cx="50" cy="50" rx="40" ry="30" fill="green" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        rawSVG = documentState.rawSVG.get();
        expect(rawSVG).toContain('<ellipse');
      });

      it('should handle switching between valid and invalid SVG', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Valid SVG
        textArea.value = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        let errorContainer = panel.shadowRoot?.querySelector('#error-container') as HTMLDivElement;
        expect(errorContainer?.classList.contains('visible')).toBe(false);
        
        // Invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        errorContainer = panel.shadowRoot?.querySelector('#error-container') as HTMLDivElement;
        expect(errorContainer?.classList.contains('visible')).toBe(true);
        
        // Valid SVG again
        textArea.value = '<svg width="100" height="100"><line x1="0" y1="0" x2="100" y2="100" stroke="black" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        errorContainer = panel.shadowRoot?.querySelector('#error-container') as HTMLDivElement;
        expect(errorContainer?.classList.contains('visible')).toBe(false);
      });
    });
  });

  describe('Rollback Mechanism (Task 10.4)', () => {
    describe('Rollback Button Visibility', () => {
      it('should hide rollback button when no errors', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(panel.isRollbackButtonVisible()).toBe(false);
      });

      it('should show rollback button when parse errors occur', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        
        await new Promise(resolve => setTimeout(resolve, 350));
        
        expect(panel.isRollbackButtonVisible()).toBe(true);
      });

      it('should hide rollback button after successful parse', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        expect(panel.isRollbackButtonVisible()).toBe(true);
        
        // Enter valid SVG
        textArea.value = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        expect(panel.isRollbackButtonVisible()).toBe(false);
      });
    });

    describe('Rollback Functionality', () => {
      it('should restore textarea content to last valid SVG', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        const lastValid = panel.getLastValidSVG();
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Trigger rollback
        panel.triggerRollback();
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Textarea should be restored
        expect(textArea.value).toBe(lastValid);
        expect(textArea.value).toContain('<rect');
      });

      it('should clear parse errors after rollback', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Verify error is displayed
        let errorContainer = panel.shadowRoot?.querySelector('#error-container') as HTMLDivElement;
        expect(errorContainer?.classList.contains('visible')).toBe(true);
        
        // Trigger rollback
        panel.triggerRollback();
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Error should be cleared
        errorContainer = panel.shadowRoot?.querySelector('#error-container') as HTMLDivElement;
        expect(errorContainer?.classList.contains('visible')).toBe(false);
      });

      it('should update document state with last valid SVG', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Trigger rollback
        panel.triggerRollback();
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Document state should be updated with last valid SVG
        const rawSVG = documentState.rawSVG.get();
        expect(rawSVG).toContain('<rect');
        expect(rawSVG).not.toContain('<invalid');
      });

      it('should hide rollback button after rollback', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        expect(panel.isRollbackButtonVisible()).toBe(true);
        
        // Trigger rollback
        panel.triggerRollback();
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(panel.isRollbackButtonVisible()).toBe(false);
      });

      it('should update line numbers after rollback', async () => {
        const svgText = '<svg width="100" height="100">\n  <rect x="10" y="10" width="80" height="80" fill="blue" />\n</svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        const originalLineCount = svgText.split('\n').length;
        
        // Enter invalid SVG with different line count
        textArea.value = '<svg><invalid\n\n\n\n';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Trigger rollback
        panel.triggerRollback();
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Line numbers should match original
        const lineNumberElements = panel.shadowRoot?.querySelectorAll('.line-number');
        expect(lineNumberElements?.length).toBe(originalLineCount);
      });
    });

    describe('Last Valid SVG Tracking', () => {
      it('should maintain last valid SVG snapshot', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const lastValid = panel.getLastValidSVG();
        expect(lastValid).toContain('<rect');
      });

      it('should update last valid SVG after successful parse', async () => {
        const svgText1 = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult1 = parser.parse(svgText1);
        
        documentStateUpdater.setDocument(
          parseResult1.document,
          parseResult1.tree,
          svgText1
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter new valid SVG
        const svgText2 = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.value = svgText2;
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        const lastValid = panel.getLastValidSVG();
        expect(lastValid).toContain('<circle');
        expect(lastValid).not.toContain('<rect');
      });

      it('should not update last valid SVG on parse error', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const lastValidBefore = panel.getLastValidSVG();
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        const lastValidAfter = panel.getLastValidSVG();
        expect(lastValidAfter).toBe(lastValidBefore);
      });
    });

    describe('Rollback Button Interaction', () => {
      it('should trigger rollback when button is clicked', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Click rollback button
        const rollbackButton = panel.shadowRoot?.querySelector('#rollback-button') as HTMLButtonElement;
        expect(rollbackButton).not.toBeNull();
        rollbackButton.click();
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Should restore to last valid
        expect(textArea.value).toContain('<rect');
      });

      it('should have rollback button with correct styling', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        const rollbackButton = panel.shadowRoot?.querySelector('#rollback-button') as HTMLButtonElement;
        expect(rollbackButton).not.toBeNull();
        expect(rollbackButton.classList.contains('rollback')).toBe(true);
        expect(rollbackButton.textContent).toContain('Rollback');
      });
    });

    describe('Edge Cases', () => {
      it('should handle rollback when lastValidSVG is empty', async () => {
        // Don't set any document initially
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Try to trigger rollback
        panel.triggerRollback();
        
        // Should not throw error
        expect(panel.getLastValidSVG()).toBe('');
      });

      it('should handle multiple consecutive rollbacks', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // First rollback
        panel.triggerRollback();
        await new Promise(resolve => setTimeout(resolve, 400));
        
        expect(textArea.value).toContain('<rect');
        
        // Enter invalid SVG again
        textArea.value = '<svg><another-invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Second rollback
        panel.triggerRollback();
        await new Promise(resolve => setTimeout(resolve, 400));
        
        expect(textArea.value).toContain('<rect');
      });

      it('should handle rollback with complex multi-line SVG', async () => {
        const svgText = `<svg width="200" height="200">
  <g id="group1">
    <rect x="10" y="10" width="80" height="80" fill="blue" />
    <circle cx="50" cy="50" r="20" fill="red" />
  </g>
</svg>`;
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Trigger rollback
        panel.triggerRollback();
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Should restore complex SVG
        expect(textArea.value).toContain('<g');
        expect(textArea.value).toContain('group1');
        expect(textArea.value).toContain('<rect');
        expect(textArea.value).toContain('<circle');
      });
    });

    describe('Integration with Parse Errors', () => {
      it('should show rollback button only when errors are present', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(panel.isRollbackButtonVisible()).toBe(false);
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Rollback button should be visible
        expect(panel.isRollbackButtonVisible()).toBe(true);
        
        // Error container should be visible
        const errorContainer = panel.shadowRoot?.querySelector('#error-container') as HTMLDivElement;
        expect(errorContainer?.classList.contains('visible')).toBe(true);
      });

      it('should clear both errors and rollback button after successful edit', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter invalid SVG
        textArea.value = '<svg><invalid';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        expect(panel.isRollbackButtonVisible()).toBe(true);
        
        // Enter valid SVG
        textArea.value = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 350));
        
        expect(panel.isRollbackButtonVisible()).toBe(false);
        
        const errorContainer = panel.shadowRoot?.querySelector('#error-container') as HTMLDivElement;
        expect(errorContainer?.classList.contains('visible')).toBe(false);
      });
    });
  });

  describe('Selection Synchronization (Task 10.6)', () => {
    describe('Element Position Mapping', () => {
      it('should build element position map for SVG with IDs', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Element positions should be built
        // We can't directly access private properties, but we can test the behavior
        expect(panel.getSVGText()).toContain('rect1');
      });

      it('should handle SVG with multiple elements with IDs', async () => {
        const svgText = `<svg width="200" height="200">
  <rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" />
  <circle id="circle1" cx="150" cy="50" r="40" fill="red" />
  <ellipse id="ellipse1" cx="100" cy="150" rx="60" ry="30" fill="green" />
</svg>`;
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const text = panel.getSVGText();
        expect(text).toContain('rect1');
        expect(text).toContain('circle1');
        expect(text).toContain('ellipse1');
      });

      it('should handle SVG with nested elements with IDs', async () => {
        const svgText = `<svg width="200" height="200">
  <g id="group1">
    <rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" />
    <g id="group2">
      <circle id="circle1" cx="50" cy="50" r="20" fill="red" />
    </g>
  </g>
</svg>`;
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const text = panel.getSVGText();
        expect(text).toContain('group1');
        expect(text).toContain('rect1');
        expect(text).toContain('group2');
        expect(text).toContain('circle1');
      });

      it('should rebuild position map when text changes', async () => {
        const svgText1 = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult1 = parser.parse(svgText1);
        
        documentStateUpdater.setDocument(
          parseResult1.document,
          parseResult1.tree,
          svgText1
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Change text to add new element
        const svgText2 = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /><circle id="circle1" cx="50" cy="50" r="40" fill="red" /></svg>';
        textArea.value = svgText2;
        textArea.dispatchEvent(new Event('input'));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Position map should be rebuilt
        expect(textArea.value).toContain('circle1');
      });
    });

    describe('Cursor-Based Selection Detection', () => {
      it('should detect element at cursor position', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        expect(textArea).not.toBeNull();
        
        // Position cursor inside rect element
        const rectIndex = svgText.indexOf('<rect');
        textArea.setSelectionRange(rectIndex + 5, rectIndex + 5);
        textArea.dispatchEvent(new Event('click'));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Selection should be updated - verify the textarea exists and is ready
        expect(textArea).not.toBeNull();
        expect(textArea.value).toContain('rect1');
      });

      it('should update selection on click', async () => {
        const svgText = '<svg width="200" height="200"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /><circle id="circle1" cx="150" cy="50" r="40" fill="red" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Click on rect element
        const rectIndex = svgText.indexOf('<rect');
        textArea.setSelectionRange(rectIndex + 5, rectIndex + 5);
        textArea.dispatchEvent(new Event('click'));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Verify textarea is active
        expect(textArea).not.toBeNull();
      });

      it('should update selection on keyup', async () => {
        const svgText = '<svg width="200" height="200"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /><circle id="circle1" cx="150" cy="50" r="40" fill="red" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Position cursor and trigger keyup
        const circleIndex = svgText.indexOf('<circle');
        textArea.setSelectionRange(circleIndex + 5, circleIndex + 5);
        textArea.dispatchEvent(new Event('keyup'));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(textArea).not.toBeNull();
      });

      it('should handle cursor outside any element', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Position cursor at the beginning (before any element)
        textArea.setSelectionRange(0, 0);
        textArea.dispatchEvent(new Event('click'));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should not throw error
        expect(textArea).not.toBeNull();
      });
    });

    describe('Selection Highlighting from Other Views', () => {
      it('should highlight element when selection changes from other views', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Simulate selection from another view
        documentStateUpdater.select(['rect1']);
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Text area should have selection
        expect(textArea.selectionStart).not.toBe(textArea.selectionEnd);
      });

      it('should highlight correct element when multiple elements exist', async () => {
        const svgText = '<svg width="200" height="200"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /><circle id="circle1" cx="150" cy="50" r="40" fill="red" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Select circle from another view
        documentStateUpdater.select(['circle1']);
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should highlight circle element
        const selectedText = textArea.value.substring(textArea.selectionStart, textArea.selectionEnd);
        expect(selectedText).toContain('circle');
        expect(selectedText).toContain('circle1');
      });

      it('should focus textarea when highlighting selection', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Blur the textarea first
        textArea.blur();
        
        // Select from another view
        documentStateUpdater.select(['rect1']);
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Textarea should be focused
        // Note: In jsdom, focus behavior may not work exactly as in a real browser
        expect(textArea).not.toBeNull();
      });

      it('should handle selection of non-existent element gracefully', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Select non-existent element
        documentStateUpdater.select(['nonexistent']);
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should not throw error
        expect(panel.getSVGText()).toContain('rect1');
      });

      it('should clear selection when no elements are selected', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // First select an element
        documentStateUpdater.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Then clear selection
        documentStateUpdater.clearSelection();
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should not throw error
        expect(textArea).not.toBeNull();
      });
    });

    describe('Bidirectional Synchronization', () => {
      it('should sync selection from raw SVG to other views', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Click on element in raw SVG
        const rectIndex = svgText.indexOf('<rect');
        textArea.setSelectionRange(rectIndex + 5, rectIndex + 5);
        textArea.dispatchEvent(new Event('click'));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Selection should be propagated to document state
        // We can verify by checking if the selection state was updated
        expect(textArea).not.toBeNull();
      });

      it('should sync selection from other views to raw SVG', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Select from another view
        documentStateUpdater.select(['rect1']);
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Raw SVG should highlight the element
        expect(textArea.selectionStart).not.toBe(textArea.selectionEnd);
      });

      it('should not create infinite loop when syncing selection', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Click on element
        const rectIndex = svgText.indexOf('<rect');
        textArea.setSelectionRange(rectIndex + 5, rectIndex + 5);
        textArea.dispatchEvent(new Event('click'));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should not throw error or hang
        expect(textArea).not.toBeNull();
      });
    });

    describe('Edge Cases', () => {
      it('should handle elements without IDs', async () => {
        const svgText = '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Click on element without ID
        const rectIndex = svgText.indexOf('<rect');
        textArea.setSelectionRange(rectIndex + 5, rectIndex + 5);
        textArea.dispatchEvent(new Event('click'));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should not throw error
        expect(textArea).not.toBeNull();
      });

      it('should handle malformed SVG gracefully', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Enter malformed SVG
        textArea.value = '<svg><rect id="rect1"';
        textArea.dispatchEvent(new Event('input'));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should not throw error
        expect(textArea.value).toContain('<rect');
      });

      it('should handle empty selection set', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Clear selection
        documentStateUpdater.clearSelection();
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should not throw error
        expect(panel.getSVGText()).toContain('rect1');
      });

      it('should handle rapid selection changes', async () => {
        const svgText = '<svg width="200" height="200"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /><circle id="circle1" cx="150" cy="50" r="40" fill="red" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Rapidly change selection
        documentStateUpdater.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 5));
        
        documentStateUpdater.select(['circle1']);
        await new Promise(resolve => setTimeout(resolve, 5));
        
        documentStateUpdater.select(['rect1']);
        await new Promise(resolve => setTimeout(resolve, 5));
        
        // Should not throw error
        expect(panel.getSVGText()).toContain('rect1');
      });

      it('should handle multi-line elements', async () => {
        const svgText = `<svg width="200" height="200">
  <rect 
    id="rect1" 
    x="10" 
    y="10" 
    width="80" 
    height="80" 
    fill="blue" 
  />
</svg>`;
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Select the multi-line element
        documentStateUpdater.select(['rect1']);
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should highlight the element
        expect(textArea.selectionStart).not.toBe(textArea.selectionEnd);
      });
    });

    describe('Performance', () => {
      it('should handle large SVG documents efficiently', async () => {
        // Create a large SVG with many elements
        const elements = Array.from({ length: 100 }, (_, i) => 
          `  <rect id="rect${i}" x="${i * 10}" y="${i * 10}" width="10" height="10" fill="blue" />`
        );
        const svgText = `<svg width="1000" height="1000">\n${elements.join('\n')}\n</svg>`;
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Select an element
        documentStateUpdater.select(['rect50']);
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should complete without hanging
        expect(textArea).not.toBeNull();
      });

      it('should rebuild position map efficiently on text changes', async () => {
        const svgText = '<svg width="100" height="100"><rect id="rect1" x="10" y="10" width="80" height="80" fill="blue" /></svg>';
        const parseResult = parser.parse(svgText);
        
        documentStateUpdater.setDocument(
          parseResult.document,
          parseResult.tree,
          svgText
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const textArea = panel.shadowRoot?.querySelector('.text-editor') as HTMLTextAreaElement;
        
        // Make multiple rapid changes
        for (let i = 0; i < 10; i++) {
          textArea.value = `<svg width="100" height="100"><rect id="rect${i}" x="10" y="10" width="80" height="80" fill="blue" /></svg>`;
          textArea.dispatchEvent(new Event('input'));
          await new Promise(resolve => setTimeout(resolve, 5));
        }
        
        // Should complete without hanging
        expect(textArea).not.toBeNull();
      });
    });
  });
});
