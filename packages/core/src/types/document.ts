import type { SVGNode } from './node.js';

/**
 * SVG document model representing the complete document tree.
 * This is the single source of truth for all SVG content.
 */
export interface SVGDocument {
  /** Root <svg> element */
  root: SVGNode;
  
  /** Index of all nodes by their stable ID for O(1) lookup */
  nodes: Map<string, SVGNode>;
  
  /** Version counter for change tracking (increments on each modification) */
  version: number;

  /**
   * Parser warnings collected during parse (e.g., unknown elements).
   * Empty if parsing produced no warnings.
   */
  warnings?: ParseWarning[];

  /**
   * Unique list of unknown element names encountered during parsing.
   * Preserved for optional filtering by callers.
   */
  unknownElements?: string[];
}

/**
 * Error information for parsing failures.
 */
export interface ParseError {
  message: string;
  line: number;
  column: number;
}

/**
 * Warning information for non-fatal parsing issues.
 */
export interface ParseWarning {
  /** Warning code for classification */
  code: 'UNKNOWN_ELEMENT';
  /** Human-readable warning message */
  message: string;
  /** Line number where the warning occurred */
  line: number;
  /** Column number where the warning occurred */
  column: number;
  /** The element name that triggered the warning */
  elementName: string;
}
