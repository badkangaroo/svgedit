# Reactive Signal System

A lightweight reactive state management system with fine-grained reactivity for the SVG Editor.

## Overview

The signal system provides three core primitives:

1. **Signal** - A reactive value container that notifies subscribers when changed
2. **Computed** - A derived value that automatically updates when dependencies change
3. **Effect** - A side effect that runs when dependencies change

## Features

- ✅ Fine-grained reactivity - only affected computations re-run
- ✅ Automatic dependency tracking - no manual subscription management
- ✅ Computed value caching - efficient recalculation only when needed
- ✅ Effect cleanup - proper resource management
- ✅ Conditional dependencies - dynamic dependency graphs
- ✅ Peek without tracking - read values without creating dependencies
- ✅ TypeScript support - full type safety

## API Reference

### `signal<T>(initialValue: T): Signal<T>`

Creates a new signal with an initial value.

```typescript
const count = signal(0);
```

#### Signal Methods

- `get(): T` - Get the current value and track as a dependency
- `set(value: T): void` - Set a new value and notify subscribers
- `update(fn: (current: T) => T): void` - Update using a function
- `peek(): T` - Get the value without tracking as a dependency
- `subscriberCount(): number` - Get the number of active subscribers

### `computed<T>(computeFn: () => T): Computed<T>`

Creates a computed signal that derives its value from other signals.

```typescript
const doubled = computed(() => count.get() * 2);
```

#### Computed Methods

- `get(): T` - Get the computed value (recalculates if dirty)
- `peek(): T` - Get the value without tracking as a dependency
- `dispose(): void` - Clean up the computed signal

### `effect(effectFn: () => void | (() => void)): () => void`

Creates an effect that runs when dependencies change. Returns a dispose function.

```typescript
const dispose = effect(() => {
  console.log('Count:', count.get());
  
  // Optional: return cleanup function
  return () => {
    console.log('Cleaning up');
  };
});

// Later: stop the effect
dispose();
```

## Usage Examples

### Basic Signal Usage

```typescript
import { signal } from './signals';

const count = signal(0);

console.log(count.get()); // 0

count.set(5);
console.log(count.get()); // 5

count.update(n => n + 1);
console.log(count.get()); // 6
```

### Computed Values

```typescript
import { signal, computed } from './signals';

const width = signal(100);
const height = signal(50);
const area = computed(() => width.get() * height.get());

console.log(area.get()); // 5000

width.set(200);
console.log(area.get()); // 10000 (automatically recalculated)
```

### Effects

```typescript
import { signal, effect } from './signals';

const name = signal('World');

effect(() => {
  console.log(`Hello, ${name.get()}!`);
});
// Logs: "Hello, World!"

name.set('Alice');
// Logs: "Hello, Alice!"
```

### Effect Cleanup

```typescript
import { signal, effect } from './signals';

const isActive = signal(false);

effect(() => {
  if (isActive.get()) {
    console.log('Started');
    
    return () => {
      console.log('Stopped');
    };
  }
});

isActive.set(true);  // Logs: "Started"
isActive.set(false); // Logs: "Stopped"
```

### Chained Computed Values

```typescript
import { signal, computed } from './signals';

const count = signal(2);
const doubled = computed(() => count.get() * 2);
const quadrupled = computed(() => doubled.get() * 2);

console.log(quadrupled.get()); // 8

count.set(5);
console.log(quadrupled.get()); // 20
```

### Conditional Dependencies

```typescript
import { signal, computed } from './signals';

const showAdvanced = signal(false);
const basicValue = signal(10);
const advancedValue = signal(100);

const displayValue = computed(() => {
  return showAdvanced.get() 
    ? advancedValue.get() 
    : basicValue.get();
});

console.log(displayValue.get()); // 10

// Only basicValue is tracked
basicValue.set(20);
console.log(displayValue.get()); // 20

// advancedValue changes don't trigger recomputation
advancedValue.set(200);
console.log(displayValue.get()); // 20 (unchanged)

// Switch to advanced mode
showAdvanced.set(true);
console.log(displayValue.get()); // 200

// Now advancedValue is tracked
advancedValue.set(300);
console.log(displayValue.get()); // 300
```

### Peek Without Tracking

```typescript
import { signal, effect } from './signals';

const count = signal(0);
let runs = 0;

effect(() => {
  // Using peek() doesn't create a dependency
  const current = count.peek();
  console.log(`Effect run #${++runs}, count is ${current}`);
});
// Logs: "Effect run #1, count is 0"

count.set(5);
// No log - effect doesn't re-run

console.log(runs); // 1
```

## SVG Editor Use Cases

### Document State

```typescript
import { signal, computed } from './signals';

// Core document state
const svgDocument = signal<SVGElement | null>(null);
const selectedIds = signal<Set<string>>(new Set());

// Derived state
const hasSelection = computed(() => selectedIds.get().size > 0);
const selectionCount = computed(() => selectedIds.get().size);
const selectedElements = computed(() => {
  const doc = svgDocument.get();
  const ids = selectedIds.get();
  if (!doc) return [];
  
  return Array.from(ids)
    .map(id => doc.querySelector(`[id="${id}"]`))
    .filter(el => el !== null) as SVGElement[];
});
```

### UI Synchronization

```typescript
import { signal, effect } from './signals';

