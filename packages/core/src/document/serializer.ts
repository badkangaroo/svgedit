/**
 * SVG Serializer
 * 
 * Serializes an SVG document tree back to valid SVG text.
 * Handles proper XML formatting, attribute ordering, and indentation.
 */

import type { SVGDocument } from '../types/document.js';
import type { SVGNode } from '../types/node.js';

/**
 * Options for controlling serialization output.
 */
export interface SerializerOptions {
  /** Whether to pretty-print with indentation (default: true) */
  prettyPrint?: boolean;
  
  /** Indentation string (default: '  ' - two spaces) */
  indent?: string;
  
  /** Whether to sort attributes alphabetically (default: true for consistency) */
  sortAttributes?: boolean;
}

/**
 * Serializer for converting SVG document trees to XML text.
 */
export class Serializer {
  private options: Required<SerializerOptions>;
  
  constructor(options: SerializerOptions = {}) {
    this.options = {
      prettyPrint: options.prettyPrint ?? true,
      indent: options.indent ?? '  ',
      sortAttributes: options.sortAttributes ?? true
    };
  }
  
  /**
   * Serialize an SVG document to XML text.
   * 
   * @param document - The SVG document to serialize
   * @returns Valid SVG/XML text
   */
  serialize(document: SVGDocument): string {
    return this.serializeNode(document.root, 0);
  }
  
  /**
   * Serialize a single node and its children.
   * 
   * @param node - The node to serialize
   * @param depth - Current indentation depth
   * @returns XML text for this node and its children
   */
  private serializeNode(node: SVGNode, depth: number): string {
    const indent = this.options.prettyPrint ? this.options.indent.repeat(depth) : '';
    const newline = this.options.prettyPrint ? '\n' : '';
    
    // Build opening tag
    let result = `${indent}<${node.type}`;
    
    // Add attributes
    const attributes = this.serializeAttributes(node.attributes);
    if (attributes) {
      result += ` ${attributes}`;
    }
    
    // Handle self-closing vs. container elements
    if (node.children.length === 0) {
      // Self-closing tag
      result += ` />${newline}`;
    } else {
      // Opening tag with children
      result += `>${newline}`;
      
      // Serialize children
      for (const child of node.children) {
        result += this.serializeNode(child, depth + 1);
      }
      
      // Closing tag
      result += `${indent}</${node.type}>${newline}`;
    }
    
    return result;
  }
  
  /**
   * Serialize attributes to a string.
   * 
   * @param attributes - Map of attribute key-value pairs
   * @returns Formatted attribute string
   */
  private serializeAttributes(attributes: Map<string, string>): string {
    if (attributes.size === 0) {
      return '';
    }
    
    // Get attribute entries
    let entries = Array.from(attributes.entries());
    
    // Sort alphabetically for deterministic output
    if (this.options.sortAttributes) {
      entries = entries.sort((a, b) => a[0].localeCompare(b[0]));
    }
    
    // Format as key="value" pairs
    return entries
      .map(([key, value]) => `${key}="${this.escapeAttributeValue(value)}"`)
      .join(' ');
  }
  
  /**
   * Escape special characters in attribute values.
   * 
   * @param value - The attribute value to escape
   * @returns Escaped attribute value
   */
  private escapeAttributeValue(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
