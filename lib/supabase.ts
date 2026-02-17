/**
 * Server-side Supabase client configuration
 * 
 * This module provides a singleton Supabase client for server-side operations.
 * It validates environment variables at module load time and throws clear errors
 * if configuration is missing.
 * 
 * @module lib/supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Validates and retrieves required environment variables
 * @throws {Error} If required environment variables are missing or invalid
 */
function validateEnvironment(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url.trim() === '') {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not configured. ' +
      'Please set this environment variable in your .env.local file or deployment platform.'
    )
  }

  if (!key || key.trim() === '') {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. ' +
      'Please set this environment variable in your .env.local file or deployment platform.'
    )
  }

  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL format: "${url}". ` +
      'URL must start with http:// or https://'
    )
  }

  return { url, key }
}

/**
 * Creates and returns a Supabase client instance
 * @throws {Error} If environment variables are invalid
 */
function createSupabaseClient(): SupabaseClient {
  const { url, key } = validateEnvironment()
  
  try {
    return createClient(url, key, {
      auth: {
        persistSession: false, // Server-side: no session persistence
        autoRefreshToken: false, // Server-side: no auto-refresh
      },
    })
  } catch (error) {
    throw new Error(
      `Failed to create Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Singleton Supabase client instance
 * Initialized once at module load time
 */
let supabaseInstance: SupabaseClient | undefined

/**
 * Gets the Supabase client instance
 * Creates the instance on first call (lazy initialization)
 * 
 * @returns {SupabaseClient} The Supabase client instance
 * @throws {Error} If environment variables are missing or invalid
 * 
 * @example
 * ```typescript
 * import { getSupabaseClient } from '@/lib/supabase'
 * 
 * export async function GET() {
 *   const supabase = getSupabaseClient()
 *   const { data, error } = await supabase.from('staff').select('*')
 *   // ...
 * }
 * ```
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient()
  }
  return supabaseInstance
}

/**
 * Default export for convenience
 * @deprecated Use named export `getSupabaseClient()` instead for better tree-shaking
 */
export const supabase = getSupabaseClient()

/**
 * Type export for TypeScript consumers
 */
export type { SupabaseClient }
