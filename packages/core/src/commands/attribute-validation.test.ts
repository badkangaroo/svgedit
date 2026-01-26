import { describe, it, expect } from 'vitest';
import {
  validateNumericAttribute,
  validateLengthAttribute,
  validateColorAttribute,
  validateEnumAttribute,
  validateAttributeType
} from './attribute-validation.js';

describe('Numeric Attribute Validation', () => {
  it('should accept valid integers', () => {
    const result = validateNumericAttribute('x', '10');
    expect(result.valid).toBe(true);
  });

  it('should accept valid floats', () => {
    const result = validateNumericAttribute('x', '10.5');
    expect(result.valid).toBe(true);
  });

  it('should accept negative numbers', () => {
    const result = validateNumericAttribute('x', '-10');
    expect(result.valid).toBe(true);
  });

  it('should accept zero', () => {
    const result = validateNumericAttribute('x', '0');
    expect(result.valid).toBe(true);
  });

  it('should reject non-numeric values', () => {
    const result = validateNumericAttribute('x', 'abc');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.message).toContain('must be a valid number');
      expect(result.error.context?.expectedType).toBe('number');
    }
  });

  it('should reject empty strings', () => {
    const result = validateNumericAttribute('x', '');
    expect(result.valid).toBe(false);
  });

  it('should reject strings with units', () => {
    const result = validateNumericAttribute('x', '10px');
    expect(result.valid).toBe(false);
  });
});

describe('Length Attribute Validation', () => {
  it('should accept numbers without units', () => {
    const result = validateLengthAttribute('width', '100');
    expect(result.valid).toBe(true);
  });

  it('should accept numbers with px unit', () => {
    const result = validateLengthAttribute('width', '100px');
    expect(result.valid).toBe(true);
  });

  it('should accept numbers with em unit', () => {
    const result = validateLengthAttribute('width', '10em');
    expect(result.valid).toBe(true);
  });

  it('should accept numbers with rem unit', () => {
    const result = validateLengthAttribute('width', '10rem');
    expect(result.valid).toBe(true);
  });

  it('should accept percentages', () => {
    const result = validateLengthAttribute('width', '50%');
    expect(result.valid).toBe(true);
  });

  it('should accept numbers with pt unit', () => {
    const result = validateLengthAttribute('width', '12pt');
    expect(result.valid).toBe(true);
  });

  it('should accept numbers with cm unit', () => {
    const result = validateLengthAttribute('width', '5cm');
    expect(result.valid).toBe(true);
  });

  it('should accept negative lengths', () => {
    const result = validateLengthAttribute('x', '-10px');
    expect(result.valid).toBe(true);
  });

  it('should accept decimal lengths', () => {
    const result = validateLengthAttribute('width', '10.5px');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid units', () => {
    const result = validateLengthAttribute('width', '100xyz');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.message).toContain('must be a valid length');
    }
  });

  it('should reject non-numeric values', () => {
    const result = validateLengthAttribute('width', 'auto');
    expect(result.valid).toBe(false);
  });

  it('should reject empty strings', () => {
    const result = validateLengthAttribute('width', '');
    expect(result.valid).toBe(false);
  });
});

