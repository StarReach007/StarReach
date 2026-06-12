# Design: StarReach v2 — Red Alert direction

**Date:** 2026-06-13
**Status:** Approved
**Supersedes:** the game-direction parts of `2026-06-12-auth-buttons-design.md`
(its PixiJS-everything UI goal lives on as roadmap item 5).

## Vision

A mobile-first, 2D **isometric, Red Alert-style space colonization game**
built on PixiJS v8. The player lands on a planet, builds a base, harvests ore
to grow an economy, constructs a rocket — then **personally flies it** (the
original skill-based flight game) to the next world. Conquest in v1 means
colonizing the chain **Moon → Mars → Europa → Titan**. Combat arrives in a
later phase on top of the same systems.

Core loop: **build → harvest → launch → fly → land → build again.**
The skill-based flight game as the travel layer is the differentiator.

## Decisions (from brainstorming, 2026-06-12/13)

| Question | Decision |
|---|---|
| Genre | Full direction change to RA-style RTS (not just UI skin) |
| "Conquer" in v1 | Economy first: conquest = colonization; no enemies in v1 |
| Travel between planets | Playable rocket flight (legacy tuned physics survive) |
| Perspective | Isometric, like Red Alert (diamond tiles, 3/4-angle sprites) |
| UI technology | PixiJS for everything; HTML only as hidden input conduits |
| Intro | FMV-style landing video at boot, tap-to-start gate (shipped) |

## Roadmap (each item gets its own spec → plan → build cycle)

1. **Intro FMV** — ✅ shipped 2026-06-13 (`js/intro.js`, `public/assets/intro.mp4`)
2. **Isometric base MVP on the Moon** — next. Iso tile grid + depth sorting,
   pinch/drag camera, tap-to-place buildings, ore patches, harvest-tick
   economy, RA-style build sidebar (PixiJS). Exactly four structures:
   Landing Site (HQ — the rocket you arrived in), Power Plant, Ore Refinery,
   Rocket Pad. Base state persisted per planet.
3. **Rocket flight port** — legacy physics unchanged (GRAVITY 0.028,
   COAST_DRAG 0.9985, MAX_THRUST 0.042, landing thresholds); framed as travel:
   landing quality determines how much cargo survives.
4. **Star chart** — planet-selection map stitching bases and flights into one
   campaign (Moon → Mars → Europa → Titan).
5. **RA-style UI skin + PixiJS auth modal** — military-console aesthetic;
   replaces the HTML auth card (absorbs the remainder of the 2026-06-12 spec).
6. **Later:** AI defenders on contested planets; PvP only after that, if ever.

## Architecture principles for the RTS work

- Isometric math (tile↔screen projection, z-sort order) isolated in one
  module; no other code does iso arithmetic.
- Game state (base layout, resources) is plain serializable data, separate
  from PixiJS display objects — enables saves, future server authority, and
  testing without a renderer.
- Screens keep the existing contract: `create<Name>Screen(...)` → `Container`
  with optional `.cleanup()`.

## Risks / constraints

- **Iso art pipeline:** every structure needs consistent 3/4-angle art;
  Higgsfield generations need a locked camera prompt.
- **Mobile controls:** RA was mouse-driven; v1 is tap-select / tap-place with
  pinch zoom. No drag-box multi-select until units exist.
- **Cheating:** per-user RLS now guards rows, but the client still computes
  the economy. Acceptable until leaderboards/PvP; revisit server authority then.
- **Asset weight:** intro video is ~20 MB for 10 s; re-encode (~3 MB) before
  any public launch.

## Out of scope for v1 (explicit)

Combat of any kind, multiplayer, fog of war, unit pathfinding, sounds/music
beyond the intro video, guest→account progress merge.
