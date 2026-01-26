# Implementation Plan: Core Engine

## Overview

This implementation plan follows the 4-sprint structure defined in the core package README:
1. Document model foundation (parsing, serialization, stable IDs, round-trip fidelity)
2. Command system and history (execute/undo, history manager, batching)
3. Geometry and transforms (matrices, bounding boxes, path utilities)
4. Performance and indexing (selector queries, hierarchy indexing, benchmarks)

Each sprint builds incrementally on the previous sprint, with property-based tests integrated throughout to catch errors early.

## Tasks

### Sprint 1: Document Model Foundation

- [x] 1. Set up project structure and core types
  - Create TypeScript configuration with strict mode
  - Set up Vitest test framework
  - Install fast-check for property-based testing
  - Define base SVGNode interface and element type discriminated unions
  - Define Result<T, E> type and ErrorCode enum
  - _Requirements: 19.1, 19.2, 19.4_

- [x] 2. Implement SVG parser
  - [x] 2.1 Create XML parsing foundation
    - Parse XML text into a basic tree structure
    - Handle malformed XML with descriptive errors
    - Extract element names, attributes, and hierarchy
    - _Requirements: 1.1, 1.3, 1.4, 1.5_
  
  - [ ]* 2.2 Write property test for XML parsing
    - **Property 1: Complete element preservation**
    - **Property 3: Hierarchy preservation**
    - **Property 4: Attribute preservation**
    - **Validates: Requirements 1.1, 1.3, 1.4**
  
  - [ ]* 2.3 Write property test for parse error handling
    - **Property 5: Parse error handling**
    - **Validates: Requirements 1.5**
  
  - [x] 2.4 Implement stable ID generation
    - Create IDGenerator class with counter-based approach
    - Assign unique IDs to all parsed nodes
    - Build node index (Map<string, SVGNode>)
    - _Requirements: 1.2, 3.1_
  
  - [ ]* 2.5 Write property test for ID uniqueness
    - **Property 2: Unique ID assignment**
    - **Validates: Requirements 1.2, 3.1, 3.4**
  
  - [x] 2.6 Implement deterministic node ordering
    - Ensure consistent ordering based on document order
    - Store children in arrays to preserve order
    - _Requirements: 1.6_
  
  - [ ]* 2.7 Write property test for deterministic parsing
    - **Property 6: Deterministic parsing**
    - **Validates: Requirements 1.6**

- [x] 3. Implement SVG serializer
  - [x] 3.1 Create serialization logic
    - Traverse document tree and generate XML text
    - Format attributes consistently
    - Maintain proper indentation and hierarchy
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 3.2 Write property test for valid serialization
    - **Property 7: Valid serialization**
    - **Validates: Requirements 2.1**
  
  - [ ]* 3.3 Write property test for deterministic serialization
    - **Property 8: Deterministic serialization**
    - **Validates: Requirements 2.2**
  
  - [ ]* 3.4 Write property test for consistent formatting
    - **Property 9: Consistent attribute formatting**
    - **Property 10: Proper XML hierarchy**
    - **Validates: Requirements 2.3, 2.4**

- [x] 4. Implement round-trip fidelity
  - [x] 4.1 Ensure parse-serialize-parse equivalence
    - Test that parsing then serializing then parsing produces equivalent structure
    - Fix any discrepancies in attribute handling or whitespace
    - _Requirements: 2.6_
  
  - [ ]* 4.2 Write property test for round-trip fidelity (CRITICAL)
    - **Property 11: Round-trip fidelity**
    - **Validates: Requirements 2.6**

- [x] 5. Implement document model operations
  - [x] 5.1 Create document query by ID
    - Implement queryById using node index
    - Return node or null if not found
    - _Requirements: 3.3_
  
  - [ ]* 5.2 Write property test for query by ID
    - **Property 13: Query by ID correctness**
    - **Validates: Requirements 3.3**
  
  - [x] 5.3 Create immutable update utilities
    - Implement helper functions for immutable node updates
    - Ensure version counter increments on changes
    - _Requirements: Data Models section_
  
  - [ ]* 5.4 Write unit tests for immutable updates
    - Test that updates return new instances
    - Test that original document is unchanged

