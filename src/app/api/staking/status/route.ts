// GET /api/staking/status - 自分のステーキング状況
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const festivalId = searchParams.get('festival_id')
  const wallet = searchParams.get('wallet_address')

  if (!wallet) {
    return NextResponse.json({ error: 'wallet_address必須' }, { status: 400 })
  }

  try {
    let query = supabaseAdmin
      .from('festival_stakes')
      .select('*, festivals(*)')
      .eq('wallet_address', wallet)
      .order('created_at', { ascending: false })

    if (festivalId) {
      query = query.eq('festival_id', festivalId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ stakes: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
