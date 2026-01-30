# Implementation Plan: Frontend SVG Editor

## Overview

This implementation plan breaks down the Frontend SVG Editor into incremental, testable steps organized by the four sprints outlined in the requirements. Each task builds on previous work, with checkpoints to ensure stability and correctness. The implementation uses Web Components, reactive signals, and TypeScript.

## Tasks

### Sprint 1: Basic UI Framework and Theming

- [x] 1. Set up project structure and build configuration
  - Create TypeScript project with Web Components support
  - Configure build tooling (Vite or similar)
  - Set up testing framework (Vitest + fast-check for property tests)
  - Create directory structure for components, state, and utilities
  - _Requirements: Foundation for all requirements_

- [x] 2. Implement reactive signal system
  - [x] 2.1 Create signal primitives (signal, computed, effect)
    - Implement core reactive primitives for state management
    - Support fine-grained reactivity to minimize re-renders
    - _Requirements: Foundation for 3.1-3.5, 4.1-4.4_
  
  - [ ]* 2.2 Write property tests for signal reactivity
    - **Property: Signal updates propagate to all subscribers**
    - **Validates: State management foundation**

- [x] 3. Create app shell and layout system
  - [x] 3.1 Implement root app component with panel layout
    - Create `<svg-editor-app>` component with menu, canvas, hierarchy, inspector, and tools
    - Implement CSS Grid layout for panel arrangement
    - Add panel dividers with drag-to-resize functionality
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 3.2 Write property test for panel resize
    - **Property 30: Panel resize updates dimensions**
    - **Validates: Requirements 1.2**
  
  - [x] 3.3 Implement panel layout persistence
    - Save layout configuration to local storage on changes
    - Load layout configuration on app initialization
    - _Requirements: 1.3, 1.4_
  
  - [ ]* 3.4 Write property test for layout persistence
    - **Property 2: Panel layout persistence round-trip**
    - **Validates: Requirements 1.3, 1.4**
  
  - [ ]* 3.5 Write property test for viewport resize
    - **Property 31: Viewport resize maintains usability**
    - **Validates: Requirements 1.5**

- [x] 4. Implement theme system
  - [x] 4.1 Create theme definitions and CSS custom properties
    - Define light and dark theme color palettes
    - Ensure WCAG 2.1 AA contrast ratios (4.5:1 for body text)
    - Create CSS custom properties for all theme colors
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 4.2 Write property test for theme contrast compliance
    - **Property 4: Theme contrast compliance**
    - **Validates: Requirements 2.3**
  
  - [x] 4.3 Implement theme toggle and application
    - Create theme toggle control in menu bar
    - Apply theme changes to all components via CSS custom properties
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 4.4 Write property test for theme propagation
    - **Property 5: Theme propagation**
    - **Validates: Requirements 2.2**
  
  - [x] 4.5 Implement theme persistence
    - Save theme preference to local storage
    - Load and apply saved theme on app initialization
    - _Requirements: 2.4, 2.5_
  
  - [ ]* 4.6 Write property test for theme persistence
    - **Property 3: Theme persistence round-trip**
    - **Validates: Requirements 2.4, 2.5**

- [x] 5. Sprint 1 Checkpoint
  - Verify editor shell displays all panels (menu, canvas, hierarchy, inspector, tools)
  - Verify theme toggle switches between light and dark modes
  - Verify contrast ratios meet 4.5:1 for body text
  - Run all tests and ensure they pass
  - Ask the user if questions arise

### Sprint 2: View Coordination Across Panels

