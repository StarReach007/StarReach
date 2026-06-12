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

Schema lives in `supabase/migrations/` (applied via `make push`). The `players`
row is keyed to `auth.users` through `auth_user_id`, and RLS scopes every
read/write to the owner:

```sql
create policy "read own"   on players for select using (auth_user_id = auth.uid());
create policy "insert own" on players for insert with check (auth_user_id = auth.uid());
create policy "update own" on players for update
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
```

A `SECURITY DEFINER` trigger on `auth.users` creates the player row at sign-up.
See the migration for the full table + trigger definition.

### Auth flow (js/auth.js)

Real Supabase Auth — email + password, nothing faked.

```
register(email, username, password):
  - validate email / callsign (>=2, [a-z0-9_]) / password (>=6)
  - supabase.auth.signUp({ email, password, data:{ username } })
  - DB trigger creates the players row (auth_user_id = new user id)
  - return player row, or null if email confirmation is pending

login(email, password):
  - supabase.auth.signInWithPassword → load own players row (RLS-scoped)

continueAsGuest():
  - local-only profile in localStorage 'starreach_guest' (no cloud saves)

autoLogin():
  - resume Supabase session if present, else saved guest, else null
```

Anyone can play immediately via **Play as Guest**; cloud accounts are real
email/password with per-user RLS (`auth_user_id = auth.uid()`).

### Title screen

- PixiJS animated starfield + glowing title
- HTML overlay input for callsign (simpler than PixiJS text input)
- LAUNCH button → loginOrRegister → transition to game screen

---

## Direction (v2): Red Alert-style space colonization

> Full design: `docs/superpowers/specs/2026-06-13-starreach-v2-direction.md`

2D **isometric RTS-style base building** connected by the playable rocket
flight game. Core loop: **build → harvest → launch → fly → land → build
again**. Conquest in v1 = colonizing Moon → Mars → Europa → Titan (economy
first; combat is a later phase).

## Phase 2: Intro FMV ✅

Tap-to-start gate (unlocks audio) → landing video full-screen with sound,
tap to skip → normal boot. `js/intro.js` + `public/assets/intro.mp4`.

## Phase 3: Isometric base MVP on the Moon

- Iso tile grid renderer + depth sorting (iso math isolated in one module)
- Pinch/drag camera; tap-to-place buildings; ore patches; harvest-tick economy
- RA-style build sidebar (PixiJS)
- Four structures: Landing Site (HQ), Power Plant, Ore Refinery, Rocket Pad
- Base state persisted per planet (Supabase for accounts, localStorage for guests)

## Phase 4: Rocket flight port (travel layer)

- Port the legacy canvas prototype to PixiJS, physics **unchanged**:
  GRAVITY 0.028 · COAST_DRAG 0.9985 · MAX_THRUST 0.042 · rotation steering (no auto-center, full 360°) · landing thresholds vy > 3.5 explode / 1.5–3.5 damage / < 1.5 safe
- Framed as travel between planets: landing quality determines surviving cargo

## Phase 5: Star chart

Planet-selection map stitching bases + flights into one campaign.

## Phase 6: RA-style UI skin + PixiJS auth modal

Military-console aesthetic; replaces the HTML auth card with a full-PixiJS
modal (hidden DOM input only as keyboard conduit).

## Later: combat

AI defenders on contested planets first; PvP only after that, if ever.

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
