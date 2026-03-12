// POST /api/staking/stake - ステーキング実行（tx検証付き）
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyTransaction } from '@/lib/verifyTransaction'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { festival_id, wallet_address, amount, tx_hash } = body

    if (!festival_id || !wallet_address || !amount || !tx_hash) {
      return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 })
    }

    // 祭り取得
    const { data: festival, error: fErr } = await supabaseAdmin
      .from('festivals')
      .select('*')
      .eq('id', festival_id)
      .single()

    if (fErr || !festival) {
      return NextResponse.json({ error: '祭りが見つかりません' }, { status: 404 })
    }

    // ステータスチェック
    if (festival.status !== 'open') {
      return NextResponse.json({ error: 'この祭りは現在受付していません' }, { status: 400 })
    }

    // 期間チェック
    const now = new Date()
    if (now < new Date(festival.start_at) || now > new Date(festival.end_at)) {
      return NextResponse.json({ error: '受付期間外です' }, { status: 400 })
    }

    // 個人上限・下限チェック（amountはdecimals込みbigint）
    const amt = BigInt(amount)
    if (amt < BigInt(festival.min_stake)) {
      return NextResponse.json({ error: `最低ステーク量を下回っています` }, { status: 400 })
    }
    if (amt > BigInt(festival.max_stake)) {
      return NextResponse.json({ error: `個人上限を超えています` }, { status: 400 })
    }

    // 重複チェック（1祭り1ウォレット1回）
    const { data: existing } = await supabaseAdmin
      .from('festival_stakes')
      .select('id')
      .eq('festival_id', festival_id)
      .eq('wallet_address', wallet_address)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'すでにステーキング済みです' }, { status: 400 })
    }

    // 総量キャップチェック
    const { data: allStakes } = await supabaseAdmin
      .from('festival_stakes')
      .select('amount')
      .eq('festival_id', festival_id)

    const currentTotal = (allStakes || []).reduce((sum: number, s: any) => sum + Number(s.amount), 0)
    if (currentTotal + Number(amount) > Number(festival.max_stake_cap)) {
      return NextResponse.json({ error: 'ステーキング総量が上限に達しています' }, { status: 400 })
    }

    // pool_wallet取得
    const { data: config } = await supabaseAdmin
      .from('festival_config')
      .select('value')
      .eq('key', 'pool_wallet_address')
      .single()

    if (!config?.value) {
      return NextResponse.json({ error: 'プールウォレットが未設定です' }, { status: 500 })
    }

    // オンチェーン検証（decimals込みなので実数値に変換して渡す）
    // verifyTransactionはdecimals込み実数値を期待 → 6 decimals前提で割る
    const decimals = 6 // $035HPのdecimals
    const expectedAmountFloat = Number(amount) / Math.pow(10, decimals)

    const verifyResult = await verifyTransaction({
      txHash: tx_hash,
      expectedSender: wallet_address,
      expectedAmount: expectedAmountFloat,
      poolWallet: config.value,
      tokenMint: festival.token_mint,
    })

    if (!verifyResult.ok) {
      return NextResponse.json({ error: verifyResult.error || 'トランザクション検証失敗' }, { status: 400 })
    }

    // DB登録
    const { data: stake, error: insertErr } = await supabaseAdmin
      .from('festival_stakes')
      .insert({
        festival_id,
        wallet_address,
        amount: Number(amount),
        tx_hash,
      })
      .select()
      .single()

    if (insertErr) {
      // tx_hash重複とか
      return NextResponse.json({ error: insertErr.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, stake })
  } catch (err: any) {
    console.error('[festival/stake]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
