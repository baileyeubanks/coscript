# CO-SCRIPT by Content Co-op

AI-powered content scripting tool for teams. Choose a template, configure your audience, and generate production-ready scripts with Claude AI.

## Features

- **Template Selector** — Social media posts, blog articles, video scripts, and ad copy
- **AI Generation** — Powered by Claude API with template-aware system prompts
- **Script Editor** — Full editor with configurable audience, tone, length, and key points
- **Template-Specific Fields** — Platform selector for social, SEO keywords for blog, scene markers for video, A/B variants for ads
- **Auto-Save** — Drafts save to Supabase every 30 seconds
- **Export** — Print-to-PDF and plain text download
- **Collaboration** — Share scripts via expiring public links
- **Auth** — Supabase authentication (email/password + Google OAuth)

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Supabase (auth + database)
- Anthropic Claude API (content generation)
- Tailwind CSS
- Netlify deployment

## Getting Started

```bash
git clone https://github.com/baileyeubanks/coscript.git
cd coscript
npm install
cp .env.example .env.local
# Fill in your credentials in .env.local
npm run dev
```

Open [http://localhost:4102](http://localhost:4102) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |

## Supabase Setup

Create the required tables:

```sql
create table drafts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  template_type text not null default 'social_media',
  content text default '',
  config jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table share_links (
  id uuid default gen_random_uuid() primary key,
  draft_id uuid references drafts(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table drafts enable row level security;
alter table share_links enable row level security;

create policy "Users manage own drafts" on drafts for all using (auth.uid() = user_id);
create policy "Anyone can read shared links" on share_links for select using (true);
create policy "Users create share links" on share_links for insert with check (auth.uid() = created_by);
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/generate` | Generate content with Claude AI |
| GET | `/api/drafts` | List user's drafts |
| POST | `/api/drafts` | Create new draft |
| GET | `/api/drafts/:id` | Get a draft |
| PUT | `/api/drafts/:id` | Update a draft |
| DELETE | `/api/drafts/:id` | Delete a draft |
| POST | `/api/share` | Create shared link |
| GET | `/shared/:token` | View shared script (public) |

## Deployment

Deploy to Netlify:

```bash
npm run build
```

The `netlify.toml` is pre-configured with the `@netlify/plugin-nextjs` plugin. Connect your repo to Netlify and set environment variables in the dashboard.

## License

MIT
