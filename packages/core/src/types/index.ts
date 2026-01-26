/**
 * Core type definitions for the SVG Edit engine.
 * This module exports all public types used throughout the library.
 */

export type { Result } from './result.js';
export { ErrorCode } from './result.js';
export type { ErrorDetails } from './result.js';

export type {
  SVGElementType,
  SVGNode,
  RectNode,
  CircleNode,
  EllipseNode,
  LineNode,
  PolylineNode,
  PolygonNode,
  PathNode,
  TextNode,
  GroupNode,
  DefsNode,
  UseNode,
  SVGRootNode,
  SpecificSVGNode
} from './node.js';

export type {
  SVGDocument,
  ParseError
} from './document.js';
