# Co-Script Deploy Contract

## Canonical Source

- Repo: `/Users/baileyeubanks/Desktop/Projects/contentco-op/coscript`
- Framework: Next.js 16
- Default port: `4102`
- Health endpoint: `/api/health`

## Required Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser Supabase anon key |
| `SUPABASE_URL` | Optional | Server fallback for Supabase URL |
| `SUPABASE_SERVICE_KEY` | Yes for server routes | Server-side Supabase service role |
| `ANTHROPIC_API_KEY` | Optional | AI routes that use Anthropic |
| `GOOGLE_API_KEY` | Optional | Gemini orchestration route |
| `GEMINI_MODEL` | Optional | Override default Gemini model |
| `AI_MODEL` | Optional | Default editor model label |
| `PORT` | Optional | Runtime port; defaults to `4102` |

## Build and Runtime

```bash
npm ci
npm run build
npx next start --hostname 0.0.0.0 --port 4102
```

## Docker Contract

- Dockerfile: `/Users/baileyeubanks/Desktop/Projects/contentco-op/coscript/Dockerfile`
- Base image: `node:20-slim`
- Exposed port: `4102`
- Health probe: `GET /api/health`

## Coolify Notes

- Set `COSCRIPT_PUBLIC_BASE` in `/Users/baileyeubanks/Desktop/Projects/ccnas-stack/.env.template`
- Use the repo root as the build context
- Probe path: `/api/health`
- Rollback owner: Content Co-op / Co-Script repo owner
