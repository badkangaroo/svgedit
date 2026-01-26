/**
 * Core type definitions for the SVG Editor
 */

/**
 * Document representation
 */
export interface DocumentNode {
  id: string;
  type: string;
  tagName: string;
  attributes: Map<string, string>;
  children: DocumentNode[];
  element: SVGElement;
}

/**
 * Operations for undo/redo
 */
export interface Operation {
  type: 'create' | 'delete' | 'move' | 'attribute' | 'batch';
  timestamp: number;
  undo: () => void;
  redo: () => void;
  description: string;
}

/**
 * Tool definitions
 */
export interface Tool {
  id: string;
  name: string;
  icon: string;
  cursor: string;
  onActivate: () => void;
  onDeactivate: () => void;
  onCanvasMouseDown: (event: MouseEvent) => void;
  onCanvasMouseMove: (event: MouseEvent) => void;
  onCanvasMouseUp: (event: MouseEvent) => void;
}

/**
 * Panel layout configuration
 */
export interface PanelLayout {
  hierarchyWidth: number;
  inspectorWidth: number;
  rawSVGHeight: number;
  hierarchyVisible: boolean;
  inspectorVisible: boolean;
  rawSVGVisible: boolean;
}

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';

/**
 * Tool type identifier
 */
export type ToolType = 'select' | 'rectangle' | 'circle' | 'ellipse' | 'line' | 'path' | 'text' | 'group';

/**
 * Editor state
 */
export interface EditorState {
  // Document state
  svgDocument: SVGElement | null;
  documentTree: DocumentNode[];
  rawSVG: string;
  
  // Selection state
  selectedIds: Set<string>;
  hoveredId: string | null;
  
  // UI state
  activeTool: Tool | null;
  theme: Theme;
  panelLayout: PanelLayout;
  
  // History state
  undoStack: Operation[];
  redoStack: Operation[];
  
  // Performance state
  isProcessing: boolean;
  progressPercent: number;
  
  // File state
  fileHandle: FileSystemFileHandle | null;
  isDirty: boolean;
}

/**
 * Parse result from SVG parser
 */
export interface ParseResult {
  success: boolean;
  document: SVGElement | null;
  tree: DocumentNode[];
  errors: ParseError[];
  serializedSVG?: string; // Optional serialized SVG from worker
}

/**
 * Parse error information
 */
export interface ParseError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  // Virtualization thresholds
  hierarchyVirtualizationThreshold: number; // 1000 nodes
  
  // Debounce delays
  rawSVGParseDelay: number; // 300ms
  attributeUpdateDelay: number; // 100ms
  
  // Worker thresholds
  workerParseThreshold: number; // 1MB file size
  workerTransformThreshold: number; // 5000 nodes
  
  // Performance targets
  selectionUpdateTarget: number; // 50ms for < 1000 nodes, 200ms for < 5000 nodes
  attributeUpdateTarget: number; // 100ms
  rawSVGUpdateTarget: number; // 200ms
}

/**
 * File state for file operations
 */
export interface FileState {
  handle: FileSystemFileHandle | null;
  name: string;
  isDirty: boolean;
  lastSaved: Date | null;
}
