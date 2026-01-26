/**
 * Result type for operations that can fail.
 * Provides type-safe error handling without exceptions.
 */
export type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Error codes for various failure scenarios in the core engine.
 */
export enum ErrorCode {
  // Parsing errors
  INVALID_XML = 'INVALID_XML',
  MALFORMED_SVG = 'MALFORMED_SVG',
  INVALID_ATTRIBUTE = 'INVALID_ATTRIBUTE',
  
  // Command errors
  NODE_NOT_FOUND = 'NODE_NOT_FOUND',
  INVALID_PARENT = 'INVALID_PARENT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  COMMAND_NOT_EXECUTED = 'COMMAND_NOT_EXECUTED',
  
  // Geometry errors
  INVALID_MATRIX = 'INVALID_MATRIX',
  INVALID_PATH_DATA = 'INVALID_PATH_DATA',
  
  // Query errors
  INVALID_SELECTOR = 'INVALID_SELECTOR',
}

/**
 * Detailed error information including context.
 */
export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  line?: number;      // For parsing errors
  column?: number;    // For parsing errors
  nodeId?: string;    // For command errors
  context?: unknown;  // Additional context
}