- [x] 6. Sprint 1 Checkpoint
  - Ensure all tests pass
  - Verify round-trip fidelity works for various SVG documents
  - Ask the user if questions arise

### Sprint 2: Command System and History

- [ ] 7. Implement base command interface
  - [x] 7.1 Create Command interface and base classes
    - Define Command interface with execute() and undo() methods
    - Define canExecute() and canUndo() validation methods
    - Create CommandError type with error codes
    - _Requirements: 4.3, 5.2_
  
  - [x] 7.2 Implement command validation
    - Add validation logic to prevent invalid commands
    - Return errors without modifying document
    - _Requirements: 4.4_
  
  - [ ]* 7.3 Write property test for invalid commands
    - **Property 15: Invalid commands preserve state**
    - **Validates: Requirements 4.4**

- [ ] 8. Implement CreateElementCommand
  - [x] 8.1 Create command to add new elements
    - Accept element type, attributes, parent ID, and optional insert index
    - Generate stable ID for new element
    - Add element to parent's children array
    - Update document node index
    - _Requirements: 8.1, 8.4_
  
  - [x] 8.2 Implement undo for CreateElementCommand
    - Remove created element from parent
    - Remove from document node index
    - _Requirements: 8.2_
  
  - [ ]* 8.3 Write property test for create command
    - **Property 25: Create element adds node**
    - **Property 26: Create element undo removes node**
    - **Property 27: Create child adds to parent**
    - **Validates: Requirements 8.1, 8.2, 8.4**
  
  - [ ]* 8.4 Write unit tests for create command edge cases
    - Test creating element with invalid parent ID
    - Test creating element at specific index
    - Test creating element with no attributes

- [ ] 9. Implement DeleteElementCommand
  - [x] 9.1 Create command to remove elements
    - Accept node ID to delete
    - Remove node and all children from document
    - Store deleted subtree for undo
    - _Requirements: 9.1, 9.3_
  
  - [x] 9.2 Implement undo for DeleteElementCommand
    - Restore deleted node and children to original position
    - Restore to document node index
    - _Requirements: 9.2, 9.4_
  
  - [ ]* 9.3 Write property test for delete command
    - **Property 28: Delete element removes node**
    - **Property 29: Delete element undo restores node**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
  
  - [ ]* 9.4 Write unit tests for delete command edge cases
    - Test deleting non-existent node
    - Test deleting root node
    - Test deleting node with many children

- [ ] 10. Implement UpdateAttributeCommand
  - [x] 10.1 Create command to modify attributes
    - Accept node ID, attribute name, and new value
    - Store previous value for undo
    - Handle creating new attributes vs updating existing
    - _Requirements: 10.1, 10.3_
  
  - [x] 10.2 Implement undo for UpdateAttributeCommand
    - Restore previous attribute value
    - Remove attribute if it was newly created
    - _Requirements: 10.2, 10.4_
  
  - [ ]* 10.3 Write property test for update command
    - **Property 30: Update attribute modifies value**
    - **Property 31: Update attribute undo restores value**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
  
  - [ ]* 10.4 Write unit tests for update command edge cases
    - Test updating non-existent node
    - Test updating to same value
    - Test creating new attribute

- [ ] 11. Implement command inverse property tests
  - [ ]* 11.1 Write property test for command inverse (CRITICAL)
    - **Property 16: Command inverse property**
    - Test execute then undo restores original state for all command types
    - **Validates: Requirements 5.1**

- [ ] 12. Implement BatchCommand
  - [x] 12.1 Create command to group multiple commands
    - Accept array of sub-commands
    - Execute all sub-commands in order
    - Stop on first failure
    - _Requirements: 7.2, 7.4_
  
  - [x] 12.2 Implement undo for BatchCommand
    - Undo all executed sub-commands in reverse order
    - _Requirements: 7.3_
  
  - [ ]* 12.3 Write property test for batch command
    - **Property 22: Batch execution order**
    - **Property 23: Batch undo order**
    - **Property 24: Batch error handling**
    - **Validates: Requirements 7.2, 7.3, 7.4**
  
  - [ ]* 12.4 Write unit tests for batch command edge cases
    - Test empty batch
    - Test batch with single command
    - Test batch with failing command in middle

