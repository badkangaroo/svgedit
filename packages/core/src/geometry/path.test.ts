import { describe, it, expect } from 'vitest';
import {
  parsePath,
  serializePath,
  normalizePath,
  simplifyPath,
  splitPath,
  mergePath,
  type PathCommand
} from './path.js';

describe('Path Parsing', () => {
  it('should parse simple moveto and lineto commands', () => {
    const commands = parsePath('M 10 20 L 30 40');
    
    expect(commands).toHaveLength(2);
    expect(commands[0]).toEqual({
      type: 'M',
      points: [10, 20],
      absolute: true
    });
    expect(commands[1]).toEqual({
      type: 'L',
      points: [30, 40],
      absolute: true
    });
  });

  it('should parse relative commands', () => {
    const commands = parsePath('M 10 10 l 5 5');
    
    expect(commands).toHaveLength(2);
    expect(commands[0].absolute).toBe(true);
    expect(commands[1].absolute).toBe(false);
    expect(commands[1].points).toEqual([5, 5]);
  });

  it('should parse closepath command', () => {
    const commands = parsePath('M 0 0 L 10 0 L 10 10 Z');
    
    expect(commands).toHaveLength(4);
    expect(commands[3]).toEqual({
      type: 'Z',
      points: [],
      absolute: true
    });
  });

  it('should parse cubic bezier curves', () => {
    const commands = parsePath('M 0 0 C 10 10 20 20 30 30');
    
    expect(commands).toHaveLength(2);
    expect(commands[1]).toEqual({
      type: 'C',
      points: [10, 10, 20, 20, 30, 30],
      absolute: true
    });
  });

  it('should parse quadratic bezier curves', () => {
    const commands = parsePath('M 0 0 Q 10 10 20 20');
    
    expect(commands).toHaveLength(2);
    expect(commands[1]).toEqual({
      type: 'Q',
      points: [10, 10, 20, 20],
      absolute: true
    });
  });

  it('should parse arc commands', () => {
    const commands = parsePath('M 0 0 A 10 10 0 0 1 20 20');
    
    expect(commands).toHaveLength(2);
    expect(commands[1]).toEqual({
      type: 'A',
      points: [10, 10, 0, 0, 1, 20, 20],
      absolute: true
    });
  });

  it('should handle empty path data', () => {
    const commands = parsePath('');
    expect(commands).toHaveLength(0);
  });

  it('should handle path data with commas', () => {
    const commands = parsePath('M 10,20 L 30,40');
    
    expect(commands).toHaveLength(2);
    expect(commands[0].points).toEqual([10, 20]);
    expect(commands[1].points).toEqual([30, 40]);
  });

  it('should handle path data without spaces', () => {
    const commands = parsePath('M10 20L30 40');
    
    expect(commands).toHaveLength(2);
    expect(commands[0].points).toEqual([10, 20]);
    expect(commands[1].points).toEqual([30, 40]);
  });
});

describe('Path Serialization', () => {
  it('should serialize absolute commands', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [10, 20], absolute: true },
      { type: 'L', points: [30, 40], absolute: true }
    ];
    
    const pathData = serializePath(commands);
    expect(pathData).toBe('M 10 20 L 30 40');
  });

  it('should serialize relative commands', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [10, 10], absolute: true },
      { type: 'L', points: [5, 5], absolute: false }
    ];
    
    const pathData = serializePath(commands);
    expect(pathData).toBe('M 10 10 l 5 5');
  });

  it('should serialize closepath command', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 0], absolute: true },
      { type: 'Z', points: [], absolute: true }
    ];
    
    const pathData = serializePath(commands);
    expect(pathData).toBe('M 0 0 L 10 0 Z');
  });

  it('should serialize cubic bezier curves', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'C', points: [10, 10, 20, 20, 30, 30], absolute: true }
    ];
    
    const pathData = serializePath(commands);
    expect(pathData).toBe('M 0 0 C 10 10 20 20 30 30');
  });
});

describe('Path Normalization', () => {
  it('should convert relative commands to absolute', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [10, 10], absolute: true },
      { type: 'L', points: [5, 5], absolute: false }
    ];
    
    const normalized = normalizePath(commands);
    
    expect(normalized).toHaveLength(2);
    expect(normalized[0]).toEqual({
      type: 'M',
      points: [10, 10],
      absolute: true
    });
    expect(normalized[1]).toEqual({
      type: 'L',
      points: [15, 15],
      absolute: true
    });
  });

  it('should preserve absolute commands', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [10, 10], absolute: true },
      { type: 'L', points: [20, 20], absolute: true }
    ];
    
    const normalized = normalizePath(commands);
    
    expect(normalized).toEqual(commands);
  });

  it('should handle multiple relative commands', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 0], absolute: false },
      { type: 'L', points: [0, 10], absolute: false }
    ];
    
    const normalized = normalizePath(commands);
    
    expect(normalized[0].points).toEqual([0, 0]);
    expect(normalized[1].points).toEqual([10, 0]);
    expect(normalized[2].points).toEqual([10, 10]);
  });

  it('should handle closepath correctly', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [10, 10], absolute: true },
      { type: 'L', points: [5, 5], absolute: false },
      { type: 'Z', points: [], absolute: false }
    ];
    
    const normalized = normalizePath(commands);
    
    expect(normalized[2]).toEqual({
      type: 'Z',
      points: [],
      absolute: true
    });
  });
});

