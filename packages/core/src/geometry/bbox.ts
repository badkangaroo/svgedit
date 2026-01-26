/**
 * Bounding box calculation utilities for SVG elements.
 * 
 * This module provides functions to calculate the smallest axis-aligned rectangle
 * that completely contains an SVG shape. Bounding boxes are essential for:
 * - Hit testing and selection
 * - Layout and positioning
 * - Viewport calculations
 * - Collision detection
 * 
 * All bounding box calculations return coordinates in the element's local coordinate
 * system (before any transforms are applied). For transform-aware bounding boxes,
 * use the transform utilities in conjunction with these functions.
 * 
 * @module geometry/bbox
 */

/**
 * Bounding box represented as an axis-aligned rectangle.
 * 
 * The bounding box is defined by:
 * - x, y: The top-left corner coordinates
 * - width, height: The dimensions of the rectangle
 * 
 * All values are in the local coordinate system of the element.
 */
export interface BoundingBox {
  /** X coordinate of the top-left corner */
  x: number;
  /** Y coordinate of the top-left corner */
  y: number;
  /** Width of the bounding box */
  width: number;
  /** Height of the bounding box */
  height: number;
}

/**
 * Calculate the bounding box for a rectangle element.
 * 
 * For rectangles, the bounding box is simply the rectangle itself,
 * defined by its x, y, width, and height attributes.
 * 
 * @param x - X coordinate of the rectangle's top-left corner
 * @param y - Y coordinate of the rectangle's top-left corner
 * @param width - Width of the rectangle
 * @param height - Height of the rectangle
 * @returns The bounding box of the rectangle
 * 
 * @example
 * ```typescript
 * const bbox = bboxRect(10, 20, 100, 50);
 * // bbox = { x: 10, y: 20, width: 100, height: 50 }
 * ```
 */
export function bboxRect(
  x: number,
  y: number,
  width: number,
  height: number
): BoundingBox {
  return { x, y, width, height };
}

/**
 * Calculate the bounding box for a circle element.
 * 
 * A circle is defined by its center point (cx, cy) and radius (r).
 * The bounding box is the smallest square that contains the circle.
 * 
 * @param cx - X coordinate of the circle's center
 * @param cy - Y coordinate of the circle's center
 * @param r - Radius of the circle
 * @returns The bounding box of the circle
 * 
 * @example
 * ```typescript
 * const bbox = bboxCircle(50, 50, 25);
 * // bbox = { x: 25, y: 25, width: 50, height: 50 }
 * ```
 */
export function bboxCircle(cx: number, cy: number, r: number): BoundingBox {
  return {
    x: cx - r,
    y: cy - r,
    width: r * 2,
    height: r * 2,
  };
}

/**
 * Calculate the bounding box for an ellipse element.
 * 
 * An ellipse is defined by its center point (cx, cy) and radii (rx, ry).
 * The bounding box is the smallest rectangle that contains the ellipse.
 * 
 * @param cx - X coordinate of the ellipse's center
 * @param cy - Y coordinate of the ellipse's center
 * @param rx - Horizontal radius of the ellipse
 * @param ry - Vertical radius of the ellipse
 * @returns The bounding box of the ellipse
 * 
 * @example
 * ```typescript
 * const bbox = bboxEllipse(50, 50, 30, 20);
 * // bbox = { x: 20, y: 30, width: 60, height: 40 }
 * ```
 */
export function bboxEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number
): BoundingBox {
  return {
    x: cx - rx,
    y: cy - ry,
    width: rx * 2,
    height: ry * 2,
  };
}

/**
 * Calculate the bounding box for a line element.
 * 
 * A line is defined by its start point (x1, y1) and end point (x2, y2).
 * The bounding box is the smallest rectangle that contains both endpoints.
 * 
 * Note: This does not account for stroke width. For a complete bounding box
 * including stroke, you would need to expand the box by half the stroke width
 * in all directions.
 * 
 * @param x1 - X coordinate of the line's start point
 * @param y1 - Y coordinate of the line's start point
 * @param x2 - X coordinate of the line's end point
 * @param y2 - Y coordinate of the line's end point
 * @returns The bounding box of the line
 * 
 * @example
 * ```typescript
 * const bbox = bboxLine(10, 20, 100, 80);
 * // bbox = { x: 10, y: 20, width: 90, height: 60 }
 * 
 * // Vertical line
 * const vbox = bboxLine(50, 10, 50, 100);
 * // vbox = { x: 50, y: 10, width: 0, height: 90 }
 * ```
 */
