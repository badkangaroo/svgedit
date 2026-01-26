/**
 * SVG Parser
 * 
 * Parses SVG text into a DocumentNode tree structure.
 * Uses DOMParser for initial parsing and assigns unique IDs to all elements.
 * Returns parse errors with line/column information.
 * 
 * Requirements: 5.1, 5.2, 11.2
 */

import type { DocumentNode, ParseResult, ParseError } from '../types';

/**
 * ID generator for creating stable unique IDs for nodes.
 */
class IDGenerator {
  private counter: number = 0;
  private prefix: string;
  
  constructor(prefix: string = 'svg-node') {
    this.prefix = prefix;
  }
  
  generate(): string {
    return `${this.prefix}-${++this.counter}`;
  }
  
  reset(): void {
    this.counter = 0;
  }
}

/**
 * SVG Parser class for converting SVG text to DocumentNode tree
 */
export class SVGParser {
  private idGenerator: IDGenerator;
  private domParser: DOMParser;
  
  constructor() {
    this.idGenerator = new IDGenerator();
    this.domParser = new DOMParser();
  }
  
  /**
   * Parse SVG text into a DocumentNode tree
   * 
   * @param svgText - The SVG text to parse
   * @returns ParseResult containing the parsed document or errors
   */
  parse(svgText: string): ParseResult {
    // Reset ID generator for each parse
    this.idGenerator.reset();
    
    try {
      // Use DOMParser to parse the SVG text
      const doc = this.domParser.parseFromString(svgText, 'image/svg+xml');
      
      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        const errors = this.extractParseErrors(parserError, svgText);
        return {
          success: false,
          document: null,
          tree: [],
          errors,
        };
      }
      
      // Get the root SVG element
      const svgElement = doc.documentElement;
      
      // Verify it's an SVG element
      if (svgElement.tagName.toLowerCase() !== 'svg') {
        return {
          success: false,
          document: null,
          tree: [],
          errors: [{
            line: 1,
            column: 1,
            message: 'Root element must be <svg>',
            severity: 'error',
          }],
        };
      }
      
      // Build the DocumentNode tree
      const tree: DocumentNode[] = [];
      const rootNode = this.buildDocumentNode(svgElement as unknown as SVGElement);
      if (rootNode) {
        tree.push(rootNode);
      }
      
      return {
        success: true,
        document: svgElement as unknown as SVGElement,
        tree,
        errors: [],
      };
    } catch (error) {
      // Handle unexpected errors
      return {
        success: false,
        document: null,
        tree: [],
        errors: [{
          line: 1,
          column: 1,
          message: error instanceof Error ? error.message : 'Unknown parsing error',
          severity: 'error',
        }],
      };
    }
  }
  
  /**
   * Build a DocumentNode from an SVG element
   * 
   * @param element - The SVG element to convert
   * @returns DocumentNode representation
   */
  private buildDocumentNode(element: SVGElement): DocumentNode {
    // Generate unique ID for this node
    const id = this.idGenerator.generate();
    
    // Assign the ID to the element if it doesn't have one
    if (!element.hasAttribute('id')) {
      element.setAttribute('id', id);
    } else {
      // Use existing ID but ensure uniqueness in our system
      const existingId = element.getAttribute('id')!;
      element.setAttribute('data-original-id', existingId);
      element.setAttribute('id', id);
    }
    
    // Extract attributes
    const attributes = new Map<string, string>();
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes.set(attr.name, attr.value);
    }
    
    // Build children recursively
    const children: DocumentNode[] = [];
    // Use childNodes to get all element children (children property might not work in all environments)
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      // Only process element nodes (nodeType 1), skip text nodes, comments, etc.
      if (child.nodeType === 1 && child instanceof Element) {
        const childNode = this.buildDocumentNode(child as SVGElement);
        children.push(childNode);
      }
    }
    
    // Create the DocumentNode
    const node: DocumentNode = {
      id,
      type: element.tagName.toLowerCase(),
      tagName: element.tagName,
      attributes,
      children,
      element,
    };
    
    return node;
  }
  
  /**
   * Extract parse errors from DOMParser error element
   * 
   * @param errorElement - The parsererror element
   * @param svgText - The original SVG text for context
   * @returns Array of ParseError objects
   */
  private extractParseErrors(errorElement: Element, svgText: string): ParseError[] {
    const errors: ParseError[] = [];
    
    // Get the error text
    const errorText = errorElement.textContent || 'Unknown parsing error';
    
    // Try to extract line and column information from the error message
    // DOMParser error format varies by browser, so we try multiple patterns
    const lineColMatch = errorText.match(/line (\d+).*column (\d+)/i) ||
                        errorText.match(/line:?\s*(\d+).*column:?\s*(\d+)/i) ||
                        errorText.match(/(\d+):(\d+)/);
    
    let line = 1;
    let column = 1;
    
    if (lineColMatch) {
      line = parseInt(lineColMatch[1], 10);
      column = parseInt(lineColMatch[2], 10);
    }
    
    // Extract the error message (remove line/column info if present)
    let message = errorText
      .replace(/line \d+.*column \d+/i, '')
      .replace(/line:?\s*\d+.*column:?\s*\d+/i, '')
      .replace(/\d+:\d+/, '')
      .trim();
    
    // If message is empty or too generic, provide a better one
    if (!message || message.length < 5) {
      message = 'Invalid XML/SVG syntax';
    }
    
    errors.push({
      line,
      column,
      message,
      severity: 'error',
    });
    
    return errors;
  }
  
  /**
   * Parse SVG text in a Web Worker (for large documents)
   * This is a placeholder for future implementation
   * 
   * @param svgText - The SVG text to parse
   * @returns Promise resolving to ParseResult
   */
  async parseInWorker(svgText: string): Promise<ParseResult> {
    // For now, just use the regular parse method
    // In Sprint 4, this will be implemented to use Web Workers
    return this.parse(svgText);
  }
}

/**
 * Create a singleton parser instance
 */
export const svgParser = new SVGParser();

/**
 * Convenience function to parse SVG text
 * 
 * @param svgText - The SVG text to parse
 * @returns ParseResult containing the parsed document or errors
 */
export function parseSVG(svgText: string): ParseResult {
  return svgParser.parse(svgText);
}
