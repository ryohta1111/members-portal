import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabase } from '@/lib/radarSupabase'

export const revalidate = 300

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  const db = getRadarSupabase()

  let query = db.from('radar_scores').select('*, radar_x_users(*)')
  if (eventId) query = query.eq('event_id', eventId)
  query = query.order('score', { ascending: false }).limit(100)

  const { data, error } = await query

  if (error) {
    // Fallback: separate queries
    let scoresQuery = db.from('radar_scores').select('*')
    if (eventId) scoresQuery = scoresQuery.eq('event_id', eventId)
    const { data: scores } = await scoresQuery.order('score', { ascending: false }).limit(100)

    if (!scores || scores.length === 0) return NextResponse.json([])

    const xIds = scores.map(s => s.x_id).filter(Boolean)
    const { data: users } = await db.from('radar_x_users').select('*').in('x_id', xIds)
    const userMap = new Map((users || []).map(u => [u.x_id, u]))

    const result = scores.map((s, i) => {
      const u = userMap.get(s.x_id)
      return {
        rank: i + 1,
        x_id: s.x_id,
        username: u?.username || 'unknown',
        display_name: u?.display_name || '',
        profile_image_url: u?.profile_image_url || null,
        followers_count: u?.followers_count || 0,
        period_posts: s.period_posts || 0,
        score: s.score || 0,
        follower_score: s.follower_score || 0,
        post_score: s.post_score || 0,
        like_score: s.like_score || 0,
        rt_score: s.rt_score || 0,
        reply_score: s.reply_score || 0,
        intl_bonus: s.intl_bonus || 0,
        period_likes: s.period_likes || 0,
        period_retweets: s.period_retweets || 0,
      }
    })
    return NextResponse.json(result)
  }

  const result = (data || []).map((s: any, i: number) => {
    const u = s.radar_x_users
    return {
      rank: i + 1,
      x_id: s.x_id,
      username: u?.username || 'unknown',
      display_name: u?.display_name || '',
      profile_image_url: u?.profile_image_url || null,
      followers_count: u?.followers_count || 0,
      period_posts: s.period_posts || 0,
      score: s.score || 0,
      follower_score: s.follower_score || 0,
      post_score: s.post_score || 0,
      like_score: s.like_score || 0,
      rt_score: s.rt_score || 0,
      reply_score: s.reply_score || 0,
      intl_bonus: s.intl_bonus || 0,
      period_likes: s.period_likes || 0,
      period_retweets: s.period_retweets || 0,
    }
  })

  return NextResponse.json(result)
}
