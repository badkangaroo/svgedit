# Netlify DB Usage

Netlify DB is a managed Postgres instance provisioned via Netlify. The backend should use a single `DATABASE_URL` connection string injected by Netlify.

## Environment Variables

- `DATABASE_URL`: Postgres connection string (Netlify DB)

## Migrations

Initial schema draft is in `schema.sql`. Migrations can be applied via a simple SQL runner or a migration tool once selected.
