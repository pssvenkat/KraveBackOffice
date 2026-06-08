import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses RLS.
 * ONLY use in trusted server contexts (API routes, webhooks).
 * NEVER expose to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. ' +
      'Add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables. ' +
      'Find it at: Supabase Dashboard → Project Settings → API → service_role (secret)'
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
