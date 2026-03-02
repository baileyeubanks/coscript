# CoScript V2 — Codebase Audit + Competitive Analysis

**Date**: 2026-02-28
**Repo**: `git@github.com:baileyeubanks/coscript.git` @ `/tmp/coscript`
**Branch**: `main` | **Last commit**: `b9a97db fix: correct Claude model IDs + watchlist sync endpoint`

---

## PART 1: CURRENT CODEBASE AUDIT

### Stack
| Layer | Tech | Version |
|---|---|---|
| Framework | Next.js | 16.1.6 |
| UI | React | 19.2.3 |
| Language | TypeScript | 5.9.3 |
| CSS | Tailwind CSS v4 | 4.2.1 |
| Auth + DB | Supabase (SSR + JS client) | 0.8.0 / 2.97.0 |
| Icons | Lucide React | 0.575.0 |
| AI | Anthropic Claude (direct HTTP) | claude-sonnet-4-20250514 |
| Deploy | Netlify + @netlify/plugin-nextjs | 5.15.8 |
| Node | 20 (.nvmrc) | |

**7 runtime deps. Zero state management lib. Zero ORM. Extremely lean.**

### Metrics
| Metric | Value |
|---|---|
| Total source files | 60 |
| Total LOC (excl. package-lock) | 4,164 |
| TypeScript/TSX LOC | 3,401 |
| Dashboard pages | 7 (Studio, Editor, Scripts, Script Detail, Frameworks, Vault, Research) |
| API routes | 17 |
| AI endpoints | 5 (generate, score, hooks, rewrite, analyze-url) |
| Database tables | 7 |
| Seeded frameworks | 12 |
| Components | 1 (Shell.tsx) |
| Git commits | 7 |

### Database Schema (7 Tables)

**scripts** — id, user_id, title, script_type, content, hook, audience, objective, tone, platform, score, score_breakdown (JSONB), ai_feedback (JSONB), status (draft/review/published), word_count, created_at, updated_at

**script_versions** — id, script_id, version_number, content, hook, score, score_breakdown, created_at

**frameworks** — id, name, category (hooks/frameworks), description, structure (JSONB), example, source, is_system, user_id, created_at (12 seeded: Hook->Story->Offer, Curiosity Gap, Contrarian Take, Before/After Bridge, List Attack, Story Loop, PAS, AIDA, Authority Stack, Myth Buster, Tutorial Formula, Emotional Rollercoaster)

**vault_items** — id, user_id, title, content, source_url, source_type, tags[], notes, created_at

**watchlists** — id, user_id, name, platform (youtube/tiktok/instagram), channel_url, channel_id, last_synced_at, status, created_at

**research_items** — id, user_id, watchlist_id, title, url, platform, view_count, avg_views, outlier_score, thumbnail_url, published_at, metadata (JSONB), created_at

**share_links** — id, script_id, token, expires_at, created_at

### Feature Inventory

**WORKING (22 features)**
- Email/password login + signup with validation
- Google OAuth with callback
- SSR session management with middleware
- Studio dashboard (stats cards, recent scripts, quick actions)
- Full script editor (title, type, content, hook, audience, objective, tone, platform)
- 30-second auto-save with dirty detection
- Script CRUD (list, create, read, update, delete)
- Automatic version history on save
- Script library with search + filter by type (5) + status (3)
- Script detail view with version history tab
- AI: Generate script (Claude Sonnet 4, platform-aware, type-aware, tone-aware)
- AI: Score 0-100 with breakdown (hook_strength, clarity, structure, emotional_pull, cta_power)
- AI: Generate 5 hook variants (Curiosity Gap, Contrarian, Before/After, Story Loop, Bold Claim)
- AI: Rewrite with custom instruction + tone
- AI: Analyze URL (sends URL to Claude, no actual scraping)
- Framework library (12 seeded, search, category filter, expand/collapse)
- Vault/swipe file (CRUD, tags, search, source URL, notes)
- Watchlist management (create/delete, platform selector)
- Research outliers view (grid with thumbnails, view counts, outlier scores)
- Share links (7-day expiry, public read-only, crypto.randomBytes token)
- Collapsible sidebar navigation
- Dark theme with CSS variables

