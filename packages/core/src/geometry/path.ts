/**
 * Path manipulation utilities for SVG path data.
 * 
 * This module provides functions for parsing, serializing, normalizing,
 * simplifying, splitting, and merging SVG path data.
 * 
 * @module geometry/path
 */

/**
 * Represents a single SVG path command.
 */
export interface PathCommand {
  /** Command type: M (move), L (line), C (cubic), Q (quadratic), A (arc), Z (close) */
  type: 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z';
  /** Coordinate points for the command */
  points: number[];
  /** Whether the command uses absolute (true) or relative (false) coordinates */
  absolute: boolean;
}

/**
 * Parse SVG path data string into an array of PathCommand objects.
 * 
 * Supports all standard SVG path commands:
 * - M/m: moveto
 * - L/l: lineto
 * - H/h: horizontal lineto
 * - V/v: vertical lineto
 * - C/c: cubic Bézier curve
 * - S/s: smooth cubic Bézier curve
 * - Q/q: quadratic Bézier curve
 * - T/t: smooth quadratic Bézier curve
 * - A/a: elliptical arc
 * - Z/z: closepath
 * 
 * @param pathData - SVG path data string (e.g., "M 10 10 L 20 20")
 * @returns Array of parsed PathCommand objects
 * 
 * @example
 * ```typescript
 * const commands = parsePath("M 10 10 L 20 20 Z");
 * // Returns: [
 * //   { type: 'M', points: [10, 10], absolute: true },
 * //   { type: 'L', points: [20, 20], absolute: true },
 * //   { type: 'Z', points: [], absolute: true }
 * // ]
 * ```
 */
export function parsePath(pathData: string): PathCommand[] {
  const commands: PathCommand[] = [];
  
  if (!pathData || pathData.trim().length === 0) {
    return commands;
  }
  
  // Tokenize the path data
  const tokens = tokenizePath(pathData);
  
  let i = 0;
  let currentX = 0;
  let currentY = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    // Check if token is a command letter
    if (isCommandLetter(token)) {
      const cmdType = token.toUpperCase() as PathCommand['type'];
      const absolute = token === token.toUpperCase();
      
      i++;
      
      // Parse command parameters
      const cmd = parseCommand(cmdType, absolute, tokens, i, currentX, currentY);
      commands.push(cmd);
      
      // Update current position
      if (cmd.type !== 'Z') {
        const lastPoints = cmd.points;
        if (lastPoints.length >= 2) {
          currentX = lastPoints[lastPoints.length - 2];
          currentY = lastPoints[lastPoints.length - 1];
        }
      }
      
      // Advance index by number of parameters consumed
      i += getParameterCount(cmdType);
    } else {
      i++;
    }
  }
  
  return commands;
}

/**
 * Serialize an array of PathCommand objects back to SVG path data string.
 * 
 * @param commands - Array of PathCommand objects
 * @returns SVG path data string
 * 
 * @example
 * ```typescript
 * const commands = [
 *   { type: 'M', points: [10, 10], absolute: true },
 *   { type: 'L', points: [20, 20], absolute: true }
 * ];
 * const pathData = serializePath(commands);
 * // Returns: "M 10 10 L 20 20"
 * ```
 */
export function serializePath(commands: PathCommand[]): string {
  return commands.map(cmd => {
    const letter = cmd.absolute ? cmd.type : cmd.type.toLowerCase();
    const points = cmd.points.join(' ');
    return points.length > 0 ? `${letter} ${points}` : letter;
  }).join(' ');
}

/**
 * Normalize path commands by converting all relative commands to absolute.
 * 
 * This preserves the visual appearance of the path while making all
 * coordinates absolute, which simplifies further processing.
 * 
 * @param commands - Array of PathCommand objects (may contain relative commands)
 * @returns Array of PathCommand objects with all absolute coordinates
 * 
 * @example
 * ```typescript
 * const commands = [
 *   { type: 'M', points: [10, 10], absolute: true },
 *   { type: 'L', points: [5, 5], absolute: false }  // relative
 * ];
 * const normalized = normalizePath(commands);
 * // Returns: [
 * //   { type: 'M', points: [10, 10], absolute: true },
 * //   { type: 'L', points: [15, 15], absolute: true }  // now absolute
 * // ]
 * ```
 */
