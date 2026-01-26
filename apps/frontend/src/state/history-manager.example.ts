/**
 * History Manager Usage Examples
 * 
 * This file demonstrates how to use the HistoryManager with different types of operations.
 * These examples show the patterns that will be used throughout the editor.
 */

import { historyManager, HistoryManager } from './history-manager';
import { Operation } from '../types';

// Example 1: Simple attribute change operation
function exampleAttributeChange() {
  console.log('=== Example 1: Attribute Change ===');
  
  // Simulate an element and attribute change
  const element = { x: 10, y: 20 };
  const oldX = element.x;
  const newX = 50;
  
  // Create the operation
  const operation: Operation = {
    type: 'attribute',
    timestamp: Date.now(),
    undo: () => {
      element.x = oldX;
      console.log(`Undo: Restored x to ${oldX}`);
    },
    redo: () => {
      element.x = newX;
      console.log(`Redo: Set x to ${newX}`);
    },
    description: 'Change x attribute',
  };
  
  // Apply the change
  element.x = newX;
  console.log(`Applied: x = ${element.x}`);
  
  // Push to history
  historyManager.push(operation);
  console.log(`Can undo: ${historyManager.canUndo()}`);
  
  // Undo the change
  historyManager.undo();
  console.log(`After undo: x = ${element.x}`);
  console.log(`Can redo: ${historyManager.canRedo()}`);
  
  // Redo the change
  historyManager.redo();
  console.log(`After redo: x = ${element.x}`);
  
  historyManager.clear();
}

// Example 2: Element creation operation
function exampleElementCreation() {
  console.log('\n=== Example 2: Element Creation ===');
  
  // Simulate a document with elements
  const document = { elements: [] as string[] };
  const newElement = 'circle-1';
  
  const operation: Operation = {
    type: 'create',
    timestamp: Date.now(),
    undo: () => {
      // Remove the element
      const index = document.elements.indexOf(newElement);
      if (index > -1) {
        document.elements.splice(index, 1);
      }
      console.log(`Undo: Removed ${newElement}`);
    },
    redo: () => {
      // Add the element back
      document.elements.push(newElement);
      console.log(`Redo: Added ${newElement}`);
    },
    description: 'Create circle element',
  };
  
  // Create the element
  document.elements.push(newElement);
  console.log(`Created: ${newElement}, elements: [${document.elements}]`);
  
  // Push to history
  historyManager.push(operation);
  
  // Undo creation (delete)
  historyManager.undo();
  console.log(`After undo: elements: [${document.elements}]`);
  
  // Redo creation
  historyManager.redo();
  console.log(`After redo: elements: [${document.elements}]`);
  
  historyManager.clear();
}

// Example 3: Element deletion operation
function exampleElementDeletion() {
  console.log('\n=== Example 3: Element Deletion ===');
  
  const document = { elements: ['rect-1', 'circle-1', 'path-1'] };
  const elementToDelete = 'circle-1';
  const deletedIndex = document.elements.indexOf(elementToDelete);
  
  const operation: Operation = {
    type: 'delete',
    timestamp: Date.now(),
    undo: () => {
      // Restore the element at its original position
      document.elements.splice(deletedIndex, 0, elementToDelete);
      console.log(`Undo: Restored ${elementToDelete} at index ${deletedIndex}`);
    },
    redo: () => {
      // Delete the element again
      const index = document.elements.indexOf(elementToDelete);
      if (index > -1) {
        document.elements.splice(index, 1);
      }
      console.log(`Redo: Deleted ${elementToDelete}`);
    },
    description: 'Delete circle element',
  };
  
  console.log(`Before delete: [${document.elements}]`);
  
  // Delete the element
  document.elements.splice(deletedIndex, 1);
  console.log(`After delete: [${document.elements}]`);
  
  // Push to history
  historyManager.push(operation);
  
  // Undo deletion (restore)
  historyManager.undo();
  console.log(`After undo: [${document.elements}]`);
  
  // Redo deletion
  historyManager.redo();
  console.log(`After redo: [${document.elements}]`);
  
  historyManager.clear();
}