- [ ] 13. Implement HistoryManager
  - [x] 13.1 Create history manager with undo/redo stacks
    - Maintain undo stack and redo stack
    - Track current document state
    - Implement execute() method that adds to undo stack
    - _Requirements: 6.1_
  
  - [x] 13.2 Implement undo functionality
    - Pop from undo stack
    - Execute command's undo() method
    - Push to redo stack
    - _Requirements: 6.2, 6.3_
  
  - [x] 13.3 Implement redo functionality
    - Pop from redo stack
    - Re-execute command
    - Push back to undo stack
    - _Requirements: 6.4_
  
  - [x] 13.4 Implement redo invalidation
    - Clear redo stack when new command is executed
    - _Requirements: 6.5_
  
  - [ ]* 13.5 Write property tests for history manager
    - **Property 17: History tracking**
    - **Property 18: Undo behavior**
    - **Property 19: Redo behavior**
    - **Property 20: Redo invalidation**
    - **Property 21: Deterministic replay**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
  
  - [ ]* 13.6 Write unit tests for history manager edge cases
    - Test undo with empty stack
    - Test redo with empty stack
    - Test multiple undo/redo cycles

- [x] 14. Sprint 2 Checkpoint
  - Ensure all command tests pass
  - Verify undo/redo works correctly for all command types
  - Test complex command sequences
  - Ask the user if questions arise

### Sprint 3: Geometry and Transforms

- [ ] 15. Implement matrix transformation utilities
  - [x] 15.1 Create basic matrix operations
    - Implement identity matrix
    - Implement matrix composition (multiply)
    - Implement matrix inverse
    - Implement point transformation
    - _Requirements: 11.1, 11.3, 11.4_
  
  - [ ]* 15.2 Write property test for matrix composition
    - **Property 32: Matrix composition**
    - **Validates: Requirements 11.1**
  
  - [ ]* 15.3 Write property test for matrix inverse
    - **Property 35: Matrix inverse property**
    - **Validates: Requirements 11.4**
  
  - [ ]* 15.4 Write property test for point transformation
    - **Property 34: Matrix point transformation**
    - **Validates: Requirements 11.3**
  
  - [x] 15.5 Implement matrix decomposition
    - Extract translate, rotate, scale, and skew components
    - _Requirements: 11.2_
  
  - [ ]* 15.6 Write property test for matrix decomposition
    - **Property 33: Matrix decomposition**
    - **Validates: Requirements 11.2, 11.5**
  
  - [x] 15.7 Implement matrix creation helpers
    - Create translate(tx, ty) helper
    - Create scale(sx, sy) helper
    - Create rotate(angle) helper
    - _Requirements: 11.1_
  
  - [ ]* 15.8 Write unit tests for matrix edge cases
    - Test singular matrices (no inverse)
    - Test identity matrix operations
    - Test zero scale matrices

- [ ] 16. Implement bounding box calculations
  - [x] 16.1 Create bounding box calculator for basic shapes
    - Implement bbox for rectangles (x, y, width, height)
    - Implement bbox for circles (cx, cy, r)
    - Implement bbox for ellipses
    - Implement bbox for lines
    - _Requirements: 12.1, 12.2_
  
  - [x] 16.2 Implement bounding box for paths
    - Parse path data into commands
    - Calculate bbox by analyzing all path commands
    - Handle curves and arcs
    - _Requirements: 12.3_
  
  - [x] 16.3 Implement bounding box for groups
    - Calculate union of all child bounding boxes
    - Handle empty groups
    - _Requirements: 12.4_
  
  - [x] 16.4 Implement transform-aware bounding boxes
    - Apply transformation matrix to bounding box
    - Transform all four corners and recalculate bbox
    - _Requirements: 12.5_
  
  - [ ]* 16.5 Write property test for bounding box calculation
    - **Property 36: Bounding box calculation**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
  
  - [ ]* 16.6 Write unit tests for bounding box edge cases
    - Test empty groups
    - Test elements with zero dimensions
    - Test heavily transformed elements