export function normalizePath(commands: PathCommand[]): PathCommand[] {
  const normalized: PathCommand[] = [];
  let currentX = 0;
  let currentY = 0;
  let subpathStartX = 0;
  let subpathStartY = 0;
  
  for (const cmd of commands) {
    if (cmd.absolute) {
      // Already absolute, just copy
      normalized.push({ ...cmd });
      
      // Update current position
      if (cmd.type === 'M') {
        currentX = cmd.points[0];
        currentY = cmd.points[1];
        subpathStartX = currentX;
        subpathStartY = currentY;
      } else if (cmd.type === 'Z') {
        currentX = subpathStartX;
        currentY = subpathStartY;
      } else if (cmd.points.length >= 2) {
        currentX = cmd.points[cmd.points.length - 2];
        currentY = cmd.points[cmd.points.length - 1];
      }
    } else {
      // Convert relative to absolute
      const absolutePoints: number[] = [];
      
      for (let i = 0; i < cmd.points.length; i += 2) {
        absolutePoints.push(currentX + cmd.points[i]);
        absolutePoints.push(currentY + cmd.points[i + 1]);
      }
      
      normalized.push({
        type: cmd.type,
        points: absolutePoints,
        absolute: true
      });
      
      // Update current position
      if (cmd.type === 'M') {
        currentX = absolutePoints[0];
        currentY = absolutePoints[1];
        subpathStartX = currentX;
        subpathStartY = currentY;
      } else if (cmd.type === 'Z') {
        currentX = subpathStartX;
        currentY = subpathStartY;
      } else if (absolutePoints.length >= 2) {
        currentX = absolutePoints[absolutePoints.length - 2];
        currentY = absolutePoints[absolutePoints.length - 1];
      }
    }
  }
  
  return normalized;
}

/**
 * Simplify a path by removing redundant points within a tolerance.
 * 
 * Uses the Ramer-Douglas-Peucker algorithm to reduce the number of points
 * while preserving the overall shape within the specified tolerance.
 * 
 * @param commands - Array of PathCommand objects
 * @param tolerance - Maximum distance a point can be from the simplified line
 * @returns Simplified array of PathCommand objects
 * 
 * @example
 * ```typescript
 * const commands = parsePath("M 0 0 L 1 0 L 2 0 L 3 0");
 * const simplified = simplifyPath(commands, 0.1);
 * // Returns: [
 * //   { type: 'M', points: [0, 0], absolute: true },
 * //   { type: 'L', points: [3, 0], absolute: true }
 * // ]
 * ```
 */
export function simplifyPath(commands: PathCommand[], tolerance: number): PathCommand[] {
  if (commands.length <= 2) {
    return commands;
  }
  
  // First normalize to absolute coordinates
  const normalized = normalizePath(commands);
  
  // Extract points for simplification
  const points: [number, number][] = [];
  for (const cmd of normalized) {
    if (cmd.type !== 'Z' && cmd.points.length >= 2) {
      for (let i = 0; i < cmd.points.length; i += 2) {
        points.push([cmd.points[i], cmd.points[i + 1]]);
      }
    }
  }
  
  if (points.length <= 2) {
    return normalized;
  }
  
  // Apply Douglas-Peucker algorithm
  const simplified = douglasPeucker(points, tolerance);
  
  // Convert back to commands
  const result: PathCommand[] = [];
  if (simplified.length > 0) {
    result.push({
      type: 'M',
      points: [simplified[0][0], simplified[0][1]],
      absolute: true
    });
    
    for (let i = 1; i < simplified.length; i++) {
      result.push({
        type: 'L',
        points: [simplified[i][0], simplified[i][1]],
        absolute: true
      });
    }
    
    // Preserve closing command if original had one
    const lastCmd = normalized[normalized.length - 1];
    if (lastCmd.type === 'Z') {
      result.push({ type: 'Z', points: [], absolute: true });
    }
  }
  
  return result;
}

/**
 * Split a path at parameter t (0 to 1).
 * 
 * Divides the path into two separate paths at the specified position.
 * 
 * @param commands - Array of PathCommand objects
 * @param t - Split parameter (0 = start, 1 = end)
 * @returns Tuple of two PathCommand arrays [before split, after split]
 * 
 * @example
 * ```typescript
 * const commands = parsePath("M 0 0 L 10 0 L 10 10");
 * const [before, after] = splitPath(commands, 0.5);
 * ```
 */
