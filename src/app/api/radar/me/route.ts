import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabase } from '@/lib/radarSupabase'

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 })

  const db = getRadarSupabase()

  // Get user's X username
  const { data: user } = await db
    .from('radar_users')
    .select('*')
    .eq('wallet_address', wallet)
    .single()

  if (!user) return NextResponse.json({ registered: false })

  // Get user's score for active event
  let score = null
  if (user.x_id) {
    const { data: scoreData } = await db
      .from('radar_scores')
      .select('*')
      .eq('x_id', user.x_id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    score = scoreData
  }

  return NextResponse.json({ registered: true, ...user, score })
}