describe('Path Simplification', () => {
  it('should simplify collinear points', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [1, 0], absolute: true },
      { type: 'L', points: [2, 0], absolute: true },
      { type: 'L', points: [3, 0], absolute: true }
    ];
    
    const simplified = simplifyPath(commands, 0.1);
    
    expect(simplified.length).toBeLessThan(commands.length);
    expect(simplified[0].type).toBe('M');
    expect(simplified[0].points).toEqual([0, 0]);
    expect(simplified[simplified.length - 1].points).toEqual([3, 0]);
  });

  it('should preserve shape within tolerance', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 0], absolute: true },
      { type: 'L', points: [10, 10], absolute: true }
    ];
    
    const simplified = simplifyPath(commands, 0.1);
    
    // Should keep all points since they form a corner
    expect(simplified.length).toBeGreaterThanOrEqual(3);
  });

  it('should handle paths with only two points', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 10], absolute: true }
    ];
    
    const simplified = simplifyPath(commands, 0.1);
    
    expect(simplified).toEqual(commands);
  });

  it('should preserve closepath command', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [1, 0], absolute: true },
      { type: 'L', points: [2, 0], absolute: true },
      { type: 'Z', points: [], absolute: true }
    ];
    
    const simplified = simplifyPath(commands, 0.1);
    
    expect(simplified[simplified.length - 1].type).toBe('Z');
  });
});

describe('Path Splitting', () => {
  it('should split path at midpoint', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 0], absolute: true },
      { type: 'L', points: [10, 10], absolute: true }
    ];
    
    const [before, after] = splitPath(commands, 0.5);
    
    expect(before.length).toBeGreaterThan(0);
    expect(after.length).toBeGreaterThan(0);
    expect(before[0].type).toBe('M');
  });

  it('should return empty first path when t=0', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 0], absolute: true }
    ];
    
    const [before, after] = splitPath(commands, 0);
    
    expect(before).toHaveLength(0);
    expect(after).toEqual(commands);
  });

  it('should return empty second path when t=1', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 0], absolute: true }
    ];
    
    const [before, after] = splitPath(commands, 1);
    
    expect(before).toEqual(commands);
    expect(after).toHaveLength(0);
  });

  it('should handle single segment path', () => {
    const commands: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 0], absolute: true }
    ];
    
    const [before, after] = splitPath(commands, 0.5);
    
    expect(before.length).toBeGreaterThan(0);
    expect(after.length).toBeGreaterThan(0);
  });
});

describe('Path Merging', () => {
  it('should merge two paths', () => {
    const path1: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 0], absolute: true }
    ];
    
    const path2: PathCommand[] = [
      { type: 'M', points: [10, 0], absolute: true },
      { type: 'L', points: [10, 10], absolute: true }
    ];
    
    const merged = mergePath(path1, path2);
    
    expect(merged.length).toBeGreaterThan(path1.length);
  });

  it('should skip redundant move command when endpoints match', () => {
    const path1: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 0], absolute: true }
    ];
    
    const path2: PathCommand[] = [
      { type: 'M', points: [10, 0], absolute: true },
      { type: 'L', points: [10, 10], absolute: true }
    ];
    
    const merged = mergePath(path1, path2);
    
    // Should have 3 commands: M, L, L (skipping the second M)
    expect(merged).toHaveLength(3);
    expect(merged[0].type).toBe('M');
    expect(merged[1].type).toBe('L');
    expect(merged[2].type).toBe('L');
  });

  it('should handle empty first path', () => {
    const path1: PathCommand[] = [];
    const path2: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 0], absolute: true }
    ];
    
    const merged = mergePath(path1, path2);
    
    expect(merged).toEqual(path2);
  });

  it('should handle empty second path', () => {
    const path1: PathCommand[] = [
      { type: 'M', points: [0, 0], absolute: true },
      { type: 'L', points: [10, 0], absolute: true }
    ];
    const path2: PathCommand[] = [];
    
    const merged = mergePath(path1, path2);
    
    expect(merged).toEqual(path1);
  });
});

describe('Round-trip: Parse and Serialize', () => {
  it('should preserve path data through parse-serialize cycle', () => {
    const original = 'M 10 20 L 30 40 L 50 60 Z';
    const commands = parsePath(original);
    const serialized = serializePath(commands);
    const reparsed = parsePath(serialized);
    
    expect(reparsed).toEqual(commands);
  });

  it('should handle complex paths', () => {
    const original = 'M 0 0 C 10 10 20 20 30 30 Q 40 40 50 50 Z';
    const commands = parsePath(original);
    const serialized = serializePath(commands);
    const reparsed = parsePath(serialized);
    
    expect(reparsed).toEqual(commands);
  });
});

describe('Edge Cases', () => {
  it('should handle empty path', () => {
    const commands = parsePath('');
    expect(commands).toHaveLength(0);
    
    const serialized = serializePath(commands);
    expect(serialized).toBe('');
  });

  it('should handle path with only move command', () => {
    const commands = parsePath('M 10 20');
    expect(commands).toHaveLength(1);
    expect(commands[0].type).toBe('M');
  });

  it('should handle path with only closepath', () => {
    const commands: PathCommand[] = [
      { type: 'Z', points: [], absolute: true }
    ];
    
    const serialized = serializePath(commands);
    expect(serialized).toBe('Z');
  });

  it('should normalize empty path', () => {
    const commands: PathCommand[] = [];
    const normalized = normalizePath(commands);
    expect(normalized).toHaveLength(0);
  });

  it('should simplify empty path', () => {
    const commands: PathCommand[] = [];
    const simplified = simplifyPath(commands, 0.1);
    expect(simplified).toHaveLength(0);
  });
});
