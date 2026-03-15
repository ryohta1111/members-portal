import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabase, getRadarSupabaseAdmin } from '@/lib/radarSupabase'

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 })

  const db = getRadarSupabase()
  const dbAdmin = getRadarSupabaseAdmin()

  // Get user's X username
  const { data: user } = await db
    .from('radar_users')
    .select('*')
    .eq('wallet_address', wallet)
    .single()

  if (!user) return NextResponse.json({ registered: false })

  // Auto-link x_id if missing
  let xId = user.x_id
  if (!xId && user.x_username) {
    const { data: xUser } = await db
      .from('radar_x_users')
      .select('x_id')
      .ilike('username', user.x_username)
      .single()

    if (xUser) {
      xId = xUser.x_id
      // Save the link
      await dbAdmin
        .from('radar_users')
        .update({ x_id: xId })
        .eq('wallet_address', wallet)
    }
  }

  // Get user's score
  let score = null
  if (xId) {
    const { data: scoreData } = await db
      .from('radar_scores')
      .select('*')
      .eq('x_id', xId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    score = scoreData
  }

  return NextResponse.json({ registered: true, ...user, x_id: xId, score })
}
