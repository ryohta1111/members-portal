import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabase } from '@/lib/radarSupabase'

export const revalidate = 300

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  const myXId = req.nextUrl.searchParams.get('my_x_id')
  const db = getRadarSupabase()

  // Get scores
  let scoresQuery = db.from('radar_scores').select('*')
  if (eventId) scoresQuery = scoresQuery.eq('event_id', eventId)
  const { data: scores } = await scoresQuery.order('score', { ascending: false }).limit(50)

  if (!scores || scores.length === 0) return NextResponse.json({ nodes: [], links: [] })

  // Ensure my node is included
  if (myXId && !scores.find(s => s.x_id === myXId)) {
    let myQuery = db.from('radar_scores').select('*').eq('x_id', myXId)
    if (eventId) myQuery = myQuery.eq('event_id', eventId)
    const { data: myScore } = await myQuery.limit(1).single()
    if (myScore) scores.push(myScore)
  }

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

  // Build links from real connection data
  let connQuery = db.from('radar_connections').select('source_x_id, target_x_id, connection_type')
  if (eventId) connQuery = connQuery.eq('event_id', eventId)
  const { data: connections } = await connQuery

  const linkMap = new Map<string, { source: string; target: string; strength: number; types: Set<string> }>()
  const nodeIdSet = new Set(nodes.map(n => n.id))

  for (const conn of connections || []) {
    // Only include connections between nodes we're showing
    if (!nodeIdSet.has(conn.source_x_id) || !nodeIdSet.has(conn.target_x_id)) continue

    const key = [conn.source_x_id, conn.target_x_id].sort().join('-')
    const existing = linkMap.get(key)
    if (existing) {
      existing.strength += 1
      existing.types.add(conn.connection_type)
    } else {
      linkMap.set(key, {
        source: conn.source_x_id,
        target: conn.target_x_id,
        strength: 1,
        types: new Set([conn.connection_type]),
      })
    }
  }

  let links = [...linkMap.values()].map(l => ({
    source: l.source,
    target: l.target,
    strength: l.strength,
    type: l.types.has('replied_to') ? 'reply' : l.types.has('quoted') ? 'quote' : 'retweet',
  }))

  // If no real connections yet, fallback to hub-and-spoke
  if (links.length === 0) {
    const hubCount = Math.min(5, nodes.length)
    const hubs = nodes.slice(0, hubCount)
    const others = nodes.slice(hubCount)

    for (let i = 0; i < hubs.length; i++) {
      for (let j = i + 1; j < hubs.length; j++) {
        links.push({ source: hubs[i].id, target: hubs[j].id, strength: 3, type: 'hub' })
      }
    }
    for (const node of others) {
      const idx = nodes.indexOf(node)
      const hubIndex = Math.floor((idx - hubCount) % hubCount)
      links.push({ source: node.id, target: hubs[hubIndex].id, strength: 1, type: 'hub' })
      if (node.score > 50 && hubCount > 1) {
        const hub2 = (hubIndex + 1) % hubCount
        links.push({ source: node.id, target: hubs[hub2].id, strength: 0.5, type: 'hub' })
      }
    }
  }

  return NextResponse.json({ nodes, links })
}
