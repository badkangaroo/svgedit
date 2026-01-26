/**
 * Known SVG element types supported by the core engine.
 * This list is used for validation and warnings (unknown elements are preserved).
 */
export const KNOWN_ELEMENT_TYPES = [
  'svg',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'path',
  'text',
  'tspan',
  'g',
  'defs',
  'use',
  'image',
  'clipPath',
  'mask',
  'pattern',
  'linearGradient',
  'radialGradient',
  'stop',
  'symbol',
  'marker',
  'filter'
] as const;

/**
 * SVG element types supported by the core engine.
 * This is a discriminated union type for type-safe element handling.
 */
export type SVGElementType = typeof KNOWN_ELEMENT_TYPES[number];

/**
 * SVG node type that allows unknown/custom elements.
 * Unknown elements are preserved for round-trip compatibility.
 */
export type SVGNodeType = SVGElementType | (string & {});

/**
 * Type guard for known SVG element types.
 */
export function isKnownElementType(value: string): value is SVGElementType {
  return (KNOWN_ELEMENT_TYPES as readonly string[]).includes(value);
}

/**
 * Base interface for all SVG nodes in the document tree.
 * All nodes have a stable unique ID that persists across operations.
 */
export interface SVGNode {
  /** Stable unique identifier for this node */
  id: string;
  
  /** Element type (rect, circle, path, etc.) */
  type: SVGNodeType;
  
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
