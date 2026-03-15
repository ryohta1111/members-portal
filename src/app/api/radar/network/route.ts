import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabase } from '@/lib/radarSupabase'

export const revalidate = 300

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  const db = getRadarSupabase()

  // Get scores (which have user stats)
  let scoresQuery = db.from('radar_scores').select('*')
  if (eventId) scoresQuery = scoresQuery.eq('event_id', eventId)
  const { data: scores } = await scoresQuery.order('score', { ascending: false }).limit(50)

  if (!scores || scores.length === 0) return NextResponse.json({ nodes: [], links: [] })

  // Get user info for all scored users
  const xIds = scores.map(s => s.x_id).filter(Boolean)
  const { data: users } = await db.from('radar_x_users').select('*').in('x_id', xIds)
  const userMap = new Map((users || []).map(u => [u.x_id, u]))

  // Get posts for link generation
  let postsQuery = db.from('radar_posts').select('author_id, tweet_id, text')
  if (eventId) postsQuery = postsQuery.eq('event_id', eventId)
  const { data: posts } = await postsQuery

  // Build nodes
  const nodes = scores.map(s => {
    const u = userMap.get(s.x_id)
    return {
      id: s.x_id,
      username: u?.username || 'unknown',
      display_name: u?.display_name || '',
      followers_count: u?.followers_count || 0,
      score: s.score || 0,
      isMe: false,
      profile_image_url: u?.profile_image_url || null,
    }
  })

  // Build links - connect users who both posted (simplified: connect by shared hashtag activity)
  // For now, create links between top users based on co-occurrence in similar time windows
  const links: Array<{ source: string; target: string; strength: number }> = []
  const authorPosts = new Map<string, string[]>()
  for (const p of posts || []) {
    const arr = authorPosts.get(p.author_id) || []
    arr.push(p.tweet_id)
    authorPosts.set(p.author_id, arr)
  }

  // Create links between users who both have posts (weighted by min post count)
  const nodeIds = new Set(nodes.map(n => n.id))
  const nodeArray = [...nodeIds]
  for (let i = 0; i < nodeArray.length; i++) {
    for (let j = i + 1; j < nodeArray.length; j++) {
      const a = authorPosts.get(nodeArray[i])?.length || 0
      const b = authorPosts.get(nodeArray[j])?.length || 0
      if (a > 0 && b > 0) {
        links.push({
          source: nodeArray[i],
          target: nodeArray[j],
          strength: Math.min(a, b),
        })
      }
    }
  }

  // Limit links to top connections to avoid clutter
  const sortedLinks = links.sort((a, b) => b.strength - a.strength).slice(0, 100)

  return NextResponse.json({ nodes, links: sortedLinks })
}