- [x] 17. Implement path manipulation utilities
  - [x] 17.1 Create path parser and serializer
    - Create new path.ts module in geometry directory
    - Define PathCommand type for path operations
    - Parse path data string into PathCommand array
    - Serialize PathCommand array back to string
    - Handle all SVG path commands (M, L, C, Q, A, Z, etc.)
    - _Requirements: 13.4_
  
  - [x] 17.2 Implement path normalization
    - Convert all relative commands to absolute
    - Preserve visual path appearance
    - Track current position during conversion
    - _Requirements: 13.4_
  
  - [ ]* 17.3 Write property test for path normalization
    - **Property 40: Path normalization**
    - **Validates: Requirements 13.4**
  
  - [x] 17.4 Implement path simplification
    - Remove redundant points within tolerance
    - Use Douglas-Peucker or similar algorithm
    - Preserve overall shape
    - _Requirements: 13.1_
  
  - [ ]* 17.5 Write property test for path simplification
    - **Property 37: Path simplification preserves shape**
    - **Validates: Requirements 13.1**
  
  - [x] 17.6 Implement path splitting
    - Split path at parameter t (0 to 1)
    - Return two separate PathCommand arrays
    - Handle different command types appropriately
    - _Requirements: 13.2_
  
  - [ ]* 17.7 Write property test for path splitting
    - **Property 38: Path splitting**
    - **Validates: Requirements 13.2**
  
  - [x] 17.8 Implement path merging
    - Merge two compatible paths into one
    - Combine path commands sequentially
    - Validate paths can be merged
    - _Requirements: 13.3_
  
  - [ ]* 17.9 Write property test for path merging
    - **Property 39: Path merging**
    - **Validates: Requirements 13.3**
  
  - [x] 17.10 Export path utilities from geometry index
    - Add path utilities to geometry/index.ts
    - Export PathCommand type
    - Export all path manipulation functions
    - _Requirements: 19.1_
  
  - [ ]* 17.11 Write unit tests for path edge cases
    - Test empty paths
    - Test paths with only move commands
    - Test paths with complex curves
    - Test invalid path data

- [x] 18. Sprint 3 Checkpoint
  - Ensure all geometry tests pass
  - Verify matrix operations are mathematically correct
  - Test bounding boxes match expected values
  - Ask the user if questions arise

### Sprint 4: Performance and Indexing

- [x] 19. Implement hierarchy indexing
  - [x] 19.1 Create HierarchyIndex class
    - Build parent map (nodeId -> parentId)
    - Build children map (nodeId -> childIds[])
    - Implement getParent() method
    - Implement getChildren() method
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [x] 19.2 Implement incremental index updates
    - Update index when nodes are added
    - Update index when nodes are removed
    - Update index when nodes are moved
    - Invalidate only affected portions
    - _Requirements: 15.4_
  
  - [x] 19.3 Implement ancestor and descendant queries
    - Implement getAncestors() method
    - Implement getDescendants() method
    - Use index for efficient traversal
    - _Requirements: 15.2, 15.3_

- [ ] 20. Implement selector query engine
  - [x] 20.1 Create QueryEngine class
    - Implement queryById() using node index
    - Implement queryByType() by filtering nodes
    - Implement queryByAttribute() by checking attributes
    - _Requirements: 14.2, 14.3, 14.4_
  
  - [x] 20.2 Implement multi-criteria queries
    - Add query() method that accepts multiple criteria
    - Combine type, attribute, and other selectors with AND logic
    - Return intersection of results
    - _Requirements: 14.5_
  
  - [ ]* 20.3 Write property tests for query correctness
    - **Property 42: Query by type correctness**
    - **Property 43: Query by attribute correctness**
    - **Property 44: Multi-criteria query correctness**
    - **Validates: Requirements 14.2, 14.3, 14.5**
  
  - [ ]* 20.4 Write unit tests for query edge cases
    - Test queries on empty documents
    - Test queries with no matches
    - Test multi-criteria queries with various combinations

