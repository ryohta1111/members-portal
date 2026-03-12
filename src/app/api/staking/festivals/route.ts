// GET /api/staking/festivals - 開催中・予定の祭り一覧
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    let query = supabaseAdmin
      .from('festivals')
      .select('*')
      .in('status', ['upcoming', 'open', 'closed', 'paid'])
      .order('start_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 各祭りの現在ステーク総量を取得
    const festivalIds = data.map((f: any) => f.id)
    const { data: stakes } = await supabaseAdmin
      .from('festival_stakes')
      .select('festival_id, amount')
      .in('festival_id', festivalIds)

    // 祭りごとの合計を計算
    const totals: Record<string, number> = {}
    for (const s of stakes || []) {
      totals[s.festival_id] = (totals[s.festival_id] || 0) + Number(s.amount)
    }

    const result = data.map((f: any) => ({
      ...f,
      total_staked: totals[f.id] || 0,
      stake_count: (stakes || []).filter((s: any) => s.festival_id === f.id).length,
    }))

    return NextResponse.json({ festivals: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
