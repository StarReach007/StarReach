# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Star Reach — mobile-first HTML5 space game: **Red Alert-style isometric base building** connected by a skill-based rocket flight game. Players build a base, harvest ore, construct a rocket, fly it themselves to the next planet (Moon → Mars → Europa → Titan), and colonize space. Economy first; combat is a later phase. Direction spec: `docs/superpowers/specs/2026-06-13-starreach-v2-direction.md`.

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

- `js/main.js` — PixiJS Application init + screen routing (title ↔ game); boots Pixi + session resume behind the intro video
- `js/intro.js` — boot-time intro: TAP TO START gate (unlocks audio) → landing video (`public/assets/intro.mp4`) with sound, tap to skip
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

Launch from Earth in a junky rocket and **conquer space, Red Alert-style**: land on the Moon, build a base from your landing craft, harvest ore, and construct better rockets — then fly them yourself to farther worlds (Mars → Europa → Titan), founding a colony on each. (Narrative beats live in `StoryBoard.md`.)

## Roadmap (v2 — see PLAN.md for detail)

1. ✅ Intro FMV (tap-to-start gate → landing video)
2. Isometric base MVP on the Moon (4 structures, harvest economy, RA-style build sidebar)
3. Rocket flight port (physics identical) as the travel layer
4. Star chart connecting planets
5. RA-style UI skin + full-PixiJS auth modal
6. Later: AI defenders, then maybe PvP
