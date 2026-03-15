import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabaseAdmin } from '@/lib/radarSupabase'

export async function POST(req: NextRequest) {
  const { wallet_address, x_username } = await req.json()

  if (!wallet_address || !x_username) {
    return NextResponse.json({ error: 'wallet_address and x_username are required' }, { status: 400 })
  }

  const clean = x_username.replace(/^@/, '').trim().toLowerCase()
  if (!clean || clean.length > 30) {
    return NextResponse.json({ error: '無効なユーザー名です' }, { status: 400 })
  }

  const db = getRadarSupabaseAdmin()
  const { error } = await db
    .from('radar_users')
    .upsert({ wallet_address, x_username: clean }, { onConflict: 'wallet_address' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, x_username: clean })
}
