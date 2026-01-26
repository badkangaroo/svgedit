# Frontend Editor Setup Guide

This document describes the project structure and setup for the SVG Editor frontend application.

## Project Overview

The frontend editor is a web-based SVG editing application built with:
- **Web Components** - Custom Elements v1 API for component architecture
- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling and dev server
- **Vitest** - Unit and property-based testing with fast-check

## Directory Structure

```
apps/frontend/
├── src/
│   ├── components/     # Web Components (canvas, panels, tools)
│   ├── state/          # Reactive signal-based state management
│   ├── utils/          # Utility functions and helpers
│   ├── workers/        # Web Workers for expensive operations
│   ├── styles/         # CSS files for theming and global styles
│   │   └── main.css    # Main stylesheet with theme variables
│   ├── types.ts        # Core type definitions
│   └── main.ts         # Application entry point
├── tests/
│   ├── unit/           # Unit tests for specific examples
│   ├── properties/     # Property-based tests with fast-check
│   ├── e2e/            # End-to-end workflow tests
│   ├── setup.ts        # Test setup and configuration
│   └── vitest.d.ts     # Type definitions for custom matchers
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build configuration
└── vitest.config.ts    # Vitest test configuration
```

## Configuration Files

### package.json
- Defines project dependencies and scripts
- Links to `@svg-edit/core` package using file reference
- Includes dev dependencies for testing and building

### tsconfig.json
- TypeScript compiler configuration
- Targets ES2020 with DOM APIs
- Enables experimental decorators for Web Components
- Includes Vitest globals for testing

### vite.config.ts
- Vite build configuration
- Sets up dev server on port 3000
- Configures path aliases (@/ for src/)
- Includes Vitest test configuration

### vitest.config.ts
- Vitest-specific test configuration
- Uses jsdom environment for DOM testing
- Configures coverage reporting
- Sets up test setup file

## Testing Setup

### Test Configuration
- **Framework**: Vitest with jsdom environment
- **Property Testing**: fast-check with minimum 100 iterations
- **Setup File**: `tests/setup.ts` configures test environment

### Test Mocks
The setup file provides mocks for:
- File System Access API
- localStorage
- requestAnimationFrame

### Custom Matchers
- `toBeWithinRange(floor, ceiling)` - Checks if a number is within a range

### Running Tests
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Theme System

The application uses CSS custom properties for theming:

### Light Theme (Default)
- Background: #ffffff
- Surface: #f5f5f5
- Primary: #1976d2
- Text: #1a1a1a

### Dark Theme
- Background: #121212
- Surface: #1e1e1e
- Primary: #64b5f6
- Text: #e0e0e0

### Contrast Compliance
All themes meet WCAG 2.1 AA contrast ratio requirements:
- Body text: 4.5:1 minimum
- Large text: 3:1 minimum

### Applying Themes
Themes are applied via the `data-theme` attribute on the root element:
```html
<html data-theme="dark">
```

## Type Definitions

Core types are defined in `src/types.ts`:

- **DocumentNode** - SVG document tree structure
- **Operation** - Undo/redo operation interface
- **Tool** - Tool definition for creating primitives
- **PanelLayout** - Panel layout configuration
- **EditorState** - Complete editor state
- **ParseResult** - SVG parser result
- **ParseError** - Parse error information
- **PerformanceConfig** - Performance thresholds
- **FileState** - File operation state

## Development Workflow

### Starting Development
```bash
# Start dev server (opens browser automatically)
npm run dev
```

### Type Checking
```bash
# Check types without emitting files
npm run type-check
```

### Building for Production
```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## Next Steps

The project structure is now ready for implementation. The next tasks are:

1. **Implement reactive signal system** (Task 2)
   - Create signal primitives (signal, computed, effect)
   - Write property tests for signal reactivity

2. **Create app shell and layout system** (Task 3)
   - Implement root app component with panel layout
   - Add panel resizing functionality
   - Implement layout persistence

3. **Implement theme system** (Task 4)
   - Create theme toggle control
   - Verify contrast compliance
   - Implement theme persistence

## Dependencies

### Production Dependencies
- `@svg-edit/core` - Headless SVG manipulation library

### Development Dependencies
- `typescript` - TypeScript compiler
- `vite` - Build tool and dev server
- `vitest` - Test framework
- `@vitest/coverage-v8` - Coverage reporting
- `@vitest/ui` - Test UI
- `fast-check` - Property-based testing
- `jsdom` - DOM implementation for testing

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Progressive Enhancement
- File System Access API with fallback to download
- Web Workers for performance optimization
- Custom Elements v1 API (widely supported)

## Performance Targets

As defined in the design document:

- Selection updates: < 50ms for 1000 nodes, < 200ms for 5000 nodes
- Attribute updates: < 100ms
- Raw SVG parsing: < 200ms
- Worker UI updates: < 50ms after completion

## Accessibility

The application will support:
- Keyboard navigation for all interactive elements
- ARIA labels for tools and panels
- Focus management for modal dialogs
- Screen reader announcements for state changes
- High contrast mode support
- Keyboard shortcuts that don't conflict with screen readers
