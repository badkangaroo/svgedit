/**
 * XML/SVG Parser
 * 
 * Parses XML text into a basic tree structure with error handling.
 * This is the foundation for SVG document parsing.
 */

import type { SVGNode, SVGNodeType } from '../types/node.js';
import { isKnownElementType } from '../types/node.js';
import type { SVGDocument, ParseError, ParseWarning } from '../types/document.js';
import type { Result } from '../types/result.js';

/**
 * ID generator for creating stable unique IDs for nodes.
 */
class IDGenerator {
  private counter: number = 0;
  
  generate(): string {
    return `node_${++this.counter}`;
  }
  
  reset(): void {
    this.counter = 0;
  }
}

/**
 * Simple XML tokenizer for parsing XML text.
 */
interface Token {
  type: 'open' | 'close' | 'self-close' | 'text' | 'eof';
  name?: string;
  attributes?: Map<string, string>;
  text?: string;
  line: number;
  column: number;
}

/**
 * Tokenizes XML text into a stream of tokens.
 */
class XMLTokenizer {
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private text: string;
  
  constructor(text: string) {
    this.text = text;
  }
  
  /**
   * Get the next token from the input stream.
   */
  nextToken(): Token {
    this.skipWhitespace();
    
    if (this.pos >= this.text.length) {
      return { type: 'eof', line: this.line, column: this.column };
    }
    
    const char = this.text[this.pos];
    
    if (char === '<') {
      return this.parseTag();
    } else {
      return this.parseText();
    }
  }
  
  /**
   * Skip whitespace characters.
   */
  private skipWhitespace(): void {
    while (this.pos < this.text.length) {
      const char = this.text[this.pos];
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        if (char === '\n') {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.pos++;
      } else {
        break;
      }
    }
  }
  
  /**
   * Parse an XML tag (opening, closing, or self-closing).
   */
  private parseTag(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    
    // Skip '<'
    this.pos++;
    this.column++;
    
    // Check for closing tag
    if (this.text[this.pos] === '/') {
      this.pos++;
      this.column++;
      const name = this.parseTagName();
      this.skipWhitespace();
      
      if (this.text[this.pos] !== '>') {
        throw this.error('Expected ">" after closing tag name');
      }
      
      this.pos++;
      this.column++;
      
      return {
        type: 'close',
        name,
        line: startLine,
        column: startColumn
      };
    }
    
    // Parse opening or self-closing tag
    const name = this.parseTagName();
    this.skipWhitespace();
    
    const attributes = this.parseAttributes();
    this.skipWhitespace();
    
    // Check for self-closing tag
    if (this.text[this.pos] === '/' && this.text[this.pos + 1] === '>') {
      this.pos += 2;
      this.column += 2;
      
      return {
        type: 'self-close',
        name,
        attributes,
        line: startLine,
        column: startColumn
      };
    }
    
    if (this.text[this.pos] !== '>') {
      throw this.error('Expected ">" or "/>" after tag');
    }
    
    this.pos++;
    this.column++;
    
    return {
      type: 'open',
      name,
      attributes,
      line: startLine,
      column: startColumn
    };
  }
  
  /**
   * Parse a tag name.
   */
  private parseTagName(): string {
    const start = this.pos;
    
    while (this.pos < this.text.length) {
      const char = this.text[this.pos];
      if (this.isNameChar(char)) {
        this.pos++;
        this.column++;
      } else {
        break;
      }
    }
    
    if (start === this.pos) {
      throw this.error('Expected tag name');
    }
    
    return this.text.substring(start, this.pos);
  }
  
  /**
   * Check if a character is valid in a tag/attribute name.
   */
  private isNameChar(char: string | undefined): boolean {
    if (!char) return false;
    return /[a-zA-Z0-9:_-]/.test(char);
  }
  
  /**
   * Parse attributes from a tag.
   */
  private parseAttributes(): Map<string, string> {
    const attributes = new Map<string, string>();
    
    while (this.pos < this.text.length) {
      this.skipWhitespace();
      
      const char = this.text[this.pos];
      if (char === '>' || char === '/') {
        break;
      }
      
      const name = this.parseAttributeName();
      this.skipWhitespace();
      
      if (this.text[this.pos] !== '=') {
        throw this.error('Expected "=" after attribute name');
      }
      
      this.pos++;
      this.column++;
      this.skipWhitespace();
      
      const value = this.parseAttributeValue();
      attributes.set(name, value);
    }
    
    return attributes;
  }
  
