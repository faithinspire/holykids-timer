import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

if (!url.startsWith('http')) {
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL')
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
})

export function getSupabaseClient(): SupabaseClient {
  return supabase
}
