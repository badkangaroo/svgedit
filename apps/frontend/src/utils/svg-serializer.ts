/**
 * SVG Serializer
 * 
 * Serializes SVG elements to formatted SVG text.
 * Cleans up editor-specific attributes and formats with proper indentation.
 * 
 * Requirements: 12.4
 */

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
  
  /** Whether to clean up editor-specific attributes (default: true) */
  cleanupEditorAttributes?: boolean;
  
  /** Whether to keep the data-uuid attribute during cleanup (default: false) */
  keepUUID?: boolean;
}

/**
 * SVG Serializer class for converting SVG elements to formatted text
 */
export class SVGSerializer {
  private options: Required<SerializerOptions>;
  
  constructor(options: SerializerOptions = {}) {
    this.options = {
      prettyPrint: options.prettyPrint ?? true,
      indent: options.indent ?? '  ',
      sortAttributes: options.sortAttributes ?? true,
      cleanupEditorAttributes: options.cleanupEditorAttributes ?? true,
      keepUUID: options.keepUUID ?? false,
    };
  }
  
  /**
   * Serialize an SVG element to formatted SVG text
   * 
   * @param element - The SVG element to serialize
   * @param options - Optional override options for this serialization
   * @returns Formatted SVG string
   */
  serialize(element: SVGElement, options?: SerializerOptions): string {
    // Merge default options with overrides
    const currentOptions = { ...this.options, ...options };
    
    // Clone the element to avoid modifying the original
    const cloned = element.cloneNode(true) as SVGElement;
    
    // Clean up editor-specific attributes if requested
    if (currentOptions.cleanupEditorAttributes) {
      this.cleanupElement(cloned, currentOptions.keepUUID);
    }
    
    // Serialize the element (passing options down would require changing signature, 
    // but serializeElement only uses prettyPrint/indent which are in this.options or need to be passed)
    // Actually serializeElement uses this.options. 
    // I should temporarily swap options or pass them.
    // Simpler: Create a temporary serializer or just update serializeElement signature.
    // Or just bind the options.
    
    return this.serializeElementWithConfig(cloned, 0, currentOptions);
  }
  
  /**
   * Clean up editor-specific attributes from an element and its children
   * 
   * @param element - The element to clean up
   * @param keepUUID - Whether to keep data-uuid
   */
  private cleanupElement(element: Element, keepUUID: boolean): void {
    // Remove editor-specific attributes
    // - Generated IDs (svg-node-*)
    // - data-original-id (used to store original IDs)
    // - Any other editor-specific data attributes
    
    const id = element.getAttribute('id');
    if (id && id.startsWith('svg-node-')) {
      // Check if there's an original ID to restore
      const originalId = element.getAttribute('data-original-id');
      if (originalId) {
        element.setAttribute('id', originalId);
        element.removeAttribute('data-original-id');
      } else {
        // Remove the generated ID
        element.removeAttribute('id');
      }
    }
    
    // Remove data-original-id if it exists
    element.removeAttribute('data-original-id');
    
    // Remove the internal data-uuid attribute unless requested to keep
    if (!keepUUID) {
      element.removeAttribute('data-uuid');
    }
    
    // Remove any other editor-specific attributes (e.g., selection markers)
    element.removeAttribute('data-selected');
    element.removeAttribute('data-hovered');
    
    // Recursively clean up children
    for (let i = 0; i < element.children.length; i++) {
      this.cleanupElement(element.children[i], keepUUID);
    }
  }

  /**
   * Serialize a single element and its children with specific config
   */
  private serializeElementWithConfig(element: Element, depth: number, config: Required<SerializerOptions>): string {
    const indent = config.prettyPrint ? config.indent.repeat(depth) : '';
    const newline = config.prettyPrint ? '\n' : '';
    
    // Build opening tag
    let result = `${indent}<${element.tagName.toLowerCase()}`;
    
    // Add attributes
    const attributes = this.serializeAttributesWithConfig(element, config);
    if (attributes) {
      result += ` ${attributes}`;
    }
    
    // Check if element has children or text content
    const hasChildren = element.children.length > 0;
    const hasTextContent = element.childNodes.length > 0 && 
                          Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
    
    // Handle self-closing vs. container elements
    if (!hasChildren && !hasTextContent) {
      // Self-closing tag
      result += ` />${newline}`;
    } else {
      // Opening tag with children or text
      result += `>`;
      
      // Handle text content
      if (hasTextContent && !hasChildren) {
        // Simple text content without children
        const textContent = this.getTextContent(element);
        result += this.escapeTextContent(textContent);
      } else if (hasChildren) {
        // Has child elements
        result += newline;
        
        // Serialize children
        for (let i = 0; i < element.children.length; i++) {
          result += this.serializeElementWithConfig(element.children[i], depth + 1, config);
        }
        
        // Add indent before closing tag
        result += indent;
      }
      
      // Closing tag
      result += `</${element.tagName.toLowerCase()}>${newline}`;
    }
    
    return result;
  }

  /**
   * Serialize attributes to a string with config
   */
  private serializeAttributesWithConfig(element: Element, config: Required<SerializerOptions>): string {
    if (element.attributes.length === 0) {
      return '';
    }
    
    // Get attribute entries
    let entries: Array<[string, string]> = [];
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      entries.push([attr.name, attr.value]);
    }
    
    // Sort alphabetically for deterministic output
    if (config.sortAttributes) {
      entries = entries.sort((a, b) => a[0].localeCompare(b[0]));
    }
    
    // Format as key="value" pairs
    return entries
      .map(([key, value]) => `${key}="${this.escapeAttributeValue(value)}"`)
      .join(' ');
  }

  /**
   * Serialize a single element and its children (legacy method using instance options)
   * 
   * @param element - The element to serialize
   * @param depth - Current indentation depth
   * @returns XML text for this element and its children
   */
  private serializeElement(element: Element, depth: number): string {
    return this.serializeElementWithConfig(element, depth, this.options);
  }
  
  /**
   * Get text content from an element, handling mixed content
   * 
   * @param element - The element to get text from
   * @returns The text content
   */
  private getTextContent(element: Element): string {
    let text = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      }
    }
    return text;
  }
  
  /**
   * Serialize attributes to a string
   * 
   * @param element - The element whose attributes to serialize
   * @returns Formatted attribute string
   */
  private serializeAttributes(element: Element): string {
    return this.serializeAttributesWithConfig(element, this.options);
  }
  
  /**
   * Escape special characters in attribute values
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
  
  /**
   * Escape special characters in text content
   * 
   * @param text - The text content to escape
   * @returns Escaped text content
   */
  private escapeTextContent(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  
  /**
   * Serialize SVG element in a Web Worker (for large documents)
   * This is a placeholder for future implementation
   * 
   * @param element - The SVG element to serialize
   * @returns Promise resolving to formatted SVG string
   */
  async serializeInWorker(element: SVGElement): Promise<string> {
    // For now, just use the regular serialize method
    // In Sprint 4, this will be implemented to use Web Workers
    return this.serialize(element);
  }
}

/**
 * Create a singleton serializer instance
 */
export const svgSerializer = new SVGSerializer();

/**
 * Convenience function to serialize an SVG element
 * 
 * @param element - The SVG element to serialize
 * @returns Formatted SVG string
 */
export function serializeSVG(element: SVGElement): string {
  return svgSerializer.serialize(element);
}
