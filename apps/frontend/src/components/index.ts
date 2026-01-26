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

// Export component classes for testing and type checking
export { SVGEditorApp } from './svg-editor-app';
export { SVGCanvas } from './svg-canvas';
export { SVGHierarchyPanel } from './svg-hierarchy-panel';
