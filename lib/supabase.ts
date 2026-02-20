import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ Missing Supabase environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', url ? 'Set' : 'Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? 'Set' : 'Missing')
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

if (!url.startsWith('http')) {
  console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL:', url)
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL - must start with http')
}

console.log('✅ Supabase client initialized:', url.substring(0, 30) + '...')

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
})

export function getSupabaseClient(): SupabaseClient {
  return supabase
}