- [ ] 21. Optimize query performance
  - [x] 21.1 Add performance optimizations
    - Use Map for O(1) ID lookups (already implemented)
    - Use early termination for single-result queries
    - _Requirements: 14.1_
  
  - [ ]* 21.2 Write property test for query performance
    - **Property 41: Query performance**
    - Generate documents with 1000 nodes
    - Verify queries complete in under 50ms
    - **Validates: Requirements 14.1**

- [ ] 22. Implement validation and error handling
  - [x] 22.1 Create attribute type validator
    - Create new validation module for attribute types
    - Validate numeric attributes (x, y, width, height, etc.)
    - Validate color attributes (hex, rgb, named colors)
    - Validate enum attributes (e.g., fill-rule, stroke-linecap)
    - Return descriptive errors with expected vs actual types
    - _Requirements: 17.2_
  
  - [ ]* 22.2 Write property test for attribute validation
    - **Property 45: Attribute type validation**
    - **Validates: Requirements 17.2**
  
  - [ ] 22.3 Enhance parser error messages
    - Update parser to track line and column numbers
    - Include line numbers in ParseError type
    - Provide clear descriptions of what went wrong
    - _Requirements: 17.3_
  
  - [ ]* 22.4 Write property test for error messages
    - **Property 46: Validation error messages**
    - **Validates: Requirements 17.3**
  
  - [ ] 22.5 Implement graceful handling of unknown elements
    - Update parser to continue when unknown elements are encountered
    - Add warning system for unknown elements
    - Store warnings in parse result
    - _Requirements: 17.4_
  
  - [ ]* 22.6 Write property test for unknown element handling
    - **Property 47: Unknown element graceful handling**
    - **Validates: Requirements 17.4**
  
  - [x] 22.7 Implement null-safe query operations
    - QueryEngine already returns null for invalid node references
    - Never throws exceptions for missing nodes
    - _Requirements: 18.3_
  
  - [ ]* 22.8 Write property test for query null safety
    - **Property 48: Query null safety**
    - **Validates: Requirements 18.3**
  
  - [x] 22.9 Ensure error state consistency
    - Commands already validate before execution
    - Failed commands don't modify document
    - _Requirements: 18.4_
  
  - [ ]* 22.10 Write property test for error state consistency
    - **Property 49: Error state consistency**
    - **Validates: Requirements 18.4**

- [ ] 23. Implement performance benchmarks
  - [ ]* 23.1 Create benchmark suite
    - Create benchmarks directory
    - Benchmark selector queries on 1k, 5k, 10k nodes
    - Benchmark command execution and undo
    - Benchmark parsing and serialization
    - Benchmark matrix operations
    - _Requirements: 22.1, 22.2, 22.3_
  
  - [ ]* 23.2 Configure benchmarks for CI
    - Set up Vitest bench configuration
    - Define performance thresholds
    - Document how to run benchmarks
    - _Requirements: 22.4_

- [x] 24. Verify framework independence
  - All tests run in Node.js without browser APIs
  - No UI framework dependencies
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [x] 25. Create public API exports
  - [x] 25.1 Export all public interfaces and classes
    - Export command classes (CreateElementCommand, DeleteElementCommand, etc.)
    - Export HistoryManager implementation
    - Export BatchCommand
    - Verify all necessary types are exported
    - _Requirements: 19.1_
  
  - [x] 25.2 Write API documentation
    - Add JSDoc comments to exported command classes
    - Add usage examples to main index.ts
    - Document error codes and error handling patterns
    - Create examples directory with common usage patterns
    - _Requirements: 19.1_

- [ ] 26. Final Sprint 4 Checkpoint
  - Ensure all tests pass (unit and property-based)
  - Verify 90%+ code coverage
  - Run full benchmark suite (if implemented)
  - Verify all performance targets are met
  - Ask the user if questions arise

### Property-Based Testing Tasks

These tasks implement property-based tests for critical correctness properties across all sprints. Property-based tests use fast-check to validate universal properties across many generated inputs.

