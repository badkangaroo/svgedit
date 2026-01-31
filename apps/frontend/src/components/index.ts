/**
 * Components Index
 * 
 * Exports all Web Components for the SVG Editor.
 * Importing this file will register all custom elements.
 */

// Import components to register them
import './svg-editor-app';
import './svg-canvas';
import './svg-hierarchy-panel';
import './svg-raw-panel';
import './svg-attribute-inspector';
import './svg-tool-palette';

// Export component classes for testing and type checking
export { SVGEditorApp } from './svg-editor-app';
export { SVGCanvas } from './svg-canvas';
export { SVGHierarchyPanel } from './svg-hierarchy-panel';
export { SVGRawPanel } from './svg-raw-panel';
export { SVGAttributeInspector } from './svg-attribute-inspector';
export { SVGToolPalette, toolPaletteState } from './svg-tool-palette';
export type { ToolType } from '../types';
