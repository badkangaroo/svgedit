import { describe, it, expect } from 'vitest';
import {
  validateNodeExists,
  validateParentNode,
  validateAttributeName,
  validateAttributeValue,
  validateElementType,
  validateInsertIndex,
  combineValidations,
  type ValidationResult,
} from './validation.js';
import type { SVGDocument } from '../types/document.js';
import type { SVGNode } from '../types/node.js';
import { ErrorCode } from '../types/result.js';

/**
 * Helper to create a minimal test document.
 */
function createTestDocument(): SVGDocument {
  const root: SVGNode = {
    id: 'root',
    type: 'svg',
    attributes: new Map(),
    children: [],
    parent: null,
  };
  
  const child1: SVGNode = {
    id: 'child1',
    type: 'rect',
    attributes: new Map([['x', '10'], ['y', '20']]),
    children: [],
    parent: root,
  };
  
  const child2: SVGNode = {
    id: 'child2',
    type: 'circle',
    attributes: new Map([['cx', '50'], ['cy', '50'], ['r', '25']]),
    children: [],
    parent: root,
  };
  
  root.children = [child1, child2];
  
  return {
    root,
    nodes: new Map([
      ['root', root],
      ['child1', child1],
      ['child2', child2],
    ]),
    version: 0,
  };
}

