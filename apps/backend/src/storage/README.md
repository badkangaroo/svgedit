# Netlify Blobs Key Conventions

This document defines blob key paths to keep storage deterministic and traceable.

## SVG Files

```
projects/{projectId}/files/{fileId}/current.svg
```

## SVG Revisions

```
projects/{projectId}/files/{fileId}/revisions/{revisionId}.svg
```

## Export Outputs

```
projects/{projectId}/files/{fileId}/exports/{jobId}.{ext}
```

## Notes

- `projectId`, `fileId`, `revisionId`, and `jobId` are UUIDs.
- Store blob keys in Postgres records for lookup.
