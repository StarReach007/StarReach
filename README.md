# 🚀 Star Reach

Mobile-first HTML5 space game. Build a junky rocket, launch it through the atmosphere, reach distant planets, then mine them for resources to fund better upgrades.

**Two linked games:**
- **Rocket Game** — launch, steer, dodge obstacles, collect coins/fuel, reach the Moon → Mars → Europa → Titan
- **Planet Mining** — drill into planets, collect ores and artifacts, sell for credits

## Tech Stack

| Layer | Tool |
|---|---|
| Renderer | [PixiJS v8](https://pixijs.com) |
| Build tool | [Vite](https://vitejs.dev) |
| Runtime / package manager | [Bun](https://bun.sh) |
| Database & auth | [Supabase](https://supabase.com) (username-only login) |
| Hosting | [Vercel](https://vercel.com) (auto-deploy on push to `main`) |

## Getting Started

```bash
bun install
bun run dev
```

Open the printed localhost URL. The game runs in any modern browser.

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase project credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Without credentials the game runs in **local-only guest mode** (no cloud saves).

## Database Setup (Supabase)

Run this SQL in the Supabase SQL editor:

```sql
create table players (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  coins integer default 0,
  best_altitude integer default 0,
  upgrades jsonb default '{}',
  created_at timestamptz default now(),
  last_seen timestamptz default now()
);

alter table players enable row level security;
create policy "public read" on players for select using (true);
create policy "public insert" on players for insert with check (true);
create policy "public update own" on players for update using (true);
```

## Deployment

Every push to `main` auto-deploys via Vercel. One-time setup:

1. [vercel.com](https://vercel.com) → New Project → Import `StarReach007/StarReach`
2. Vercel auto-detects Vite
3. Add the two `VITE_SUPABASE_*` env vars in project settings
4. Deploy

## Project Structure

```
├── index.html               # Vite entry point + HTML auth overlay
├── js/
│   ├── main.js              # PixiJS app init + screen router
│   ├── supabase.js          # Supabase client (null when unconfigured)
│   ├── auth.js              # Username-only login/register + normalize
│   └── screens/
│       ├── titleScreen.js   # Animated starfield + callsign entry
│       └── gameScreen.js    # Game placeholder (rocket game lands here)
├── css/style.css            # Global + auth-overlay styles
├── supabase/migrations/     # DB schema (applied via `make push`)
├── Makefile                 # dev / install / lint / db push targets
├── vercel.json              # Vercel build config
└── vite.config.js           # Vite config
```