const selectedIds = signal<Set<string>>(new Set());

// Sync selection to canvas
effect(() => {
  const ids = selectedIds.get();
  // Update canvas visual indicators
  updateCanvasSelection(ids);
});

// Sync selection to hierarchy panel
effect(() => {
  const ids = selectedIds.get();
  // Update hierarchy panel highlights
  updateHierarchySelection(ids);
});

// Sync selection to attribute inspector
effect(() => {
  const ids = selectedIds.get();
  // Update attribute inspector content
  updateInspectorContent(ids);
});
```

### Theme System

```typescript
import { signal, effect } from './signals';

const theme = signal<'light' | 'dark'>('light');

effect(() => {
  const currentTheme = theme.get();
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
});
```

### Panel Layout

```typescript
import { signal, effect } from './signals';

interface PanelLayout {
  hierarchyWidth: number;
  inspectorWidth: number;
  rawSVGHeight: number;
}

const panelLayout = signal<PanelLayout>({
  hierarchyWidth: 250,
  inspectorWidth: 300,
  rawSVGHeight: 200,
});

effect(() => {
  const layout = panelLayout.get();
  localStorage.setItem('panelLayout', JSON.stringify(layout));
});
```

## Performance Characteristics

### Signal Updates

- **Time Complexity**: O(n) where n is the number of subscribers
- **Space Complexity**: O(n) for storing subscribers
- **Optimization**: Only notifies if value actually changed (using `!==` comparison)

### Computed Values

- **Time Complexity**: O(1) for cached reads, O(m) for recomputation where m is the computation cost
- **Space Complexity**: O(d) where d is the number of dependencies
- **Optimization**: Lazy evaluation - only recomputes when accessed and dirty

### Effects

- **Time Complexity**: O(d) where d is the number of dependencies for cleanup/resubscription
- **Space Complexity**: O(d) for storing dependencies
- **Optimization**: Automatic cleanup of old dependencies when re-running

## Best Practices

### 1. Use Signals for Mutable State

```typescript
// ✅ Good
const count = signal(0);
count.set(count.get() + 1);

// ❌ Avoid
let count = 0;
count++; // No reactivity
```

### 2. Use Computed for Derived Values

```typescript
// ✅ Good
const fullName = computed(() => `${firstName.get()} ${lastName.get()}`);

// ❌ Avoid
let fullName = `${firstName.get()} ${lastName.get()}`; // Won't update
```

### 3. Use Effects for Side Effects

```typescript
// ✅ Good
effect(() => {
  console.log('Count:', count.get());
});

// ❌ Avoid
count.set(count.get() + 1);
console.log('Count:', count.get()); // Not reactive
```

### 4. Clean Up Effects

```typescript
// ✅ Good
const dispose = effect(() => {
  const listener = () => console.log('clicked');
  element.addEventListener('click', listener);
  
  return () => {
    element.removeEventListener('click', listener);
  };
});

// Later
dispose();
```

### 5. Use Peek for Non-Reactive Reads

```typescript
// ✅ Good - when you don't want to track
effect(() => {
  const current = count.peek(); // Won't re-run when count changes
  console.log('Initial:', current);
});

// ❌ Avoid - if you don't want reactivity
effect(() => {
  const current = count.get(); // Will re-run when count changes
  console.log('Current:', current);
});
```

### 6. Avoid Infinite Loops

```typescript
// ❌ Bad - infinite loop
effect(() => {
  count.set(count.get() + 1); // Triggers itself
});

// ✅ Good - conditional update
effect(() => {
  const current = count.get();
  if (current < 10) {
    count.set(current + 1);
  }
});
```

## Testing

The signal system includes comprehensive unit tests covering:

- Basic signal operations (get, set, update, peek)
- Computed value caching and recomputation
- Effect execution and cleanup
- Complex dependency graphs
- Conditional dependencies
- Edge cases (objects, arrays, null, undefined)
- Error handling

Run tests with:

```bash
npm test -- signals.test.ts
```

## Implementation Details

### Dependency Tracking

Dependencies are tracked using a global `currentEffect` variable. When a signal's `get()` method is called:

1. If `currentEffect` is set, the signal adds the effect to its subscribers
2. The effect adds the signal to its dependencies
3. When the signal changes, it notifies all subscribers
4. Effects automatically clean up old dependencies before re-running

### Computed Caching

Computed values use a `dirty` flag to track when recalculation is needed:

1. Initially marked as dirty
2. On first `get()`, compute the value and mark as clean
3. When a dependency changes, mark as dirty
4. Subsequent `get()` calls return cached value if clean

### Effect Cleanup

Effects support cleanup functions for resource management:

1. Effect function can return a cleanup function
2. Cleanup runs before the next effect execution
3. Cleanup runs when the effect is disposed
4. Prevents memory leaks from event listeners, timers, etc.

## Future Enhancements

Potential improvements for future versions:

- **Batching**: Group multiple updates to avoid redundant effect executions
- **Async Computed**: Support for async computations
- **Transactions**: Atomic updates to multiple signals
- **Debugging**: DevTools integration for tracking signal updates
- **Serialization**: Save/restore signal state
- **Middleware**: Intercept signal updates for logging, validation, etc.

## License

Part of the SVG Editor project.
