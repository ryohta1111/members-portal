import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null
let _adminClient: SupabaseClient | null = null

export function getRadarSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_RADAR_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_RADAR_SUPABASE_ANON_KEY || ''
    )
  }
  return _client
}

export function getRadarSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_RADAR_SUPABASE_URL || '',
      process.env.RADAR_SUPABASE_SERVICE_ROLE_KEY || ''
    )
  }
  return _adminClient
}
