# Plan: StarReach — PixiJS + Supabase + Vercel

## Context

The StarReach repo starts as a blank slate. The original game prototypes (`star-reach.html`, `planet-mining.html`) are single-file HTML5 canvas games pending a port. This plan covers the full modern stack: **PixiJS v8** as the renderer, **Vite** as the build tool, **Bun** as the runtime/package manager, **Supabase** as the database with username-only auth (no password, no email), and **Vercel** for hosting with auto-deploy on every push to `main`.

Auth flow: user types a callsign → Supabase checks if that player exists → creates or loads their record. Username stored in localStorage for auto-login on return visits.

---

## Phase 1: Project Scaffolding ✅

### Project structure

```
StarReach/
├── index.html               # Vite entry + HTML auth overlay
├── src/
│   ├── main.js              # PixiJS Application init + screen router
│   ├── supabase.js          # Supabase client (reads VITE_ env vars)
│   ├── auth.js              # Username login/register logic
│   └── screens/
│       ├── titleScreen.js   # Title + username entry form
│       └── gameScreen.js    # Placeholder (PixiJS canvas mount point)
├── public/assets/           # Game art (Higgsfield PNGs)
├── package.json             # pixi.js, @supabase/supabase-js, vite
├── vite.config.js
├── vercel.json
└── .env.example
```

**Commands (Bun):** `bun install` · `bun run dev` · `bun run build`

### Supabase — players table

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

### Auth flow (src/auth.js)

```
loginOrRegister(username):
  1. Trim + lowercase + strip to [a-z0-9_], min 2 chars
  2. SELECT from players WHERE username = input
  3. Found  → update last_seen, return player row
  4. Missing → INSERT new row, return new player
  5. Save username to localStorage 'starreach_user'

autoLogin():
  Read localStorage → loginOrRegister(saved) → skip title form
```

Falls back to **local guest mode** when Supabase env vars are missing.

### Title screen

- PixiJS animated starfield + glowing title
- HTML overlay input for callsign (simpler than PixiJS text input)
- LAUNCH button → loginOrRegister → transition to game screen

---

## Phase 2: Port rocket game to PixiJS

- Replace `canvas.getContext('2d')` with PixiJS `Application`
- `ctx.drawImage` → `Sprite`, `ctx.fillRect` → `Graphics`
- Keep all physics, collision, and upgrade logic **unchanged**:
  GRAVITY 0.028 · COAST_DRAG 0.9985 · MAX_THRUST 0.042 · rotation steering (no auto-center, full 360°) · landing thresholds vy > 3.5 explode / 1.5–3.5 damage / < 1.5 safe
- Game loop: `app.ticker.add(delta => update(delta))`

## Phase 3: Moon arrival → mining → colony

Story: reach the Moon, mine its resources, and spend them to **build a colony** that
funds better rockets and farther worlds (Mars → Europa → Titan).

- Moon arrival screen → resource mining minigame
- Colony builder funded by mined resources
- Shared wallet via Supabase `players.coins`; upgrades synced to `players.upgrades` (jsonb)
- Navigation between launch, mining, and colony views

---

## Vercel auto-deploy (one-time setup)

1. Push code to GitHub `main`
2. vercel.com → New Project → Import `StarReach007/StarReach`
3. Vercel auto-detects Vite
4. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
5. Deploy → every future push to `main` auto-deploys

---

## Verification checklist

- [x] `bun install` → no errors (pixi.js 8.19, vite 6.4, supabase 2.108)
- [x] `bun run build` → 763 modules bundled to `dist/`
- [x] `bun run dev` → server boots; index.html / js / css all serve HTTP 200
- [ ] Enter username → row appears in Supabase `players` table *(needs .env creds)*
- [ ] Refresh → auto-login skips title screen *(needs .env creds)*
- [ ] Same username on another browser → loads same player *(needs .env creds)*
- [ ] Push to `main` → Vercel builds and serves live URL

> **Note:** Phase 1 structure was implemented into `js/` + `css/` + root `index.html`
> (matching the Makefile lint targets), not the `src/` tree shown above. The original
> single-file canvas prototype that previously occupied `index.html` was replaced by
> this scaffold and lives in git history (`git show HEAD:index.html`).