- [x] 6. Implement SVG document state management
  - [x] 6.1 Create document state model
    - Define DocumentNode interface and SVG document state
    - Create signals for document, selection, and raw SVG text
    - Implement state update functions
    - _Requirements: 3.1-3.5, 4.1_
  
  - [x] 6.2 Implement SVG parser
    - Create parser to convert SVG text to DocumentNode tree
    - Use DOMParser for initial parsing
    - Assign unique IDs to all elements
    - Return parse errors with line/column information
    - _Requirements: 5.1, 5.2, 11.2_
  
  - [ ]* 6.3 Write property test for parse error reporting
    - **Property 8: SVG parse error reporting**
    - **Validates: Requirements 5.2, 15.1**
  
  - [x] 6.4 Implement SVG serializer
    - Create serializer to convert document tree to SVG text
    - Format with proper indentation
    - Clean up editor-specific attributes
    - _Requirements: 12.4_
  
  - [ ]* 6.5 Write property test for serialization round-trip
    - **Property 22: SVG serialization round-trip**
    - **Validates: Requirements 12.4**

- [x] 7. Implement selection manager
  - [x] 7.1 Create selection manager with cross-view sync
    - Implement SelectionManager class with signal-based selection state
    - Create methods for select, addToSelection, clearSelection
    - Implement sync methods for canvas, hierarchy, raw SVG, and inspector
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [ ]* 7.2 Write property test for cross-view selection sync
    - **Property 1: Cross-view selection synchronization**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

- [x] 8. Implement canvas component
  - [x] 8.1 Create canvas component with SVG rendering
    - Build `<svg-canvas>` component that renders SVG document
    - Subscribe to document state signal for updates
    - Implement selection visual indicators (outlines, handles)
    - Handle mouse events for selection
    - _Requirements: 1.1, 3.1_
  
  - [x] 8.2 Wire canvas selection to selection manager
    - Connect canvas click events to selection manager
    - Update canvas visuals when selection changes
    - Support multi-select with Ctrl/Cmd key
    - _Requirements: 3.1, 3.5_

- [x] 9. Implement hierarchy panel component
  - [x] 9.1 Create hierarchy panel with tree view
    - Build `<svg-hierarchy-panel>` component displaying document tree
    - Subscribe to document state signal for updates
    - Implement expand/collapse functionality
    - Highlight selected nodes
    - _Requirements: 1.1, 3.2_
  
  - [x] 9.2 Implement virtual scrolling for large documents
    - Add virtual scrolling when node count exceeds 1000
    - Render only visible nodes for performance
    - _Requirements: 13.3_
  
  - [x] 9.3 Wire hierarchy selection to selection manager
    - Connect node click events to selection manager
    - Update hierarchy highlights when selection changes
    - _Requirements: 3.2_

- [x] 10. Implement raw SVG panel component
  - [x] 10.1 Create raw SVG panel with text editor
    - Build `<svg-raw-panel>` component with textarea or code editor
    - Subscribe to document state signal to display SVG text
    - Implement syntax highlighting (optional enhancement)
    - _Requirements: 1.1, 5.1_
  
  - [x] 10.2 Implement debounced parsing
    - Add 300ms debounce to text input
    - Parse SVG and update document state on debounce completion
    - Display parse errors inline with line/column info
    - _Requirements: 5.1, 5.2, 13.4_
  
  - [ ]* 10.3 Write property test for invalid SVG state preservation
    - **Property 9: Invalid SVG state preservation**
    - **Validates: Requirements 5.3**
  
  - [x] 10.4 Implement rollback mechanism
    - Add rollback button to revert to last valid state
    - Maintain snapshot of last valid document state
    - _Requirements: 5.4_
  
  - [ ]* 10.5 Write property test for successful parse view sync
    - **Property 10: Successful parse view synchronization**
    - **Validates: Requirements 5.5**
  
  - [x] 10.6 Wire raw SVG selection to selection manager
    - Detect element selection from cursor position in text
    - Update text selection when selection changes from other views
    - _Requirements: 3.3_