export function splitPath(commands: PathCommand[], t: number): [PathCommand[], PathCommand[]] {
  if (t <= 0) {
    return [[], commands];
  }
  if (t >= 1) {
    return [commands, []];
  }
  
  // Normalize first
  const normalized = normalizePath(commands);
  
  // Calculate total path length
  let totalLength = 0;
  const segmentLengths: number[] = [];
  
  for (let i = 1; i < normalized.length; i++) {
    const prev = normalized[i - 1];
    const curr = normalized[i];
    
    if (curr.type === 'L' && prev.points.length >= 2 && curr.points.length >= 2) {
      const dx = curr.points[0] - prev.points[prev.points.length - 2];
      const dy = curr.points[1] - prev.points[prev.points.length - 1];
      const length = Math.sqrt(dx * dx + dy * dy);
      segmentLengths.push(length);
      totalLength += length;
    } else {
      segmentLengths.push(0);
    }
  }
  
  // Find split point
  const targetLength = totalLength * t;
  let accumulatedLength = 0;
  let splitIndex = 0;
  let splitT = 0;
  
  for (let i = 0; i < segmentLengths.length; i++) {
    if (accumulatedLength + segmentLengths[i] >= targetLength) {
      splitIndex = i + 1;
      splitT = segmentLengths[i] > 0 
        ? (targetLength - accumulatedLength) / segmentLengths[i]
        : 0;
      break;
    }
    accumulatedLength += segmentLengths[i];
  }
  
  // Create split point
  const before = normalized.slice(0, splitIndex);
  const after = normalized.slice(splitIndex);
  
  // Interpolate split point if needed
  if (splitT > 0 && splitT < 1 && splitIndex > 0 && splitIndex < normalized.length) {
    const prev = normalized[splitIndex - 1];
    const curr = normalized[splitIndex];
    
    if (prev.points.length >= 2 && curr.points.length >= 2) {
      const x = prev.points[prev.points.length - 2] + 
                (curr.points[0] - prev.points[prev.points.length - 2]) * splitT;
      const y = prev.points[prev.points.length - 1] + 
                (curr.points[1] - prev.points[prev.points.length - 1]) * splitT;
      
      before.push({ type: 'L', points: [x, y], absolute: true });
      after.unshift({ type: 'M', points: [x, y], absolute: true });
    }
  }
  
  return [before, after];
}

/**
 * Merge two compatible paths into a single path.
 * 
 * Combines the path commands from both paths sequentially.
 * 
 * @param path1 - First path commands array
 * @param path2 - Second path commands array
 * @returns Merged PathCommand array
 * 
 * @example
 * ```typescript
 * const path1 = parsePath("M 0 0 L 10 0");
 * const path2 = parsePath("M 10 0 L 10 10");
 * const merged = mergePath(path1, path2);
 * ```
 */
export function mergePath(path1: PathCommand[], path2: PathCommand[]): PathCommand[] {
  if (path1.length === 0) return path2;
  if (path2.length === 0) return path1;
  
  const result = [...path1];
  
  // If path2 starts with a move command and path1 ends at the same point,
  // we can skip the move command
  if (path2[0].type === 'M' && path1.length > 0) {
    const lastCmd = path1[path1.length - 1];
    if (lastCmd.points.length >= 2 && path2[0].points.length >= 2) {
      const lastX = lastCmd.points[lastCmd.points.length - 2];
      const lastY = lastCmd.points[lastCmd.points.length - 1];
      const firstX = path2[0].points[0];
      const firstY = path2[0].points[1];
      
      // If endpoints match, skip the move command
      if (Math.abs(lastX - firstX) < 0.001 && Math.abs(lastY - firstY) < 0.001) {
        result.push(...path2.slice(1));
        return result;
      }
    }
  }
  
  result.push(...path2);
  return result;
}

// Helper functions

function tokenizePath(pathData: string): string[] {
  // Replace command letters with space-separated tokens
  const withSpaces = pathData.replace(/([MmLlHhVvCcSsQqTtAaZz])/g, ' $1 ');
  
  // Split on whitespace and commas, filter empty strings
  return withSpaces.split(/[\s,]+/).filter(token => token.length > 0);
}

function isCommandLetter(token: string): boolean {
  return /^[MmLlHhVvCcSsQqTtAaZz]$/.test(token);
}

function parseCommand(
  cmdType: PathCommand['type'],
  absolute: boolean,
  tokens: string[],
  startIndex: number,
  currentX: number,
  currentY: number
): PathCommand {
  const paramCount = getParameterCount(cmdType);
  const points: number[] = [];
  
  for (let i = 0; i < paramCount && startIndex + i < tokens.length; i++) {
    const value = parseFloat(tokens[startIndex + i]);
    if (!isNaN(value)) {
      points.push(value);
    }
  }
  
  return {
    type: cmdType,
    points,
    absolute
  };
}

function getParameterCount(cmdType: string): number {
  switch (cmdType.toUpperCase()) {
    case 'M':
    case 'L':
      return 2;
    case 'H':
    case 'V':
      return 1;
    case 'C':
      return 6;
    case 'S':
    case 'Q':
      return 4;
    case 'T':
      return 2;
    case 'A':
      return 7;
    case 'Z':
      return 0;
    default:
      return 0;
  }
}

function douglasPeucker(points: [number, number][], tolerance: number): [number, number][] {
  if (points.length <= 2) {
    return points;
  }
  
  // Find the point with maximum distance from line between first and last
  let maxDistance = 0;
  let maxIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], first, last);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    
    // Concatenate results, removing duplicate middle point
    return [...left.slice(0, -1), ...right];
  } else {
    // All points between first and last can be removed
    return [first, last];
  }
}

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  if (dx === 0 && dy === 0) {
    // Line start and end are the same point
    return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  }
  
  // Calculate perpendicular distance using cross product
  const numerator = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt(dx * dx + dy * dy);
  
  return numerator / denominator;
}
