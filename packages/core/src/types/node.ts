/**
 * SVG element types supported by the core engine.
 * This is a discriminated union type for type-safe element handling.
 */
export type SVGElementType = 
  | 'svg'
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'polyline'
  | 'polygon'
  | 'path'
  | 'text'
  | 'g'
  | 'defs'
  | 'use';

/**
 * Base interface for all SVG nodes in the document tree.
 * All nodes have a stable unique ID that persists across operations.
 */
export interface SVGNode {
  /** Stable unique identifier for this node */
  id: string;
  
  /** Element type (rect, circle, path, etc.) */
  type: SVGElementType;
  
  /** Element attributes as key-value pairs */
  attributes: Map<string, string>;
  
  /** Child nodes */
  children: SVGNode[];
  
  /** Parent node reference (null for root) */
  parent: SVGNode | null;
}

/**
 * Rectangle element with specific properties.
 */
export interface RectNode extends SVGNode {
  type: 'rect';
}

/**
 * Circle element with specific properties.
 */
export interface CircleNode extends SVGNode {
  type: 'circle';
}

/**
 * Ellipse element with specific properties.
 */
export interface EllipseNode extends SVGNode {
  type: 'ellipse';
}

/**
 * Line element with specific properties.
 */
export interface LineNode extends SVGNode {
  type: 'line';
}

/**
 * Polyline element with specific properties.
 */
export interface PolylineNode extends SVGNode {
  type: 'polyline';
}

/**
 * Polygon element with specific properties.
 */
export interface PolygonNode extends SVGNode {
  type: 'polygon';
}

/**
 * Path element with specific properties.
 */
export interface PathNode extends SVGNode {
  type: 'path';
}

/**
 * Text element with specific properties.
 */
export interface TextNode extends SVGNode {
  type: 'text';
}

/**
 * Group element with specific properties.
 */
export interface GroupNode extends SVGNode {
  type: 'g';
}

/**
 * Defs element with specific properties.
 */
export interface DefsNode extends SVGNode {
  type: 'defs';
}

/**
 * Use element with specific properties.
 */
export interface UseNode extends SVGNode {
  type: 'use';
}

/**
 * Root SVG element with specific properties.
 */
export interface SVGRootNode extends SVGNode {
  type: 'svg';
}

/**
 * Union type of all specific node types.
 * Enables type narrowing based on the 'type' discriminator.
 */
export type SpecificSVGNode =
  | SVGRootNode
  | RectNode
  | CircleNode
  | EllipseNode
  | LineNode
  | PolylineNode
  | PolygonNode
  | PathNode
  | TextNode
  | GroupNode
  | DefsNode
  | UseNode;