- [x] 11. Implement attribute inspector component
  - [x] 11.1 Create attribute inspector with dynamic forms
    - Build `<svg-attribute-inspector>` component
    - Subscribe to selection state signal
    - Display all attributes of selected element
    - Generate appropriate input controls (text, number, color, etc.)
    - _Requirements: 1.1, 4.1_
  
  - [ ]* 11.2 Write property test for attribute display completeness
    - **Property 6: Attribute display completeness**
    - **Validates: Requirements 4.1**
  
  - [x] 11.3 Implement attribute editing and validation
    - Handle attribute value changes from input controls
    - Validate attribute values before applying
    - Display validation errors inline
    - Update document state on valid changes
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [ ]* 11.4 Write property test for invalid attribute rejection
    - **Property 7: Invalid attribute rejection**
    - **Validates: Requirements 4.4**
  
  - [ ]* 11.5 Write property test for attribute validation error feedback
    - **Property 27: Attribute validation error feedback**
    - **Validates: Requirements 15.3**

- [x] 12. Sprint 2 Checkpoint
  - Verify selection syncs across canvas, hierarchy, raw SVG, and inspector
  - Verify attribute edits update raw SVG text within 200ms for 1k nodes
  - Verify raw SVG edits re-parse with error display and rollback
  - Run all tests and ensure they pass
  - Ask the user if questions arise

### Sprint 3: Core Editing Flows

- [x] 13. Implement history manager for undo/redo
  - [x] 13.1 Create history manager with undo/redo stacks
    - Implement HistoryManager class with undo and redo stacks
    - Create Operation interface with undo/redo functions
    - Maintain at least 50 operations in history
    - _Requirements: 9.1, 9.5_
  
  - [ ]* 13.2 Write property test for undo history capacity
    - **Property 20: Undo history capacity**
    - **Validates: Requirements 9.5**
  
  - [x] 13.3 Implement undo and redo functionality
    - Create undo() and redo() methods
    - Update all views after undo/redo
    - _Requirements: 9.2, 9.3_
  
  - [ ]* 13.4 Write property test for undo-redo round-trip
    - **Property 19: Undo-redo round-trip**
    - **Validates: Requirements 9.2, 9.3**

- [x] 14. Implement tool palette and primitive creation
  - [x] 14.1 Create tool palette component
    - Build `<svg-tool-palette>` component with tool buttons
    - Implement tool selection state
    - Display active tool indicator
    - _Requirements: 1.1, 6.1_
  
  - [x] 14.2 Implement primitive creation tools
    - Create tools for rectangle, circle, ellipse, line, path, text, group
    - Handle canvas mouse events to create primitives
    - Assign default attributes to new primitives
    - Add new elements to document state
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [ ]* 14.3 Write property test for primitive creation
    - **Property 11: Primitive creation updates all views**
    - **Validates: Requirements 6.2, 6.3**
  
  - [ ]* 14.4 Write property test for primitive default attributes
    - **Property 12: Primitive default attributes**
    - **Validates: Requirements 6.4**
  
  - [ ]* 14.5 Write property test for primitive auto-selection
    - **Property 13: Primitive creation auto-selection**
    - **Validates: Requirements 6.5**

- [x] 15. Implement transform engine for element manipulation
  - [x] 15.1 Create transform engine for move operations
    - Implement TransformEngine class with move() method
    - Handle single and multi-element movement
    - Update element position or transform attributes
    - Return Operation for undo/redo
    - _Requirements: 7.1, 7.4_
  
  - [ ]* 15.2 Write property test for element position update
    - **Property 14: Element position update**
    - **Validates: Requirements 7.1**
  
  - [ ]* 15.3 Write property test for multi-element movement
    - **Property 15: Multi-element movement**
    - **Validates: Requirements 7.4**
  
  - [x] 15.4 Implement canvas drag-to-move interaction
    - Handle mousedown, mousemove, mouseup for dragging
    - Provide visual feedback during drag
    - Finalize position on mouseup and push to undo stack
    - _Requirements: 7.1, 7.3, 7.5_
  
  - [ ]* 15.5 Write property test for operations creating undo entries
    - **Property 16: Operations create undo entries**
    - **Validates: Requirements 7.5, 8.4, 9.1**

