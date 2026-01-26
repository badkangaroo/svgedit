/**
 * Example usage of the reactive signal system
 * 
 * This file demonstrates how to use signals, computed values, and effects
 * in the SVG editor application.
 */

import { signal, computed, effect } from './signals';

// Example 1: Basic signal usage
console.log('=== Example 1: Basic Signals ===');
const count = signal(0);
console.log('Initial count:', count.get()); // 0

count.set(5);
console.log('After set(5):', count.get()); // 5

count.update(n => n + 1);
console.log('After update(n => n + 1):', count.get()); // 6

// Example 2: Computed values
console.log('\n=== Example 2: Computed Values ===');
const firstName = signal('John');
const lastName = signal('Doe');
const fullName = computed(() => `${firstName.get()} ${lastName.get()}`);

console.log('Full name:', fullName.get()); // "John Doe"

firstName.set('Jane');
console.log('After changing first name:', fullName.get()); // "Jane Doe"

// Example 3: Effects
console.log('\n=== Example 3: Effects ===');
const temperature = signal(20);
const unit = signal<'C' | 'F'>('C');

effect(() => {
  const temp = temperature.get();
  const u = unit.get();
  console.log(`Temperature: ${temp}°${u}`);
});
// Logs: "Temperature: 20°C"

temperature.set(25);
// Logs: "Temperature: 25°C"

unit.set('F');
// Logs: "Temperature: 25°F"

// Example 4: SVG Editor State (realistic use case)
console.log('\n=== Example 4: SVG Editor State ===');

// Document state
const svgDocument = signal<SVGElement | null>(null);
const selectedIds = signal<Set<string>>(new Set());

// Derived state
const hasSelection = computed(() => selectedIds.get().size > 0);
const selectionCount = computed(() => selectedIds.get().size);

// UI updates via effects
effect(() => {
  const count = selectionCount.get();
  console.log(`Selection changed: ${count} element(s) selected`);
});
// Logs: "Selection changed: 0 element(s) selected"

// Check if we have a selection
console.log('Has selection:', hasSelection.get()); // false
console.log('Document:', svgDocument.get()); // null

// Simulate selecting elements
selectedIds.set(new Set(['rect1', 'circle1']));
// Logs: "Selection changed: 2 element(s) selected"

// Example 5: Cleanup in effects
console.log('\n=== Example 5: Effect Cleanup ===');
const isEditing = signal(false);

const dispose = effect(() => {
  if (isEditing.get()) {
    console.log('Started editing');
    
    // Return cleanup function
    return () => {
      console.log('Stopped editing');
    };
  }
});

isEditing.set(true);
// Logs: "Started editing"

isEditing.set(false);
// Logs: "Stopped editing"

dispose(); // Clean up the effect

// Example 6: Complex dependency graph
console.log('\n=== Example 6: Complex Dependencies ===');
const width = signal(100);
const height = signal(50);
const scale = signal(1);

const scaledWidth = computed(() => width.get() * scale.get());
const scaledHeight = computed(() => height.get() * scale.get());
const area = computed(() => scaledWidth.get() * scaledHeight.get());

effect(() => {
  console.log(`Area: ${area.get()}px²`);
});
// Logs: "Area: 5000px²"

scale.set(2);
// Logs: "Area: 20000px²"

width.set(200);
// Logs: "Area: 40000px²"

// Example 7: Conditional dependencies
console.log('\n=== Example 7: Conditional Dependencies ===');
const showAdvanced = signal(false);
const basicValue = signal(10);
const advancedValue = signal(100);

const displayValue = computed(() => {
  return showAdvanced.get() ? advancedValue.get() : basicValue.get();
});

effect(() => {
  console.log(`Display value: ${displayValue.get()}`);
});
// Logs: "Display value: 10"

basicValue.set(20);
// Logs: "Display value: 20"

advancedValue.set(200);
// No log - advancedValue is not tracked when showAdvanced is false

showAdvanced.set(true);
// Logs: "Display value: 200"

advancedValue.set(300);
// Logs: "Display value: 300"

// Example 8: Peek without tracking
console.log('\n=== Example 8: Peek Without Tracking ===');
const counter = signal(0);
let effectRuns = 0;

effect(() => {
  // Using peek() doesn't create a dependency
  const current = counter.peek();
  console.log(`Effect run #${++effectRuns}, counter is ${current}`);
});
// Logs: "Effect run #1, counter is 0"

counter.set(5);
// No log - effect doesn't re-run because we used peek()

console.log('Counter value:', counter.get()); // 5
console.log('Effect runs:', effectRuns); // 1

console.log('\n=== Examples Complete ===');