- [x] 27. Set up property-based testing infrastructure
  - [x] 27.1 Create test data generators (arbitraries)
    - Create tests/properties/arbitraries.ts
    - Implement arbitraryDocument() generator
    - Implement arbitrarySVGNode() generator
    - Implement arbitraryMatrix() generator
    - Implement arbitraryPathCommand() generator
    - Implement generators for specific node types (rect, circle, path, etc.)
    - _Requirements: 21.2_
  
  - [x] 27.2 Configure property test settings
    - Set numRuns to minimum 100 iterations
    - Configure timeout for long-running tests
    - Add descriptive test names with property numbers
    - _Requirements: 21.2_

- [ ] 28. Implement Sprint 1 property tests (Parsing & Serialization)
  - [ ]* 28.1 Property 1: Complete element preservation
    - **Validates: Requirements 1.1**
  
  - [ ]* 28.2 Property 2: Unique ID assignment
    - **Validates: Requirements 1.2, 3.1, 3.4**
  
  - [ ]* 28.3 Property 3: Hierarchy preservation
    - **Validates: Requirements 1.3**
  
  - [ ]* 28.4 Property 4: Attribute preservation
    - **Validates: Requirements 1.4**
  
  - [ ]* 28.5 Property 5: Parse error handling
    - **Validates: Requirements 1.5, 18.1**
  
  - [ ]* 28.6 Property 6: Deterministic parsing
    - **Validates: Requirements 1.6**
  
  - [ ]* 28.7 Property 7: Valid serialization
    - **Validates: Requirements 2.1**
  
  - [ ]* 28.8 Property 8: Deterministic serialization
    - **Validates: Requirements 2.2**
  
  - [ ]* 28.9 Property 9: Consistent attribute formatting
    - **Validates: Requirements 2.3**
  
  - [ ]* 28.10 Property 10: Proper XML hierarchy
    - **Validates: Requirements 2.4**
  
  - [ ]* 28.11 Property 11: Round-trip fidelity (CRITICAL)
    - **Validates: Requirements 2.6**
  
  - [ ]* 28.12 Property 12: ID stability across modifications
    - **Validates: Requirements 3.2**
  
  - [ ]* 28.13 Property 13: Query by ID correctness
    - **Validates: Requirements 3.3, 14.4**

- [ ] 29. Implement Sprint 2 property tests (Commands & History)
  - [ ]* 29.1 Property 14: Command execution applies changes
    - **Validates: Requirements 4.1, 4.2**
  
  - [ ]* 29.2 Property 15: Invalid commands preserve state
    - **Validates: Requirements 4.4, 18.2**
  
  - [ ]* 29.3 Property 16: Command inverse property (CRITICAL)
    - Test execute then undo restores original state for all command types
    - **Validates: Requirements 5.1**
  
  - [ ]* 29.4 Property 17: History tracking
    - **Validates: Requirements 6.1**
  
  - [ ]* 29.5 Property 18: Undo behavior
    - **Validates: Requirements 6.2, 6.3**
  
  - [ ]* 29.6 Property 19: Redo behavior
    - **Validates: Requirements 6.4**
  
  - [ ]* 29.7 Property 20: Redo invalidation
    - **Validates: Requirements 6.5**
  
  - [ ]* 29.8 Property 21: Deterministic replay
    - **Validates: Requirements 6.6**
  
  - [ ]* 29.9 Property 22: Batch execution order
    - **Validates: Requirements 7.2**
  
  - [ ]* 29.10 Property 23: Batch undo order
    - **Validates: Requirements 7.3**
  
  - [ ]* 29.11 Property 24: Batch error handling
    - **Validates: Requirements 7.4**
  
  - [ ]* 29.12 Property 25: Create element adds node
    - **Validates: Requirements 8.1**
  
  - [ ]* 29.13 Property 26: Create element undo removes node
    - **Validates: Requirements 8.2**
  
  - [ ]* 29.14 Property 27: Create child adds to parent
    - **Validates: Requirements 8.4**
  
  - [ ]* 29.15 Property 28: Delete element removes node
    - **Validates: Requirements 9.1, 9.3**
  
  - [ ]* 29.16 Property 29: Delete element undo restores node
    - **Validates: Requirements 9.2, 9.4**
  
  - [ ]* 29.17 Property 30: Update attribute modifies value
    - **Validates: Requirements 10.1, 10.3**
  
  - [ ]* 29.18 Property 31: Update attribute undo restores value
    - **Validates: Requirements 10.2, 10.4**

