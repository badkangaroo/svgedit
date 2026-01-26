/**
 * Matrix transformation utilities for 2D affine transformations.
 * 
 * This module provides operations for working with 2D transformation matrices
 * used in SVG transforms. Matrices are represented as 6-element tuples [a, b, c, d, e, f]
 * corresponding to the matrix:
 * 
 * | a c e |
 * | b d f |
 * | 0 0 1 |
 * 
 * This represents an affine transformation where:
 * - (a, b) controls scaling and rotation in x
 * - (c, d) controls scaling and rotation in y
 * - (e, f) controls translation
 * 
 * @module geometry/matrix
 */

import type { Result } from '../types/result.js';
import { ErrorCode } from '../types/result.js';

/**
 * 2D affine transformation matrix represented as [a, b, c, d, e, f].
 * 
 * Corresponds to the transformation matrix:
 * | a c e |
 * | b d f |
 * | 0 0 1 |
 * 
 * When applied to a point (x, y), the transformation is:
 * x' = a*x + c*y + e
 * y' = b*x + d*y + f
 */
export type Matrix = [number, number, number, number, number, number];

/**
 * 2D point with x and y coordinates.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Components of a 2D affine transformation.
 * 
 * A transformation matrix can be decomposed into these fundamental components:
 * - Translation: shifts the coordinate system
 * - Rotation: rotates around the origin
 * - Scale: stretches or shrinks along axes
 * - Skew: shears the coordinate system
 */
export interface TransformComponents {
  /** Translation in x direction */
  translateX: number;
  /** Translation in y direction */
  translateY: number;
  /** Scale factor in x direction */
  scaleX: number;
  /** Scale factor in y direction */
  scaleY: number;
  /** Rotation angle in radians (counterclockwise) */
  rotation: number;
  /** Skew angle in radians */
  skew: number;
}

/**
 * Error information for matrix operation failures.
 */
export interface MatrixError {
  code: ErrorCode;
  message: string;
  context?: unknown;
}

/**
 * Create an identity matrix that performs no transformation.
 * 
 * The identity matrix is:
 * | 1 0 0 |
 * | 0 1 0 |
 * | 0 0 1 |
 * 
 * When applied to any point, it returns the same point unchanged.
 * When composed with any matrix M, it returns M unchanged.
 * 
 * @returns The identity matrix [1, 0, 0, 1, 0, 0]
 * 
 * @example
 * ```typescript
 * const id = identity();
 * const point = { x: 10, y: 20 };
 * const transformed = applyToPoint(id, point);
 * // transformed === { x: 10, y: 20 }
 * ```
 */
export function identity(): Matrix {
  return [1, 0, 0, 1, 0, 0];
}

/**
 * Compose two transformation matrices by multiplying them.
 * 
 * Matrix composition applies transformations in sequence:
 * compose(m1, m2) creates a matrix that first applies m2, then applies m1.
 * 
 * Note: Matrix multiplication is not commutative, so compose(m1, m2) !== compose(m2, m1)
 * 
 * Given matrices:
 * m1 = [a1, b1, c1, d1, e1, f1]
 * m2 = [a2, b2, c2, d2, e2, f2]
 * 
 * The result is:
 * [a1*a2 + c1*b2, b1*a2 + d1*b2, a1*c2 + c1*d2, b1*c2 + d1*d2, a1*e2 + c1*f2 + e1, b1*e2 + d1*f2 + f1]
 * 
 * @param m1 - The first matrix (applied second)
 * @param m2 - The second matrix (applied first)
 * @returns The composed matrix representing both transformations
 * 
 * @example
 * ```typescript
 * const translate = [1, 0, 0, 1, 10, 20];
 * const scale = [2, 0, 0, 2, 0, 0];
 * const combined = compose(translate, scale);
 * // First scales by 2, then translates by (10, 20)
 * ```
 */
