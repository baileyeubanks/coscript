# Co-Script Stabilization Plan

Updated: March 10, 2026

## Verified Current State

- `npm run build` passes.
- Health endpoint exists at `/api/health`.
- Deploy contract exists at
  `/Users/baileyeubanks/Desktop/Projects/contentco-op/coscript/DEPLOY_CONTRACT.md`.
- Docker runtime contract exists at
  `/Users/baileyeubanks/Desktop/Projects/contentco-op/coscript/Dockerfile`.
- Editor, research, scripts, vault, frameworks, and share-link routes all compile.

## Product Areas

| Area | Current state | Verification |
| --- | --- | --- |
| Editor workspace | Strongest surface | `README.md` + build output |
| Save/load + versions | Present | API routes compile |
| Research support | Partial | Research routes exist, ingestion depth remains limited |
| Share links | Present | `/shared/[token]` builds |
| Auth/runtime | Partial but coherent | Protected routes enforced; dev preview remains editor-only |
| Deploy/runtime | Now contract-defined | Dockerfile + health route added |

## Primary Remaining Gaps

1. Research freshness and upstream ingestion remain partial.
2. Only `/editor` has a dev-preview bypass; broader browser QA still needs a real authenticated session.
3. AI quality and availability still depend on external provider credentials and runtime health.
4. Runtime and deploy truth are now defined, but still need live Coolify rollout verification.

## Hardening Order

1. Run one authenticated writing cycle: create -> save -> version -> share-link -> restore.
2. Tighten research ingestion so `/research` reflects live, trustworthy source freshness.
3. Add smoke coverage for `/api/health`, `/api/scripts`, and `/shared/[token]`.
4. Verify the Coolify rollout against the new deploy contract.

## Explicit Non-Goals For This Pass

- No new writing workflow architecture rewrite.
- No promotion of the Gemini orchestration route into the canonical product path.
- No monorepo backslide; this remains a standalone product.
