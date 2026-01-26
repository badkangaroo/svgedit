# Backend API

Services for persistence, auth, export, and (stretch) collaboration.

## Features
- File storage
- User authentication
- Export pipeline (SVG, PNG)
- Collaboration (stretch, CRDT via Supabase Realtime)
- Netlify DB + Netlify Blobs storage

## Local Development

```bash
npm install
npm run dev
```

The Fastify app listens on `http://localhost:3001` by default.

### Required Env Vars

- `DATABASE_URL` (Netlify DB connection string)
- `JWT_SECRET` (defaults to `dev-secret-change-me` for local dev)
- `JWT_ACCESS_TTL` (seconds, default `900`)
- `JWT_REFRESH_TTL` (seconds, default `2592000`)
- `NETLIFY_BLOBS_STORE` (optional, default `svgedit`)
- `NETLIFY_SITE_ID` + `NETLIFY_API_TOKEN` (required for local Blobs access)

### Database Schema

Initial schema is in `apps/backend/src/db/schema.sql`. Apply it to your
Netlify DB instance before running locally.

## Netlify Functions

- Function entry: `apps/backend/netlify/functions/api.ts`
- OpenAPI docs: `GET /docs`
- Health check: `GET /health`
- Version: `GET /version`

## API Endpoints (Initial)

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /projects`
- `POST /projects`
- `POST /projects/:projectId/files`
- `GET /projects/:projectId/files/:fileId`
- `PUT /projects/:projectId/files/:fileId`
- `POST /exports`
- `GET /exports/:jobId`

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

### Sprint 3 - Export and reliability
- Checkpoint: export pipeline (SVG, PNG) with queued jobs.
- Checkpoint: observability (request logs, metrics, tracing) wired in.
- Checkpoint: integration tests cover auth + storage + export.

### Sprint 4 - Collaboration (stretch)
- Checkpoint: presence and selection sync events over Realtime.
- Checkpoint: two clients can co-edit and receive updates under 250ms.
- Checkpoint: conflict policy implemented (CRDT).
