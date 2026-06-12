# Design: Title-screen auth buttons + in-game MENU

**Date:** 2026-06-12
**Status:** Approved

## Goal

Replace the single always-visible callsign form with an explicit choice on the
title screen — **PLAY AS GUEST** and **LOGIN / JOIN** — and add a **MENU**
button to the game screen that returns to the title without ending the session.

## Decisions (from brainstorming)

- **Guest:** instant play, no callsign. Progress persists in this browser
  (localStorage) and resumes on refresh. Can switch to a real account later.
- **No backend:** when Supabase env vars are missing, Login/Join shows
  "Online accounts are unavailable — play as guest." instead of silently
  creating a local profile (behavior change from the current fallback).
- **MENU:** back to title, **stay signed in**. Title gains a signed-in state;
  refresh still auto-joins the game.
- **UI approach:** all-PixiJS buttons (canvas-rendered, custom pressed/disabled
  states). The HTML overlay shrinks to just the callsign input + status line.

## Components

### 1. `js/ui/button.js` (new)

`createButton(label, { width, onPress, disabled })` → PixiJS `Container`.

- Rounded-rect `Graphics` background + monospace `Text` label.
- `eventMode: 'static'`, `cursor: 'pointer'`, generous mobile hit area.
- Pressed state (darker/scale 0.97) and disabled state (dimmed, ignores input).
- `.setDisabled(bool)` for in-flight requests.
- Used by all screens; no HTML buttons remain.

### 2. Title screen — `js/screens/titleScreen.js`

Signature: `createTitleScreen(app, { overlay, player, onPlay })`.
Three states beneath the existing starfield/title:

| State | Trigger | UI |
|---|---|---|
| Signed out | `player == null` | `PLAY AS GUEST`, `LOGIN / JOIN` (stacked) |
| Signed in | `player != null` (arrived via MENU) | "signed in as \<name\>" + `CONTINUE`, then `PLAY AS GUEST`, `SWITCH ACCOUNT` |
| Login form | tap Login/Join or Switch Account | HTML overlay (input + status only) + PixiJS `LAUNCH` and `BACK` buttons |

- `CONTINUE` → `onPlay(player)` with the existing player.
- `PLAY AS GUEST` → `loginAsGuest()` → `onPlay(guestPlayer)`.
- `LAUNCH` → `loginOrRegister(input.value)`; errors render in `#auth-status`;
  buttons disabled while the request is in flight. Enter in the input submits.
- `BACK` → hide overlay, return to the prior button state.
- `cleanup()` removes ticker, DOM listeners, and hides the overlay (existing
  pattern).

### 3. Auth/session — `js/auth.js`

localStorage keys:

- `starreach_session` — `{"mode":"guest"}` or `{"mode":"account","username":"..."}`.
  A legacy bare `starreach_user` value migrates to an account session on read.
- `starreach_guest` — guest profile JSON `{coins, best_altitude, upgrades}`.
  Created on first guest play. Never deleted by switching accounts; PLAY AS
  GUEST always resumes it.

API:

- `loginAsGuest()` → load-or-create guest profile, set session, return
  `{username:'guest', guest:true, ...profile}`.
- `loginOrRegister(raw)` → unchanged select-or-insert flow, but **throws**
  `"Online accounts are unavailable — play as guest."` when `supabase` is null.
  Sets the account session on success.
- `autoLogin()` → resume per session marker (guest profile or account lookup);
  returns `null` when no session.
- `logout()` → clears `starreach_session` (kept for future use; no UI calls it
  in this feature).
- `saveGuestProgress(profile)` → persist guest profile changes (used by later
  phases; written now so the storage shape has one owner).

### 4. Routing — `js/main.js` + `js/screens/gameScreen.js`

- `main.js` tracks `currentPlayer`. `goToTitle()` passes it (or null);
  `onPlay(player)` sets it and routes to the game.
- Game screen signature: `createGameScreen(app, player, { onMenu })`. A small
  PixiJS `MENU` button (top-right) calls `onMenu` → title in signed-in state.
  Session storage is untouched by MENU.

## Error handling

- All login failures (validation, network, no-backend) surface in
  `#auth-status`; LAUNCH/BACK re-enable afterwards.
- `autoLogin()` failures fall through to the signed-out title (existing
  behavior).

## Out of scope (explicit YAGNI)

- Merging guest progress into an account on login.
- Logout UI (session can be replaced via Switch Account / Play as Guest).
- Responsive re-layout on window resize (screens lay out once at creation,
  matching the existing codebase).

## Known trade-off

LAUNCH/BACK are canvas buttons positioned near, but not in layout flow with,
the DOM input. On mobile the soft keyboard may cover them; Enter-to-submit is
the mitigation. If this proves annoying, moving LAUNCH back into the HTML card
is a small, isolated change.

## Verification

No test infra exists in this repo. Verify by `make lint` plus walking these
flows in the dev server:

1. Fresh visit → signed-out title → PLAY AS GUEST → game as guest.
2. Refresh → resumes guest game directly.
3. MENU → signed-in title → CONTINUE → back in game; session intact.
4. Switch Account with valid creds → account game; PLAY AS GUEST later resumes
   the same guest profile.
5. No `.env` → LOGIN / JOIN → LAUNCH shows the unavailable message; guest path
   still works.
