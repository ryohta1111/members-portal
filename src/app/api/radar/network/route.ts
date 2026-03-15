import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabase } from '@/lib/radarSupabase'

export const revalidate = 300

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  const db = getRadarSupabase()

  // Get scores
  let scoresQuery = db.from('radar_scores').select('*')
  if (eventId) scoresQuery = scoresQuery.eq('event_id', eventId)
  const { data: scores } = await scoresQuery.order('score', { ascending: false }).limit(50)

  if (!scores || scores.length === 0) return NextResponse.json({ nodes: [], links: [] })

  // Get user info
  const xIds = scores.map(s => s.x_id).filter(Boolean)
  const { data: users } = await db.from('radar_x_users').select('*').in('x_id', xIds)
  const userMap = new Map((users || []).map(u => [u.x_id, u]))

  // Build nodes
  const nodes = scores.map((s, i) => {
    const u = userMap.get(s.x_id)
    return {
      id: s.x_id,
      username: u?.username || 'unknown',
      display_name: u?.display_name || '',
      followers_count: u?.followers_count || 0,
      score: s.score || 0,
      isMe: false,
      profile_image_url: u?.profile_image_url || null,
      rank: i + 1,
    }
  })

  // Build links: hub-and-spoke model
  // Top 5 users are "hubs" — other users connect to 1-2 random hubs
  // This creates a realistic network structure instead of full mesh
  const links: Array<{ source: string; target: string; strength: number }> = []
  const hubCount = Math.min(5, nodes.length)
  const hubs = nodes.slice(0, hubCount)
  const others = nodes.slice(hubCount)

  // Connect hubs to each other
  for (let i = 0; i < hubs.length; i++) {
    for (let j = i + 1; j < hubs.length; j++) {
      links.push({
        source: hubs[i].id,
        target: hubs[j].id,
        strength: Math.min(hubs[i].score, hubs[j].score) / 100,
      })
    }
  }

  // Connect each non-hub to 1-2 hubs based on score proximity
  for (const node of others) {
    // Connect to the closest hub by score
    const hubIndex = Math.floor((node.rank - hubCount) % hubCount)
    links.push({
      source: node.id,
      target: hubs[hubIndex].id,
      strength: node.score / 200,
    })

    // 50% chance to connect to a second hub
    if (node.score > 50 && hubCount > 1) {
      const hub2 = (hubIndex + 1) % hubCount
      links.push({
        source: node.id,
        target: hubs[hub2].id,
        strength: node.score / 400,
      })
    }
  }

  return NextResponse.json({ nodes, links })
}
