# Co-Script Captain Audit

Date: 2026-03-09
Scope: integrated repo convergence for the standalone writing product

## Classification

`stabilizing`

Co-Script now reads much more like one product than a bundle of separate threads, but it still has explicit blockers around research ingestion depth, auth-dependent preview limitations, and deployment truth that should stay visible.

## Current Condition

### Strongest surface

- The editor is now the clearest product center.
- Writing flow, AI passes, save state, version history, and local backup all resolve in one workspace.
- Research, frameworks, vault references, and saved drafts are framed as support surfaces rather than competing products.

### What changed in this convergence pass

- Product IA and copy were reframed around one editor-centered workflow.
- The editor gained a support-context rail for research items, vault references, and frameworks.
- README and repo docs now point to one canonical model instead of advertising multiple product truths.
- Shared package drift was reduced into compatibility shims aligned with the standalone app.
- Runtime truth was tightened around auth-page suspense handling, build expectations, and local preview rules.

## Root Causes Behind Prior Drift

1. Monorepo residue left old route names, package contracts, and product language in place after the standalone split.
2. AI experimentation advanced along two different tracks:
   - editor-native Anthropic passes
   - Gemini orchestration with broader stage framing
3. Research support existed, but it was still framed like a parallel destination rather than an upstream input to writing.
4. Runtime truth lagged behind product changes, especially around local preview, auth-page rendering rules, and deployment assumptions.

## Corrected Canonical Model

Co-Script should be treated as:

- one standalone writing product
- one editor-centered workflow
- one AI relationship where generation, rewrite, scoring, and hooks serve the editor
- one research-support layer that feeds briefing and drafting
- one auth and data model centered on Supabase Auth and the standalone schema
- one local-backup contract where browser storage is resilience only, never the durable authority

In practice:

- `/editor` is the primary work surface
- `/scripts` is resume and history
- `/research` is signal intake
- `/vault` and `/frameworks` are support libraries
- `lib/contracts.ts` is the in-app contract canon
- the Supabase schema is the durable data canon

## AI Canon

Canonical product AI surface:

- `POST /api/ai/generate`
- `POST /api/ai/rewrite`
- `POST /api/ai/score`
- `POST /api/ai/hooks`

`POST /api/ai/gemini-orchestrate` remains in the repo only as an internal experimental route. It is not the product-facing writing model.

## Remaining Blockers

1. Research sync is still partial. Watchlist freshness is surfaced, but upstream ingestion and trending depth remain limited.
2. Local visual QA outside `/editor` still depends on a real authenticated session because only the editor has a dev preview bypass.
3. Hosting truth has been moved onto the home-hosted Coolify/NAS path, but live rollout verification still remains to be completed against the new deploy contract.
4. AI generation quality still depends on external provider health and credentials; this pass aligns the workflow but does not eliminate provider/runtime risk.

## Canonical References

- `docs/auth-data-model.md`
- `README.md`
- `lib/contracts.ts`
- `supabase/migrations/001_coscript_schema.sql`
