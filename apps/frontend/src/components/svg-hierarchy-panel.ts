/**
 * SVG Hierarchy Panel Component
 * 
 * Displays the SVG document structure as a tree view.
 * Subscribes to document state signal for automatic updates.
 * Implements expand/collapse functionality and highlights selected nodes.
 * Implements virtual scrolling for large documents (> 1000 nodes).
 * 
 * Requirements: 1.1, 3.2, 13.3
 */

import { effect } from '../state/signals';
import { documentState } from '../state/document-state';
import { selectionManager } from '../state/selection-manager';
import type { DocumentNode } from '../types';

/**
 * Flattened node representation for virtual scrolling
 */
interface FlatNode {
  node: DocumentNode;
  depth: number;
  index: number;
  isVisible: boolean;
}

/**
 * SVGHierarchyPanel Web Component
 * 
 * Displays the document tree structure with interactive selection.
 * Automatically updates when the document state changes.
 * Uses virtual scrolling for documents with > 1000 nodes.
 */
export class SVGHierarchyPanel extends HTMLElement {
  private treeContainer: HTMLDivElement | null = null;
  private scrollContainer: HTMLDivElement | null = null;
  private disposeEffects: (() => void)[] = [];
  private expandedNodes: Set<string> = new Set();
  
  // Virtual scrolling properties
  private readonly VIRTUALIZATION_THRESHOLD = 1000;
  private readonly NODE_HEIGHT = 28; // Approximate height of each node in pixels
  private readonly BUFFER_SIZE = 10; // Number of extra nodes to render above/below viewport
  private flatNodes: FlatNode[] = [];
  private isVirtualized = false;
  private lastScrollTop = 0;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Expose documentState for testing/debugging
    (this as any)._documentState = documentState;
    
