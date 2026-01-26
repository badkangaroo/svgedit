import { describe, it, expect } from 'vitest';
import { ErrorCode } from './result.js';
import type { Result, ErrorDetails } from './result.js';

describe('Result type', () => {
  it('should create a successful result', () => {
    const result: Result<number, ErrorDetails> = {
      ok: true,
      value: 42
    };
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });
  
  it('should create an error result', () => {
    const result: Result<number, ErrorDetails> = {
      ok: false,
      error: {
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Test error'
      }
    };
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
      expect(result.error.message).toBe('Test error');
    }
  });
  
  it('should support type narrowing', () => {
    const successResult: Result<string, ErrorDetails> = {
      ok: true,
      value: 'success'
    };
    
    if (successResult.ok) {
      // TypeScript should know this is the success case
      const value: string = successResult.value;
      expect(value).toBe('success');
    }
    
    const errorResult: Result<string, ErrorDetails> = {
      ok: false,
      error: {
        code: ErrorCode.NODE_NOT_FOUND,
        message: 'Node not found'
      }
    };
    
    if (!errorResult.ok) {
      // TypeScript should know this is the error case
      const error: ErrorDetails = errorResult.error;
      expect(error.code).toBe(ErrorCode.NODE_NOT_FOUND);
    }
  });
});

describe('ErrorCode enum', () => {
  it('should have all expected error codes', () => {
    expect(ErrorCode.INVALID_XML).toBe('INVALID_XML');
    expect(ErrorCode.MALFORMED_SVG).toBe('MALFORMED_SVG');
    expect(ErrorCode.INVALID_ATTRIBUTE).toBe('INVALID_ATTRIBUTE');
    expect(ErrorCode.NODE_NOT_FOUND).toBe('NODE_NOT_FOUND');
    expect(ErrorCode.INVALID_PARENT).toBe('INVALID_PARENT');
    expect(ErrorCode.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
    expect(ErrorCode.COMMAND_NOT_EXECUTED).toBe('COMMAND_NOT_EXECUTED');
    expect(ErrorCode.INVALID_MATRIX).toBe('INVALID_MATRIX');
    expect(ErrorCode.INVALID_PATH_DATA).toBe('INVALID_PATH_DATA');
    expect(ErrorCode.INVALID_SELECTOR).toBe('INVALID_SELECTOR');
  });
});
