# Dashboard

Project management and file browser interface.

## Features
- File organization
- Project settings
- Asset management

## Planning & Checkpoints

Short sprints with observable results aligned to the main roadmap.

### Sprint 1 - UI framework and theming
- Checkpoint: navigation shell with project list and detail panels.
- Checkpoint: shared theme tokens and contrast checks applied to views.
- Checkpoint: keyboard navigation for list and main actions.

### Sprint 2 - View coordination and workflow
- Checkpoint: list selection syncs with detail and preview panels.
- Checkpoint: inline rename updates list and detail state immediately.
- Checkpoint: empty, loading, and error states are consistent and tested.

### Sprint 3 - Backend integration
- Checkpoint: authenticated project list/create/delete wired to API.
- Checkpoint: file upload/download flows with progress indicators.
- Checkpoint: settings changes persist and restore on reload.

### Sprint 4 - Polishing and performance
- Checkpoint: large project lists remain responsive (< 200ms interactions).
- Checkpoint: accessibility pass for contrast, focus, and ARIA labels.
- Checkpoint: end-to-end tests cover critical dashboard flows.
