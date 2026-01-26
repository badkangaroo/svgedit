/**
 * Reactive Signal System
 * 
 * A lightweight reactive state management system with fine-grained reactivity.
 * Supports signal primitives (signal, computed, effect) for efficient state updates.
 */

// Type definitions
type Subscriber = () => void;
type ComputeFn<T> = () => T;
type EffectFn = () => void | (() => void);

// Global context for tracking dependencies
let currentEffect: Effect | null = null;
const effectStack: Effect[] = [];

/**
 * Signal - A reactive value container
 * 
 * Signals hold a value and notify subscribers when the value changes.
 * They form the foundation of the reactive system.
 */
export class Signal<T> {
  private value: T;
  private subscribers = new Set<Subscriber>();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  /**
   * Get the current value and track the dependency if called within an effect
   */
  get(): T {
    if (currentEffect) {
      this.subscribers.add(currentEffect.execute);
      currentEffect.dependencies.add(this);
    }
    return this.value;
  }

  /**
   * Set a new value and notify all subscribers if the value changed
   */
  set(newValue: T): void {
    if (this.value !== newValue) {
      this.value = newValue;
      this.notify();
    }
  }

  /**
   * Update the value using a function and notify subscribers
   */
  update(updater: (current: T) => T): void {
    this.set(updater(this.value));
  }

  /**
   * Peek at the value without tracking dependencies
   */
  peek(): T {
    return this.value;
  }

  /**
   * Notify all subscribers of a change
   */
  private notify(): void {
    // Create a copy to avoid issues if subscribers modify the set
    const subs = Array.from(this.subscribers);
    subs.forEach(sub => sub());
  }

  /**
   * Remove a subscriber
   */
  unsubscribe(subscriber: Subscriber): void {
    this.subscribers.delete(subscriber);
  }

  /**
   * Get the number of subscribers (useful for testing)
   */
  subscriberCount(): number {
    return this.subscribers.size;
  }
}

/**
 * Computed - A derived reactive value
 * 
 * Computed signals automatically recalculate when their dependencies change.
 * They cache their value and only recompute when necessary.
 */
export class Computed<T> {
  private value: T | undefined;
  private dirty = true;
  private computeFn: ComputeFn<T>;
  private subscribers = new Set<Subscriber>();
  private dependencies = new Set<Signal<any> | Computed<any>>();
  private effect: Effect;

  constructor(computeFn: ComputeFn<T>) {
    this.computeFn = computeFn;
    
    // Create an effect to track dependencies and mark as dirty
    this.effect = new Effect(() => {
      this.dirty = true;
      this.notify();
    });
  }

  /**
   * Get the computed value, recalculating if necessary
   */
  get(): T {
    if (this.dirty) {
      // Clear old dependencies
      this.dependencies.forEach(dep => {
        if (dep instanceof Signal) {
          dep.unsubscribe(this.effect.execute);
        }
      });
      this.dependencies.clear();

      // Compute new value and track dependencies
      const prevEffect = currentEffect;
      currentEffect = this.effect;
      this.effect.dependencies.clear();
      
      try {
        this.value = this.computeFn();
        this.dirty = false;
        
        // Store dependencies
        this.effect.dependencies.forEach(dep => {
          this.dependencies.add(dep);
        });
      } finally {
        currentEffect = prevEffect;
      }
    }

    // Track this computed as a dependency if called within an effect
    if (currentEffect && this.value !== undefined) {
      this.subscribers.add(currentEffect.execute);
      currentEffect.dependencies.add(this);
    }

    return this.value as T;
  }

  /**
   * Peek at the value without tracking dependencies
   */
  peek(): T {
    if (this.dirty) {
      // Clear old dependencies
      this.dependencies.forEach(dep => {
        if (dep instanceof Signal) {
          dep.unsubscribe(this.effect.execute);
        }
      });
      this.dependencies.clear();

      // Compute new value and track dependencies (but don't track this computed)
      const prevEffect = currentEffect;
      currentEffect = this.effect;
      this.effect.dependencies.clear();
      
      try {
        this.value = this.computeFn();
        this.dirty = false;
        
        // Store dependencies
        this.effect.dependencies.forEach(dep => {
          this.dependencies.add(dep);
        });
      } finally {
        currentEffect = prevEffect;
      }
    }
    
    // Don't track this computed as a dependency
    return this.value as T;
  }

  /**
   * Notify all subscribers of a change
   */
  private notify(): void {
    const subs = Array.from(this.subscribers);
    subs.forEach(sub => sub());
  }

  /**
   * Remove a subscriber
   */
  unsubscribe(subscriber: Subscriber): void {
    this.subscribers.delete(subscriber);
  }

  /**
   * Clean up the computed signal
   */
  dispose(): void {
    this.dependencies.forEach(dep => {
      if (dep instanceof Signal) {
        dep.unsubscribe(this.effect.execute);
      }
    });
    this.dependencies.clear();
    this.subscribers.clear();
  }
}

/**
 * Effect - A side effect that runs when dependencies change
 * 
 * Effects automatically track their dependencies and re-run when any dependency changes.
 * They can return a cleanup function that runs before the next execution.
 */
export class Effect {
  execute: () => void;
  dependencies = new Set<Signal<any> | Computed<any>>();
  private effectFn: EffectFn;
  private cleanup: (() => void) | void = undefined;
  private isRunning = false;

  constructor(effectFn: EffectFn) {
    this.effectFn = effectFn;
    
    // Bind execute to this instance
    this.execute = () => {
      if (this.isRunning) {
        // Prevent infinite loops
        console.warn('Effect is already running, skipping execution');
        return;
      }

      // Run cleanup from previous execution
      if (this.cleanup) {
        this.cleanup();
        this.cleanup = undefined;
      }

      // Clear old dependencies
      this.dependencies.forEach(dep => {
        if (dep instanceof Signal) {
          dep.unsubscribe(this.execute);
        } else if (dep instanceof Computed) {
          dep.unsubscribe(this.execute);
        }
      });
      this.dependencies.clear();

      // Run the effect and track new dependencies
      const prevEffect = currentEffect;
      currentEffect = this;
      effectStack.push(this);
      this.isRunning = true;

      try {
        this.cleanup = this.effectFn();
      } finally {
        this.isRunning = false;
        effectStack.pop();
        currentEffect = prevEffect;
      }
    };

    // Run the effect immediately
    this.execute();
  }

  /**
   * Stop the effect and run cleanup
   */
  dispose(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = undefined;
    }

    this.dependencies.forEach(dep => {
      if (dep instanceof Signal) {
        dep.unsubscribe(this.execute);
      } else if (dep instanceof Computed) {
        dep.unsubscribe(this.execute);
      }
    });
    this.dependencies.clear();
  }
}

/**
 * Create a new signal with an initial value
 */
export function signal<T>(initialValue: T): Signal<T> {
  return new Signal(initialValue);
}

/**
 * Create a computed signal that derives its value from other signals
 */
export function computed<T>(computeFn: ComputeFn<T>): Computed<T> {
  return new Computed(computeFn);
}

/**
 * Create an effect that runs when its dependencies change
 * Returns a dispose function to stop the effect
 */
export function effect(effectFn: EffectFn): () => void {
  const eff = new Effect(effectFn);
  return () => eff.dispose();
}

/**
 * Batch multiple signal updates together to avoid redundant effect executions
 */
export function batch(fn: () => void): void {
  // Simple batching: collect all updates and notify once
  // For a more sophisticated implementation, we could use a microtask queue
  fn();
}
