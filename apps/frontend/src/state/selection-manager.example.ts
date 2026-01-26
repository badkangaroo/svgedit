/**
 * Selection Manager Usage Examples
 * 
 * This file demonstrates how to use the SelectionManager in different scenarios.
 */

import { selectionManager } from './selection-manager';
import type { SelectionChangeEvent } from './selection-manager';

// ============================================================================
// Example 1: Basic Selection Operations
// ============================================================================

function basicSelectionExample() {
  console.log('=== Basic Selection Example ===');
  
  // Select a single element
  selectionManager.select(['rect1']);
  console.log('Selected:', Array.from(selectionManager.getSelectedIds()));
  // Output: ['rect1']
  
  // Add more elements to selection
  selectionManager.addToSelection(['circle1', 'path1']);
  console.log('Selected:', Array.from(selectionManager.getSelectedIds()));
  // Output: ['rect1', 'circle1', 'path1']
  
  // Remove an element from selection
  selectionManager.removeFromSelection(['circle1']);
  console.log('Selected:', Array.from(selectionManager.getSelectedIds()));
  // Output: ['rect1', 'path1']
  
  // Toggle selection
  selectionManager.toggleSelection('rect1'); // Removes rect1
  selectionManager.toggleSelection('ellipse1'); // Adds ellipse1
  console.log('Selected:', Array.from(selectionManager.getSelectedIds()));
  // Output: ['path1', 'ellipse1']
  
  // Clear all selections
  selectionManager.clearSelection();
  console.log('Has selection:', selectionManager.hasSelection());
  // Output: false
}

// ============================================================================
// Example 2: Registering View Sync Callbacks
// ============================================================================

function registerViewCallbacksExample() {
  console.log('=== Register View Callbacks Example ===');
  
  // Register callbacks for all views
  selectionManager.registerSyncCallbacks({
    onCanvasSync: (event: SelectionChangeEvent) => {
      console.log('Canvas sync:', event.selectedIds.size, 'elements');
      // Update canvas visual indicators
      event.selectedElements.forEach(element => {
        element.classList.add('selected');
        // Add selection outline, handles, etc.
      });
    },
    
    onHierarchySync: (event: SelectionChangeEvent) => {
      console.log('Hierarchy sync:', event.selectedIds.size, 'nodes');
      // Update hierarchy panel highlights
      event.selectedIds.forEach(id => {
        const node = document.querySelector(`[data-node-id="${id}"]`);
        node?.classList.add('selected');
      });
    },
    
    onRawSVGSync: (event: SelectionChangeEvent) => {
      console.log('Raw SVG sync:', event.selectedIds.size, 'elements');
      // Update text selection in raw SVG editor
      // This would typically highlight the corresponding SVG text
    },
    
    onInspectorSync: (event: SelectionChangeEvent) => {
      console.log('Inspector sync:', event.selectedIds.size, 'elements');
      // Update attribute inspector
      if (event.selectedElements.length === 1) {
        // Show attributes for single selection
        const element = event.selectedElements[0];
        displayAttributes(element);
      } else if (event.selectedElements.length > 1) {
        // Show common attributes for multi-selection
        displayCommonAttributes(event.selectedElements);
      } else {
        // Clear inspector
        clearInspector();
      }
    },
  });
  
  // Now when selection changes, all views will be automatically updated
  selectionManager.select(['rect1', 'circle1']);
}

// ============================================================================
// Example 3: Canvas Component Integration
// ============================================================================

class CanvasComponent {
  private selectedElements: Set<SVGElement> = new Set();
  
  constructor() {
    // Register canvas sync callback
    selectionManager.registerSyncCallbacks({
      onCanvasSync: this.handleSelectionChange.bind(this),
    });
    
    // Set up canvas click handler
    this.setupClickHandler();
  }
  
  private handleSelectionChange(event: SelectionChangeEvent): void {
    // Clear previous selection visuals
    this.selectedElements.forEach(el => {
      el.classList.remove('selected');
      this.removeSelectionHandles(el);
    });
    
    // Update with new selection
    this.selectedElements = new Set(event.selectedElements);
    
    // Add selection visuals
    this.selectedElements.forEach(el => {
      el.classList.add('selected');
      this.addSelectionHandles(el);
    });
  }
  
  private setupClickHandler(): void {
    const canvas = document.getElementById('canvas');
    canvas?.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as SVGElement;
      
      if (target.id) {
        if (e.ctrlKey || e.metaKey) {
          // Multi-select with Ctrl/Cmd
          selectionManager.toggleSelection(target.id);
        } else {
          // Single select
          selectionManager.select([target.id]);
        }
      } else {
        // Click on empty space - clear selection
        selectionManager.clearSelection();
      }
    });
  }
  
  private addSelectionHandles(element: SVGElement): void {
    // Add visual selection handles (resize, rotate, etc.)
    console.log('Adding handles to', element.id);
  }
  
  private removeSelectionHandles(element: SVGElement): void {
    // Remove visual selection handles
    console.log('Removing handles from', element.id);
  }
}

// ============================================================================
// Example 4: Hierarchy Panel Integration
// ============================================================================

class HierarchyPanelComponent {
  constructor() {
    // Register hierarchy sync callback
    selectionManager.registerSyncCallbacks({
      onHierarchySync: this.handleSelectionChange.bind(this),
    });
    
    // Set up node click handler
    this.setupNodeClickHandler();
  }
  
  private handleSelectionChange(event: SelectionChangeEvent): void {
    // Clear previous highlights
    document.querySelectorAll('.hierarchy-node.selected').forEach(node => {
      node.classList.remove('selected');
    });
    
    // Add highlights to selected nodes
    event.selectedIds.forEach(id => {
      const node = document.querySelector(`[data-node-id="${id}"]`);
      node?.classList.add('selected');
      
      // Scroll into view if needed
      node?.scrollIntoView({ block: 'nearest' });
    });
  }
  
