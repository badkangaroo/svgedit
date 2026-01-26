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
}

/**
 * Error information for parsing failures.
 */
export interface ParseError {
  message: string;
  line: number;
  column: number;
}
