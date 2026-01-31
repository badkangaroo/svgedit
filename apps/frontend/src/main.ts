/**
 * Main entry point for the SVG Editor application
 * Initializes the app and registers Web Components
 */

import './styles/main.css';

// Import and register components
import './components/svg-editor-app';
import './components/svg-canvas';
import './components/svg-hierarchy-panel';
import './components/svg-attribute-inspector';
import './components/svg-raw-panel';
import './components/svg-tool-palette';

import { SVGParser } from './utils/svg-parser';
import { documentStateUpdater, documentState } from './state/document-state';
import { selectionManager } from './state/selection-manager';

// Expose internal state for E2E testing
(window as any).SVGParser = SVGParser;
(window as any).documentStateUpdater = documentStateUpdater;
(window as any).documentState = documentState;
(window as any).selectionManager = selectionManager;

console.log('SVG Editor initializing... DEBUG_VERSION_1');

// Load theme preference
const savedTheme = localStorage.getItem('svg-editor-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// The app will be rendered via the <svg-editor-app> custom element in index.html