  private setupNodeClickHandler(): void {
    const hierarchy = document.getElementById('hierarchy-panel');
    hierarchy?.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const nodeElement = target.closest('[data-node-id]') as HTMLElement;
      
      if (nodeElement) {
        const nodeId = nodeElement.dataset.nodeId!;
        
        if (e.ctrlKey || e.metaKey) {
          // Multi-select with Ctrl/Cmd
          selectionManager.toggleSelection(nodeId);
        } else {
          // Single select
          selectionManager.select([nodeId]);
        }
      }
    });
  }
}

// ============================================================================
// Example 5: Attribute Inspector Integration
// ============================================================================

class AttributeInspectorComponent {
  private inspectorElement: HTMLElement;
  
  constructor() {
    this.inspectorElement = document.getElementById('attribute-inspector')!;
    
    // Register inspector sync callback
    selectionManager.registerSyncCallbacks({
      onInspectorSync: this.handleSelectionChange.bind(this),
    });
  }
  
  private handleSelectionChange(event: SelectionChangeEvent): void {
    // Clear inspector
    this.inspectorElement.innerHTML = '';
    
    if (event.selectedElements.length === 0) {
      // No selection
      this.inspectorElement.innerHTML = '<p>No element selected</p>';
    } else if (event.selectedElements.length === 1) {
      // Single selection - show all attributes
      this.displaySingleElementAttributes(event.selectedElements[0]);
    } else {
      // Multi-selection - show common attributes
      this.displayMultiElementAttributes(event.selectedElements);
    }
  }
  
  private displaySingleElementAttributes(element: SVGElement): void {
    const attributes = Array.from(element.attributes);
    
    const html = `
      <h3>${element.tagName}</h3>
      <div class="attributes">
        ${attributes.map(attr => `
          <div class="attribute">
            <label>${attr.name}</label>
            <input 
              type="text" 
              value="${attr.value}"
              data-attr="${attr.name}"
              data-element-id="${element.id}"
            />
          </div>
        `).join('')}
      </div>
    `;
    
    this.inspectorElement.innerHTML = html;
    
    // Set up attribute change handlers
    this.setupAttributeChangeHandlers();
  }
  
  private displayMultiElementAttributes(elements: SVGElement[]): void {
    this.inspectorElement.innerHTML = `
      <h3>Multiple Elements (${elements.length})</h3>
      <p>Common attributes would be shown here</p>
    `;
  }
  
  private setupAttributeChangeHandlers(): void {
    const inputs = this.inspectorElement.querySelectorAll('input[data-attr]');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const attrName = target.dataset.attr!;
        const elementId = target.dataset.elementId!;
        const newValue = target.value;
        
        // Update the element attribute
        const element = document.getElementById(elementId);
        if (element) {
          element.setAttribute(attrName, newValue);
          // This would typically go through a command system for undo/redo
        }
      });
    });
  }
}

// ============================================================================
// Example 6: Query Selection State
// ============================================================================

function querySelectionExample() {
  console.log('=== Query Selection Example ===');
  
  // Select some elements
  selectionManager.select(['rect1', 'circle1', 'path1']);
  
  // Check if anything is selected
  console.log('Has selection:', selectionManager.hasSelection());
  // Output: true
  
  // Get selection count
  console.log('Selection count:', selectionManager.getSelectionCount());
  // Output: 3
  
  // Get selected IDs
  const ids = selectionManager.getSelectedIds();
  console.log('Selected IDs:', Array.from(ids));
  // Output: ['rect1', 'circle1', 'path1']
  
  // Get selected elements (from document)
  const elements = selectionManager.getSelectedElements();
  console.log('Selected elements:', elements.map(el => el.tagName));
  // Output: ['rect', 'circle', 'path']
  
  // Get selected nodes (from document tree)
  const nodes = selectionManager.getSelectedNodes();
  console.log('Selected nodes:', nodes.map(node => node.tagName));
  // Output: ['rect', 'circle', 'path']
}

// ============================================================================
// Example 7: Manual Sync (Advanced)
// ============================================================================

function manualSyncExample() {
  console.log('=== Manual Sync Example ===');
  
  // In most cases, sync happens automatically
  // But you can manually trigger sync if needed
  
  // Sync only to canvas
  selectionManager.syncToCanvas();
  
  // Sync only to hierarchy
  selectionManager.syncToHierarchy();
  
  // Sync only to raw SVG
  selectionManager.syncToRawSVG();
  
  // Sync only to inspector
  selectionManager.syncToInspector();
  
  // Sync to all views
  selectionManager.syncToAllViews();
}

// ============================================================================
// Helper Functions (for examples)
// ============================================================================

function displayAttributes(element: SVGElement): void {
  console.log('Displaying attributes for', element.id);
}

function displayCommonAttributes(elements: SVGElement[]): void {
  console.log('Displaying common attributes for', elements.length, 'elements');
}

function clearInspector(): void {
  console.log('Clearing inspector');
}

// ============================================================================
// Run Examples
// ============================================================================

export function runSelectionManagerExamples() {
  console.log('\n=== Selection Manager Examples ===\n');
  
  basicSelectionExample();
  console.log('\n');
  
  registerViewCallbacksExample();
  console.log('\n');
  
  querySelectionExample();
  console.log('\n');
  
  manualSyncExample();
  console.log('\n');
  
  // Component examples would be instantiated in the actual app
  // const canvas = new CanvasComponent();
  // const hierarchy = new HierarchyPanelComponent();
  // const inspector = new AttributeInspectorComponent();
}

// Uncomment to run examples
// runSelectionManagerExamples();