  /**
   * Parse an attribute name.
   */
  private parseAttributeName(): string {
    const start = this.pos;
    
    while (this.pos < this.text.length) {
      const char = this.text[this.pos];
      if (this.isNameChar(char)) {
        this.pos++;
        this.column++;
      } else {
        break;
      }
    }
    
    if (start === this.pos) {
      throw this.error('Expected attribute name');
    }
    
    return this.text.substring(start, this.pos);
  }
  
  /**
   * Parse an attribute value (quoted string).
   */
  private parseAttributeValue(): string {
    const quote = this.text[this.pos];
    
    if (quote !== '"' && quote !== "'") {
      throw this.error('Expected quoted attribute value');
    }
    
    this.pos++;
    this.column++;
    
    const start = this.pos;
    
    while (this.pos < this.text.length) {
      const char = this.text[this.pos];
      
      if (char === quote) {
        const value = this.text.substring(start, this.pos);
        this.pos++;
        this.column++;
        // Unescape HTML entities in attribute values
        return this.unescapeAttributeValue(value);
      }
      
      if (char === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      
      this.pos++;
    }
    
    throw this.error('Unterminated attribute value');
  }
  
  /**
   * Unescape HTML entities in attribute values.
   */
  private unescapeAttributeValue(value: string): string {
    return value
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&'); // Must be last to avoid double-unescaping
  }
  
  /**
   * Parse text content between tags.
   */
  private parseText(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    const start = this.pos;
    
    while (this.pos < this.text.length) {
      const char = this.text[this.pos];
      
      if (char === '<') {
        break;
      }
      
      if (char === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      
      this.pos++;
    }
    
    const text = this.text.substring(start, this.pos).trim();
    
    return {
      type: 'text',
      text,
      line: startLine,
      column: startColumn
    };
  }
  
  /**
   * Create a parse error with current position.
   */
  private error(message: string): ParseError {
    return {
      message,
      line: this.line,
      column: this.column
    };
  }
}

/**
 * Parser for converting XML text into an SVG document tree.
 */
export class Parser {
  private idGenerator: IDGenerator;
  
  constructor() {
    this.idGenerator = new IDGenerator();
  }
  
  /**
   * Parse SVG text into a document model.
   * 
   * @param svgText - The SVG/XML text to parse
   * @returns Result containing the parsed document or an error
   */
  parse(svgText: string): Result<SVGDocument, ParseError> {
    try {
      // Reset ID generator for each parse
      this.idGenerator.reset();
      
      const tokenizer = new XMLTokenizer(svgText);
      const nodes = new Map<string, SVGNode>();
      const warnings: ParseWarning[] = [];
      const unknownElements = new Set<string>();
      
      // Parse the root element
      const root = this.parseElement(tokenizer, null, nodes, warnings, unknownElements);
      
      if (!root) {
        return {
          ok: false,
          error: {
            message: 'No root element found',
            line: 1,
            column: 1
          }
        };
      }
      
      // Verify we've consumed all input
      const token = tokenizer.nextToken();
      if (token.type !== 'eof') {
        return {
          ok: false,
          error: {
            message: 'Unexpected content after root element',
            line: token.line,
            column: token.column
          }
        };
      }
      
      return {
        ok: true,
        value: {
          root,
          nodes,
          version: 0,
          warnings,
          unknownElements: Array.from(unknownElements)
        }
      };
    } catch (error) {
      if (this.isParseError(error)) {
        return {
          ok: false,
          error
        };
      }
      
      // Unexpected error
      return {
        ok: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown parsing error',
          line: 1,
          column: 1
        }
      };
    }
  }
  
  /**
   * Parse a single XML element and its children.
   */
  private parseElement(
    tokenizer: XMLTokenizer,
    parent: SVGNode | null,
    nodes: Map<string, SVGNode>,
    warnings: ParseWarning[],
    unknownElements: Set<string>
  ): SVGNode | null {
    const token = tokenizer.nextToken();
    
    if (token.type === 'eof') {
      return null;
    }
    
    if (token.type === 'text') {
      // Skip text nodes for now (we'll handle them in a future task)
      return this.parseElement(tokenizer, parent, nodes, warnings, unknownElements);
    }
    
    if (token.type !== 'open' && token.type !== 'self-close') {
      throw {
        message: `Unexpected token type: ${token.type}`,
        line: token.line,
        column: token.column
      } as ParseError;
    }
    
    this.recordUnknownElement(token, warnings, unknownElements);

    // Create the node
    const id = this.idGenerator.generate();
    const node: SVGNode = {
      id,
      type: token.name as SVGNodeType,
      attributes: token.attributes || new Map(),
      children: [],
      parent
    };
    
    nodes.set(id, node);
    
    // If self-closing, we're done
    if (token.type === 'self-close') {
      return node;
    }
    
    // Parse children
    while (true) {
      const nextToken = tokenizer.nextToken();
      
      if (nextToken.type === 'eof') {
        throw {
          message: `Unclosed tag: ${token.name}`,
          line: token.line,
          column: token.column
        } as ParseError;
      }
      
      if (nextToken.type === 'close') {
        if (nextToken.name !== token.name) {
          throw {
            message: `Mismatched closing tag: expected ${token.name}, got ${nextToken.name}`,
            line: nextToken.line,
            column: nextToken.column
          } as ParseError;
        }
        break;
      }
      
      if (nextToken.type === 'text') {
        // Skip text content for now
        continue;
      }
      
      if (nextToken.type === 'open' || nextToken.type === 'self-close') {
        // Parse child element
        const childId = this.idGenerator.generate();
        this.recordUnknownElement(nextToken, warnings, unknownElements);

        const child: SVGNode = {
          id: childId,
          type: nextToken.name as SVGNodeType,
          attributes: nextToken.attributes || new Map(),
          children: [],
          parent: node
        };
        
        nodes.set(childId, child);
        node.children.push(child);
        
        // If not self-closing, parse children recursively
        if (nextToken.type === 'open') {
          this.parseChildren(tokenizer, child, nextToken.name!, nodes, warnings, unknownElements);
        }
      }
    }
    
    return node;
  }
  
  /**
   * Parse children of an element until we hit the closing tag.
   */
  private parseChildren(
    tokenizer: XMLTokenizer,
    parent: SVGNode,
    parentTagName: string,
    nodes: Map<string, SVGNode>,
    warnings: ParseWarning[],
    unknownElements: Set<string>
  ): void {
    while (true) {
      const token = tokenizer.nextToken();
      
      if (token.type === 'eof') {
        throw {
          message: `Unclosed tag: ${parentTagName}`,
          line: 1,
          column: 1
        } as ParseError;
      }
      
      if (token.type === 'close') {
        if (token.name !== parentTagName) {
          throw {
            message: `Mismatched closing tag: expected ${parentTagName}, got ${token.name}`,
            line: token.line,
            column: token.column
          } as ParseError;
        }
        break;
      }
      
      if (token.type === 'text') {
        // Skip text content for now
        continue;
      }
      
      if (token.type === 'open' || token.type === 'self-close') {
        // Create child node
        const childId = this.idGenerator.generate();
        this.recordUnknownElement(token, warnings, unknownElements);

        const child: SVGNode = {
          id: childId,
          type: token.name as SVGNodeType,
          attributes: token.attributes || new Map(),
          children: [],
          parent
        };
        
        nodes.set(childId, child);
        parent.children.push(child);
        
        // If not self-closing, parse children recursively
        if (token.type === 'open') {
          this.parseChildren(tokenizer, child, token.name!, nodes, warnings, unknownElements);
        }
      }
    }
  }

  /**
   * Record an unknown element warning without interrupting parsing.
   */
  private recordUnknownElement(
    token: Token,
    warnings: ParseWarning[],
    unknownElements: Set<string>
  ): void {
    if (!token.name) {
      return;
    }

    if (isKnownElementType(token.name)) {
      return;
    }

    unknownElements.add(token.name);
    warnings.push({
      code: 'UNKNOWN_ELEMENT',
      message: `Unknown SVG element "${token.name}" encountered during parsing`,
      line: token.line,
      column: token.column,
      elementName: token.name
    });
  }
  
  /**
   * Type guard to check if an error is a ParseError.
   */
  private isParseError(error: unknown): error is ParseError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'line' in error &&
      'column' in error
    );
  }
}
