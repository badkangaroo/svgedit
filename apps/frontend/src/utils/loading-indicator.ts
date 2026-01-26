/**
 * Loading Indicator Utility
 * 
 * Provides a centralized way to show/hide loading indicators for long operations.
 * Automatically shows indicator after 200ms threshold to avoid flashing for quick operations.
 * 
 * Requirements: 13.5
 */

export type LoadingIndicatorType = 'spinner' | 'progress' | 'inline';

export interface LoadingIndicatorOptions {
  /** Type of loading indicator to show */
  type?: LoadingIndicatorType;
  
  /** Message to display with the indicator */
  message?: string;
  
  /** Delay before showing indicator (default: 200ms) */
  delay?: number;
  
  /** Whether to block user interaction while loading */
  blocking?: boolean;
  
  /** Progress percentage (0-100) for progress type */
  progress?: number;
}

export interface LoadingIndicatorHandle {
  /** Update the loading message */
  updateMessage(message: string): void;
  
  /** Update progress percentage (for progress type) */
  updateProgress(progress: number): void;
  
  /** Hide the loading indicator */
  hide(): void;
}

/**
 * LoadingIndicatorManager manages loading indicators across the application
 */
class LoadingIndicatorManager {
  private activeIndicators = new Map<string, LoadingIndicatorHandle>();
  private indicatorContainer: HTMLElement | null = null;
  private nextId = 0;

  /**
   * Initialize the loading indicator manager
   * Creates the container element if it doesn't exist
   */
  initialize(): void {
    if (this.indicatorContainer) return;

    // Ensure document.body exists
    if (!document.body) {
      // In test environment, body might not be ready yet
      // Try to create it
      if (typeof document !== 'undefined' && document.documentElement) {
        const body = document.createElement('body');
        document.documentElement.appendChild(body);
      } else {
        console.warn('document.body not available, cannot initialize loading indicators');
        return;
      }
    }

    // Create container for loading indicators
    this.indicatorContainer = document.createElement('div');
    this.indicatorContainer.id = 'loading-indicator-container';
    this.indicatorContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(this.indicatorContainer);
  }

  /**
   * Show a loading indicator
   * 
   * @param options Loading indicator options
   * @returns Handle to control the indicator
   */
  show(options: LoadingIndicatorOptions = {}): LoadingIndicatorHandle {
    this.initialize();

    const {
      type = 'spinner',
      message = 'Loading...',
      delay = 200,
      blocking = false,
      progress = 0,
    } = options;

    const id = `indicator-${this.nextId++}`;
    let timeoutId: number | undefined;
    let element: HTMLElement | null = null;
    let isVisible = false;

    // Create the indicator element
    const createIndicator = () => {
      if (!this.indicatorContainer) return;

      element = document.createElement('div');
      element.id = id;
      element.className = `loading-indicator loading-indicator-${type}`;
      
      // Apply styles based on type
      if (blocking) {
        element.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
        `;
      } else {
        element.style.cssText = `
          position: absolute;
          top: 16px;
          right: 16px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-outline);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          pointer-events: auto;
          max-width: 300px;
        `;
      }

      // Create indicator content based on type
      if (type === 'spinner') {
        element.innerHTML = `
          <div class="loading-spinner" style="
            width: 20px;
            height: 20px;
            border: 3px solid var(--color-outline);
            border-radius: 50%;
            border-top-color: var(--color-primary);
            animation: spin 1s linear infinite;
          "></div>
          <span class="loading-message" style="
            color: var(--color-on-surface);
            font-size: 14px;
          ">${message}</span>
        `;
      } else if (type === 'progress') {
        element.innerHTML = `
          <div style="flex: 1;">
            <div class="loading-message" style="
              color: var(--color-on-surface);
              font-size: 14px;
              margin-bottom: var(--spacing-xs);
            ">${message}</div>
            <div class="loading-progress-bar" style="
              width: 100%;
              height: 4px;
              background-color: var(--color-surface-variant);
              border-radius: 2px;
              overflow: hidden;
            ">
              <div class="loading-progress-fill" style="
                width: ${progress}%;
                height: 100%;
                background-color: var(--color-primary);
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>
        `;
      } else if (type === 'inline') {
        element.innerHTML = `
          <div class="loading-spinner" style="
            width: 16px;
            height: 16px;
            border: 2px solid var(--color-outline);
            border-radius: 50%;
            border-top-color: var(--color-primary);
            animation: spin 1s linear infinite;
          "></div>
          <span class="loading-message" style="
            color: var(--color-on-surface);
            font-size: 13px;
          ">${message}</span>
        `;
      }

      // Add spin animation if not already present
      if (!document.getElementById('loading-indicator-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-indicator-styles';
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      this.indicatorContainer.appendChild(element);
      isVisible = true;
    };

    // Show indicator after delay
    if (delay === 0) {
      createIndicator();
    } else {
      timeoutId = setTimeout(() => {
        createIndicator();
      }, delay) as unknown as number;
    }

    // Create handle to control the indicator
    const handle: LoadingIndicatorHandle = {
      updateMessage: (newMessage: string) => {
        if (element) {
          const messageEl = element.querySelector('.loading-message');
          if (messageEl) {
            messageEl.textContent = newMessage;
          }
        }
      },

      updateProgress: (newProgress: number) => {
        if (element && type === 'progress') {
          const progressFill = element.querySelector('.loading-progress-fill') as HTMLElement;
          if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, newProgress))}%`;
          }
        }
      },

      hide: () => {
        // Clear timeout if indicator hasn't been shown yet
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }

        // Remove element if it was shown
        if (element && element.parentNode) {
          element.remove();
        }

        // Remove from active indicators
        this.activeIndicators.delete(id);
      },
    };

    this.activeIndicators.set(id, handle);
    return handle;
  }

  /**
   * Hide all active loading indicators
   */
  hideAll(): void {
    this.activeIndicators.forEach(handle => handle.hide());
    this.activeIndicators.clear();
  }

  /**
   * Reset the loading indicator manager
   * Clears all indicators and removes the container
   */
  reset(): void {
    this.hideAll();
    if (this.indicatorContainer && this.indicatorContainer.parentNode) {
      this.indicatorContainer.remove();
    }
    this.indicatorContainer = null;
  }

  /**
   * Get the number of active indicators
   */
  getActiveCount(): number {
    return this.activeIndicators.size;
  }
}

/**
 * Global loading indicator manager instance
 */
export const loadingIndicator = new LoadingIndicatorManager();

/**
 * Convenience function to wrap an async operation with a loading indicator
 * 
 * @param operation Async operation to execute
 * @param options Loading indicator options
 * @returns Promise resolving to the operation result
 */
export async function withLoadingIndicator<T>(
  operation: () => Promise<T>,
  options: LoadingIndicatorOptions = {}
): Promise<T> {
  const handle = loadingIndicator.show(options);
  
  try {
    const result = await operation();
    return result;
  } finally {
    handle.hide();
  }
}

/**
 * Decorator to automatically show loading indicator for long operations
 * 
 * @param threshold Time in ms before showing indicator (default: 200ms)
 */
export function withLoading(threshold: number = 200) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let handle: LoadingIndicatorHandle | null = null;

      // Start a timer to show loading indicator after threshold
      const timerId = setTimeout(() => {
        handle = loadingIndicator.show({
          message: `${propertyKey}...`,
          delay: 0, // Already waited threshold
        });
      }, threshold);

      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        clearTimeout(timerId);
        if (handle) {
          handle.hide();
        }
      }
    };

    return descriptor;
  };
}
