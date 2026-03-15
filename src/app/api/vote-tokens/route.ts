import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VOTES_SUPABASE_URL || 'https://mazeypdufgldzoxhdiio.supabase.co',
  process.env.VOTES_SUPABASE_KEY || 'sb_publishable_M5r4eM8ry3jhMWVv_ynpjA_9QeVauhS'
)

export async function GET() {
  // Get active round
  const { data: rounds } = await supabase
    .from('vote_rounds')
    .select('*')
    .eq('status', 'open')
    .limit(1)

  const activeRound = rounds?.[0] || null

  // Get tokens
  const { data: tokens, error } = await supabase
    .from('vote_tokens')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    return NextResponse.json({
      round: null,
      tokens: [
        { mint: '5C7nFDCgWTLnHgszBd4ksmCak3nouFoMZ9sbAxkApump', ticker: '$OSUNEN', name: '押燃', min_holding: 1, vote_ratio: 1.0, is_gate: true, is_target: true },
        { mint: '4FDtAagigMuFcPp36rbd9bzcYTJgQah2qLMYcYtfpump', ticker: '$INMU', name: 'INMU COIN', min_holding: 1, vote_ratio: 1.0, is_gate: true, is_target: true },
        { mint: '8d4D4FGUrbtTDucywowRD4AnizRKCr1YZaYQ74bRpump', ticker: '$ANIMAL', name: 'SEXY ANIMAL COIN', min_holding: 1, vote_ratio: 1.0, is_gate: true, is_target: true },
        { mint: 'CLD7wRUSwM68q51ayc1wt4Yipc6b2fwLqVm7Rv4Dpump', ticker: '$035HP', name: '035HP!', min_holding: 1, vote_ratio: 2.0, is_gate: true, is_target: false },
      ],
    })
  }

  return NextResponse.json({ round: activeRound, tokens })
}