describe('Command Validation', () => {
  describe('validateNodeExists', () => {
    it('should return valid for existing node', () => {
      const document = createTestDocument();
      
      const result = validateNodeExists(document, 'root');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return valid for child nodes', () => {
      const document = createTestDocument();
      
      const result = validateNodeExists(document, 'child1');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return error for non-existent node', () => {
      const document = createTestDocument();
      
      const result = validateNodeExists(document, 'non-existent');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.NODE_NOT_FOUND);
        expect(result.error.message).toContain('non-existent');
        expect(result.error.nodeId).toBe('non-existent');
      }
    });
    
    it('should return error for empty node ID', () => {
      const document = createTestDocument();
      
      const result = validateNodeExists(document, '');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.NODE_NOT_FOUND);
      }
    });
  });
  
  describe('validateParentNode', () => {
    it('should return valid for existing parent node', () => {
      const document = createTestDocument();
      
      const result = validateParentNode(document, 'root');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return valid for child nodes that can be parents', () => {
      const document = createTestDocument();
      
      const result = validateParentNode(document, 'child1');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return error for non-existent parent', () => {
      const document = createTestDocument();
      
      const result = validateParentNode(document, 'non-existent');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.INVALID_PARENT);
        expect(result.error.message).toContain('non-existent');
        expect(result.error.nodeId).toBe('non-existent');
      }
    });
  });
  
  describe('validateAttributeName', () => {
    it('should return valid for standard attribute names', () => {
      const validNames = ['fill', 'stroke', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r'];
      
      for (const name of validNames) {
        const result = validateAttributeName(name);
        expect(result.valid).toBe(true);
      }
    });
    
    it('should return valid for namespaced attributes', () => {
      const result = validateAttributeName('xlink:href');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return valid for attributes with hyphens', () => {
      const result = validateAttributeName('stroke-width');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return valid for attributes with underscores', () => {
      const result = validateAttributeName('_custom_attr');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return valid for attributes with periods', () => {
      const result = validateAttributeName('data.value');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return error for empty attribute name', () => {
      const result = validateAttributeName('');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.INVALID_ATTRIBUTE);
        expect(result.error.message).toContain('empty');
      }
    });
    
    it('should return error for whitespace-only attribute name', () => {
      const result = validateAttributeName('   ');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.INVALID_ATTRIBUTE);
      }
    });
    
    it('should return error for attribute name starting with digit', () => {
      const result = validateAttributeName('123attr');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.INVALID_ATTRIBUTE);
        expect(result.error.message).toContain('Invalid attribute name');
      }
    });
    
    it('should return error for attribute name with spaces', () => {
      const result = validateAttributeName('my attr');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.INVALID_ATTRIBUTE);
      }
    });
    
    it('should return error for attribute name with special characters', () => {
      const result = validateAttributeName('attr@name');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.INVALID_ATTRIBUTE);
      }
    });
  });
  
  describe('validateAttributeValue', () => {
    it('should return valid for string values', () => {
      const result = validateAttributeValue('red');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return valid for empty string', () => {
      const result = validateAttributeValue('');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return valid for numeric strings', () => {
      const result = validateAttributeValue('123.45');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return valid for complex values', () => {
      const result = validateAttributeValue('translate(10, 20) rotate(45)');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return error for non-string values', () => {
      // @ts-expect-error Testing invalid input
      const result = validateAttributeValue(123);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.INVALID_ATTRIBUTE);
        expect(result.error.message).toContain('must be a string');
      }
    });
  });
  
  describe('validateElementType', () => {
    it('should return valid for standard SVG elements', () => {
      const validTypes = [
        'svg', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
        'path', 'text', 'g', 'defs', 'use', 'image',
      ];
      
      for (const type of validTypes) {
        const result = validateElementType(type);
        expect(result.valid).toBe(true);
      }
    });
    
    it('should return valid for gradient elements', () => {
      const result1 = validateElementType('linearGradient');
      const result2 = validateElementType('radialGradient');
      
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
    
    it('should return valid for filter elements', () => {
      const result = validateElementType('filter');
      
      expect(result.valid).toBe(true);
    });
    
    it('should return error for empty element type', () => {
      const result = validateElementType('');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toContain('empty');
      }
    });
    
    it('should return error for whitespace-only element type', () => {
      const result = validateElementType('   ');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
      }
    });
    
    it('should return error for unknown element type', () => {
      const result = validateElementType('unknownElement');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toContain('Unknown element type');
        expect(result.error.message).toContain('unknownElement');
      }
    });
  });
  
  describe('validateInsertIndex', () => {
    it('should return valid for undefined index (append)', () => {
      const document = createTestDocument();
      
      const result = validateInsertIndex(document, 'root', undefined);
      
      expect(result.valid).toBe(true);
    });
    
    it('should return valid for index 0', () => {
      const document = createTestDocument();
      
      const result = validateInsertIndex(document, 'root', 0);
      
      expect(result.valid).toBe(true);
    });
    
    it('should return valid for index at end', () => {
      const document = createTestDocument();
      const parent = document.nodes.get('root')!;
      const childCount = parent.children.length;
      
      const result = validateInsertIndex(document, 'root', childCount);
      
      expect(result.valid).toBe(true);
    });
    
    it('should return valid for index in middle', () => {
      const document = createTestDocument();
      
      const result = validateInsertIndex(document, 'root', 1);
      
      expect(result.valid).toBe(true);
    });
    
    it('should return error for negative index', () => {
      const document = createTestDocument();
      
      const result = validateInsertIndex(document, 'root', -1);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toContain('non-negative');
      }
    });
    
    it('should return error for index beyond children length', () => {
      const document = createTestDocument();
      const parent = document.nodes.get('root')!;
      const childCount = parent.children.length;
      
      const result = validateInsertIndex(document, 'root', childCount + 1);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toContain('out of bounds');
      }
    });
    
    it('should return error for non-existent parent', () => {
      const document = createTestDocument();
      
      const result = validateInsertIndex(document, 'non-existent', 0);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.INVALID_PARENT);
      }
    });
  });
  
  describe('combineValidations', () => {
    it('should return valid when all validations pass', () => {
      const validations: ValidationResult[] = [
        { valid: true },
        { valid: true },
        { valid: true },
      ];
      
      const result = combineValidations(validations);
      
      expect(result.valid).toBe(true);
    });
    
    it('should return first error when validation fails', () => {
      const error1 = {
        code: ErrorCode.NODE_NOT_FOUND,
        message: 'First error',
      };
      const error2 = {
        code: ErrorCode.INVALID_ATTRIBUTE,
        message: 'Second error',
      };
      
      const validations: ValidationResult[] = [
        { valid: true },
        { valid: false, error: error1 },
        { valid: false, error: error2 },
      ];
      
      const result = combineValidations(validations);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toEqual(error1);
      }
    });
    
    it('should return valid for empty validations array', () => {
      const result = combineValidations([]);
      
      expect(result.valid).toBe(true);
    });
    
    it('should work with real validation functions', () => {
      const document = createTestDocument();
      
      const result = combineValidations([
        validateNodeExists(document, 'root'),
        validateAttributeName('fill'),
        validateAttributeValue('red'),
      ]);
      
      expect(result.valid).toBe(true);
    });
    
    it('should return first error from real validation functions', () => {
      const document = createTestDocument();
      
      const result = combineValidations([
        validateNodeExists(document, 'root'),
        validateNodeExists(document, 'non-existent'),
        validateAttributeName(''),
      ]);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.NODE_NOT_FOUND);
        expect(result.error.message).toContain('non-existent');
      }
    });
  });
  
  describe('Integration: Command validation workflow', () => {
    it('should validate all preconditions for a create command', () => {
      const document = createTestDocument();
      
      // Simulate validating a create element command
      const result = combineValidations([
        validateElementType('rect'),
        validateParentNode(document, 'root'),
        validateInsertIndex(document, 'root', 0),
      ]);
      
      expect(result.valid).toBe(true);
    });
    
    it('should catch invalid parent in create command validation', () => {
      const document = createTestDocument();
      
      const result = combineValidations([
        validateElementType('rect'),
        validateParentNode(document, 'non-existent'),
        validateInsertIndex(document, 'non-existent', 0),
      ]);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.INVALID_PARENT);
      }
    });
    
    it('should validate all preconditions for an update attribute command', () => {
      const document = createTestDocument();
      
      const result = combineValidations([
        validateNodeExists(document, 'child1'),
        validateAttributeName('fill'),
        validateAttributeValue('blue'),
      ]);
      
      expect(result.valid).toBe(true);
    });
    
    it('should catch invalid attribute name in update command validation', () => {
      const document = createTestDocument();
      
      const result = combineValidations([
        validateNodeExists(document, 'child1'),
        validateAttributeName(''),
        validateAttributeValue('blue'),
      ]);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.INVALID_ATTRIBUTE);
      }
    });
    
    it('should validate all preconditions for a delete command', () => {
      const document = createTestDocument();
      
      const result = validateNodeExists(document, 'child1');
      
      expect(result.valid).toBe(true);
    });
    
    it('should catch non-existent node in delete command validation', () => {
      const document = createTestDocument();
      
      const result = validateNodeExists(document, 'non-existent');
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe(ErrorCode.NODE_NOT_FOUND);
      }
    });
  });
});
