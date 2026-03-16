# CO-SCRIPT Repo Context

## Role
Standalone writing product under the Content Co-op umbrella.

## Current Condition
`stabilizing`

Co-Script now has one dominant product shape: an editor-centered writing workflow with AI passes, research inputs, durable Supabase-backed state, and support libraries that feed the draft workspace.

## Canonical Scope
- editor
- AI generation
- research support
- auth and data
- product runtime

## Canonical Model
- `/editor` is the primary work surface
- `/scripts` is resume and history
- `/research` is signal intake
- `/vault` and `/frameworks` are support libraries
- Supabase Auth is the identity authority
- the standalone Supabase schema is the durable data authority
- browser local storage is backup only, never canonical persistence

## Key Source Files
- `/Users/baileyeubanks/Desktop/Projects/contentco-op/coscript/README.md`
- `/Users/baileyeubanks/Desktop/Projects/contentco-op/coscript/docs/COSCRIPT_CAPTAIN_AUDIT_2026-03-09.md`
- `/Users/baileyeubanks/Desktop/Projects/contentco-op/coscript/docs/auth-data-model.md`
- `/Users/baileyeubanks/Desktop/Projects/contentco-op/coscript/app`
- `/Users/baileyeubanks/Desktop/Projects/contentco-op/coscript/lib`

## Current Risks
- research sync and trending discovery are still partial
- non-editor routes still need real auth for full live QA
- live deploy/runtime truth is now documented for the Coolify/NAS path, but rollout verification still remains
- AI quality and availability still depend on external provider health

## Next Focus
- protect the editor-centered model from thread drift
- treat Gemini orchestration as internal experimentation, not product canon
- avoid roadmap expansion that breaks product coherence before the remaining blockers are resolved

## Update Rule
Every future CO-SCRIPT thread should read this file first and update it when repo truth materially changes.
