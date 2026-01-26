/**
 * Attribute type validation utilities.
 * 
 * This module provides validators for SVG attribute types including
 * numeric values, colors, and enums.
 * 
 * @module commands/attribute-validation
 */

import { ErrorCode } from '../types/result.js';
import type { CommandError } from './command.js';

/**
 * Validation result for attribute type checking.
 */
export type AttributeValidationResult = 
  | { valid: true }
  | { valid: false; error: CommandError };

/**
 * Validate a numeric attribute value.
 * 
 * Checks if the value is a valid number (integer or float).
 * 
 * @param attributeName - Name of the attribute being validated
 * @param value - The value to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateNumericAttribute('x', '10');
 * if (!result.valid) {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function validateNumericAttribute(
  attributeName: string,
  value: string
): AttributeValidationResult {
  // Trim whitespace
  const trimmedValue = value.trim();
  
  // Check if it's a valid number format (no units allowed)
  const numericPattern = /^-?\d+(\.\d+)?$/;
  if (!numericPattern.test(trimmedValue)) {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_ATTRIBUTE,
        message: `Attribute "${attributeName}" must be a valid number. Got: "${value}"`,
        context: {
          attributeName,
          value,
          expectedType: 'number',
          actualType: 'string'
        }
      }
    };
  }
  
  return { valid: true };
}

/**
 * Validate a length attribute value (number with optional unit).
 * 
 * Accepts numbers with optional units: px, em, rem, %, pt, pc, cm, mm, in
 * 
 * @param attributeName - Name of the attribute being validated
 * @param value - The value to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * validateLengthAttribute('width', '100px'); // valid
 * validateLengthAttribute('width', '50%');   // valid
 * validateLengthAttribute('width', '10');    // valid
 * validateLengthAttribute('width', 'auto');  // invalid
 * ```
 */
export function validateLengthAttribute(
  attributeName: string,
  value: string
): AttributeValidationResult {
  // Match number with optional unit
  const lengthPattern = /^-?\d+(\.\d+)?(px|em|rem|%|pt|pc|cm|mm|in)?$/;
  
  if (!lengthPattern.test(value.trim())) {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_ATTRIBUTE,
        message: `Attribute "${attributeName}" must be a valid length (number with optional unit). Got: "${value}"`,
        context: {
          attributeName,
          value,
          expectedType: 'length',
          validUnits: ['px', 'em', 'rem', '%', 'pt', 'pc', 'cm', 'mm', 'in']
        }
      }
    };
  }
  
  return { valid: true };
}

/**
 * Validate a color attribute value.
 * 
 * Accepts:
 * - Named colors (e.g., 'red', 'blue')
 * - Hex colors (e.g., '#ff0000', '#f00')
 * - RGB/RGBA (e.g., 'rgb(255, 0, 0)', 'rgba(255, 0, 0, 0.5)')
 * - HSL/HSLA (e.g., 'hsl(0, 100%, 50%)')
 * 
 * @param attributeName - Name of the attribute being validated
 * @param value - The value to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * validateColorAttribute('fill', 'red');           // valid
 * validateColorAttribute('fill', '#ff0000');       // valid
 * validateColorAttribute('fill', 'rgb(255,0,0)');  // valid
 * validateColorAttribute('fill', 'invalid');       // invalid
 * ```
 */
