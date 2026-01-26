/**
 * Validation utilities for command execution.
 * 
 * This module provides helper functions for validating command preconditions
 * and ensuring commands can be safely executed or undone.
 * 
 * @module commands/validation
 */

import type { SVGDocument } from '../types/document.js';
import type { CommandError } from './command.js';
import { ErrorCode } from '../types/result.js';

/**
 * Validation result type for command preconditions.
 */
export type ValidationResult = 
  | { valid: true }
  | { valid: false; error: CommandError };

/**
 * Validates that a node exists in the document.
 * 
 * @param document - The document to check
 * @param nodeId - The ID of the node to validate
 * @returns Validation result indicating if the node exists
 * 
 * @example
 * ```typescript
 * const result = validateNodeExists(document, 'node-123');
 * if (!result.valid) {
 *   return { ok: false, error: result.error };
 * }
 * ```
 */
export function validateNodeExists(
  document: SVGDocument,
  nodeId: string
): ValidationResult {
  if (!document.nodes.has(nodeId)) {
    return {
      valid: false,
      error: {
        code: ErrorCode.NODE_NOT_FOUND,
        message: `Node with ID "${nodeId}" not found in document`,
        nodeId,
      },
    };
  }
  
  return { valid: true };
}

/**
 * Validates that a parent node exists and can accept children.
 * 
 * @param document - The document to check
 * @param parentId - The ID of the parent node to validate
 * @returns Validation result indicating if the parent is valid
 * 
 * @example
 * ```typescript
 * const result = validateParentNode(document, 'parent-123');
 * if (!result.valid) {
 *   return { ok: false, error: result.error };
 * }
 * ```
 */
export function validateParentNode(
  document: SVGDocument,
  parentId: string
): ValidationResult {
  const nodeResult = validateNodeExists(document, parentId);
  if (!nodeResult.valid) {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_PARENT,
        message: `Parent node with ID "${parentId}" not found in document`,
        nodeId: parentId,
      },
    };
  }
  
  // Parent node exists and can accept children
  // All SVG nodes can potentially have children as per SVG spec
  // This can be extended with more specific rules if needed
  
  return { valid: true };
}

/**
 * Validates that an attribute name is valid.
 * 
 * @param attributeName - The attribute name to validate
 * @returns Validation result indicating if the attribute name is valid
 * 
 * @example
 * ```typescript
 * const result = validateAttributeName('fill');
 * if (!result.valid) {
 *   return { ok: false, error: result.error };
 * }
 * ```
 */
export function validateAttributeName(
  attributeName: string
): ValidationResult {
  if (!attributeName || attributeName.trim().length === 0) {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_ATTRIBUTE,
        message: 'Attribute name cannot be empty',
        context: { attributeName },
      },
    };
  }
  
  // Check for invalid characters in attribute names
  // XML attribute names must start with a letter or underscore
  // and can contain letters, digits, hyphens, underscores, and periods
  const validNamePattern = /^[a-zA-Z_][\w\-.:]*$/;
  if (!validNamePattern.test(attributeName)) {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_ATTRIBUTE,
        message: `Invalid attribute name: "${attributeName}". Attribute names must start with a letter or underscore and contain only letters, digits, hyphens, underscores, colons, and periods.`,
        context: { attributeName },
      },
    };
  }
  
  return { valid: true };
}

/**
 * Validates that an attribute value is valid.
 * 
 * @param attributeValue - The attribute value to validate
 * @returns Validation result indicating if the attribute value is valid
 * 
 * @example
 * ```typescript
 * const result = validateAttributeValue('red');
 * if (!result.valid) {
 *   return { ok: false, error: result.error };
 * }
 * ```
 */
export function validateAttributeValue(
  attributeValue: string
): ValidationResult {
  // Attribute values can be any string, including empty strings
  // We just need to ensure it's a string type
  if (typeof attributeValue !== 'string') {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_ATTRIBUTE,
        message: 'Attribute value must be a string',
        context: { attributeValue, type: typeof attributeValue },
      },
    };
  }
  
  return { valid: true };
}

/**
 * Validates that an element type is valid.
 * 
 * @param elementType - The element type to validate
 * @returns Validation result indicating if the element type is valid
 * 
 * @example
 * ```typescript
 * const result = validateElementType('rect');
 * if (!result.valid) {
 *   return { ok: false, error: result.error };
 * }
 * ```
 */
export function validateElementType(
  elementType: string
): ValidationResult {
  if (!elementType || elementType.trim().length === 0) {
    return {
      valid: false,
      error: {
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Element type cannot be empty',
        context: { elementType },
      },
    };
  }
  
  // Valid SVG element types (can be extended)
  const validTypes = [
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
    'filter',
  ];
  
  if (!validTypes.includes(elementType)) {
    return {
      valid: false,
      error: {
        code: ErrorCode.VALIDATION_FAILED,
        message: `Unknown element type: "${elementType}". This may not be a valid SVG element.`,
        context: { elementType, validTypes },
      },
    };
  }
  
  return { valid: true };
}

/**
 * Validates that an insert index is valid for a parent node.
 * 
 * @param document - The document to check
 * @param parentId - The ID of the parent node
 * @param index - The index to validate (undefined means append)
 * @returns Validation result indicating if the index is valid
 * 
 * @example
 * ```typescript
 * const result = validateInsertIndex(document, 'parent-123', 2);
 * if (!result.valid) {
 *   return { ok: false, error: result.error };
 * }
 * ```
 */
export function validateInsertIndex(
  document: SVGDocument,
  parentId: string,
  index?: number
): ValidationResult {
  const parentResult = validateParentNode(document, parentId);
  if (!parentResult.valid) {
    return parentResult;
  }
  
  const parent = document.nodes.get(parentId)!;
  
  // If index is undefined, it means append (always valid)
  if (index === undefined) {
    return { valid: true };
  }
  
  // Index must be non-negative
  if (index < 0) {
    return {
      valid: false,
      error: {
        code: ErrorCode.VALIDATION_FAILED,
        message: `Insert index must be non-negative, got ${index}`,
        nodeId: parentId,
        context: { index },
      },
    };
  }
  
  // Index must be <= children.length (can insert at end)
  if (index > parent.children.length) {
    return {
      valid: false,
      error: {
        code: ErrorCode.VALIDATION_FAILED,
        message: `Insert index ${index} is out of bounds. Parent has ${parent.children.length} children.`,
        nodeId: parentId,
        context: { index, childrenCount: parent.children.length },
      },
    };
  }
  
  return { valid: true };
}

/**
 * Combines multiple validation results.
 * Returns the first error encountered, or success if all validations pass.
 * 
 * @param validations - Array of validation results to combine
 * @returns Combined validation result
 * 
 * @example
 * ```typescript
 * const result = combineValidations([
 *   validateNodeExists(document, nodeId),
 *   validateAttributeName(attrName),
 *   validateAttributeValue(attrValue),
 * ]);
 * if (!result.valid) {
 *   return { ok: false, error: result.error };
 * }
 * ```
 */
export function combineValidations(
  validations: ValidationResult[]
): ValidationResult {
  for (const validation of validations) {
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}
