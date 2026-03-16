# CO-SCRIPT by Content Co-op

Standalone script writing product with an editor-centered workflow, Supabase-backed persistence, browser draft recovery, and AI passes built for real script development.

## Canonical Product Model

Co-Script should be read as one writing system:

- The editor is the primary workspace for briefing, drafting, rewriting, scoring, save state, and version restore.
- Research, frameworks, and vault references are support surfaces that feed the editor.
- Supabase Auth is the only identity authority.
- Durable product data lives in the standalone schema at `supabase/migrations/001_coscript_schema.sql`.
- Browser `localStorage` is a backup layer for resilience, not the canonical store.

Supporting references:

- `docs/COSCRIPT_CAPTAIN_AUDIT_2026-03-09.md`
- `docs/auth-data-model.md`

## Core Features

- Editor workspace with brief fields, document structure, local backup, cloud save, and version history
- AI writing passes for angle generation, outlining, drafting, rewriting, scoring, and hook exploration
- Research inputs through watchlists and outlier discovery
- Framework library and reference vault for editor support
- Script sharing through tokenized public links
- Supabase auth with email/password and Google OAuth

## AI Surfaces

Product-facing AI routes:

- `POST /api/ai/generate`
- `POST /api/ai/rewrite`
- `POST /api/ai/score`
- `POST /api/ai/hooks`

`POST /api/ai/gemini-orchestrate` is retained only as an internal experimental route for tool-enabled prompting. It is not the canonical product workflow.

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Supabase (auth + database)
- Anthropic Claude API for the primary editor workflow
- Google Gemini API for internal experiments only

## Getting Started

```bash
git clone https://github.com/baileyeubanks/coscript.git
cd coscript
npm install
cp .env.example .env.local
# Fill in your credentials in .env.local
npm run dev
```

Open [http://localhost:4102](http://localhost:4102).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_URL` | Optional | Server-only fallback for the Supabase URL; defaults to `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_SERVICE_KEY` | Yes | Server-only service role key used for public share-link resolution |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for canonical editor AI passes |
| `GOOGLE_API_KEY` | Optional | Gemini API key for the internal experimental orchestration route |
| `GEMINI_MODEL` | Optional | Default Gemini model override for the internal route |

## Durable Data

The standalone schema defines these product tables:

- `scripts`
- `script_versions`
- `frameworks`
- `vault_items`
- `watchlists`
- `research_items`
- `share_links`

All product tables are protected with row-level security in the migration.

## Runtime Notes

- Protected pages are gated in `proxy.ts`.
- Protected API routes enforce auth in the handlers.
- `/editor` has a dev-only preview bypass so the writing surface can be reviewed locally without a full auth session.
- Hosting is expected to run through the home-hosted Coolify/NAS path once the deploy contract is finalized.

## Validation

Primary checks for this app:

```bash
npm run typecheck
npm run build
```

## License

MIT