export function validateColorAttribute(
  attributeName: string,
  value: string
): AttributeValidationResult {
  const trimmedValue = value.trim().toLowerCase();
  
  // Check for named colors
  const namedColors = [
    'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure',
    'beige', 'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood',
    'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan',
    'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgrey', 'darkgreen', 'darkkhaki',
    'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
    'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
    'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
    'firebrick', 'floralwhite', 'forestgreen', 'fuchsia',
    'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'grey', 'green', 'greenyellow',
    'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki',
    'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
    'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgrey', 'lightgreen', 'lightpink',
    'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey',
    'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen',
    'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
    'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
    'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin',
    'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid',
    'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff',
    'peru', 'pink', 'plum', 'powderblue', 'purple',
    'red', 'rosybrown', 'royalblue',
    'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue',
    'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue',
    'tan', 'teal', 'thistle', 'tomato', 'turquoise',
    'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen',
    'transparent', 'currentcolor', 'none'
  ];
  
  if (namedColors.includes(trimmedValue)) {
    return { valid: true };
  }
  
  // Check for hex colors
  const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{6})$/;
  if (hexPattern.test(trimmedValue)) {
    return { valid: true };
  }
  
  // Check for rgb/rgba
  const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(\,\s*[\d.]+\s*)?\)$/;
  if (rgbPattern.test(trimmedValue)) {
    // Additional validation: rgba must have 4 values, rgb must have 3
    const hasAlpha = trimmedValue.startsWith('rgba');
    const commaCount = (trimmedValue.match(/,/g) || []).length;
    
    if (hasAlpha && commaCount !== 3) {
      // rgba needs exactly 4 values (3 commas)
      return {
        valid: false,
        error: {
          code: ErrorCode.INVALID_ATTRIBUTE,
          message: `Attribute "${attributeName}" must be a valid color. Got: "${value}"`,
          context: {
            attributeName,
            value,
            expectedType: 'color',
            validFormats: ['named color', 'hex (#rgb or #rrggbb)', 'rgb(r,g,b)', 'rgba(r,g,b,a)', 'hsl(h,s%,l%)', 'hsla(h,s%,l%,a)']
          }
        }
      };
    }
    
    if (!hasAlpha && commaCount !== 2) {
      // rgb needs exactly 3 values (2 commas)
      return {
        valid: false,
        error: {
          code: ErrorCode.INVALID_ATTRIBUTE,
          message: `Attribute "${attributeName}" must be a valid color. Got: "${value}"`,
          context: {
            attributeName,
            value,
            expectedType: 'color',
            validFormats: ['named color', 'hex (#rgb or #rrggbb)', 'rgb(r,g,b)', 'rgba(r,g,b,a)', 'hsl(h,s%,l%)', 'hsla(h,s%,l%,a)']
          }
        }
      };
    }
    
    return { valid: true };
  }
  
  // Check for hsl/hsla
  const hslPattern = /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/;
  if (hslPattern.test(trimmedValue)) {
    return { valid: true };
  }
  
  return {
    valid: false,
    error: {
      code: ErrorCode.INVALID_ATTRIBUTE,
      message: `Attribute "${attributeName}" must be a valid color. Got: "${value}"`,
      context: {
        attributeName,
        value,
        expectedType: 'color',
        validFormats: ['named color', 'hex (#rgb or #rrggbb)', 'rgb(r,g,b)', 'rgba(r,g,b,a)', 'hsl(h,s%,l%)', 'hsla(h,s%,l%,a)']
      }
    }
  };
}

/**
 * Validate an enum attribute value.
 * 
 * Checks if the value is one of the allowed values.
 * 
 * @param attributeName - Name of the attribute being validated
 * @param value - The value to validate
 * @param allowedValues - Array of allowed values
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * validateEnumAttribute('fill-rule', 'nonzero', ['nonzero', 'evenodd']);
 * validateEnumAttribute('stroke-linecap', 'round', ['butt', 'round', 'square']);
 * ```
 */
export function validateEnumAttribute(
  attributeName: string,
  value: string,
  allowedValues: string[]
): AttributeValidationResult {
  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_ATTRIBUTE,
        message: `Attribute "${attributeName}" must be one of: ${allowedValues.join(', ')}. Got: "${value}"`,
        context: {
          attributeName,
          value,
          expectedType: 'enum',
          allowedValues
        }
      }
    };
  }
  
  return { valid: true };
}

/**
 * Validate an attribute based on its name and expected type.
 * 
 * This is a convenience function that automatically determines the
 * appropriate validator based on the attribute name.
 * 
 * @param attributeName - Name of the attribute
 * @param value - The value to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * validateAttributeType('x', '10');           // numeric
 * validateAttributeType('width', '100px');    // length
 * validateAttributeType('fill', 'red');       // color
 * validateAttributeType('fill-rule', 'nonzero'); // enum
 * ```
 */
export function validateAttributeType(
  attributeName: string,
  value: string
): AttributeValidationResult {
  // Numeric attributes
  const numericAttributes = ['x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2'];
  if (numericAttributes.includes(attributeName)) {
    return validateNumericAttribute(attributeName, value);
  }
  
  // Length attributes
  const lengthAttributes = ['width', 'height', 'stroke-width', 'font-size'];
  if (lengthAttributes.includes(attributeName)) {
    return validateLengthAttribute(attributeName, value);
  }
  
  // Color attributes
  const colorAttributes = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'];
  if (colorAttributes.includes(attributeName)) {
    return validateColorAttribute(attributeName, value);
  }
  
  // Enum attributes
  if (attributeName === 'fill-rule') {
    return validateEnumAttribute(attributeName, value, ['nonzero', 'evenodd']);
  }
  
  if (attributeName === 'stroke-linecap') {
    return validateEnumAttribute(attributeName, value, ['butt', 'round', 'square']);
  }
  
  if (attributeName === 'stroke-linejoin') {
    return validateEnumAttribute(attributeName, value, ['miter', 'round', 'bevel']);
  }
  
  if (attributeName === 'text-anchor') {
    return validateEnumAttribute(attributeName, value, ['start', 'middle', 'end']);
  }
  
  if (attributeName === 'visibility') {
    return validateEnumAttribute(attributeName, value, ['visible', 'hidden', 'collapse']);
  }
  
  // For unknown attributes, accept any string value
  return { valid: true };
}
