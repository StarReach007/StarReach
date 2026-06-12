# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Star Reach — mobile-first HTML5 space game with two linked parts: a rocket launch/flight game and a planet mining game. Players launch rockets, reach planets (Moon → Mars → Europa → Titan), mine resources, and buy upgrades.

## Stack & Commands

- **Runtime/PM:** Bun — use `bun install`, `bun run dev`, `bun run build` (never npm/yarn/pnpm)
- **Build:** Vite (dev server + production build to `dist/`)
- **Renderer:** PixiJS v8 — note v8 API: `new Text({ text, style })`, `graphics.rect().fill()`, `await app.init()`
- **DB/Auth:** Supabase Auth — real email + password accounts + a callsign; per-user RLS on the `players` table (rows scoped by `auth.uid()`). Guest mode plays locally without an account.
- **Deploy:** Vercel auto-deploys on push to `main`

```bash
bun install        # install deps
bun run dev        # dev server (Vite)
bun run build      # production build → dist/
```

## Architecture

Source lives in `js/` and `css/` (matches the Makefile lint targets); `index.html` at the repo root is the Vite entry point.

- `js/main.js` — PixiJS Application init + screen routing (title ↔ game)
- `js/auth.js` — `register(email, username, password)` / `login(email, password)` / `continueAsGuest()` / `autoLogin()` / `logout()` / `normalizeUsername()`. Real Supabase Auth sessions; guest progress saved to localStorage key `starreach_guest`. `register()` returns `null` when email confirmation is pending.
- `js/supabase.js` — client init from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; exports `null` when unconfigured
- `js/screens/` — each screen exports `create<Name>Screen(app, ...)` returning a PixiJS `Container` (with an optional `.cleanup()` called on transition)
- `css/style.css` — global + auth-overlay styles
- `index.html` — contains the HTML auth overlay (input + button); the title screen toggles it via the `visible` CSS class
- `supabase/migrations/` — schema applied via `make push` (`bunx supabase db push`)

## Conventions

- ES modules, no TypeScript (plain JS)
- **Bun + Vite + PixiJS only — never npm/yarn/pnpm**, not even `npm view`
- Ticker callbacks receive a PixiJS `Ticker` object in v8: use `time.deltaTime`, not a bare number
- Screens own their own tickers; destroy containers with `{ children: true }` on transition
- HTML overlays for text input (PixiJS has no native input); keep z-index above canvas
- Game data lives in Supabase `players` row: `coins`, `best_altitude`, `upgrades` (jsonb)
- Usernames normalized: trim → lowercase → strip non `[a-z0-9_]`, min 2 chars

## Legacy Code (reference — in git history)

The original single-file canvas prototype (~2,927-line `index.html`) was removed from the working tree when the PixiJS scaffold replaced it. It is recoverable for the Phase 2 port: `git show HEAD:index.html > legacy-star-reach.html`. Key tuned values to preserve during port: GRAVITY 0.028, COAST_DRAG 0.9985, MAX_THRUST 0.042, steering = rotation (not strafe, no auto-center, full 360°), landing thresholds (vy > 3.5 explode / 1.5–3.5 damage / < 1.5 safe).

## Story

Launch a junky rocket from Earth, fly through the atmosphere, and **reach the Moon**. On arrival, mine its resources and spend them to **build a colony**, funding better rockets and reaching farther worlds (Mars → Europa → Titan).

## Roadmap

1. Port rocket game to PixiJS (keep physics identical)
2. Moon arrival → resource mining
3. Colony builder funded by mined resources
4. Shared wallet via Supabase `players.coins`
5. Tier-based rocket art, landing sequences, sounds
