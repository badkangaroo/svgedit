import { describe, it, expect } from 'vitest';
import type { Command, CommandError } from './command.js';
import type { SVGDocument } from '../types/document.js';
import type { Result } from '../types/result.js';
import { ErrorCode } from '../types/result.js';

/**
 * Test implementation of Command interface.
 * This simple command increments the document version.
 */
class IncrementVersionCommand implements Command {
  private executed = false;
  private previousVersion?: number;
  
  canExecute(document: SVGDocument): boolean {
    return !this.executed;
  }
  
  canUndo(document: SVGDocument): boolean {
    return this.executed && this.previousVersion !== undefined;
  }
  
  execute(document: SVGDocument): Result<SVGDocument, CommandError> {
    if (!this.canExecute(document)) {
      return {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Command has already been executed',
        },
      };
    }
    
    this.previousVersion = document.version;
    this.executed = true;
    
    return {
      ok: true,
      value: {
        ...document,
        version: document.version + 1,
      },
    };
  }
  
  undo(document: SVGDocument): Result<SVGDocument, CommandError> {
    if (!this.canUndo(document)) {
      return {
        ok: false,
        error: {
          code: ErrorCode.COMMAND_NOT_EXECUTED,
          message: 'Command has not been executed',
        },
      };
    }
    
    this.executed = false;
    
    return {
      ok: true,
      value: {
        ...document,
        version: this.previousVersion!,
      },
    };
  }
}

/**
 * Test implementation that always fails validation.
 */
class InvalidCommand implements Command {
  canExecute(document: SVGDocument): boolean {
    return false;
  }
  
  canUndo(document: SVGDocument): boolean {
    return false;
  }
  
  execute(document: SVGDocument): Result<SVGDocument, CommandError> {
    return {
      ok: false,
      error: {
        code: ErrorCode.VALIDATION_FAILED,
        message: 'This command is always invalid',
      },
    };
  }
  
  undo(document: SVGDocument): Result<SVGDocument, CommandError> {
    return {
      ok: false,
      error: {
        code: ErrorCode.COMMAND_NOT_EXECUTED,
        message: 'Cannot undo command that was never executed',
      },
    };
  }
}

/**
 * Helper to create a minimal test document.
 */
function createTestDocument(): SVGDocument {
  const root = {
    id: 'root',
    type: 'svg' as const,
    attributes: new Map(),
    children: [],
    parent: null,
  };
  
  return {
    root,
    nodes: new Map([['root', root]]),
    version: 0,
  };
}

