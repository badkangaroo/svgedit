/**
 * Unit tests for the reactive signal system
 */

import { describe, it, expect, vi } from 'vitest';
import { signal, computed, effect } from './signals';

describe('Signal', () => {
  it('should create a signal with an initial value', () => {
    const count = signal(0);
    expect(count.get()).toBe(0);
  });

  it('should update the value when set is called', () => {
    const count = signal(0);
    count.set(5);
    expect(count.get()).toBe(5);
  });

  it('should update the value using an updater function', () => {
    const count = signal(0);
    count.update(n => n + 1);
    expect(count.get()).toBe(1);
  });

  it('should peek at the value without tracking dependencies', () => {
    const count = signal(0);
    let effectRuns = 0;
    
    effect(() => {
      count.peek(); // Should not track
      effectRuns++;
    });
    
    expect(effectRuns).toBe(1);
    count.set(5);
    expect(effectRuns).toBe(1); // Should not run again
  });

  it('should not notify subscribers if value does not change', () => {
    const count = signal(0);
    let effectRuns = 0;
    
    effect(() => {
      count.get();
      effectRuns++;
    });
    
    expect(effectRuns).toBe(1);
    count.set(0); // Same value
    expect(effectRuns).toBe(1); // Should not run again
  });

  it('should notify all subscribers when value changes', () => {
    const count = signal(0);
    let effect1Runs = 0;
    let effect2Runs = 0;
    
    effect(() => {
      count.get();
      effect1Runs++;
    });
    
    effect(() => {
      count.get();
      effect2Runs++;
    });
    
    expect(effect1Runs).toBe(1);
    expect(effect2Runs).toBe(1);
    
    count.set(5);
    
    expect(effect1Runs).toBe(2);
    expect(effect2Runs).toBe(2);
  });

  it('should track subscriber count', () => {
    const count = signal(0);
    expect(count.subscriberCount()).toBe(0);
    
    const dispose1 = effect(() => {
      count.get();
    });
    expect(count.subscriberCount()).toBe(1);
    
    const dispose2 = effect(() => {
      count.get();
    });
    expect(count.subscriberCount()).toBe(2);
    
    dispose1();
    expect(count.subscriberCount()).toBe(1);
    
    dispose2();
    expect(count.subscriberCount()).toBe(0);
  });
});

describe('Computed', () => {
  it('should compute a derived value', () => {
    const count = signal(2);
    const doubled = computed(() => count.get() * 2);
    
    expect(doubled.get()).toBe(4);
  });

  it('should recompute when dependencies change', () => {
    const count = signal(2);
    const doubled = computed(() => count.get() * 2);
    
    expect(doubled.get()).toBe(4);
    
    count.set(5);
    expect(doubled.get()).toBe(10);
  });

  it('should cache computed values', () => {
    const count = signal(2);
    let computeRuns = 0;
    
    const doubled = computed(() => {
      computeRuns++;
      return count.get() * 2;
    });
    
    expect(computeRuns).toBe(0); // Not computed yet
    
    doubled.get();
    expect(computeRuns).toBe(1);
    
    doubled.get();
    expect(computeRuns).toBe(1); // Should use cached value
    
    count.set(5);
    doubled.get();
    expect(computeRuns).toBe(2); // Should recompute
  });

  it('should work with multiple dependencies', () => {
    const a = signal(2);
    const b = signal(3);
    const sum = computed(() => a.get() + b.get());
    
    expect(sum.get()).toBe(5);
    
    a.set(10);
    expect(sum.get()).toBe(13);
    
    b.set(20);
    expect(sum.get()).toBe(30);
  });

  it('should support chained computed values', () => {
    const count = signal(2);
    const doubled = computed(() => count.get() * 2);
    const quadrupled = computed(() => doubled.get() * 2);
    
    expect(quadrupled.get()).toBe(8);
    
    count.set(5);
    expect(quadrupled.get()).toBe(20);
  });

  it('should peek at the value without tracking dependencies', () => {
    const count = signal(2);
    const doubled = computed(() => count.get() * 2);
    let effectRuns = 0;
    
    effect(() => {
      doubled.peek(); // Should not track
      effectRuns++;
    });
    
    expect(effectRuns).toBe(1);
    count.set(5);
    expect(effectRuns).toBe(1); // Should not run again
  });

  it('should clean up when disposed', () => {
    const count = signal(2);
    const doubled = computed(() => count.get() * 2);
    
    doubled.get(); // Subscribe to count
    expect(count.subscriberCount()).toBe(1);
    
    doubled.dispose();
    expect(count.subscriberCount()).toBe(0);
  });
});

