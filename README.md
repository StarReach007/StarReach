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
| Database & auth | [Supabase](https://supabase.com) (email + password accounts, per-user RLS) |
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

Even with credentials, the **Play as Guest** button always lets anyone play (progress is stored locally, no cloud saves).

## Auth model

- Real **email + password** accounts via Supabase Auth — nothing faked.
- A **callsign** (username) is chosen at sign-up and stored on the player row.
- **Row-level security**: each player can read and write *only their own* row
  (scoped by `auth.uid()`), so accounts have fully isolated history and data.
- **Guest mode**: play instantly with no account; local-only progress.

## Database Setup (Supabase)

Schema lives in `supabase/migrations/` and is applied with the Supabase CLI:

```bash
make push          # bunx supabase db push
```

This creates the `players` table (keyed to `auth.users` via `auth_user_id`),
the per-user RLS policies, and a trigger that creates a player row on sign-up.
If **Confirm email** is enabled in Supabase Auth, new pilots confirm via email
before their first sign-in.

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