describe('Command Interface', () => {
  describe('execute()', () => {
    it('should apply changes to the document', () => {
      const document = createTestDocument();
      const command = new IncrementVersionCommand();
      
      const result = command.execute(document);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe(1);
      }
    });
    
    it('should return new document instance (immutable)', () => {
      const document = createTestDocument();
      const command = new IncrementVersionCommand();
      
      const result = command.execute(document);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toBe(document);
        expect(document.version).toBe(0); // Original unchanged
      }
    });
    
    it('should return error for invalid command', () => {
      const document = createTestDocument();
      const command = new InvalidCommand();
      
      const result = command.execute(document);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toBeTruthy();
      }
    });
    
    it('should not modify document on error', () => {
      const document = createTestDocument();
      const command = new InvalidCommand();
      
      const result = command.execute(document);
      
      expect(result.ok).toBe(false);
      expect(document.version).toBe(0); // Unchanged
    });
  });
  
  describe('undo()', () => {
    it('should reverse changes made by execute', () => {
      const document = createTestDocument();
      const command = new IncrementVersionCommand();
      
      const executeResult = command.execute(document);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const undoResult = command.undo(executeResult.value);
        
        expect(undoResult.ok).toBe(true);
        if (undoResult.ok) {
          expect(undoResult.value.version).toBe(0);
        }
      }
    });
    
    it('should restore document to exact previous state', () => {
      const document = createTestDocument();
      const command = new IncrementVersionCommand();
      
      const executeResult = command.execute(document);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const undoResult = command.undo(executeResult.value);
        
        expect(undoResult.ok).toBe(true);
        if (undoResult.ok) {
          expect(undoResult.value).toEqual(document);
        }
      }
    });
    
    it('should return error if command was not executed', () => {
      const document = createTestDocument();
      const command = new IncrementVersionCommand();
      
      const result = command.undo(document);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.COMMAND_NOT_EXECUTED);
      }
    });
    
    it('should return new document instance (immutable)', () => {
      const document = createTestDocument();
      const command = new IncrementVersionCommand();
      
      const executeResult = command.execute(document);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        const undoResult = command.undo(executeResult.value);
        
        expect(undoResult.ok).toBe(true);
        if (undoResult.ok) {
          expect(undoResult.value).not.toBe(executeResult.value);
        }
      }
    });
  });
  
  describe('canExecute()', () => {
    it('should return true when command can be executed', () => {
      const document = createTestDocument();
      const command = new IncrementVersionCommand();
      
      expect(command.canExecute(document)).toBe(true);
    });
    
    it('should return false when command cannot be executed', () => {
      const document = createTestDocument();
      const command = new InvalidCommand();
      
      expect(command.canExecute(document)).toBe(false);
    });
    
    it('should return false after command has been executed', () => {
      const document = createTestDocument();
      const command = new IncrementVersionCommand();
      
      command.execute(document);
      
      expect(command.canExecute(document)).toBe(false);
    });
  });
  
  describe('canUndo()', () => {
    it('should return false before command is executed', () => {
      const document = createTestDocument();
      const command = new IncrementVersionCommand();
      
      expect(command.canUndo(document)).toBe(false);
    });
    
    it('should return true after command is executed', () => {
      const document = createTestDocument();
      const command = new IncrementVersionCommand();
      
      const result = command.execute(document);
      expect(result.ok).toBe(true);
      
      if (result.ok) {
        expect(command.canUndo(result.value)).toBe(true);
      }
    });
    
    it('should return false for invalid command', () => {
      const document = createTestDocument();
      const command = new InvalidCommand();
      
      expect(command.canUndo(document)).toBe(false);
    });
  });
  
  describe('CommandError', () => {
    it('should include error code', () => {
      const document = createTestDocument();
      const command = new InvalidCommand();
      
      const result = command.execute(document);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBeDefined();
        expect(Object.values(ErrorCode)).toContain(result.error.code);
      }
    });
    
    it('should include error message', () => {
      const document = createTestDocument();
      const command = new InvalidCommand();
      
      const result = command.execute(document);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBeTruthy();
        expect(typeof result.error.message).toBe('string');
      }
    });
    
    it('should optionally include nodeId', () => {
      const error: CommandError = {
        code: ErrorCode.NODE_NOT_FOUND,
        message: 'Node not found',
        nodeId: 'test-node-id',
      };
      
      expect(error.nodeId).toBe('test-node-id');
    });
    
    it('should optionally include context', () => {
      const error: CommandError = {
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Validation failed',
        context: { reason: 'Invalid attribute value' },
      };
      
      expect(error.context).toEqual({ reason: 'Invalid attribute value' });
    });
  });
  
  describe('Command inverse property', () => {
    it('should satisfy execute then undo restores original state', () => {
      const document = createTestDocument();
      const command = new IncrementVersionCommand();
      
      // Execute
      const executeResult = command.execute(document);
      expect(executeResult.ok).toBe(true);
      
      if (executeResult.ok) {
        // Undo
        const undoResult = command.undo(executeResult.value);
        expect(undoResult.ok).toBe(true);
        
        if (undoResult.ok) {
          // Should restore exact original state
          expect(undoResult.value).toEqual(document);
          expect(undoResult.value.version).toBe(document.version);
          expect(undoResult.value.root).toEqual(document.root);
          expect(undoResult.value.nodes).toEqual(document.nodes);
        }
      }
    });
  });
});
