import { supabase } from './supabase.js'

const STORAGE_KEY = 'starreach_user'

/**
 * Normalize a raw callsign into a stable username key.
 * trim -> lowercase -> strip anything outside [a-z0-9_].
 * @param {string} raw
 * @returns {string}
 */
export function normalizeUsername(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Look up a player by username, creating the row if it doesn't exist.
 * Falls back to a local guest profile when Supabase isn't configured.
 * @param {string} rawUsername
 * @returns {Promise<object>} the player record
 */
export async function loginOrRegister(rawUsername) {
  const username = normalizeUsername(rawUsername)
  if (username.length < 2) {
    throw new Error('Callsign must be at least 2 characters (a-z, 0-9, _).')
  }

  // Guest mode — no backend configured.
  if (!supabase) {
    localStorage.setItem(STORAGE_KEY, username)
    return { username, coins: 0, best_altitude: 0, upgrades: {}, guest: true }
  }

  const { data: existing, error: selErr } = await supabase
    .from('players')
    .select('*')
    .eq('username', username)
    .maybeSingle()
  if (selErr) throw selErr

  let player = existing
  if (player) {
    await supabase
      .from('players')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', player.id)
  } else {
    const { data: created, error: insErr } = await supabase
      .from('players')
      .insert({ username })
      .select()
      .single()
    if (insErr) throw insErr
    player = created
  }

  localStorage.setItem(STORAGE_KEY, username)
  return player
}

/**
 * Try to log in using the username saved in localStorage.
 * @returns {Promise<object|null>} player record, or null if no saved session.
 */
export async function autoLogin() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return null
  try {
    return await loginOrRegister(saved)
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}
