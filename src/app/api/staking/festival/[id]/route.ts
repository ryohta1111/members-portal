// GET /api/staking/festival/[id] - 祭り詳細＋現在のステーク状況
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { data: festival, error } = await supabaseAdmin
      .from('festivals')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !festival) {
      return NextResponse.json({ error: '祭りが見つかりません' }, { status: 404 })
    }

    // 総ステーク量と参加者数
    const { data: stakes } = await supabaseAdmin
      .from('festival_stakes')
      .select('amount')
      .eq('festival_id', id)

    const totalStaked = (stakes || []).reduce((sum: number, s: any) => sum + Number(s.amount), 0)

    // pool_wallet取得
    const { data: config } = await supabaseAdmin
      .from('festival_config')
      .select('value')
      .eq('key', 'pool_wallet_address')
      .single()

    return NextResponse.json({
      festival: {
        ...festival,
        total_staked: totalStaked,
        stake_count: (stakes || []).length,
        pool_wallet: config?.value || null,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