export function bboxLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): BoundingBox {
  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  const maxX = Math.max(x1, x2);
  const maxY = Math.max(y1, y2);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Path command types supported in SVG path data.
 */
type PathCommandType = 'M' | 'm' | 'L' | 'l' | 'H' | 'h' | 'V' | 'v' | 
                       'C' | 'c' | 'S' | 's' | 'Q' | 'q' | 'T' | 't' | 
                       'A' | 'a' | 'Z' | 'z';

/**
 * Parsed path command with type and coordinates.
 */
interface PathCommand {
  type: PathCommandType;
  coords: number[];
}

/**
 * Parse SVG path data string into an array of commands.
 * 
 * Supports all SVG path commands:
 * - M/m: moveto
 * - L/l: lineto
 * - H/h: horizontal lineto
 * - V/v: vertical lineto
 * - C/c: cubic Bezier curve
 * - S/s: smooth cubic Bezier curve
 * - Q/q: quadratic Bezier curve
 * - T/t: smooth quadratic Bezier curve
 * - A/a: elliptical arc
 * - Z/z: closepath
 * 
 * @param pathData - SVG path data string (e.g., "M 10 10 L 20 20")
 * @returns Array of parsed path commands
 * 
 * @internal
 */
function parsePath(pathData: string): PathCommand[] {
  const commands: PathCommand[] = [];
  
  // Remove extra whitespace and normalize separators
  const normalized = pathData
    .trim()
    .replace(/,/g, ' ')
    .replace(/([a-zA-Z])/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!normalized) {
    return commands;
  }
  
  const tokens = normalized.split(' ');
  let i = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    // Skip if token is undefined
    if (!token) {
      i++;
      continue;
    }
    
    // Check if token is a command letter
    if (/[a-zA-Z]/.test(token)) {
      const type = token as PathCommandType;
      const coords: number[] = [];
      
      // Determine how many coordinates this command needs
      const coordCount = getCoordCount(type);
      
      // Parse coordinates
      i++;
      while (i < tokens.length) {
        const nextToken = tokens[i];
        if (!nextToken || /[a-zA-Z]/.test(nextToken)) {
          break;
        }
        const num = parseFloat(nextToken);
        if (!isNaN(num)) {
          coords.push(num);
        }
        i++;
      }
      
      // Split into multiple commands if we have more coords than needed
      // (e.g., "L 10 20 30 40" becomes two L commands)
      if (coordCount > 0) {
        for (let j = 0; j < coords.length; j += coordCount) {
          commands.push({
            type,
            coords: coords.slice(j, j + coordCount),
          });
        }
      } else {
        // Z/z command has no coordinates
        commands.push({ type, coords: [] });
      }
    } else {
      i++;
    }
  }
  
  return commands;
}

/**
 * Get the number of coordinates required for a path command.
 * 
 * @param type - Path command type
 * @returns Number of coordinates required
 * 
 * @internal
 */
function getCoordCount(type: PathCommandType): number {
  switch (type.toUpperCase()) {
    case 'M': case 'L': case 'T': return 2;
    case 'H': case 'V': return 1;
    case 'S': case 'Q': return 4;
    case 'C': return 6;
    case 'A': return 7;
    case 'Z': return 0;
    default: return 0;
  }
}

/**
 * Calculate the bounding box for a path element.
 * 
 * This function parses the SVG path data and calculates the smallest rectangle
 * that contains all points in the path, including:
 * - Line segments
 * - Cubic and quadratic Bezier curves (including control points and extrema)
 * - Elliptical arcs
 * 
 * The calculation accounts for curve extrema to ensure the bounding box
 * completely contains the path, not just its endpoints.
 * 
 * @param pathData - SVG path data string (e.g., "M 10 10 L 20 20 C 30 30 40 40 50 50")
 * @returns The bounding box of the path, or a zero-size box at origin for empty paths
 * 
 * @example
 * ```typescript
 * // Simple line path
 * const bbox1 = bboxPath("M 10 10 L 50 50");
 * // bbox1 = { x: 10, y: 10, width: 40, height: 40 }
 * 
 * // Path with curve
 * const bbox2 = bboxPath("M 0 0 Q 50 100 100 0");
 * // bbox2 accounts for the curve's peak
 * 
 * // Empty path
 * const bbox3 = bboxPath("");
 * // bbox3 = { x: 0, y: 0, width: 0, height: 0 }
 * ```
 */
