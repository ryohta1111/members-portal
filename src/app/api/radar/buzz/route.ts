import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabase } from '@/lib/radarSupabase'

export const revalidate = 300

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  const db = getRadarSupabase()

  // Get top posts by engagement (likes + retweets + replies)
  let query = db.from('radar_posts').select('*')
  if (eventId) query = query.eq('event_id', eventId)
  const { data: posts } = await query.order('like_count', { ascending: false }).limit(200)

  if (!posts || posts.length === 0) return NextResponse.json([])

  // Sort by total engagement
  const sorted = posts
    .map(p => ({ ...p, engagement: (p.like_count || 0) + (p.retweet_count || 0) + (p.reply_count || 0) }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 20)

  // Get user info
  const authorIds = [...new Set(sorted.map(p => p.author_id))]
  const { data: users } = await db.from('radar_x_users').select('*').in('x_id', authorIds)
  const userMap = new Map((users || []).map(u => [u.x_id, u]))

  const result = sorted.map(p => {
    const u = userMap.get(p.author_id)
    return {
      tweet_id: p.tweet_id,
      text: p.text,
      like_count: p.like_count,
      retweet_count: p.retweet_count,
      reply_count: p.reply_count,
      created_at: p.created_at,
      author: {
        x_id: p.author_id,
        username: u?.username || 'unknown',
        display_name: u?.display_name || '',
        profile_image_url: u?.profile_image_url || null,
      },
    }
  })

  return NextResponse.json(result)
}
