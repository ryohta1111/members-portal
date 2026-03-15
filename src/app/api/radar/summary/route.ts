import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabase } from '@/lib/radarSupabase'

export const revalidate = 300

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  const db = getRadarSupabase()

  let query = db.from('radar_posts').select('*', { count: 'exact', head: false })
  if (eventId) query = query.eq('event_id', eventId)

  const { data: posts, count: totalPosts } = await query

  // Calculate reach (sum of author followers for unique authors)
  const authorIds = [...new Set((posts || []).map(p => p.author_id))]
  let totalReach = 0
  if (authorIds.length > 0) {
    const { data: users } = await db
      .from('radar_x_users')
      .select('followers_count')
      .in('x_id', authorIds)
    totalReach = (users || []).reduce((s, u) => s + (u.followers_count || 0), 0)
  }

  // Countries
  const countryCodes = [...new Set((posts || []).map(p => p.country_code).filter(Boolean))]

  return NextResponse.json({
    totalPosts: totalPosts || 0,
    totalReach,
    countries: countryCodes.length,
    users: authorIds.length,
  })
}
