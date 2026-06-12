import { createClient } from '@supabase/supabase-js'

// Vite exposes only VITE_-prefixed env vars to client code.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// When credentials are missing we export null and the app falls back to
// local guest mode (no cloud saves) — see js/auth.js.
export const supabase = url && key ? createClient(url, key) : null

export const isConfigured = Boolean(supabase)