**BROKEN / INCOMPLETE (7 issues)**
1. **Editor "Edit" flow is broken** — Script detail links to `/editor?load=ID` but editor ignores `load` param. Cannot re-edit existing scripts.
2. **Rewrite endpoint has no UI** — `/api/ai/rewrite` works but no button anywhere calls it
3. **Analyze URL endpoint has no UI** — `/api/ai/analyze-url` works but unreachable
4. **Watchlist sync is a stub** — PUT only updates `last_synced_at`. No YouTube/TikTok API integration.
5. **Research data has no population mechanism** — Table exists, API reads it, but nothing writes to it
6. **Score not auto-saved** — After AI scoring, score stays in React state only
7. **No status management UI** — Scripts are always "draft", no way to change

**MISSING (7 features)**
1. Export (PDF/text) — promised in README, doesn't exist
2. Collaboration / multi-user
3. Auto-save indicator (dirty/saving/saved)
4. Keyboard shortcuts
5. Mobile responsive layout (fixed 400px right panel)
6. Rate limiting on AI endpoints
7. Toast notification system (CSS defined, never used)

**DEAD CODE**
- `packages/types/` and `packages/api-client/` — 202 lines of CoEdit-era monorepo types, not imported anywhere
- tsconfig.json references non-existent `tsconfig.base.json`

### Architecture Assessment

**What's solid:**
- Clean 3-client Supabase pattern (service/SSR/browser)
- Proper RLS on all tables with cascading deletes
- Thoughtful AI prompts with platform/type/tone awareness
- The scoring rubric (5 dimensions) is genuinely useful
- Version history with score snapshots is differentiating
- Minimal deps = fast builds, small bundle
- Professional dark theme with utility CSS classes

**What needs work:**
- Fragile JSON parsing (`text.match(/\{[\s\S]*\}/)`) on AI responses
- Only 1 component (Shell.tsx) — everything else is page files
- No state management for complex flows
- No error boundaries beyond root
- No loading skeletons despite CSS class being defined

---

## PART 2: COMPETITIVE LANDSCAPE

### Competitor Matrix

| Feature | Sandcastles | Descript | Jasper | Copy.ai | Kapwing | Pictory | InVideo | CoScript v1 |
|---|---|---|---|---|---|---|---|---|
| AI Script Writing | CORE | Yes | Yes | Yes | Partial | Yes | Yes | Yes |
| Video Research/Analysis | CORE | No | No | No | No | No | No | STUB |
| Hook/Pattern Library | CORE (Vault) | No | No | No | No | No | No | Yes (Vault) |
| Brand Voice Profiles | No | No | CORE | Yes | No | No | No | No |
| Knowledge Base | No | No | Yes | Yes | No | No | No | No |
| Template Library | No | No | 50+ | Yes | Yes | No | 5000+ | 12 frameworks |
| Real-time Collaboration | No | Yes | Yes | Partial | Yes | Partial | Yes | No |
| Client Review/Approval | No | Yes | Yes | No | Yes | No | No | Share links only |
| Script-to-Video | No | CORE | No | No | Yes | CORE | CORE | No |
| Video Editing | No | CORE | No | No | CORE | Yes | Yes | No |
| Production Workflow | No | Partial | No | Yes | No | No | No | No |
| Multi-Platform Format | No | No | No | No | Yes | No | Yes | Platform field |
| SEO Tools | No | No | Yes | No | No | No | No | No |
| API Access | Titan ($499) | No | No | Yes | No | No | No | No |
| Storyboarding | No | No | No | No | No | No | No | No |
| Mobile App | No | Partial | Yes | No | No | No | Yes | No |

### Pricing Landscape
| Tool | Solo | Team | Enterprise |
|---|---|---|---|
| Sandcastles | $39-49/mo | N/A | $399-499/mo |
| Jasper | $49/mo | $59-69/mo | Custom |
| Copy.ai | $49/mo | $249/mo | $4000/mo |
| Descript | $24/mo | $35/mo | $65+/mo |
| Kapwing | $16-24/mo | $50/mo | Custom |
| Pictory | $19-23/mo | $99/mo | Custom |
| InVideo | $20/mo | — | — |

### 7 Market Gaps CoScript Can Fill

