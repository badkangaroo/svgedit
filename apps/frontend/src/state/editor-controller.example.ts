/**
 * Editor Controller Usage Examples
 * 
 * This file demonstrates how to use the EditorController for undo/redo operations
 * in the SVG editor. The controller ensures all views are synchronized after operations.
 */

import { editorController } from './editor-controller';
import { documentState, documentStateUpdater } from './document-state';
import type { Operation, DocumentNode } from '../types';

// Example 1: Simple attribute change with undo/redo
function exampleAttributeChange() {
  console.log('=== Example 1: Attribute Change with Undo/Redo ===');
  
  // Simulate an element
  const element = { fill: 'red' };
  const oldFill = element.fill;
  const newFill = 'blue';
  
  // Create the operation
  const operation: Operation = {
    type: 'attribute',
    timestamp: Date.now(),
    undo: () => {
      element.fill = oldFill;
      console.log(`Undo: Restored fill to ${oldFill}`);
    },
    redo: () => {
      element.fill = newFill;
      console.log(`Redo: Set fill to ${newFill}`);
    },
    description: 'Change fill color',
  };
  
  // Apply the change
  element.fill = newFill;
  console.log(`Applied: fill = ${element.fill}`);
  
  // Push to history via controller
  editorController.pushOperation(operation);
  console.log(`Can undo: ${editorController.canUndo()}`);
  console.log(`Undo description: ${editorController.getUndoDescription()}`);
  
  // Undo the change
  editorController.undo();
  console.log(`After undo: fill = ${element.fill}`);
  console.log(`Can redo: ${editorController.canRedo()}`);
  console.log(`Redo description: ${editorController.getRedoDescription()}`);
  
  // Redo the change
  editorController.redo();
  console.log(`After redo: fill = ${element.fill}`);
  
  editorController.clearHistory();
}

// Example 2: Element creation with document state update
function exampleElementCreation() {
  console.log('\n=== Example 2: Element Creation with Document State ===');
  
  // Get initial state
  const initialTree = [...documentState.documentTree.get()];
  const newElement = { id: 'circle-1', type: 'circle' } as unknown as DocumentNode;
  
  const operation: Operation = {
    type: 'create',
    timestamp: Date.now(),
    undo: () => {
      // Remove the element from document state
      documentStateUpdater.updateDocumentTree(initialTree);
      console.log('Undo: Removed circle from document');
    },
    redo: () => {
      // Add the element back to document state
      documentStateUpdater.updateDocumentTree([...initialTree, newElement]);
      console.log('Redo: Added circle to document');
    },
    description: 'Create circle element',
  };
  
  // Create the element
  documentStateUpdater.updateDocumentTree([...initialTree, newElement]);
  console.log('Created: circle element');
  
  // Push to history
  editorController.pushOperation(operation);
  
  // Undo creation (delete)
  editorController.undo();
  console.log('After undo: circle removed');
  
  // Redo creation
  editorController.redo();
  console.log('After redo: circle restored');
  
  editorController.clearHistory();
}

// Example 3: Selection change with undo/redo
function exampleSelectionChange() {
  console.log('\n=== Example 3: Selection Change ===');
  
  // Store initial selection
  const initialSelection: string[] = [];
  const newSelection = ['element-1', 'element-2'];
  
  const operation: Operation = {
    type: 'attribute',
    timestamp: Date.now(),
    undo: () => {
      documentStateUpdater.select(initialSelection);
      console.log('Undo: Cleared selection');
    },
    redo: () => {
      documentStateUpdater.select(newSelection);
      console.log('Redo: Selected elements');
    },
    description: 'Select elements',
  };
  
  // Apply selection
  documentStateUpdater.select(newSelection);
  console.log(`Selected: ${newSelection.join(', ')}`);
  
  // Push to history
  editorController.pushOperation(operation);
  
  // Undo selection
  editorController.undo();
  console.log('After undo: selection cleared');
  
  // Redo selection
  editorController.redo();
  console.log('After redo: elements selected again');
  
  editorController.clearHistory();
}

// Example 4: Multiple operations with partial undo
function exampleMultipleOperations() {
  console.log('\n=== Example 4: Multiple Operations ===');
  
  let counter = 0;
  
  // Create 3 operations
  for (let i = 1; i <= 3; i++) {
    const operation: Operation = {
      type: 'attribute',
      timestamp: Date.now(),
      undo: () => { counter--; },
      redo: () => { counter++; },
      description: `Increment ${i}`,
    };
    counter++;
    editorController.pushOperation(operation);
    console.log(`Operation ${i}: counter = ${counter}`);
  }
  
  console.log(`\nAfter 3 operations: counter = ${counter}`);
  
  // Undo 2 operations
  editorController.undo();
  console.log(`After undo 1: counter = ${counter}`);
  editorController.undo();
  console.log(`After undo 2: counter = ${counter}`);
  
  // Redo 1 operation
  editorController.redo();
  console.log(`After redo 1: counter = ${counter}`);
  
  // Push a new operation (clears redo stack)
  const newOperation: Operation = {
    type: 'attribute',
    timestamp: Date.now(),
    undo: () => { counter -= 10; },
    redo: () => { counter += 10; },
    description: 'Add 10',
  };
  counter += 10;
  editorController.pushOperation(newOperation);
  console.log(`After new operation: counter = ${counter}, can redo: ${editorController.canRedo()}`);
  
  editorController.clearHistory();
}