- [ ] 30. Implement Sprint 3 property tests (Geometry & Transforms)
  - [ ]* 30.1 Property 32: Matrix composition
    - **Validates: Requirements 11.1**
  
  - [ ]* 30.2 Property 33: Matrix decomposition
    - **Validates: Requirements 11.2, 11.5**
  
  - [ ]* 30.3 Property 34: Matrix point transformation
    - **Validates: Requirements 11.3**
  
  - [ ]* 30.4 Property 35: Matrix inverse property
    - **Validates: Requirements 11.4**
  
  - [ ]* 30.5 Property 36: Bounding box calculation
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
  
  - [ ]* 30.6 Property 37: Path simplification preserves shape
    - **Validates: Requirements 13.1**
  
  - [ ]* 30.7 Property 38: Path splitting
    - **Validates: Requirements 13.2**
  
  - [ ]* 30.8 Property 39: Path merging
    - **Validates: Requirements 13.3**
  
  - [ ]* 30.9 Property 40: Path normalization
    - **Validates: Requirements 13.4**

- [ ] 31. Implement Sprint 4 property tests (Queries & Validation)
  - [ ]* 31.1 Property 41: Query performance
    - **Validates: Requirements 14.1**
  
  - [ ]* 31.2 Property 42: Query by type correctness
    - **Validates: Requirements 14.2**
  
  - [ ]* 31.3 Property 43: Query by attribute correctness
    - **Validates: Requirements 14.3**
  
  - [ ]* 31.4 Property 44: Multi-criteria query correctness
    - **Validates: Requirements 14.5**
  
  - [ ]* 31.5 Property 45: Attribute type validation
    - **Validates: Requirements 17.2**
  
  - [ ]* 31.6 Property 46: Validation error messages
    - **Validates: Requirements 17.3**
  
  - [ ]* 31.7 Property 47: Unknown element graceful handling
    - **Validates: Requirements 17.4**
  
  - [ ]* 31.8 Property 48: Query null safety
    - **Validates: Requirements 18.3**
  
  - [ ]* 31.9 Property 49: Error state consistency
    - **Validates: Requirements 18.4**
  
  - [ ]* 31.10 Property 50: Node.js compatibility
    - **Validates: Requirements 20.1, 20.2, 20.3, 20.4**

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation at the end of each sprint
- All tests run in Node.js without requiring a browser
- The 4-sprint structure aligns with the core package README

## Current Status

**Completed Sprints:**
- ✅ Sprint 1: Document Model Foundation (complete)
- ✅ Sprint 2: Command System and History (complete)
- ✅ Sprint 3: Geometry and Transforms (partial - missing path utilities)

**In Progress:**
- 🔄 Sprint 4: Performance and Indexing (partial)

**Key Remaining Work:**
1. Path manipulation utilities (Sprint 3, Task 17)
2. Multi-criteria queries (Sprint 4, Task 20.2)
3. Attribute type validation (Sprint 4, Task 22.1)
4. Enhanced error handling (Sprint 4, Tasks 22.3, 22.5)
5. Public API exports for commands (Sprint 4, Task 25.1)
6. API documentation (Sprint 4, Task 25.2)
7. Property-based tests (Tasks 27-31) - **CRITICAL for correctness validation**
8. Performance benchmarks (Task 23) - optional but recommended

**Test Coverage:** 88.17% (target: 90%+)
- All 613 unit tests passing
- Zero property-based tests implemented yet
- Coverage gaps mainly in index.ts files and type definitions

**Next Recommended Tasks:**
1. Task 17: Implement path manipulation utilities (required for complete geometry support)
2. Task 27: Set up property-based testing infrastructure (critical for correctness)
3. Task 28-31: Implement property-based tests (validates all correctness properties)
4. Task 25: Export commands and add API documentation (required for public API)
