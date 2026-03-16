# Co-Script Auth and Data Model

This document is the canonical auth and persistence reference for the standalone Co-Script app in this repo.

Authoritative implementation points:

- `proxy.ts` for page-level access gating and session-aware redirects
- `app/api/**` for route-level auth enforcement and product data writes
- `lib/contracts.ts` for shared in-repo data shapes
- `supabase/migrations/001_coscript_schema.sql` for durable storage and RLS rules
- `app/(dashboard)/editor/page.tsx` for browser backup versus Supabase sync behavior

## Identity Model

- Co-Script uses Supabase Auth as its only runtime identity authority.
- Authenticated product access is based on Supabase session cookies.
- Protected product pages are gated in `proxy.ts`.
- Protected APIs enforce auth in the route handlers themselves.
- Public access is intentionally narrow: `/login`, `/signup`, `/auth/callback`, and `/shared/:token`.

## Session Model

- Email/password sign-in is handled through `/api/auth/login`.
- Google OAuth starts in the browser and completes through `/auth/callback`.
- Login redirects preserve the requested destination through a sanitized `next` path.
- `/api/auth/session` is the runtime probe for whether the current browser still has a valid product session.
- If the session is gone while the editor is open, the editor falls back to browser-backup mode instead of pretending cloud sync still works.

## Durable Data Model

Durable Co-Script product data lives in Supabase and is protected by RLS.

### User-scoped tables

- `scripts`: primary saved script record
- `script_versions`: prior script bodies captured on meaningful content changes
- `watchlists`: creators/channels a user tracks
- `research_items`: outlier research found for that user
- `vault_items`: saved references and swipe-file material

### Mixed-scope table

- `frameworks`: either system-provided (`is_system = true`) or user-owned

### Public-sharing table

- `share_links`: owned through the parent script; public read is token-based for the shared page only

## What Is Not a First-Class Durable Entity

- There is currently no standalone `projects` table in Co-Script.
- There is currently no org membership or org-scoped runtime model in this standalone app.
- "Project" in product conversation currently means a writing workspace or script effort, not a persisted product entity.

## Local Versus Cloud Persistence

### Browser-local only

- The editor keeps a browser backup in `localStorage`.
- The browser backup is a resilience layer for unsaved work, offline periods, session expiry, and Supabase failures.
- The browser backup is not the source of truth when a Supabase script record exists.

### Supabase-required

- Saved scripts
- Version history
- Watchlists
- Research items
- Vault items
- User-created frameworks
- Share links

### Editor contract

- Browser backup updates continuously while writing.
- Supabase sync happens only when the session is active.
- The first successful cloud save promotes a new draft from browser-only state into a durable `scripts` row.
- Once a new draft is promoted to Supabase, the temporary `"new"` backup key is cleared so a later fresh draft does not silently resurrect an already-synced script.

## Product Boundary

- Co-Script is a standalone product runtime.
- Supabase is the durable backend for auth and product data.
- ROOT is not the runtime home for Co-Script auth or persistence.
- CCO HOME is not the runtime authority for Co-Script sessions.
- BLAZE may consume outputs later, but it does not own Co-Script auth or product data.

## Follow-Up Issues

- Research sync is still a stub. `watchlists/[id]` updates timestamps/status but does not yet ingest real upstream data.
- Deployment/runtime verification is still thin. OAuth callback configuration and service-key presence are deployment-critical and should be explicitly verified during build/release.
- `packages/api-client` and `packages/types` are now compatibility shims. They may mirror Co-Script contracts, but the runtime authority remains the app code and Supabase-backed routes in this repo.
- The standalone app is user-scoped today. If project or org concepts are needed later, they should be introduced deliberately rather than inferred from old shared-system schemas.