- [x] 16. Implement element deletion
  - [x] 16.1 Create delete operation
    - Implement delete functionality in transform engine or state manager
    - Remove elements from document state
    - Support single and multi-element deletion
    - Push operation to undo stack
    - _Requirements: 8.1, 8.2, 8.4, 8.5_
  
  - [ ]* 16.2 Write property test for element deletion
    - **Property 17: Element deletion removes from document**
    - **Validates: Requirements 8.1, 8.2**
  
  - [ ]* 16.3 Write property test for multi-element deletion
    - **Property 18: Multi-element deletion**
    - **Validates: Requirements 8.5**

- [x] 17. Implement keyboard shortcuts
  - [x] 17.1 Create keyboard shortcut manager
    - Implement global keyboard event handler
    - Map shortcuts to actions (undo, redo, delete, copy, paste, save)
    - Handle platform differences (Ctrl vs Cmd)
    - _Requirements: 9.4, 10.1, 10.2, 10.3, 10.4, 12.5_
  
  - [ ]* 17.2 Write unit tests for keyboard shortcuts
    - Test undo/redo shortcuts (Ctrl+Z, Ctrl+Shift+Z)
    - Test delete shortcuts (Delete, Backspace)
    - Test selection shortcuts (arrow keys, Tab)
    - Test copy/cut/paste shortcuts
    - Test save shortcut (Ctrl+S)
    - _Requirements: 9.4, 10.1, 10.2, 10.3, 10.4, 12.5_
  
  - [x] 17.3 Create keyboard shortcuts reference panel
    - Build modal or panel displaying all shortcuts
    - Make accessible from menu
    - _Requirements: 10.5_

- [x] 18. Implement file operations
  - [x] 18.1 Create file manager with open functionality
    - Implement FileManager class
    - Add file open dialog in menu
    - Use File System Access API where supported
    - Fall back to file input for unsupported browsers
    - Parse and load SVG file content
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ]* 18.2 Write property test for file load
    - **Property 21: File load parses content**
    - **Validates: Requirements 11.2, 11.5**
  
  - [x] 18.3 Implement save and save-as functionality
    - Add save and save-as options in menu
    - Use File System Access API to save to file handle
    - Fall back to download for unsupported browsers
    - Serialize document to valid SVG markup
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 18.4 Write unit tests for file operations
    - Test file open with File System Access API
    - Test file open fallback with file input
    - Test save with File System Access API
    - Test save fallback with download
    - Test save keyboard shortcut
    - _Requirements: 11.3, 11.4, 12.2, 12.3, 12.5_
  
  - [x] 18.5 Implement new document functionality
    - Add "New" option to file menu
    - Create method to generate blank SVG document with default dimensions (800x600)
    - Check for unsaved changes (isDirty flag) and prompt user for confirmation
    - Clear undo/redo history when creating new document
    - Reset file state (no handle, no name, not dirty)
    - Add keyboard shortcut (Ctrl+N / Cmd+N)
    - _Requirements: 12A.1, 12A.2, 12A.3, 12A.4, 12A.5_
  
  - [ ]* 18.6 Write property test for new document creation
    - **Property 21A: New document creates blank state**
    - **Validates: Requirements 12A.2, 12A.4**
  
  - [ ]* 18.7 Write property test for unsaved changes warning
    - **Property 21B: New document unsaved changes warning**
    - **Validates: Requirements 12A.3**

- [x] 19. Sprint 3 Checkpoint
  - Verify create/move/delete primitives work with undo/redo
  - Verify keyboard shortcuts for selection, delete, undo/redo
  - Verify open/save via browser download and File System Access API
  - Run all tests and ensure they pass
  - Ask the user if questions arise

### Sprint 4: Performance and Stability

