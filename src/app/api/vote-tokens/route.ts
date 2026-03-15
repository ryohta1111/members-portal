import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VOTES_SUPABASE_URL || 'https://mazeypdufgldzoxhdiio.supabase.co',
  process.env.VOTES_SUPABASE_KEY || 'sb_publishable_M5r4eM8ry3jhMWVv_ynpjA_9QeVauhS'
)

export async function GET() {
  // Get active round with its tokens
  const { data: rounds } = await supabase
    .from('vote_rounds')
    .select('*, vote_round_tokens(*)')
    .eq('status', 'open')
    .limit(1)

  const activeRound = rounds?.[0] || null

  if (!activeRound) {
    return NextResponse.json({ round: null, tokens: [] })
  }

  // Sort tokens by sort_order
  const tokens = (activeRound.vote_round_tokens || [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)

  return NextResponse.json({
    round: {
      id: activeRound.id,
      title: activeRound.title,
      table_name: activeRound.table_name,
      status: activeRound.status,
    },
    tokens,
  })
}
