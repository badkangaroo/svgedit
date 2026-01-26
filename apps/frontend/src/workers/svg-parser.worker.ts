/**
 * SVG Parser Web Worker
 * 
 * Handles parsing of large SVG documents in a background thread
 * to keep the main UI thread responsive.
 * 
 * Requirements: 14.1
 */

import type { ParseResult, ParseError, DocumentNode } from '../types';

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
 * Message types for worker communication
 */
interface ParseMessage {
  type: 'parse';
  svgText: string;
  requestId: string;
}

interface ProgressMessage {
  type: 'progress';
  requestId: string;
  percent: number;
  message: string;
}

interface ResultMessage {
  type: 'result';
  requestId: string;
  result: ParseResult;
}

interface ErrorMessage {
  type: 'error';
  requestId: string;
  error: string;
}

type WorkerMessage = ParseMessage;
type WorkerResponse = ProgressMessage | ResultMessage | ErrorMessage;

/**
 * Build a DocumentNode from an SVG element
 * Note: We can't transfer the actual SVGElement to the worker,
 * so we create a serializable representation
 */
function buildDocumentNode(
  element: Element,
  idGenerator: IDGenerator
): Omit<DocumentNode, 'element'> & { element: null } {
  // Generate unique ID for this node
  const id = idGenerator.generate();
  
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
  const children: (Omit<DocumentNode, 'element'> & { element: null })[] = [];
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    // Only process element nodes (nodeType 1)
    if (child.nodeType === 1 && child instanceof Element) {
      const childNode = buildDocumentNode(child, idGenerator);
      children.push(childNode);
    }
  }
  
  // Create the DocumentNode (without the actual element reference)
  return {
    id,
    type: element.tagName.toLowerCase(),
    tagName: element.tagName,
    attributes,
    children: children as any, // Type assertion needed due to recursive structure
    element: null, // Can't transfer DOM elements to worker
  };
}

/**
 * Extract parse errors from DOMParser error element
 */
function extractParseErrors(errorElement: Element, svgText: string): ParseError[] {
  const errors: ParseError[] = [];
  
  // Get the error text
  const errorText = errorElement.textContent || 'Unknown parsing error';
  
  // Try to extract line and column information
  const lineColMatch = errorText.match(/line (\d+).*column (\d+)/i) ||
                      errorText.match(/line:?\s*(\d+).*column:?\s*(\d+)/i) ||
                      errorText.match(/(\d+):(\d+)/);
  
  let line = 1;
  let column = 1;
  
  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10);
    column = parseInt(lineColMatch[2], 10);
  }
  
  // Extract the error message
  let message = errorText
    .replace(/line \d+.*column \d+/i, '')
    .replace(/line:?\s*\d+.*column:?\s*\d+/i, '')
    .replace(/\d+:\d+/, '')
    .trim();
  
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
 * Parse SVG text in the worker
 */
function parseSVG(svgText: string, requestId: string): void {
  const idGenerator = new IDGenerator();
  const domParser = new DOMParser();
  
  try {
    // Send progress update
    postMessage({
      type: 'progress',
      requestId,
      percent: 10,
      message: 'Parsing SVG markup...',
    } as ProgressMessage);
    
    // Parse the SVG text
    const doc = domParser.parseFromString(svgText, 'image/svg+xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      const errors = extractParseErrors(parserError, svgText);
      postMessage({
        type: 'result',
        requestId,
        result: {
          success: false,
          document: null,
          tree: [],
          errors,
        },
      } as ResultMessage);
      return;
    }
    
    // Get the root SVG element
    const svgElement = doc.documentElement;
    
    // Verify it's an SVG element
    if (svgElement.tagName.toLowerCase() !== 'svg') {
      postMessage({
        type: 'result',
        requestId,
        result: {
          success: false,
          document: null,
          tree: [],
          errors: [{
            line: 1,
            column: 1,
            message: 'Root element must be <svg>',
            severity: 'error',
          }],
        },
      } as ResultMessage);
      return;
    }
    
    // Send progress update
    postMessage({
      type: 'progress',
      requestId,
      percent: 50,
      message: 'Building document tree...',
    } as ProgressMessage);
    
    // Build the DocumentNode tree
    const tree: (Omit<DocumentNode, 'element'> & { element: null })[] = [];
    const rootNode = buildDocumentNode(svgElement, idGenerator);
    if (rootNode) {
      tree.push(rootNode);
    }
    
    // Send progress update
    postMessage({
      type: 'progress',
      requestId,
      percent: 90,
      message: 'Finalizing...',
    } as ProgressMessage);
    
    // Serialize the SVG element to send back
    const serializer = new XMLSerializer();
    const serializedSVG = serializer.serializeToString(svgElement);
    
    // Send the result
    postMessage({
      type: 'result',
      requestId,
      result: {
        success: true,
        document: null, // Will be re-parsed on main thread
        tree: tree as any, // Type assertion for recursive structure
        errors: [],
        serializedSVG, // Include serialized SVG for re-parsing on main thread
      },
    } as ResultMessage);
    
  } catch (error) {
    postMessage({
      type: 'error',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    } as ErrorMessage);
  }
}

/**
 * Worker message handler
 */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  
  if (message.type === 'parse') {
    parseSVG(message.svgText, message.requestId);
  }
};

// Export types for use in main thread
export type { ParseMessage, ProgressMessage, ResultMessage, ErrorMessage, WorkerMessage, WorkerResponse };