// Example 4: Move operation
function exampleMove() {
  console.log('\n=== Example 4: Move Operation ===');
  
  const element = { x: 10, y: 20 };
  const oldPosition = { x: element.x, y: element.y };
  const newPosition = { x: 50, y: 80 };
  
  const operation: Operation = {
    type: 'move',
    timestamp: Date.now(),
    undo: () => {
      element.x = oldPosition.x;
      element.y = oldPosition.y;
      console.log(`Undo: Moved to (${element.x}, ${element.y})`);
    },
    redo: () => {
      element.x = newPosition.x;
      element.y = newPosition.y;
      console.log(`Redo: Moved to (${element.x}, ${element.y})`);
    },
    description: 'Move element',
  };
  
  console.log(`Before move: (${element.x}, ${element.y})`);
  
  // Apply the move
  element.x = newPosition.x;
  element.y = newPosition.y;
  console.log(`After move: (${element.x}, ${element.y})`);
  
  // Push to history
  historyManager.push(operation);
  
  // Undo move
  historyManager.undo();
  console.log(`After undo: (${element.x}, ${element.y})`);
  
  // Redo move
  historyManager.redo();
  console.log(`After redo: (${element.x}, ${element.y})`);
  
  historyManager.clear();
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
  historyManager.push(operation);
  
  // Undo batch move
  historyManager.undo();
  console.log('After undo:', elements.map(el => `${el.id}: (${el.x}, ${el.y})`));
  
  // Redo batch move
  historyManager.redo();
  console.log('After redo:', elements.map(el => `${el.id}: (${el.x}, ${el.y})`));
  
  historyManager.clear();
}

// Example 6: Stack size limit
function exampleStackSizeLimit() {
  console.log('\n=== Example 6: Stack Size Limit ===');
  
  const manager = new HistoryManager(5); // Small stack for demonstration
  let counter = 0;
  
  // Push 10 operations
  for (let i = 0; i < 10; i++) {
    const operation: Operation = {
      type: 'attribute',
      timestamp: Date.now(),
      undo: () => { counter--; },
      redo: () => { counter++; },
      description: `Operation ${i}`,
    };
    manager.push(operation);
    counter++;
  }
  
  console.log(`Pushed 10 operations, stack size: ${manager.getUndoCount()}`);
  console.log(`Counter value: ${counter}`);
  
  // Undo all available operations (should be 5, not 10)
  let undoCount = 0;
  while (manager.canUndo()) {
    manager.undo();
    undoCount++;
  }
  
  console.log(`Undid ${undoCount} operations`);
  console.log(`Counter value after undo: ${counter}`);
  console.log(`Expected: ${10 - 5} (oldest 5 operations were trimmed)`);
}

// Example 7: Redo stack clearing
function exampleRedoStackClearing() {
  console.log('\n=== Example 7: Redo Stack Clearing ===');
  
  let value = 0;
  
  // Create and push 3 operations
  for (let i = 1; i <= 3; i++) {
    const operation: Operation = {
      type: 'attribute',
      timestamp: Date.now(),
      undo: () => { value--; },
      redo: () => { value++; },
      description: `Increment ${i}`,
    };
    historyManager.push(operation);
    value++;
  }
  
  console.log(`After 3 operations: value = ${value}`);
  
  // Undo 2 operations
  historyManager.undo();
  historyManager.undo();
  console.log(`After 2 undos: value = ${value}, can redo: ${historyManager.canRedo()}`);
  console.log(`Redo count: ${historyManager.getRedoCount()}`);
  
  // Push a new operation (should clear redo stack)
  const newOperation: Operation = {
    type: 'attribute',
    timestamp: Date.now(),
    undo: () => { value -= 10; },
    redo: () => { value += 10; },
    description: 'Add 10',
  };
  historyManager.push(newOperation);
  value += 10;
  
  console.log(`After new operation: value = ${value}, can redo: ${historyManager.canRedo()}`);
  console.log(`Redo count: ${historyManager.getRedoCount()}`);
  
  historyManager.clear();
}

// Run all examples
export function runAllExamples() {
  exampleAttributeChange();
  exampleElementCreation();
  exampleElementDeletion();
  exampleMove();
  exampleBatchOperation();
  exampleStackSizeLimit();
  exampleRedoStackClearing();
  
  console.log('\n=== All examples completed ===');
}

// Uncomment to run examples
// runAllExamples();
