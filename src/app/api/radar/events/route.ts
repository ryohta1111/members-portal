import { NextResponse } from 'next/server'
import { getRadarSupabase } from '@/lib/radarSupabase'

export const revalidate = 300

export async function GET() {
  const db = getRadarSupabase()
  const { data, error } = await db
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('start_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = new Date().toISOString()
  const active = data?.find(e => e.start_at <= now && e.end_at > now) || null

  return NextResponse.json({ events: data || [], active })
}
