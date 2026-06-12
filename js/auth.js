import { supabase } from './supabase.js'

// Guest progress is kept locally so anyone can play without an account.
const GUEST_KEY = 'starreach_guest'
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Normalize a raw callsign into a stable username.
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

function requireAccountConfigured() {
  if (!supabase) {
    throw new Error('Cloud accounts are unavailable here — use Play as Guest.')
  }
}

/** Load the signed-in user's own player row (RLS returns only their row). */
async function loadOwnPlayer() {
  const { data, error } = await supabase.from('players').select('*').single()
  if (error) throw error
  await supabase
    .from('players')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', data.id)
  return data
}

function readGuest() {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Create a real account (email + password) with a chosen callsign.
 * @returns {Promise<object|null>} player record, or null if email confirmation
 *   is required before the first sign-in.
 */
export async function register(email, rawUsername, password) {
  requireAccountConfigured()
  const username = normalizeUsername(rawUsername)
  if (!EMAIL_RE.test(String(email).trim())) {
    throw new Error('Enter a valid email address.')
  }
  if (username.length < 2) {
    throw new Error('Callsign must be at least 2 characters (a-z, 0-9, _).')
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }

  const { data, error } = await supabase.auth.signUp({
    email: String(email).trim(),
    password,
    options: { data: { username } },
  })
  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      throw new Error('That email already has an account — try logging in.')
    }
    throw error
  }
  // No session means the project requires email confirmation first.
  if (!data.session) return null
  return loadOwnPlayer()
}

/**
 * Sign in to an existing account with email + password.
 * @returns {Promise<object>} the player record
 */
export async function login(email, password) {
  requireAccountConfigured()
  const { error } = await supabase.auth.signInWithPassword({
    email: String(email).trim(),
    password,
  })
  if (error) throw new Error('Invalid email or password.')
  return loadOwnPlayer()
}

/**
 * Play without an account. Progress is stored locally only (no cloud saves).
 * @returns {object} a local guest profile
 */
export function continueAsGuest() {
  let profile = readGuest()
  if (!profile) {
    profile = { username: 'guest', coins: 0, best_altitude: 0, upgrades: {}, guest: true }
    localStorage.setItem(GUEST_KEY, JSON.stringify(profile))
  }
  return profile
}

/**
 * Resume a previous session: a real Supabase session if signed in, otherwise a
 * saved guest profile, otherwise null (show the title form).
 * @returns {Promise<object|null>}
 */
export async function autoLogin() {
  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      try {
        return await loadOwnPlayer()
      } catch {
        /* fall through to guest / null */
      }
    }
  }
  return readGuest()
}

export async function logout() {
  if (supabase) await supabase.auth.signOut()
  localStorage.removeItem(GUEST_KEY)
}
