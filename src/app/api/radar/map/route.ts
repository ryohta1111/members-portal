import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabase } from '@/lib/radarSupabase'

export const revalidate = 300

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  const db = getRadarSupabase()

  let query = db.from('radar_posts').select('country_code')
  if (eventId) query = query.eq('event_id', eventId)

  const { data } = await query

  // Count by country
  const counts: Record<string, number> = {}
  for (const row of data || []) {
    if (row.country_code) {
      counts[row.country_code] = (counts[row.country_code] || 0) + 1
    }
  }

  const sorted = Object.entries(counts)
    .map(([country_code, count]) => ({ country_code, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json(sorted)
}
