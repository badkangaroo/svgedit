# Backend API

Services for persistence and collaboration.

## Features
- File storage
- User authentication
- Collaboration (WebSockets)

## Planning & Checkpoints

Short sprints with observable results aligned to the main roadmap.

### Sprint 1 - API foundation
- Checkpoint: health/version endpoints and API docs published.
- Checkpoint: project/file CRUD works with in-memory or local storage.
- Checkpoint: unit tests for core services (storage, auth, events).

### Sprint 2 - Auth and project workflows
- Checkpoint: signup/login/token refresh flow with role-based access.
- Checkpoint: project list/create/rename/delete endpoints and audit logs.
- Checkpoint: error codes and rate limits documented and enforced.

### Sprint 3 - Collaboration service
- Checkpoint: WebSocket presence and selection sync events.
- Checkpoint: two clients can co-edit and receive updates under 250ms.
- Checkpoint: conflict policy implemented (last-write, merge, or lock).

### Sprint 4 - Export and reliability
- Checkpoint: export pipeline (SVG, PNG) with queued jobs.
- Checkpoint: observability (request logs, metrics, tracing) wired in.
- Checkpoint: integration tests cover auth + storage + collaboration.