- [ ] 20. Implement Web Worker support
  - [x] 20.1 Create Web Worker for SVG parsing
    - Set up worker file for parsing large SVG documents
    - Implement parseInWorker() method in SVGParser
    - Use worker for documents > 1MB
    - _Requirements: 14.1_
  
  - [x] 20.2 Create Web Worker for transformations
    - Set up worker file for complex transformations
    - Implement transform operations in worker
    - Use worker for documents > 5000 nodes
    - _Requirements: 14.2_
  
  - [-] 20.3 Implement progress indicators for workers
    - Display progress UI when workers are processing
    - Update progress percentage during worker operations
    - _Requirements: 14.3_
  
  - [ ]* 20.4 Write property test for worker progress feedback
    - **Property 24: Worker progress feedback**
    - **Validates: Requirements 14.3**
  
  - [ ] 20.5 Implement worker cancellation
    - Add cancel button to progress UI
    - Terminate worker on cancellation
    - Return UI to interactive state
    - _Requirements: 14.4_
  
  - [ ]* 20.6 Write property test for worker cancellation
    - **Property 25: Worker cancellation**
    - **Validates: Requirements 14.4**

- [ ] 21. Implement performance optimizations
  - [x] 21.1 Add loading indicators for long operations
    - Display loading indicator when operations exceed 200ms
    - Use spinner or progress bar
    - _Requirements: 13.5_
  
  - [ ]* 21.2 Write property test for long operation indicators
    - **Property 23: Long operation progress indicator**
    - **Validates: Requirements 13.5**
  
  - [x] 21.3 Optimize selection updates for large documents
    - Implement efficient selection update algorithms
    - Use requestAnimationFrame for visual updates
    - Batch DOM updates
    - _Requirements: 13.1_
  
  - [x] 21.4 Optimize attribute updates for large documents
    - Implement efficient attribute update algorithms
    - Debounce rapid attribute changes
    - _Requirements: 13.2_

- [ ] 22. Implement comprehensive error handling
  - [ ] 22.1 Add global error handler
    - Catch unhandled exceptions
    - Display error notifications to user
    - Log errors to console
    - Maintain application stability
    - _Requirements: 15.4, 15.5_
  
  - [ ]* 22.2 Write property test for error logging
    - **Property 28: Error logging**
    - **Validates: Requirements 15.4**
  
  - [ ]* 22.3 Write property test for error recovery
    - **Property 29: Error recovery**
    - **Validates: Requirements 15.5**
  
  - [ ] 22.4 Implement file operation error handling
    - Catch file system errors
    - Display user-friendly error messages
    - Provide retry options
    - _Requirements: 15.2_
  
  - [ ]* 22.5 Write property test for file operation errors
    - **Property 26: File operation error messages**
    - **Validates: Requirements 15.2**

- [ ] 23. Write end-to-end tests
  - [ ]* 23.1 Write E2E test for cross-view synchronization
    - Test selection sync across all views
    - Test attribute edit sync across all views
    - Test raw SVG edit sync across all views
    - _Requirements: 16.1_
  
  - [ ]* 23.2 Write E2E test for undo/redo operations
    - Test undo/redo for create operations
    - Test undo/redo for move operations
    - Test undo/redo for delete operations
    - Test undo/redo for attribute changes
    - _Requirements: 16.2_
  
  - [ ]* 23.3 Write E2E test for complete editing workflow
    - Test create document → add elements → save → open → verify
    - Test large document performance (5000 nodes)
    - Test error handling and recovery
    - _Requirements: 16.1, 16.2_

- [ ] 24. Sprint 4 Checkpoint and Final Review
  - Verify large SVGs remain interactive (< 300ms selection updates)
  - Verify expensive operations run in workers with progress UI
  - Verify E2E tests cover cross-view sync and undo/redo
  - Run all tests and ensure they pass
  - Perform final code review and cleanup
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints align with the four sprints outlined in the feature description
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- E2E tests validate complete user workflows
- All property tests should run with minimum 100 iterations