1. **No tool bridges script writing + production workflow for agencies** — Writing tools (Jasper, Copy.ai) and video tools (Descript, Kapwing) are separate worlds
2. **No competitor targets creative agencies specifically** — Sandcastles = individual creators. Jasper = marketing teams. Nobody serves the 5-20 person agency.
3. **Client collaboration on video scripts is broken** — Agencies share via Google Docs, get feedback via email, track manually
4. **Content brief to deliverable pipeline is fragmented** — Brief → research → script → storyboard → shot list → review → delivery lives in 6 different tools
5. **Research engine + agency workflow doesn't exist** — Sandcastles proved research-first works for creators. Nobody brought it to agencies.
6. **Multi-client brand voice for video doesn't exist** — Jasper has brand voice but not video-specific (pacing, hook style, CTA patterns)
7. **Production metadata isn't connected to scripts** — Equipment, locations, talent, shoot time all tracked in disconnected spreadsheets

---

## PART 3: RECOMMENDED V2 FEATURE SET

### The Pitch
> "CoScript is the first AI-powered script studio built for creative agencies. From content brief to client-approved script to production-ready deliverable — one tool, every client, every format."

### Tier 1: Launch Features (MVP)

| Feature | Why |
|---|---|
| AI Script Engine (multi-format, multi-platform) | Core product — every competitor has this |
| Client Brand Vaults (per-client voice, hooks, style, guidelines) | Agencies manage 10+ brands. Nobody does this for video. |
| Hook & Style Library (tag by client/format/platform) | Direct from Sandcastles, adapted for multi-client |
| Script Templates (30+ by format, industry, platform) | Table stakes — Jasper/InVideo set expectation |
| Content Brief Builder (structured intake form) | Solves agency intake chaos |
| Real-time Collaboration (multi-user editing, comments, suggestions) | Every serious tool has this now |
| Project Dashboard (by client, by project, status pipeline) | No script tool has agency-grade PM |
| Export Suite (PDF, DOCX, Google Docs, Markdown, teleprompter) | Basic hygiene |
| Revision History with Visual Diff | Critical for client-facing work |

### Tier 2: Differentiators (Post-Launch)

| Feature | Why |
|---|---|
| Client Review Portal (branded, no-login, comment per line, approve/reject) | KILLER FEATURE. Agencies will pay for this alone. |
| Production Notes Layer (shot type, equipment, location, talent per section) | Bridges script → production. Nobody does this. |
| Viral Research Engine (watchlists, transcript analysis, hook extraction) | Sandcastles for agencies. Massive moat. |
| AI Storyboard Sketches (from script descriptions) | LTX Studio / Boords territory, integrated |
| Content Calendar (visual timeline across clients) | Currently in separate PM tools |
| Analytics Feedback Loop (produced content → performance → winning patterns) | Nobody closes this loop |

### Tier 3: Enterprise

| Feature | Why |
|---|---|
| API & Webhooks (Monday, Asana, Frame.io, Slack) | Enterprise agencies demand this |
| Multi-Language (translation + cultural adaptation) | Growing agencies need this |
| Cost Estimator (AI production cost from script complexity) | Agencies love this for scoping |
| White-Label (agencies rebrand for clients) | Premium revenue stream |
| Team Analytics (writer speed, approval rates, client satisfaction) | Management layer |

### Recommended Pricing
| Tier | Price | Target | Limits |
|---|---|---|---|
| Solo Creator | $29/mo | Freelance videographers | 1 brand vault, 50 scripts/mo |
| Agency | $79/mo | Small agencies (2-5) | 10 brand vaults, unlimited scripts, collab, client portal |
| Studio | $199/mo | Larger agencies (5-20) | Unlimited vaults, research engine, storyboards, analytics |
| Enterprise | Custom | Large production cos | API, white-label, SSO, dedicated CSM |

---

## PART 4: EXISTING FOUNDATION TO EXTEND

### Keep (extend, don't rebuild)
- 7 DB tables (scripts, script_versions, frameworks, vault_items, watchlists, research_items, share_links)
- 17 API routes
- 5 AI endpoints
- Auth system (email/password + Google OAuth + SSR middleware)
- Dark theme / design system (CSS variables)
- Shell component (sidebar nav)

### Fix immediately
1. Editor `load` param (broken edit flow)
2. Rewrite endpoint → wire to UI
3. Analyze URL → wire to UI
4. Score auto-save on generation
5. Status management UI
6. AI JSON parsing (structured output instead of regex)

### Delete
- `packages/types/` (dead monorepo code)
- `packages/api-client/` (dead monorepo code)