describe('Color Attribute Validation', () => {
  describe('Named colors', () => {
    it('should accept basic named colors', () => {
      expect(validateColorAttribute('fill', 'red').valid).toBe(true);
      expect(validateColorAttribute('fill', 'blue').valid).toBe(true);
      expect(validateColorAttribute('fill', 'green').valid).toBe(true);
      expect(validateColorAttribute('fill', 'black').valid).toBe(true);
      expect(validateColorAttribute('fill', 'white').valid).toBe(true);
    });

    it('should accept extended named colors', () => {
      expect(validateColorAttribute('fill', 'aliceblue').valid).toBe(true);
      expect(validateColorAttribute('fill', 'cornflowerblue').valid).toBe(true);
      expect(validateColorAttribute('fill', 'darkslategray').valid).toBe(true);
    });

    it('should accept special color keywords', () => {
      expect(validateColorAttribute('fill', 'transparent').valid).toBe(true);
      expect(validateColorAttribute('fill', 'currentcolor').valid).toBe(true);
      expect(validateColorAttribute('fill', 'none').valid).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(validateColorAttribute('fill', 'RED').valid).toBe(true);
      expect(validateColorAttribute('fill', 'Blue').valid).toBe(true);
      expect(validateColorAttribute('fill', 'GREEN').valid).toBe(true);
    });
  });

  describe('Hex colors', () => {
    it('should accept 6-digit hex colors', () => {
      expect(validateColorAttribute('fill', '#ff0000').valid).toBe(true);
      expect(validateColorAttribute('fill', '#00ff00').valid).toBe(true);
      expect(validateColorAttribute('fill', '#0000ff').valid).toBe(true);
    });

    it('should accept 3-digit hex colors', () => {
      expect(validateColorAttribute('fill', '#f00').valid).toBe(true);
      expect(validateColorAttribute('fill', '#0f0').valid).toBe(true);
      expect(validateColorAttribute('fill', '#00f').valid).toBe(true);
    });

    it('should be case-insensitive for hex', () => {
      expect(validateColorAttribute('fill', '#FF0000').valid).toBe(true);
      expect(validateColorAttribute('fill', '#Ff0000').valid).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(validateColorAttribute('fill', '#gg0000').valid).toBe(false);
      expect(validateColorAttribute('fill', '#ff00').valid).toBe(false);
      expect(validateColorAttribute('fill', 'ff0000').valid).toBe(false);
    });
  });

  describe('RGB/RGBA colors', () => {
    it('should accept rgb colors', () => {
      expect(validateColorAttribute('fill', 'rgb(255, 0, 0)').valid).toBe(true);
      expect(validateColorAttribute('fill', 'rgb(0,255,0)').valid).toBe(true);
      expect(validateColorAttribute('fill', 'rgb(0, 0, 255)').valid).toBe(true);
    });

    it('should accept rgba colors', () => {
      expect(validateColorAttribute('fill', 'rgba(255, 0, 0, 0.5)').valid).toBe(true);
      expect(validateColorAttribute('fill', 'rgba(0,255,0,1)').valid).toBe(true);
      expect(validateColorAttribute('fill', 'rgba(0, 0, 255, 0)').valid).toBe(true);
    });

    it('should accept rgb with varying whitespace', () => {
      expect(validateColorAttribute('fill', 'rgb(255,0,0)').valid).toBe(true);
      expect(validateColorAttribute('fill', 'rgb( 255 , 0 , 0 )').valid).toBe(true);
    });

    it('should reject invalid rgb values', () => {
      expect(validateColorAttribute('fill', 'rgb(255, 0)').valid).toBe(false);
      expect(validateColorAttribute('fill', 'rgb(255, 0, 0, 0)').valid).toBe(false);
    });
  });

  describe('HSL/HSLA colors', () => {
    it('should accept hsl colors', () => {
      expect(validateColorAttribute('fill', 'hsl(0, 100%, 50%)').valid).toBe(true);
      expect(validateColorAttribute('fill', 'hsl(120,100%,50%)').valid).toBe(true);
      expect(validateColorAttribute('fill', 'hsl(240, 100%, 50%)').valid).toBe(true);
    });

    it('should accept hsla colors', () => {
      expect(validateColorAttribute('fill', 'hsla(0, 100%, 50%, 0.5)').valid).toBe(true);
      expect(validateColorAttribute('fill', 'hsla(120,100%,50%,1)').valid).toBe(true);
      expect(validateColorAttribute('fill', 'hsla(240, 100%, 50%, 0)').valid).toBe(true);
    });

    it('should reject invalid hsl values', () => {
      expect(validateColorAttribute('fill', 'hsl(0, 100, 50)').valid).toBe(false);
      expect(validateColorAttribute('fill', 'hsl(0, 100%)').valid).toBe(false);
    });
  });

  describe('Invalid colors', () => {
    it('should reject invalid color names', () => {
      const result = validateColorAttribute('fill', 'notacolor');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.message).toContain('must be a valid color');
        expect(result.error.context?.expectedType).toBe('color');
      }
    });

    it('should reject empty strings', () => {
      expect(validateColorAttribute('fill', '').valid).toBe(false);
    });

    it('should reject numbers', () => {
      expect(validateColorAttribute('fill', '123').valid).toBe(false);
    });
  });
});

describe('Enum Attribute Validation', () => {
  it('should accept valid enum values', () => {
    const result = validateEnumAttribute('fill-rule', 'nonzero', ['nonzero', 'evenodd']);
    expect(result.valid).toBe(true);
  });

  it('should accept all allowed values', () => {
    const allowed = ['butt', 'round', 'square'];
    expect(validateEnumAttribute('stroke-linecap', 'butt', allowed).valid).toBe(true);
    expect(validateEnumAttribute('stroke-linecap', 'round', allowed).valid).toBe(true);
    expect(validateEnumAttribute('stroke-linecap', 'square', allowed).valid).toBe(true);
  });

  it('should reject invalid enum values', () => {
    const result = validateEnumAttribute('fill-rule', 'invalid', ['nonzero', 'evenodd']);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.message).toContain('must be one of');
      expect(result.error.context?.allowedValues).toEqual(['nonzero', 'evenodd']);
    }
  });

  it('should be case-sensitive', () => {
    const result = validateEnumAttribute('fill-rule', 'NONZERO', ['nonzero', 'evenodd']);
    expect(result.valid).toBe(false);
  });

  it('should reject empty strings', () => {
    const result = validateEnumAttribute('fill-rule', '', ['nonzero', 'evenodd']);
    expect(result.valid).toBe(false);
  });
});