// Example 5: Batch operation (multiple changes as one)
function exampleBatchOperation() {
  console.log('\n=== Example 5: Batch Operation ===');
  
  const elements = [
    { id: 'rect-1', x: 10, y: 20 },
    { id: 'circle-1', x: 30, y: 40 },
    { id: 'path-1', x: 50, y: 60 },
  ];
  
  // Store old positions
  const oldPositions = elements.map(el => ({ x: el.x, y: el.y }));
  const deltaX = 20;
  const deltaY = 30;
  
  const operation: Operation = {
    type: 'batch',
    timestamp: Date.now(),
    undo: () => {
      elements.forEach((el, i) => {
        el.x = oldPositions[i].x;
        el.y = oldPositions[i].y;
      });
      console.log('Undo: Restored all element positions');
    },
    redo: () => {
      elements.forEach(el => {
        el.x += deltaX;
        el.y += deltaY;
      });
      console.log('Redo: Moved all elements');
    },
    description: 'Move multiple elements',
  };
  
  console.log('Before batch move:', elements.map(el => `${el.id}: (${el.x}, ${el.y})`));
  
  // Apply batch move
  elements.forEach(el => {
    el.x += deltaX;
    el.y += deltaY;
  });
  console.log('After batch move:', elements.map(el => `${el.id}: (${el.x}, ${el.y})`));
  
  // Push to history
  editorController.pushOperation(operation);
  
  // Undo batch move
  editorController.undo();
  console.log('After undo:', elements.map(el => `${el.id}: (${el.x}, ${el.y})`));
  
  // Redo batch move
  editorController.redo();
  console.log('After redo:', elements.map(el => `${el.id}: (${el.x}, ${el.y})`));
  
  editorController.clearHistory();
}

// Example 6: Using controller in UI components
function exampleUIIntegration() {
  console.log('\n=== Example 6: UI Integration ===');
  
  // Simulate a UI component that needs to check undo/redo availability
  function updateUndoRedoButtons() {
    const undoButton = {
      enabled: editorController.canUndo(),
      tooltip: editorController.getUndoDescription() || 'Nothing to undo',
    };
    
    const redoButton = {
      enabled: editorController.canRedo(),
      tooltip: editorController.getRedoDescription() || 'Nothing to redo',
    };
    
    console.log('Undo button:', undoButton);
    console.log('Redo button:', redoButton);
  }
  
  // Initial state
  console.log('Initial state:');
  updateUndoRedoButtons();
  
  // Add an operation
  const operation: Operation = {
    type: 'attribute',
    timestamp: Date.now(),
    undo: () => {},
    redo: () => {},
    description: 'Change stroke width',
  };
  editorController.pushOperation(operation);
  
  console.log('\nAfter adding operation:');
  updateUndoRedoButtons();
  
  // Undo
  editorController.undo();
  console.log('\nAfter undo:');
  updateUndoRedoButtons();
  
  // Redo
  editorController.redo();
  console.log('\nAfter redo:');
  updateUndoRedoButtons();
  
  editorController.clearHistory();
}

// Example 7: Keyboard shortcut handlers
function exampleKeyboardShortcuts() {
  console.log('\n=== Example 7: Keyboard Shortcut Handlers ===');
  
  // Simulate keyboard event handlers
  function handleKeyDown(event: { key: string; ctrlKey: boolean; shiftKey: boolean }) {
    // Ctrl+Z or Cmd+Z for undo
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
      if (editorController.canUndo()) {
        console.log('Keyboard: Undo triggered');
        editorController.undo();
      } else {
        console.log('Keyboard: Nothing to undo');
      }
    }
    
    // Ctrl+Shift+Z or Cmd+Shift+Z for redo
    if (event.ctrlKey && event.shiftKey && event.key === 'z') {
      if (editorController.canRedo()) {
        console.log('Keyboard: Redo triggered');
        editorController.redo();
      } else {
        console.log('Keyboard: Nothing to redo');
      }
    }
  }
  
  // Add some operations
  let value = 0;
  for (let i = 1; i <= 3; i++) {
    const operation: Operation = {
      type: 'attribute',
      timestamp: Date.now(),
      undo: () => { value--; },
      redo: () => { value++; },
      description: `Operation ${i}`,
    };
    value++;
    editorController.pushOperation(operation);
  }
  
  console.log(`Initial value: ${value}`);
  
  // Simulate keyboard shortcuts
  handleKeyDown({ key: 'z', ctrlKey: true, shiftKey: false });
  console.log(`After Ctrl+Z: value = ${value}`);
  
  handleKeyDown({ key: 'z', ctrlKey: true, shiftKey: false });
  console.log(`After Ctrl+Z: value = ${value}`);
  
  handleKeyDown({ key: 'z', ctrlKey: true, shiftKey: true });
  console.log(`After Ctrl+Shift+Z: value = ${value}`);
  
  editorController.clearHistory();
}

// Run all examples
export function runAllExamples() {
  exampleAttributeChange();
  exampleElementCreation();
  exampleSelectionChange();
  exampleMultipleOperations();
  exampleBatchOperation();
  exampleUIIntegration();
  exampleKeyboardShortcuts();
  
  console.log('\n=== All examples completed ===');
}

// Uncomment to run examples
// runAllExamples();
