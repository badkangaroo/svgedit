/**
 * Geometry and transformation utilities for SVG operations.
 * 
 * This module provides mathematical operations for:
 * - 2D affine transformation matrices
 * - Bounding box calculations
 * - Path manipulation
 * 
 * @module geometry
 */

export {
  identity,
  compose,
  inverse,
  applyToPoint,
  translate,
  scale,
  rotate,
  decompose,
  type Matrix,
  type Point,
  type MatrixError,
  type TransformComponents,
} from './matrix.js';

export {
  bboxRect,
  bboxCircle,
  bboxEllipse,
  bboxLine,
  bboxPath,
  bboxGroup,
  bboxTransform,
  type BoundingBox,
} from './bbox.js';

export {
  parsePath,
  serializePath,
  normalizePath,
  simplifyPath,
  splitPath,
  mergePath,
  type PathCommand,
} from './path.js';