export function bboxPath(pathData: string): BoundingBox {
  const commands = parsePath(pathData);
  
  if (commands.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  // Current position (pen position)
  let currentX = 0;
  let currentY = 0;
  
  // Starting position of current subpath (for Z command)
  let subpathStartX = 0;
  let subpathStartY = 0;
  
  // Last control point for smooth curves
  let lastControlX = 0;
  let lastControlY = 0;
  let lastCommandType: PathCommandType | null = null;
  
  /**
   * Update bounding box with a point
   */
  const updateBounds = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  
  for (const cmd of commands) {
    const { type, coords } = cmd;
    const isRelative = type === type.toLowerCase();
    
    switch (type.toUpperCase()) {
      case 'M': { // moveto
        if (coords.length >= 2 && coords[0] !== undefined && coords[1] !== undefined) {
          currentX = isRelative ? currentX + coords[0] : coords[0];
          currentY = isRelative ? currentY + coords[1] : coords[1];
          subpathStartX = currentX;
          subpathStartY = currentY;
          updateBounds(currentX, currentY);
        }
        break;
      }
      
      case 'L': { // lineto
        if (coords.length >= 2 && coords[0] !== undefined && coords[1] !== undefined) {
          currentX = isRelative ? currentX + coords[0] : coords[0];
          currentY = isRelative ? currentY + coords[1] : coords[1];
          updateBounds(currentX, currentY);
        }
        break;
      }
      
      case 'H': { // horizontal lineto
        if (coords.length >= 1 && coords[0] !== undefined) {
          currentX = isRelative ? currentX + coords[0] : coords[0];
          updateBounds(currentX, currentY);
        }
        break;
      }
      
      case 'V': { // vertical lineto
        if (coords.length >= 1 && coords[0] !== undefined) {
          currentY = isRelative ? currentY + coords[0] : coords[0];
          updateBounds(currentX, currentY);
        }
        break;
      }
      
      case 'C': { // cubic Bezier curve
        if (coords.length >= 6 && 
            coords[0] !== undefined && coords[1] !== undefined &&
            coords[2] !== undefined && coords[3] !== undefined &&
            coords[4] !== undefined && coords[5] !== undefined) {
          const x1 = isRelative ? currentX + coords[0] : coords[0];
          const y1 = isRelative ? currentY + coords[1] : coords[1];
          const x2 = isRelative ? currentX + coords[2] : coords[2];
          const y2 = isRelative ? currentY + coords[3] : coords[3];
          const x = isRelative ? currentX + coords[4] : coords[4];
          const y = isRelative ? currentY + coords[5] : coords[5];
          
          // Update bounds with control points and endpoint
          updateBounds(x1, y1);
          updateBounds(x2, y2);
          updateBounds(x, y);
          
          // Calculate extrema of cubic Bezier curve
          const extrema = cubicBezierExtrema(currentX, currentY, x1, y1, x2, y2, x, y);
          extrema.forEach(point => updateBounds(point.x, point.y));
          
          lastControlX = x2;
          lastControlY = y2;
          currentX = x;
          currentY = y;
        }
        break;
      }
      
      case 'S': { // smooth cubic Bezier curve
        if (coords.length >= 4 &&
            coords[0] !== undefined && coords[1] !== undefined &&
            coords[2] !== undefined && coords[3] !== undefined) {
          // First control point is reflection of last control point
          let x1 = currentX;
          let y1 = currentY;
          if (lastCommandType && /[CcSs]/.test(lastCommandType)) {
            x1 = 2 * currentX - lastControlX;
            y1 = 2 * currentY - lastControlY;
          }
          
          const x2 = isRelative ? currentX + coords[0] : coords[0];
          const y2 = isRelative ? currentY + coords[1] : coords[1];
          const x = isRelative ? currentX + coords[2] : coords[2];
          const y = isRelative ? currentY + coords[3] : coords[3];
          
          updateBounds(x1, y1);
          updateBounds(x2, y2);
          updateBounds(x, y);
          
          const extrema = cubicBezierExtrema(currentX, currentY, x1, y1, x2, y2, x, y);
          extrema.forEach(point => updateBounds(point.x, point.y));
          
          lastControlX = x2;
          lastControlY = y2;
          currentX = x;
          currentY = y;
        }
        break;
      }
      
      case 'Q': { // quadratic Bezier curve
        if (coords.length >= 4 &&
            coords[0] !== undefined && coords[1] !== undefined &&
            coords[2] !== undefined && coords[3] !== undefined) {
          const x1 = isRelative ? currentX + coords[0] : coords[0];
          const y1 = isRelative ? currentY + coords[1] : coords[1];
          const x = isRelative ? currentX + coords[2] : coords[2];
          const y = isRelative ? currentY + coords[3] : coords[3];
          
          updateBounds(x1, y1);
          updateBounds(x, y);
          
          // Calculate extrema of quadratic Bezier curve
          const extrema = quadraticBezierExtrema(currentX, currentY, x1, y1, x, y);
          extrema.forEach(point => updateBounds(point.x, point.y));
          
          lastControlX = x1;
          lastControlY = y1;
          currentX = x;
          currentY = y;
        }
        break;
      }
      
      case 'T': { // smooth quadratic Bezier curve
        if (coords.length >= 2 && coords[0] !== undefined && coords[1] !== undefined) {
          // Control point is reflection of last control point
          let x1 = currentX;
          let y1 = currentY;
          if (lastCommandType && /[QqTt]/.test(lastCommandType)) {
            x1 = 2 * currentX - lastControlX;
            y1 = 2 * currentY - lastControlY;
          }
          
          const x = isRelative ? currentX + coords[0] : coords[0];
          const y = isRelative ? currentY + coords[1] : coords[1];
          
          updateBounds(x1, y1);
          updateBounds(x, y);
          
          const extrema = quadraticBezierExtrema(currentX, currentY, x1, y1, x, y);
          extrema.forEach(point => updateBounds(point.x, point.y));
          
          lastControlX = x1;
          lastControlY = y1;
          currentX = x;
          currentY = y;
        }
        break;
      }
      
      case 'A': { // elliptical arc
        if (coords.length >= 7 &&
            coords[0] !== undefined && coords[1] !== undefined &&
            coords[2] !== undefined && coords[3] !== undefined &&
            coords[4] !== undefined && coords[5] !== undefined &&
            coords[6] !== undefined) {
          const rx = Math.abs(coords[0]);
          const ry = Math.abs(coords[1]);
          const xAxisRotation = coords[2];
          // largeArcFlag and sweepFlag are not used in this approximation
          // const largeArcFlag = coords[3];
          // const sweepFlag = coords[4];
          const x = isRelative ? currentX + coords[5] : coords[5];
          const y = isRelative ? currentY + coords[6] : coords[6];
          
          // For arcs, we approximate by including the endpoint and
          // a bounding box around the arc based on radii
          updateBounds(x, y);
          
          // Simple approximation: include points at radius distance
          // A more accurate implementation would convert to center parameterization
          const angle = (xAxisRotation * Math.PI) / 180;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          
          // Approximate bounds by considering rotated radii
          const dx = Math.abs(rx * cos) + Math.abs(ry * sin);
          const dy = Math.abs(rx * sin) + Math.abs(ry * cos);
          
          updateBounds(currentX - dx, currentY - dy);
          updateBounds(currentX + dx, currentY + dy);
          updateBounds(x - dx, y - dy);
          updateBounds(x + dx, y + dy);
          
          currentX = x;
          currentY = y;
        }
        break;
      }
      
      case 'Z': { // closepath
        currentX = subpathStartX;
        currentY = subpathStartY;
        // No need to update bounds, we're returning to start
        break;
      }
    }
    
    lastCommandType = type;
  }
  
  // Handle case where path has no valid points
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate extrema points of a cubic Bezier curve.
 * 
 * A cubic Bezier curve can have extrema (min/max points) between its endpoints.
 * This function finds those extrema by solving for where the derivative equals zero.
 * 
 * @param x0 - Start point x
 * @param y0 - Start point y
 * @param x1 - First control point x
 * @param y1 - First control point y
 * @param x2 - Second control point x
 * @param y2 - Second control point y
 * @param x3 - End point x
 * @param y3 - End point y
 * @returns Array of extrema points
 * 
 * @internal
 */
function cubicBezierExtrema(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number
): Array<{ x: number; y: number }> {
  const extrema: Array<{ x: number; y: number }> = [];
  
  // Find extrema in x direction
  const ax = -x0 + 3 * x1 - 3 * x2 + x3;
  const bx = 2 * x0 - 4 * x1 + 2 * x2;
  const cx = -x0 + x1;
  
  const tx = solveQuadratic(ax, bx, cx);
  
  // Find extrema in y direction
  const ay = -y0 + 3 * y1 - 3 * y2 + y3;
  const by = 2 * y0 - 4 * y1 + 2 * y2;
  const cy = -y0 + y1;
  
  const ty = solveQuadratic(ay, by, cy);
  
  // Evaluate curve at extrema points
  const allT = [...tx, ...ty].filter(t => t > 0 && t < 1);
  
  for (const t of allT) {
    const mt = 1 - t;
    const x = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
    const y = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
    extrema.push({ x, y });
  }
  
  return extrema;
}

/**
 * Calculate extrema points of a quadratic Bezier curve.
 * 
 * @param x0 - Start point x
 * @param y0 - Start point y
 * @param x1 - Control point x
 * @param y1 - Control point y
 * @param x2 - End point x
 * @param y2 - End point y
 * @returns Array of extrema points
 * 
 * @internal
 */
function quadraticBezierExtrema(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number
): Array<{ x: number; y: number }> {
  const extrema: Array<{ x: number; y: number }> = [];
  
  // Find extrema in x direction
  const tx = (x0 - x1) / (x0 - 2 * x1 + x2);
  if (tx > 0 && tx < 1) {
    const mt = 1 - tx;
    const x = mt * mt * x0 + 2 * mt * tx * x1 + tx * tx * x2;
    const y = mt * mt * y0 + 2 * mt * tx * y1 + tx * tx * y2;
    extrema.push({ x, y });
  }
  
  // Find extrema in y direction
  const ty = (y0 - y1) / (y0 - 2 * y1 + y2);
  if (ty > 0 && ty < 1 && ty !== tx) {
    const mt = 1 - ty;
    const x = mt * mt * x0 + 2 * mt * ty * x1 + ty * ty * x2;
    const y = mt * mt * y0 + 2 * mt * ty * y1 + ty * ty * y2;
    extrema.push({ x, y });
  }
  
  return extrema;
}

/**
 * Solve quadratic equation ax^2 + bx + c = 0.
 * 
 * @param a - Coefficient of x^2
 * @param b - Coefficient of x
 * @param c - Constant term
 * @returns Array of real solutions in range [0, 1]
 * 
 * @internal
 */
function solveQuadratic(a: number, b: number, c: number): number[] {
  const solutions: number[] = [];
  
  if (Math.abs(a) < 1e-10) {
    // Linear equation: bx + c = 0
    if (Math.abs(b) > 1e-10) {
      const t = -c / b;
      if (t >= 0 && t <= 1) {
        solutions.push(t);
      }
    }
  } else {
    // Quadratic equation
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant >= 0) {
      const sqrtD = Math.sqrt(discriminant);
      const t1 = (-b + sqrtD) / (2 * a);
      const t2 = (-b - sqrtD) / (2 * a);
      
      if (t1 >= 0 && t1 <= 1) solutions.push(t1);
      if (t2 >= 0 && t2 <= 1 && t2 !== t1) solutions.push(t2);
    }
  }
  
  return solutions;
}

/**
 * Apply a transformation matrix to a bounding box.
 * 
 * When an SVG element has a transform attribute, its bounding box needs to be
 * recalculated in the transformed coordinate space. This function:
 * 1. Transforms all four corners of the bounding box using the matrix
 * 2. Calculates the new axis-aligned bounding box that contains all transformed corners
 * 
 * This is essential for:
 * - Calculating screen-space bounds of transformed elements
 * - Hit testing with transforms
 * - Layout calculations with rotated/scaled elements
 * - Selection bounds for transformed shapes
 * 
 * Note: The result is always an axis-aligned bounding box, even if the original
 * box is rotated. This means the transformed box may be larger than the original
 * if rotation is involved.
 * 
 * @param bbox - The bounding box to transform
 * @param matrix - The transformation matrix to apply
 * @returns The transformed bounding box in the new coordinate space
 * 
 * @example
 * ```typescript
 * import { translate, rotate, scale } from './matrix.js';
 * 
 * // Original bounding box
 * const bbox = bboxRect(0, 0, 100, 50);
 * 
 * // Translate by (10, 20)
 * const translated = bboxTransform(bbox, translate(10, 20));
 * // translated = { x: 10, y: 20, width: 100, height: 50 }
 * 
 * // Scale by 2x
 * const scaled = bboxTransform(bbox, scale(2, 2));
 * // scaled = { x: 0, y: 0, width: 200, height: 100 }
 * 
 * // Rotate by 45 degrees (π/4 radians)
 * const rotated = bboxTransform(bbox, rotate(Math.PI / 4));
 * // rotated will be larger due to rotation, containing all corners
 * 
 * // Identity transform (no change)
 * const identity = [1, 0, 0, 1, 0, 0] as Matrix;
 * const unchanged = bboxTransform(bbox, identity);
 * // unchanged = { x: 0, y: 0, width: 100, height: 50 }
 * 
 * // Complex transform (scale then rotate then translate)
 * const complex = compose(translate(50, 50), compose(rotate(Math.PI / 6), scale(1.5, 1.5)));
 * const transformed = bboxTransform(bbox, complex);
 * // transformed contains all corners after the complex transformation
 * ```
 */
export function bboxTransform(bbox: BoundingBox, matrix: Matrix): BoundingBox {
  // Import the applyToPoint function from matrix module
  // We need to do this dynamically to avoid circular dependencies
  // For now, we'll implement the point transformation inline
  const applyMatrix = (x: number, y: number): { x: number; y: number } => {
    const [a, b, c, d, e, f] = matrix;
    return {
      x: a * x + c * y + e,
      y: b * x + d * y + f,
    };
  };
  
  // Get the four corners of the bounding box
  const topLeft = { x: bbox.x, y: bbox.y };
  const topRight = { x: bbox.x + bbox.width, y: bbox.y };
  const bottomLeft = { x: bbox.x, y: bbox.y + bbox.height };
  const bottomRight = { x: bbox.x + bbox.width, y: bbox.y + bbox.height };
  
  // Transform all four corners
  const transformedTopLeft = applyMatrix(topLeft.x, topLeft.y);
  const transformedTopRight = applyMatrix(topRight.x, topRight.y);
  const transformedBottomLeft = applyMatrix(bottomLeft.x, bottomLeft.y);
  const transformedBottomRight = applyMatrix(bottomRight.x, bottomRight.y);
  
  // Find the min and max coordinates of all transformed corners
  const allX = [
    transformedTopLeft.x,
    transformedTopRight.x,
    transformedBottomLeft.x,
    transformedBottomRight.x,
  ];
  const allY = [
    transformedTopLeft.y,
    transformedTopRight.y,
    transformedBottomLeft.y,
    transformedBottomRight.y,
  ];
  
  const minX = Math.min(...allX);
  const minY = Math.min(...allY);
  const maxX = Math.max(...allX);
  const maxY = Math.max(...allY);
  
  // Return the new axis-aligned bounding box
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Matrix type imported from matrix module.
 * Represents a 2D affine transformation as [a, b, c, d, e, f].
 */
type Matrix = [number, number, number, number, number, number];

/**
 * Calculate the bounding box for a group element.
 * 
 * A group's bounding box is the union of all its children's bounding boxes,
 * representing the smallest rectangle that contains all child elements.
 * 
 * This function is useful for:
 * - Calculating bounds of nested SVG structures
 * - Determining selection bounds for multiple elements
 * - Layout calculations for grouped content
 * 
 * @param children - Array of bounding boxes for all child elements
 * @returns The union bounding box, or a zero-size box at origin for empty groups
 * 
 * @example
 * ```typescript
 * // Group with two rectangles
 * const child1 = bboxRect(0, 0, 50, 50);
 * const child2 = bboxRect(40, 40, 50, 50);
 * const groupBox = bboxGroup([child1, child2]);
 * // groupBox = { x: 0, y: 0, width: 90, height: 90 }
 * 
 * // Empty group
 * const emptyBox = bboxGroup([]);
 * // emptyBox = { x: 0, y: 0, width: 0, height: 0 }
 * 
 * // Single child
 * const singleBox = bboxGroup([bboxCircle(50, 50, 25)]);
 * // singleBox = { x: 25, y: 25, width: 50, height: 50 }
 * ```
 */
export function bboxGroup(children: BoundingBox[]): BoundingBox {
  // Handle empty group
  if (children.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  // Handle single child (optimization)
  if (children.length === 1 && children[0]) {
    return { ...children[0] };
  }
  
  // Calculate union of all child bounding boxes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const child of children) {
    // Skip invalid bounding boxes
    if (!child || !isFinite(child.x) || !isFinite(child.y) || 
        !isFinite(child.width) || !isFinite(child.height)) {
      continue;
    }
    
    const childMinX = child.x;
    const childMinY = child.y;
    const childMaxX = child.x + child.width;
    const childMaxY = child.y + child.height;
    
    minX = Math.min(minX, childMinX);
    minY = Math.min(minY, childMinY);
    maxX = Math.max(maxX, childMaxX);
    maxY = Math.max(maxY, childMaxY);
  }
  
  // Handle case where all children were invalid
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
