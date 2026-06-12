# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Star Reach — mobile-first HTML5 space game with two linked parts: a rocket launch/flight game and a planet mining game. Players launch rockets, reach planets (Moon → Mars → Europa → Titan), mine resources, and buy upgrades.

## Stack & Commands

- **Runtime/PM:** Bun — use `bun install`, `bun run dev`, `bun run build` (never npm/yarn/pnpm)
- **Build:** Vite (dev server + production build to `dist/`)
- **Renderer:** PixiJS v8 — note v8 API: `new Text({ text, style })`, `graphics.rect().fill()`, `await app.init()`
- **DB/Auth:** Supabase — username-only auth (no passwords/email), `players` table
- **Deploy:** Vercel auto-deploys on push to `main`

```bash
bun install        # install deps
bun run dev        # dev server (Vite)
bun run build      # production build → dist/
```

## Architecture

- `src/main.js` — PixiJS Application init + screen routing (title ↔ game)
- `src/auth.js` — `loginOrRegister(username)` / `autoLogin()` / `logout()`. Username saved to localStorage key `starreach_user`. Falls back to local guest mode when Supabase env vars are missing.
- `src/supabase.js` — client init from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; exports `null` when unconfigured
- `src/screens/` — each screen exports `create<Name>Screen(app, ...)` returning a PixiJS `Container`
- `index.html` — contains the HTML auth overlay (input + button); screens toggle it via CSS classes `visible`/`active`

## Conventions

- ES modules, no TypeScript (plain JS)
- Screens own their own tickers; destroy containers with `{ children: true }` on transition
- HTML overlays for text input (PixiJS has no native input); keep z-index above canvas
- Game data lives in Supabase `players` row: `coins`, `best_altitude`, `upgrades` (jsonb)
- Usernames normalized: trim → lowercase → strip non `[a-z0-9_]`, min 2 chars

## Legacy Code (reference, not in repo yet)

Original prototypes exist as single-file HTML5 canvas games (`star-reach.html` ~2500 lines, `planet-mining.html` ~1050 lines) pending PixiJS port. Key tuned values to preserve during port: GRAVITY 0.028, COAST_DRAG 0.9985, MAX_THRUST 0.042, steering = rotation (not strafe, no auto-center, full 360°), landing thresholds (vy > 3.5 explode / 1.5–3.5 damage / < 1.5 safe).

## Roadmap

1. Port rocket game to PixiJS (keep physics identical)
2. Port mining game
3. Shared wallet via Supabase `players.coins`
4. Tier-based rocket art, landing sequences, sounds