export function compose(m1: Matrix, m2: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

/**
 * Calculate the inverse of a transformation matrix.
 * 
 * The inverse matrix M^-1 satisfies: compose(M, M^-1) = identity()
 * 
 * Not all matrices have an inverse. A matrix is invertible if and only if
 * its determinant (ad - bc) is non-zero. Singular matrices (determinant = 0)
 * cannot be inverted.
 * 
 * The inverse is calculated using the formula:
 * For matrix [a, b, c, d, e, f] with determinant det = a*d - b*c:
 * inverse = [d/det, -b/det, -c/det, a/det, (c*f - d*e)/det, (b*e - a*f)/det]
 * 
 * @param m - The matrix to invert
 * @returns Result containing the inverse matrix, or an error if the matrix is singular
 * 
 * @example
 * ```typescript
 * const m = [2, 0, 0, 2, 10, 20]; // Scale by 2, translate by (10, 20)
 * const result = inverse(m);
 * 
 * if (result.ok) {
 *   const inv = result.value;
 *   const id = compose(m, inv);
 *   // id is approximately equal to identity()
 * }
 * ```
 */
export function inverse(m: Matrix): Result<Matrix, MatrixError> {
  const [a, b, c, d, e, f] = m;
  
  // Calculate determinant
  const det = a * d - b * c;
  
  // Check if matrix is singular (not invertible)
  // Use a small epsilon for floating-point comparison
  const EPSILON = 1e-10;
  if (Math.abs(det) < EPSILON) {
    return {
      ok: false,
      error: {
        code: ErrorCode.INVALID_MATRIX,
        message: 'Matrix is singular (determinant is zero) and cannot be inverted',
        context: { matrix: m, determinant: det },
      },
    };
  }
  
  // Calculate inverse using the formula
  const invDet = 1 / det;
  
  return {
    ok: true,
    value: [
      d * invDet,
      -b * invDet,
      -c * invDet,
      a * invDet,
      (c * f - d * e) * invDet,
      (b * e - a * f) * invDet,
    ],
  };
}

/**
 * Apply a transformation matrix to a point.
 * 
 * Transforms a point (x, y) using the matrix [a, b, c, d, e, f]:
 * x' = a*x + c*y + e
 * y' = b*x + d*y + f
 * 
 * This is the fundamental operation for transforming coordinates in SVG.
 * 
 * @param m - The transformation matrix to apply
 * @param point - The point to transform
 * @returns The transformed point
 * 
 * @example
 * ```typescript
 * const translate = [1, 0, 0, 1, 10, 20];
 * const point = { x: 5, y: 5 };
 * const transformed = applyToPoint(translate, point);
 * // transformed === { x: 15, y: 25 }
 * ```
 */
export function applyToPoint(m: Matrix, point: Point): Point {
  const [a, b, c, d, e, f] = m;
  const { x, y } = point;
  
  return {
    x: a * x + c * y + e,
    y: b * x + d * y + f,
  };
}

/**
 * Create a translation matrix.
 * 
 * A translation matrix shifts points by (tx, ty):
 * | 1 0 tx |
 * | 0 1 ty |
 * | 0 0 1  |
 * 
 * @param tx - Translation in x direction
 * @param ty - Translation in y direction
 * @returns Translation matrix
 * 
 * @example
 * ```typescript
 * const m = translate(10, 20);
 * const point = { x: 0, y: 0 };
 * const transformed = applyToPoint(m, point);
 * // transformed === { x: 10, y: 20 }
 * ```
 */
export function translate(tx: number, ty: number): Matrix {
  return [1, 0, 0, 1, tx, ty];
}

/**
 * Create a scale matrix.
 * 
 * A scale matrix multiplies coordinates by (sx, sy):
 * | sx 0  0 |
 * | 0  sy 0 |
 * | 0  0  1 |
 * 
 * @param sx - Scale factor in x direction
 * @param sy - Scale factor in y direction
 * @returns Scale matrix
 * 
 * @example
 * ```typescript
 * const m = scale(2, 3);
 * const point = { x: 10, y: 10 };
 * const transformed = applyToPoint(m, point);
 * // transformed === { x: 20, y: 30 }
 * ```
 */
export function scale(sx: number, sy: number): Matrix {
  return [sx, 0, 0, sy, 0, 0];
}

/**
 * Create a rotation matrix.
 * 
 * A rotation matrix rotates points counterclockwise by the given angle:
 * | cos(θ)  -sin(θ) 0 |
 * | sin(θ)   cos(θ) 0 |
 * | 0        0      1 |
 * 
 * @param angle - Rotation angle in radians (counterclockwise)
 * @returns Rotation matrix
 * 
 * @example
 * ```typescript
 * const m = rotate(Math.PI / 2); // 90 degrees
 * const point = { x: 1, y: 0 };
 * const transformed = applyToPoint(m, point);
 * // transformed ≈ { x: 0, y: 1 }
 * ```
 */
export function rotate(angle: number): Matrix {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  return [cos, sin, -sin, cos, 0, 0];
}

/**
 * Decompose a transformation matrix into its constituent components.
 * 
 * Extracts the translate, rotate, scale, and skew components from a matrix.
 * This is useful for analyzing and manipulating existing transformations.
 * 
 * The decomposition uses the QR decomposition method:
 * 1. Translation is directly extracted from e and f
 * 2. The 2x2 linear transformation part is decomposed into rotation, scale, and skew
 * 3. Scale is computed from the magnitude of the basis vectors
 * 4. Rotation is extracted from the normalized basis vectors
 * 5. Skew is computed from the dot product of the basis vectors
 * 
 * Note: The decomposition is not unique. For example, a matrix can represent
 * the same transformation with different combinations of rotation and skew.
 * This function returns one valid decomposition.
 * 
 * @param m - The matrix to decompose
 * @returns The transformation components
 * 
 * @example
 * ```typescript
 * // Create a complex transformation
 * const m = compose(
 *   translate(10, 20),
 *   compose(rotate(Math.PI / 4), scale(2, 3))
 * );
 * 
 * // Decompose it
 * const components = decompose(m);
 * console.log(components.translateX); // 10
 * console.log(components.translateY); // 20
 * console.log(components.rotation);   // ≈ π/4
 * console.log(components.scaleX);     // ≈ 2
 * console.log(components.scaleY);     // ≈ 3
 * ```
 */
export function decompose(m: Matrix): TransformComponents {
  const [a, b, c, d, e, f] = m;
  
  // Translation is straightforward
  const translateX = e;
  const translateY = f;
  
  // Decompose the 2x2 linear transformation matrix [a c; b d]
  // Using QR decomposition approach
  
  // Compute scale in x direction (length of first column vector)
  const scaleX = Math.sqrt(a * a + b * b);
  
  // Compute skew and scale in y direction
  // The skew is related to the dot product of the two column vectors
  let skew = 0;
  let scaleY = 0;
  let rotation = 0;
  
  if (scaleX !== 0) {
    // Normalize the first column vector to get rotation
    const normalizedA = a / scaleX;
    const normalizedB = b / scaleX;
    
    // Rotation angle from the normalized first column
    rotation = Math.atan2(normalizedB, normalizedA);
    
    // Compute the dot product of the two column vectors
    const dotProduct = a * c + b * d;
    
    // Skew is the dot product divided by scaleX
    skew = dotProduct / scaleX;
    
    // Scale in y direction is computed from the second column
    // after removing the skew component
    const c2 = c - skew * normalizedA;
    const d2 = d - skew * normalizedB;
    scaleY = Math.sqrt(c2 * c2 + d2 * d2);
    
    // Check if the transformation includes a reflection
    // by computing the determinant
    const det = a * d - b * c;
    if (det < 0) {
      // Reflection detected - negate scaleY
      scaleY = -scaleY;
    }
  } else {
    // Degenerate case: scaleX is zero
    // The transformation collapses the x-axis
    scaleY = Math.sqrt(c * c + d * d);
    rotation = Math.atan2(d, c) - Math.PI / 2;
  }
  
  return {
    translateX,
    translateY,
    scaleX,
    scaleY,
    rotation,
    skew,
  };
}