    this.render();
    this.setupEffects();
    this.registerWithSelectionManager();
  }

  disconnectedCallback() {
    this.disposeEffects.forEach(dispose => dispose());
    this.disposeEffects = [];
  }

  /**
   * Render the hierarchy panel component structure
   */
  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          background-color: var(--color-surface);
          color: var(--color-on-surface);
          overflow: hidden;
        }

        .scroll-container {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .hierarchy-container {
          padding: var(--spacing-sm);
          font-family: var(--font-mono, monospace);
          font-size: 13px;
          line-height: 1.6;
          position: relative;
        }

        .hierarchy-header {
          padding: var(--spacing-sm) var(--spacing-md);
          font-weight: 600;
          font-size: 14px;
          border-bottom: 1px solid var(--color-outline);
          margin-bottom: var(--spacing-sm);
          color: var(--color-on-surface);
          position: sticky;
          top: 0;
          background-color: var(--color-surface);
          z-index: 10;
        }

        .virtual-scroll-spacer {
          width: 100%;
        }

        .virtual-scroll-content {
          position: relative;
        }

        .tree-node {
          display: block;
          user-select: none;
        }

        .node-content {
          display: flex;
          align-items: center;
          padding: var(--spacing-xs) var(--spacing-sm);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
          position: relative;
        }

        .node-content:hover {
          background-color: var(--color-surface-variant);
        }

        .node-content.selected {
          background-color: var(--color-primary-container);
          color: var(--color-on-primary-container);
          font-weight: 500;
        }

        .node-content.selected::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background-color: var(--color-primary);
        }

        .expand-toggle {
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: var(--spacing-xs);
          cursor: pointer;
          flex-shrink: 0;
          color: var(--color-on-surface-variant);
          transition: transform var(--transition-fast);
        }

        .expand-toggle.expanded {
          transform: rotate(90deg);
        }

        .expand-toggle.empty {
          visibility: hidden;
        }

        .node-icon {
          width: 16px;
          height: 16px;
          margin-right: var(--spacing-xs);
          flex-shrink: 0;
          opacity: 0.7;
        }

        .node-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .node-tag {
          color: var(--color-primary);
          font-weight: 500;
        }

        .node-id {
          color: var(--color-on-surface-variant);
          margin-left: var(--spacing-xs);
          font-size: 11px;
        }

        .node-children {
          padding-left: var(--spacing-lg);
          display: none;
        }

        .node-children.expanded {
          display: block;
        }

        .empty-state {
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-on-surface-variant);
        }

        .empty-state-icon {
          font-size: 32px;
          margin-bottom: var(--spacing-sm);
          opacity: 0.5;
        }

        .empty-state-text {
          font-size: 14px;
        }

        /* Indentation guides */
        .node-children::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: var(--color-outline-variant, var(--color-outline));
          opacity: 0.3;
        }

        .performance-indicator {
          padding: var(--spacing-xs) var(--spacing-sm);
          background-color: var(--color-primary-container);
          color: var(--color-on-primary-container);
          font-size: 11px;
          text-align: center;
          border-radius: var(--radius-sm);
          margin: var(--spacing-xs) var(--spacing-md);
        }
      </style>

      <div class="scroll-container" id="scroll-container">
        <div class="hierarchy-header">Document Structure</div>
        <div id="debug-log" style="display:none"></div>
        <div class="hierarchy-container" id="tree-container">
          <!-- Tree will be rendered here -->
        </div>
      </div>
    `;

    this.scrollContainer = this.shadowRoot.querySelector('#scroll-container');
    this.treeContainer = this.shadowRoot.querySelector('#tree-container');
    
    // Set up scroll listener for virtual scrolling
    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('scroll', () => {
        this.handleScroll();
      });
    }
  }

  /**
   * Set up reactive effects to respond to state changes
   */
  private setupEffects() {
    // Effect: Update tree when document changes
    const documentEffect = effect(() => {
      try {
        const tree = documentState.documentTree.get();
        this.updateTree(tree);
      } catch (error) {
        console.error('Error updating tree:', error);
      }
    });
    this.disposeEffects.push(documentEffect);

    // Effect: Update selection highlights when selection changes
    const selectionEffect = effect(() => {
      const selectedIds = documentState.selectedIds.get();
      this.updateSelectionHighlights(selectedIds);
    });
    this.disposeEffects.push(selectionEffect);
  }

  /**
   * Update the tree view with new document structure
   */
  private updateTree(tree: DocumentNode[]) {
    // Ensure container exists
    if (!this.treeContainer && this.shadowRoot) {
      this.treeContainer = this.shadowRoot.querySelector('#tree-container');
    }
    
    const debug = this.shadowRoot?.querySelector('#debug-log');
    if (debug) debug.textContent = `Update called. Tree len: ${tree ? tree.length : 'null'}. Container: ${!!this.treeContainer}`;

    this.dataset.lastUpdate = Date.now().toString();
    this.dataset.treeSize = tree.length.toString();
    
    if (!this.treeContainer) return;

    // Clear existing tree
    this.treeContainer.innerHTML = '';

    if (tree.length === 0) {
      // Show empty state
      this.treeContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🌳</div>
          <div class="empty-state-text">No elements in document</div>
        </div>
      `;
      this.isVirtualized = false;
      this.flatNodes = [];
      return;
    }

    // Flatten the tree for virtual scrolling
    this.flatNodes = this.flattenTree(tree);
    const totalNodes = this.flatNodes.length;

    // Determine if we should use virtual scrolling
    this.isVirtualized = totalNodes > this.VIRTUALIZATION_THRESHOLD;

    if (this.isVirtualized) {
      // Show performance indicator
      const indicator = document.createElement('div');
      indicator.classList.add('performance-indicator');
      indicator.textContent = `⚡ Virtual scrolling enabled (${totalNodes} nodes)`;
      this.treeContainer.appendChild(indicator);

      // Render with virtual scrolling
      this.renderVirtualized();
    } else {
      // Render all nodes normally
      tree.forEach(node => {
        const nodeElement = this.createTreeNode(node, 0);
        this.treeContainer!.appendChild(nodeElement);
      });
    }
  }

  /**
   * Flatten the tree structure into a linear array for virtual scrolling
   */
  private flattenTree(nodes: DocumentNode[], depth: number = 0, result: FlatNode[] = []): FlatNode[] {
    nodes.forEach(node => {
      const flatNode: FlatNode = {
        node,
        depth,
        index: result.length,
        isVisible: true,
      };
      result.push(flatNode);

      // Recursively flatten children if node is expanded
      if (node.children.length > 0 && this.expandedNodes.has(node.id)) {
        this.flattenTree(node.children, depth + 1, result);
      }
    });

    return result;
  }

  /**
   * Render virtualized tree (only visible nodes)
   */
  private renderVirtualized() {
    if (!this.treeContainer || !this.scrollContainer) return;

    const totalHeight = this.flatNodes.length * this.NODE_HEIGHT;
    const viewportHeight = this.scrollContainer.clientHeight;
    const scrollTop = this.scrollTop;

    // Calculate visible range with buffer
    const startIndex = Math.max(0, Math.floor(scrollTop / this.NODE_HEIGHT) - this.BUFFER_SIZE);
    const endIndex = Math.min(
      this.flatNodes.length,
      Math.ceil((scrollTop + viewportHeight) / this.NODE_HEIGHT) + this.BUFFER_SIZE
    );

    // Create spacer for total height
    const spacer = document.createElement('div');
    spacer.classList.add('virtual-scroll-spacer');
    spacer.style.height = `${totalHeight}px`;

    // Create content container
    const content = document.createElement('div');
    content.classList.add('virtual-scroll-content');
    content.style.transform = `translateY(${startIndex * this.NODE_HEIGHT}px)`;

    // Render only visible nodes
    for (let i = startIndex; i < endIndex; i++) {
      const flatNode = this.flatNodes[i];
      const nodeElement = this.createFlatTreeNode(flatNode);
      content.appendChild(nodeElement);
    }

    spacer.appendChild(content);
    this.treeContainer.appendChild(spacer);
  }

  /**
   * Handle scroll event for virtual scrolling
   * 
   * Uses requestAnimationFrame to batch scroll updates for better performance.
   */
  private handleScroll() {
    if (!this.scrollContainer || !this.isVirtualized) return;

    this.lastScrollTop = this.scrollContainer.scrollTop;

    // Use requestAnimationFrame to batch scroll updates
    requestAnimationFrame(() => {
      if (this.isVirtualized) {
        const tree = documentState.documentTree.get();
        this.updateTree(tree);
      }
    });
  }

  /**
   * Create a flat tree node element (for virtual scrolling)
   */
  private createFlatTreeNode(flatNode: FlatNode): HTMLElement {
    const { node, depth } = flatNode;
    const nodeElement = document.createElement('div');
    nodeElement.classList.add('tree-node');
    nodeElement.dataset.nodeId = node.id;
    nodeElement.style.paddingLeft = `${depth * 20}px`;

    // Create node content
    const content = document.createElement('div');
    content.classList.add('node-content');
    content.dataset.nodeId = node.id;

    // Expand/collapse toggle
    const toggle = document.createElement('span');
    toggle.classList.add('expand-toggle');
    if (node.children.length === 0) {
      toggle.classList.add('empty');
    } else if (this.expandedNodes.has(node.id)) {
      toggle.classList.add('expanded');
    }
    toggle.innerHTML = '▶';
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNode(node.id);
    });
    content.appendChild(toggle);

    // Node icon
    const icon = document.createElement('span');
    icon.classList.add('node-icon');
    icon.innerHTML = this.getNodeIcon(node.tagName);
    content.appendChild(icon);

    // Node label
    const label = document.createElement('span');
    label.classList.add('node-label');
    
    const tagSpan = document.createElement('span');
    tagSpan.classList.add('node-tag');
    tagSpan.textContent = `<${node.tagName}>`;
    label.appendChild(tagSpan);

    if (node.id) {
      const idSpan = document.createElement('span');
      idSpan.classList.add('node-id');
      idSpan.textContent = `#${node.id}`;
      label.appendChild(idSpan);
    }

    content.appendChild(label);

    // Add click handler for selection
    content.addEventListener('click', (e) => {
      this.handleNodeClick(e as MouseEvent, node.id);
    });

    // Check if node is selected
    const selectedIds = documentState.selectedIds.get();
    if (selectedIds.has(node.id)) {
      content.classList.add('selected');
    }

    nodeElement.appendChild(content);

    return nodeElement;
  }

  /**
   * Create a tree node element for a document node
   */
  private createTreeNode(node: DocumentNode, depth: number): HTMLElement {
    const nodeElement = document.createElement('div');
    nodeElement.classList.add('tree-node');
    nodeElement.dataset.nodeId = node.id;

    // Create node content
    const content = document.createElement('div');
    content.classList.add('node-content');
    content.dataset.nodeId = node.id;

    // Expand/collapse toggle
    const toggle = document.createElement('span');
    toggle.classList.add('expand-toggle');
    if (node.children.length === 0) {
      toggle.classList.add('empty');
    } else if (this.expandedNodes.has(node.id)) {
      toggle.classList.add('expanded');
    }
    toggle.innerHTML = '▶';
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNode(node.id);
    });
    content.appendChild(toggle);

    // Node icon
    const icon = document.createElement('span');
    icon.classList.add('node-icon');
    icon.innerHTML = this.getNodeIcon(node.tagName);
    content.appendChild(icon);

    // Node label
    const label = document.createElement('span');
    label.classList.add('node-label');
    
    const tagSpan = document.createElement('span');
    tagSpan.classList.add('node-tag');
    tagSpan.textContent = `<${node.tagName}>`;
    label.appendChild(tagSpan);

    if (node.id) {
      const idSpan = document.createElement('span');
      idSpan.classList.add('node-id');
      idSpan.textContent = `#${node.id}`;
      label.appendChild(idSpan);
    }

    content.appendChild(label);

    // Add click handler for selection
    content.addEventListener('click', (e) => {
      this.handleNodeClick(e as MouseEvent, node.id);
    });

    // Check if node is selected
    const selectedIds = documentState.selectedIds.get();
    if (selectedIds.has(node.id)) {
      content.classList.add('selected');
    }

    nodeElement.appendChild(content);

    // Create children container
    if (node.children.length > 0) {
      const childrenContainer = document.createElement('div');
      childrenContainer.classList.add('node-children');
      if (this.expandedNodes.has(node.id)) {
        childrenContainer.classList.add('expanded');
      }

      node.children.forEach(child => {
        const childElement = this.createTreeNode(child, depth + 1);
        childrenContainer.appendChild(childElement);
      });

      nodeElement.appendChild(childrenContainer);
    }

    return nodeElement;
  }

  /**
   * Get icon for a node based on its tag name
   */
  private getNodeIcon(tagName: string): string {
    const icons: Record<string, string> = {
      'svg': '📄',
      'g': '📁',
      'rect': '▭',
      'circle': '⭕',
      'ellipse': '⬭',
      'line': '─',
      'polyline': '〰',
      'polygon': '⬡',
      'path': '✏️',
      'text': '📝',
      'image': '🖼️',
      'defs': '📦',
      'use': '🔗',
      'symbol': '🔣',
    };

    return icons[tagName.toLowerCase()] || '•';
  }

  /**
   * Toggle expand/collapse state of a node
   */
  private toggleNode(nodeId: string) {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }

    // Update the tree display
    const tree = documentState.documentTree.get();
    this.updateTree(tree);
  }

  /**
   * Handle node click for selection
   */
  private handleNodeClick(event: MouseEvent, nodeId: string) {
    event.stopPropagation();

    // Handle multi-select with Ctrl/Cmd key
    if (event.ctrlKey || event.metaKey) {
      selectionManager.toggleSelection(nodeId);
    } else {
      selectionManager.select([nodeId]);
    }
  }

  /**
   * Update selection highlights in the tree
   * 
   * Optimized for large documents:
   * - Uses classList operations in batch
   * - Minimizes DOM queries with caching
   * - Batches parent node expansion to avoid multiple tree updates
   */
  private updateSelectionHighlights(selectedIds: Set<string>) {
    if (!this.treeContainer) return;

    // Batch DOM operations for better performance
    const allNodes = this.treeContainer.querySelectorAll('.node-content');
    const selectedIdsArray = Array.from(selectedIds);
    
    // First pass: Remove all selection highlights
    // Use a single batch operation
    allNodes.forEach(node => {
      node.classList.remove('selected');
    });

    // Second pass: Add selection highlights to selected nodes
    // Build a map for O(1) lookups instead of repeated querySelector calls
    const nodeMap = new Map<string, Element>();
    allNodes.forEach(node => {
      const nodeId = node.getAttribute('data-node-id');
      if (nodeId) {
        nodeMap.set(nodeId, node);
      }
    });

    // Apply selection highlights using the map
    selectedIdsArray.forEach(id => {
      const node = nodeMap.get(id);
      if (node) {
        node.classList.add('selected');
      }
    });

    // Batch parent node expansion - collect all parent IDs first
    const tree = documentState.documentTree.get();
    const allParentIds = new Set<string>();
    selectedIdsArray.forEach(id => {
      const parentIds = this.findParentNodes(id, tree);
      parentIds.forEach(parentId => allParentIds.add(parentId));
    });

    // Expand all parent nodes at once
    let needsUpdate = false;
    allParentIds.forEach(parentId => {
      if (!this.expandedNodes.has(parentId)) {
        this.expandedNodes.add(parentId);
        needsUpdate = true;
      }
    });

    // Only update tree once if needed and not in virtual scrolling mode
    if (needsUpdate && !this.isVirtualized) {
      this.updateTree(tree);
    }

    // If using virtual scrolling, scroll to first selected node
    if (this.isVirtualized && selectedIds.size > 0 && this.scrollContainer) {
      const firstSelectedId = selectedIdsArray[0];
      this.scrollToNode(firstSelectedId);
    }
  }

  /**
   * Scroll to a specific node (for virtual scrolling)
   */
  private scrollToNode(nodeId: string) {
    if (!this.scrollContainer || !this.isVirtualized) return;

    const nodeIndex = this.flatNodes.findIndex(fn => fn.node.id === nodeId);
    if (nodeIndex === -1) return;

    const nodeTop = nodeIndex * this.NODE_HEIGHT;
    const viewportHeight = this.scrollContainer.clientHeight;
    const currentScroll = this.scrollContainer.scrollTop;

    // Only scroll if node is not visible
    if (nodeTop < currentScroll || nodeTop > currentScroll + viewportHeight - this.NODE_HEIGHT) {
      this.scrollContainer.scrollTop = nodeTop - viewportHeight / 2;
    }
  }

  /**
   * Expand parent nodes to make a node visible
   * 
   * Optimized to avoid unnecessary tree updates.
   */
  private expandParentNodes(nodeId: string) {
    const tree = documentState.documentTree.get();
    const parentIds = this.findParentNodes(nodeId, tree);
    
    let needsUpdate = false;
    parentIds.forEach(parentId => {
      if (!this.expandedNodes.has(parentId)) {
        this.expandedNodes.add(parentId);
        needsUpdate = true;
      }
    });

    // Only update tree if we actually expanded new nodes
    // AND we're not in virtual scrolling mode (which handles this differently)
    if (needsUpdate && !this.isVirtualized) {
      this.updateTree(tree);
    }
  }

  /**
   * Find all parent node IDs for a given node
   */
  private findParentNodes(nodeId: string, tree: DocumentNode[], parents: string[] = []): string[] {
    for (const node of tree) {
      if (node.id === nodeId) {
        return parents;
      }
      
      if (node.children.length > 0) {
        const result = this.findParentNodes(nodeId, node.children, [...parents, node.id]);
        if (result.length > parents.length || result[result.length - 1] !== node.id) {
          return result;
        }
      }
    }
    
    return parents;
  }

  /**
   * Register hierarchy sync callback with selection manager
   */
  private registerWithSelectionManager() {
    selectionManager.registerSyncCallbacks({
      onHierarchySync: (event) => {
        // Hierarchy sync is handled automatically through reactive effects
        // This callback is here for consistency with the architecture
      },
    });
  }

  /**
   * Expand all nodes in the tree
   */
  public expandAll() {
    const tree = documentState.documentTree.get();
    this.expandAllNodes(tree);
    this.updateTree(tree);
  }

  /**
   * Recursively expand all nodes
   */
  private expandAllNodes(nodes: DocumentNode[]) {
    nodes.forEach(node => {
      if (node.children.length > 0) {
        this.expandedNodes.add(node.id);
        this.expandAllNodes(node.children);
      }
    });
  }

  /**
   * Collapse all nodes in the tree
   */
  public collapseAll() {
    this.expandedNodes.clear();
    const tree = documentState.documentTree.get();
    this.updateTree(tree);
  }

  /**
   * Get the total number of nodes in the tree (for testing)
   */
  public getTotalNodeCount(): number {
    return this.flatNodes.length;
  }

  /**
   * Check if virtual scrolling is enabled (for testing)
   */
  public isVirtualScrollingEnabled(): boolean {
    return this.isVirtualized;
  }

  /**
   * Get the virtualization threshold (for testing)
   */
  public getVirtualizationThreshold(): number {
    return this.VIRTUALIZATION_THRESHOLD;
  }

  /**
   * Force refresh the tree view
   */
  public refresh() {
    const tree = documentState.documentTree.get();
    this.updateTree(tree);
  }
}

// Register the custom element
customElements.define('svg-hierarchy-panel', SVGHierarchyPanel);
