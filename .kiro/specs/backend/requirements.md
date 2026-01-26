# Requirements Document: Backend API

## Introduction

The Backend API provides persistence, authentication, export services, and (stretch) collaboration for SVG Edit. The backend runs on Netlify using Functions and Background Functions, with Netlify DB for relational data and Netlify Blobs for SVG assets and export artifacts.

## Glossary

- **Project**: A top-level container for SVG files.
- **File**: An SVG document within a project.
- **Revision**: An immutable snapshot of a file's SVG content.
- **Export_Job**: A background task that renders SVG into another format.
- **Blob**: A binary object stored in Netlify Blobs.
- **RBAC**: Role-based access control (owner/editor/viewer).
- **Request_ID**: Correlation ID for request tracing.
- **CRDT**: Conflict-free Replicated Data Type (stretch, realtime).

## Requirements

### Requirement 1: Health and Version Endpoints

**User Story:** As a developer, I want health and version endpoints, so that I can verify the backend is running and identify the deployed version.

#### Acceptance Criteria

1. WHEN a client calls `/health`, THE API SHALL return a 200 status with `{ status: "ok" }`
2. WHEN a client calls `/version`, THE API SHALL return the current app version
3. THE API SHALL include an `x-request-id` header in both responses

### Requirement 2: API Documentation

**User Story:** As a developer, I want OpenAPI documentation, so that I can integrate clients reliably.

#### Acceptance Criteria

1. WHEN the server starts, THE API SHALL expose OpenAPI documentation
2. THE OpenAPI schema SHALL include all public endpoints and error shapes
3. THE docs endpoint SHALL be accessible without authentication

### Requirement 3: Project Management

**User Story:** As a user, I want to create and manage projects, so that I can organize my SVG files.

#### Acceptance Criteria

1. WHEN a user creates a project, THE API SHALL persist the project in Netlify DB
2. WHEN a user lists projects, THE API SHALL return only projects they own or can access
3. WHEN a user renames or deletes a project, THE API SHALL update the database and audit log

### Requirement 4: File Storage

**User Story:** As a user, I want to store SVG files in projects, so that I can persist work.

#### Acceptance Criteria

1. WHEN a file is created, THE API SHALL create a DB record and store SVG content in Blobs
2. WHEN a file is updated, THE API SHALL create a new revision and update metadata
3. WHEN a file is requested, THE API SHALL return metadata and a download URL

### Requirement 5: SVG Validation

**User Story:** As a developer, I want server-side SVG validation, so that invalid SVG is rejected consistently.

#### Acceptance Criteria

1. WHEN SVG content is received, THE API SHALL validate using `packages/core`
2. WHEN validation fails, THE API SHALL return a structured error with details
3. WHEN validation succeeds, THE API SHALL persist the file or revision

### Requirement 6: Authentication

**User Story:** As a user, I want to sign up and log in, so that I can access my projects securely.

#### Acceptance Criteria

1. WHEN a user signs up, THE API SHALL store a hashed password and return tokens
2. WHEN a user logs in, THE API SHALL validate credentials and return tokens
3. WHEN a token is refreshed, THE API SHALL issue a new access token

### Requirement 7: Role-Based Access Control

**User Story:** As a user, I want role-based access, so that I can collaborate securely.

#### Acceptance Criteria

1. WHEN a user accesses a project, THE API SHALL enforce owner/editor/viewer roles
2. WHEN a user lacks permission, THE API SHALL return a 403 error
3. THE API SHALL support adding/removing members by role

### Requirement 8: Rate Limiting

**User Story:** As an operator, I want rate limiting, so that the API remains stable.

#### Acceptance Criteria

1. WHEN requests exceed configured limits, THE API SHALL return 429
2. THE API SHALL include retry hints in the response headers
3. Rate limit counters SHALL be per user or per IP

### Requirement 9: Audit Logging

**User Story:** As an operator, I want audit logs, so that I can trace critical actions.

#### Acceptance Criteria

1. WHEN a user mutates a resource, THE API SHALL record an audit entry
2. Audit entries SHALL include user, action, target, and timestamp
3. Audit logs SHALL be stored in Netlify DB

### Requirement 10: Export Pipeline

**User Story:** As a user, I want to export SVG to SVG/PNG, so that I can download assets.

#### Acceptance Criteria

1. WHEN an export is requested, THE API SHALL enqueue an Export_Job
2. WHEN an export job completes, THE API SHALL store results in Blobs
3. WHEN a job is queried, THE API SHALL return status and download URL

### Requirement 11: Background Processing

**User Story:** As an operator, I want exports to run in background functions, so that API responses remain fast.

#### Acceptance Criteria

1. WHEN a job is queued, THE worker SHALL process it in a Background Function
2. WHEN a worker fails, THE job SHALL be marked failed with error details
3. Background workers SHALL be idempotent on retries

### Requirement 12: Observability

**User Story:** As an operator, I want observability, so that I can debug and monitor the backend.

#### Acceptance Criteria

1. THE API SHALL emit structured logs with request IDs
2. THE API SHALL log errors with stack traces and context
3. THE API SHALL expose basic timing metrics per endpoint

### Requirement 13: Netlify Storage Usage

**User Story:** As a developer, I want Netlify-native storage, so that the backend is deployable on Netlify.

#### Acceptance Criteria

1. THE API SHALL store relational data in Netlify DB
2. THE API SHALL store SVG and export artifacts in Netlify Blobs
3. THE API SHALL avoid long-lived processes or socket servers

### Requirement 14: Realtime Collaboration (Stretch)

**User Story:** As a user, I want realtime collaboration, so that multiple users can co-edit.

#### Acceptance Criteria

1. WHEN collaboration is enabled, THE API SHALL issue Supabase Realtime tokens
2. Presence and selection updates SHALL be broadcast over Realtime channels
3. CRDT updates SHALL be transported without loss or reordering