describe('Effect', () => {
  it('should run immediately when created', () => {
    let runs = 0;
    effect(() => {
      runs++;
    });
    
    expect(runs).toBe(1);
  });

  it('should re-run when dependencies change', () => {
    const count = signal(0);
    let runs = 0;
    
    effect(() => {
      count.get();
      runs++;
    });
    
    expect(runs).toBe(1);
    
    count.set(5);
    expect(runs).toBe(2);
    
    count.set(10);
    expect(runs).toBe(3);
  });

  it('should track multiple dependencies', () => {
    const a = signal(1);
    const b = signal(2);
    let sum = 0;
    
    effect(() => {
      sum = a.get() + b.get();
    });
    
    expect(sum).toBe(3);
    
    a.set(10);
    expect(sum).toBe(12);
    
    b.set(20);
    expect(sum).toBe(30);
  });

  it('should work with computed dependencies', () => {
    const count = signal(2);
    const doubled = computed(() => count.get() * 2);
    let result = 0;
    
    effect(() => {
      result = doubled.get();
    });
    
    expect(result).toBe(4);
    
    count.set(5);
    expect(result).toBe(10);
  });

  it('should run cleanup function before next execution', () => {
    const count = signal(0);
    let cleanupRuns = 0;
    
    effect(() => {
      count.get();
      return () => {
        cleanupRuns++;
      };
    });
    
    expect(cleanupRuns).toBe(0);
    
    count.set(1);
    expect(cleanupRuns).toBe(1);
    
    count.set(2);
    expect(cleanupRuns).toBe(2);
  });

  it('should run cleanup when disposed', () => {
    const count = signal(0);
    let cleanupRuns = 0;
    
    const dispose = effect(() => {
      count.get();
      return () => {
        cleanupRuns++;
      };
    });
    
    expect(cleanupRuns).toBe(0);
    
    dispose();
    expect(cleanupRuns).toBe(1);
  });

  it('should stop tracking after disposal', () => {
    const count = signal(0);
    let runs = 0;
    
    const dispose = effect(() => {
      count.get();
      runs++;
    });
    
    expect(runs).toBe(1);
    
    dispose();
    
    count.set(5);
    expect(runs).toBe(1); // Should not run again
  });

  it('should handle nested effects', () => {
    const outer = signal(1);
    const inner = signal(2);
    let outerRuns = 0;
    let innerRuns = 0;
    
    effect(() => {
      outer.get();
      outerRuns++;
      
      effect(() => {
        inner.get();
        innerRuns++;
      });
    });
    
    expect(outerRuns).toBe(1);
    expect(innerRuns).toBe(1);
    
    inner.set(3);
    expect(outerRuns).toBe(1);
    expect(innerRuns).toBe(2);
    
    outer.set(2);
    expect(outerRuns).toBe(2);
    expect(innerRuns).toBe(3); // New inner effect created
  });

  it('should prevent infinite loops', () => {
    const count = signal(0);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    effect(() => {
      const current = count.get();
      if (current < 10) {
        count.set(current + 1); // This would cause infinite loop
      }
    });
    
    // Should have warned about infinite loop
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

describe('Integration', () => {
  it('should handle complex dependency graphs', () => {
    const a = signal(1);
    const b = signal(2);
    const c = computed(() => a.get() + b.get());
    const d = computed(() => c.get() * 2);
    let result = 0;
    
    effect(() => {
      result = d.get();
    });
    
    expect(result).toBe(6); // (1 + 2) * 2
    
    a.set(5);
    expect(result).toBe(14); // (5 + 2) * 2
    
    b.set(10);
    expect(result).toBe(30); // (5 + 10) * 2
  });

  it('should handle diamond dependencies', () => {
    const source = signal(1);
    const left = computed(() => source.get() * 2);
    const right = computed(() => source.get() * 3);
    const result = computed(() => left.get() + right.get());
    
    expect(result.get()).toBe(5); // (1*2) + (1*3)
    
    source.set(2);
    expect(result.get()).toBe(10); // (2*2) + (2*3)
  });

  it('should handle conditional dependencies', () => {
    const flag = signal(true);
    const a = signal(1);
    const b = signal(2);
    let result = 0;
    
    effect(() => {
      result = flag.get() ? a.get() : b.get();
    });
    
    expect(result).toBe(1);
    
    a.set(10);
    expect(result).toBe(10);
    
    b.set(20);
    expect(result).toBe(10); // b is not tracked when flag is true
    
    flag.set(false);
    expect(result).toBe(20);
    
    a.set(100);
    expect(result).toBe(20); // a is not tracked when flag is false
    
    b.set(200);
    expect(result).toBe(200);
  });

  it('should efficiently update only affected computations', () => {
    const a = signal(1);
    const b = signal(2);
    let computeARuns = 0;
    let computeBRuns = 0;
    
    const doubledA = computed(() => {
      computeARuns++;
      return a.get() * 2;
    });
    
    const doubledB = computed(() => {
      computeBRuns++;
      return b.get() * 2;
    });
    
    // Access both to compute them
    doubledA.get();
    doubledB.get();
    
    expect(computeARuns).toBe(1);
    expect(computeBRuns).toBe(1);
    
    // Update only a
    a.set(5);
    doubledA.get();
    doubledB.get();
    
    expect(computeARuns).toBe(2);
    expect(computeBRuns).toBe(1); // Should not recompute
  });

  it('should support multiple effects on the same signal', () => {
    const count = signal(0);
    const results: number[] = [];
    
    effect(() => {
      results.push(count.get() * 2);
    });
    
    effect(() => {
      results.push(count.get() * 3);
    });
    
    expect(results).toEqual([0, 0]); // Initial runs
    
    count.set(5);
    expect(results).toEqual([0, 0, 10, 15]);
  });
});

describe('Edge Cases', () => {
  it('should handle signals with object values', () => {
    const obj = signal({ count: 0 });
    let result = 0;
    
    effect(() => {
      result = obj.get().count;
    });
    
    expect(result).toBe(0);
    
    // Setting a new object should trigger update
    obj.set({ count: 5 });
    expect(result).toBe(5);
    
    // Setting the same object reference should not trigger
    const current = obj.peek();
    obj.set(current);
    expect(result).toBe(5);
  });

  it('should handle signals with array values', () => {
    const arr = signal([1, 2, 3]);
    let sum = 0;
    
    effect(() => {
      sum = arr.get().reduce((a, b) => a + b, 0);
    });
    
    expect(sum).toBe(6);
    
    arr.set([4, 5, 6]);
    expect(sum).toBe(15);
  });

  it('should handle undefined and null values', () => {
    const nullable = signal<number | null>(null);
    const undefinable = signal<number | undefined>(undefined);
    
    expect(nullable.get()).toBe(null);
    expect(undefinable.get()).toBe(undefined);
    
    nullable.set(5);
    undefinable.set(10);
    
    expect(nullable.get()).toBe(5);
    expect(undefinable.get()).toBe(10);
  });

  it('should handle empty computed functions', () => {
    const empty = computed(() => undefined);
    expect(empty.get()).toBe(undefined);
  });

  it('should handle effects that throw errors', () => {
    const count = signal(0);
    
    expect(() => {
      effect(() => {
        count.get();
        throw new Error('Test error');
      });
    }).toThrow('Test error');
  });
});
