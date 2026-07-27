import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Database row types (match the Supabase table columns exactly) ────────────

export type BeyRow = {
  id: string
  name: string | null
  build: string
  image_url: string | null
  created_at: string
}

export type EventRow = {
  id: string
  name: string
  event_date: string
  created_at: string
}

export type EventBeyEntryRow = {
  id: string
  event_id: string
  bey_id: string
  round_codes: string
  created_at: string
}