describe('Attribute Type Validation (Auto-detect)', () => {
  describe('Numeric attributes', () => {
    it('should validate x as numeric', () => {
      expect(validateAttributeType('x', '10').valid).toBe(true);
      expect(validateAttributeType('x', 'abc').valid).toBe(false);
    });

    it('should validate y as numeric', () => {
      expect(validateAttributeType('y', '20').valid).toBe(true);
      expect(validateAttributeType('y', 'abc').valid).toBe(false);
    });

    it('should validate cx, cy, r as numeric', () => {
      expect(validateAttributeType('cx', '50').valid).toBe(true);
      expect(validateAttributeType('cy', '50').valid).toBe(true);
      expect(validateAttributeType('r', '25').valid).toBe(true);
    });
  });

  describe('Length attributes', () => {
    it('should validate width as length', () => {
      expect(validateAttributeType('width', '100').valid).toBe(true);
      expect(validateAttributeType('width', '100px').valid).toBe(true);
      expect(validateAttributeType('width', '50%').valid).toBe(true);
    });

    it('should validate height as length', () => {
      expect(validateAttributeType('height', '100').valid).toBe(true);
      expect(validateAttributeType('height', '100px').valid).toBe(true);
    });

    it('should validate stroke-width as length', () => {
      expect(validateAttributeType('stroke-width', '2').valid).toBe(true);
      expect(validateAttributeType('stroke-width', '2px').valid).toBe(true);
    });
  });

  describe('Color attributes', () => {
    it('should validate fill as color', () => {
      expect(validateAttributeType('fill', 'red').valid).toBe(true);
      expect(validateAttributeType('fill', '#ff0000').valid).toBe(true);
      expect(validateAttributeType('fill', 'rgb(255,0,0)').valid).toBe(true);
    });

    it('should validate stroke as color', () => {
      expect(validateAttributeType('stroke', 'blue').valid).toBe(true);
      expect(validateAttributeType('stroke', '#0000ff').valid).toBe(true);
    });
  });

  describe('Enum attributes', () => {
    it('should validate fill-rule as enum', () => {
      expect(validateAttributeType('fill-rule', 'nonzero').valid).toBe(true);
      expect(validateAttributeType('fill-rule', 'evenodd').valid).toBe(true);
      expect(validateAttributeType('fill-rule', 'invalid').valid).toBe(false);
    });

    it('should validate stroke-linecap as enum', () => {
      expect(validateAttributeType('stroke-linecap', 'butt').valid).toBe(true);
      expect(validateAttributeType('stroke-linecap', 'round').valid).toBe(true);
      expect(validateAttributeType('stroke-linecap', 'square').valid).toBe(true);
      expect(validateAttributeType('stroke-linecap', 'invalid').valid).toBe(false);
    });

    it('should validate stroke-linejoin as enum', () => {
      expect(validateAttributeType('stroke-linejoin', 'miter').valid).toBe(true);
      expect(validateAttributeType('stroke-linejoin', 'round').valid).toBe(true);
      expect(validateAttributeType('stroke-linejoin', 'bevel').valid).toBe(true);
    });

    it('should validate text-anchor as enum', () => {
      expect(validateAttributeType('text-anchor', 'start').valid).toBe(true);
      expect(validateAttributeType('text-anchor', 'middle').valid).toBe(true);
      expect(validateAttributeType('text-anchor', 'end').valid).toBe(true);
    });

    it('should validate visibility as enum', () => {
      expect(validateAttributeType('visibility', 'visible').valid).toBe(true);
      expect(validateAttributeType('visibility', 'hidden').valid).toBe(true);
      expect(validateAttributeType('visibility', 'collapse').valid).toBe(true);
    });
  });

  describe('Unknown attributes', () => {
    it('should accept any value for unknown attributes', () => {
      expect(validateAttributeType('data-custom', 'anything').valid).toBe(true);
      expect(validateAttributeType('unknown-attr', '123').valid).toBe(true);
      expect(validateAttributeType('class', 'my-class').valid).toBe(true);
    });
  });
});
