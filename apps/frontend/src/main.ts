/**
 * Main entry point for the SVG Editor application
 * Initializes the app and registers Web Components
 */

import './styles/main.css';

// Import and register components
import './components/svg-editor-app';

console.log('SVG Editor initializing...');

// Load theme preference
const savedTheme = localStorage.getItem('svg-editor-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// The app will be rendered via the <svg-editor-app> custom element in index.html
