# Implementation Plan: Backend API

## Overview

This plan follows the backend roadmap while moving CRDT collaboration to a stretch goal after export and reliability work. Tasks are grouped into short sprints with checkpoints and requirement references for traceability.

## Tasks

### Sprint 1: API Foundation

- [ ] 1. Set up backend project structure
  - Create `src/` with Fastify app factory
  - Add Netlify Function handler
  - Configure TypeScript for local type checking
  - _Requirements: 1.1, 1.2, 2.1, 13.3_

- [ ] 2. Health and version endpoints
  - Implement `/health` and `/version`
  - Add request ID middleware
  - _Requirements: 1.1, 1.2, 1.3, 12.1_

- [ ] 3. OpenAPI documentation
  - Register OpenAPI plugin and docs route
  - Document error schema and auth headers
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. Basic error handling and logging
  - Structured error responses with codes
  - Log request timings and errors
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 5. Data model draft
  - Define DB tables: users, projects, files, revisions, memberships, audit_logs
  - Define blob key conventions
  - _Requirements: 3.1, 4.1, 9.1, 13.1, 13.2_

- [ ] 6. Sprint 1 Checkpoint
  - Verify API runs locally and docs render
  - Validate request IDs and logs appear

### Sprint 2: Auth and Project Workflows

- [ ] 7. Auth foundations
  - Password hashing (argon2)
  - JWT access + refresh token flow
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 8. Role-based access control
  - Project membership model (owner/editor/viewer)
  - Authorization guards on routes
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 9. Project CRUD endpoints
  - Create/list/update/delete projects
  - Add audit logging on mutations
  - _Requirements: 3.1, 3.2, 3.3, 9.1_

- [ ] 10. File and revision endpoints
  - Create/update files with validation using `packages/core`
  - Store SVG content in Blobs
  - Create immutable revisions per update
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 13.2_

- [ ] 11. Rate limiting
  - Per-user and per-IP limits
  - Return 429 with retry hints
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 12. Sprint 2 Checkpoint
  - Signup/login flow works end-to-end
  - Project and file APIs validated against RBAC

### Sprint 3: Export and Reliability

- [ ] 13. Export jobs data model
  - Create `export_jobs` table
  - Define job status transitions
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 14. Export queue endpoints
  - Enqueue export requests
  - Return job status and download URLs
  - _Requirements: 10.1, 10.3_

- [ ] 15. Background worker implementation
  - Process jobs in Background Functions
  - Store results in Blobs
  - Idempotent retries
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 16. Integration tests
  - Auth + project + file + export flows
  - Validate error and rate limit behavior
  - _Requirements: 6.1, 3.1, 4.1, 10.1, 12.1_

- [ ] 17. Sprint 3 Checkpoint
  - Export jobs run reliably
  - Logs and metrics available for diagnosis

### Sprint 4: Collaboration (Stretch)

- [ ] 18. Realtime transport setup
  - Integrate Supabase Realtime tokens
  - Define channel naming and permissions
  - _Requirements: 14.1, 14.2_

- [ ] 19. Presence and selection updates
  - Broadcast presence events over Realtime
  - Validate authorization for channels
  - _Requirements: 14.2_

- [ ] 20. CRDT update pipeline
  - Define Yjs update storage format
  - Publish and subscribe to updates
  - _Requirements: 14.3_

- [ ] 21. Sprint 4 Checkpoint
  - Two clients co-edit and stay in sync
  - Realtime failures recover without data loss

## Notes

- Tasks marked as collaboration are stretch goals and can be deferred.
- All storage must remain Netlify-native (DB + Blobs).
