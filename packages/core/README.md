# Core Engine

This package contains the headless business logic for SVG Edit.

## Responsibilities
- SVG parsing and generation
- Mathematical operations (Matrix transforms, Path calculations)
- Command system (Undo/Redo)
- Tool definitions

## Testing
This package should be fully testable in a Node.js environment (using Vitest) without requiring a browser DOM.

## Status (Jan 2026)
- Document model, parsing/serialization, stable IDs, and deterministic ordering implemented.
- Command system with undo/redo, history manager, and atomic batch execution in place.
- Geometry utilities include matrices, bounding boxes, and path parsing/normalize/simplify/split/merge.
- Query/indexing includes selector queries and hierarchy index with incremental updates.
- Parser preserves unknown/custom elements and reports warnings for optional filtering.

## Quality & Testing Notes
- Test stack: Vitest unit tests plus fast-check property-based tests; Node.js only (no DOM).
- Coverage: run `npm run test:coverage` for current percentages; target remains 90%+ for core logic.
- Benchmarks: `npm run bench` is wired; benchmark suite still pending.

## Planning & Checkpoints

Short sprints with observable results aligned to the main roadmap.

### Sprint 1 - Document model foundation
- Checkpoint: parse and serialize sample SVGs with round-trip fidelity.
- Checkpoint: stable node IDs and deterministic ordering for diffs.
- Checkpoint: unit tests cover parsing, serialization, and validation.

### Sprint 2 - Command system and history
- Checkpoint: command interfaces for add/update/delete with undo/redo.
- Checkpoint: deterministic command replay for the same final SVG output.
- Checkpoint: history stack supports batching and redo invalidation.

### Sprint 3 - Geometry and transforms
- Checkpoint: matrix transforms and bounding boxes with test vectors.
- Checkpoint: path utilities (simplify, split, merge) validated by tests.
- Checkpoint: selection math matches rendered positions in frontend.

### Sprint 4 - Performance and indexing
- Checkpoint: selector queries and hierarchy indexing under 50ms for 1k nodes.
- Checkpoint: incremental updates avoid full tree re-walks when possible.
- Checkpoint: benchmarks documented and runnable in CI.
