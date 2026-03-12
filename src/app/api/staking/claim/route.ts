// POST /api/staking/claim - 報酬クレーム（オンチェーン送金・Token-2022対応）
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { festival_stake_id, wallet_address } = body

    if (!festival_stake_id || !wallet_address) {
      return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 })
    }

    // ステーク記録取得
    const { data: stake, error: sErr } = await supabaseAdmin
      .from('festival_stakes')
      .select('*, festivals(*)')
      .eq('id', festival_stake_id)
      .single()

    if (sErr || !stake) {
      return NextResponse.json({ error: 'ステーキング記録が見つかりません' }, { status: 404 })
    }

    // ウォレット一致チェック
    if (stake.wallet_address !== wallet_address) {
      return NextResponse.json({ error: 'ウォレットアドレスが一致しません' }, { status: 403 })
    }

    if (stake.claimed) {
      return NextResponse.json({ error: 'すでに受け取り済みです' }, { status: 400 })
    }

    if (!stake.reward_amount) {
      return NextResponse.json({ error: '報酬がまだ確定していません' }, { status: 400 })
    }

    const festival = stake.festivals
    if (festival.status !== 'paid') {
      return NextResponse.json({ error: '報酬配布がまだ開始されていません' }, { status: 400 })
    }

    // オンチェーン送金実行
    let claimTxHash: string
    try {
      claimTxHash = await sendFestivalReward(
        wallet_address,
        Number(stake.reward_amount),
        festival.token_mint
      )
    } catch (err: any) {
      console.error('[festival/claim] send failed:', err)
      return NextResponse.json({ error: '送金失敗: ' + err.message }, { status: 500 })
    }

    // DB更新
    const { error: updateErr } = await supabaseAdmin
      .from('festival_stakes')
      .update({
        claimed: true,
        claim_tx_hash: claimTxHash,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', festival_stake_id)

    if (updateErr) {
      // 送金は成功してるのでログだけ出す
      console.error('[festival/claim] DB update failed but tx sent:', claimTxHash, updateErr)
    }

    return NextResponse.json({
      success: true,
      reward_amount: stake.reward_amount,
      tx_hash: claimTxHash,
    })
  } catch (err: any) {
    console.error('[festival/claim]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ペイアウトウォレットからSPLトークン送金（Token-2022対応）
// reward_amountはdecimals込みのbigint値（例: 5000000 = 5トークン）
async function sendFestivalReward(
  toAddress: string,
  rewardAmountRaw: number, // decimals込み
  tokenMint: string
): Promise<string> {
  const { Connection, Keypair, PublicKey, Transaction } = await import('@solana/web3.js')
  const {
    createTransferInstruction,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
  } = await import('@solana/spl-token')
  const bs58 = (await import('bs58')).default

  const privateKeyStr = process.env.FESTIVAL_PAYOUT_WALLET_PRIVATE_KEY
  if (!privateKeyStr) throw new Error('FESTIVAL_PAYOUT_WALLET_PRIVATE_KEY not configured')

  const secretKey = bs58.decode(privateKeyStr)
  const payer = Keypair.fromSecretKey(secretKey)

  const HELIUS_KEY = process.env.HELIUS_API_KEY || 'ab65d07b-9529-4493-a83c-8ec570826be8'
  const connection = new Connection(
    `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`,
    'confirmed'
  )

  const mintPubkey = new PublicKey(tokenMint)
  const toPubkey = new PublicKey(toAddress)

  // mintのownerでToken ProgramかToken-2022か判定
  const mintInfo = await connection.getAccountInfo(mintPubkey)
  const tokenProgramId = mintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID)
    ? TOKEN_2022_PROGRAM_ID
    : TOKEN_PROGRAM_ID

  const fromAta = getAssociatedTokenAddressSync(mintPubkey, payer.publicKey, false, tokenProgramId)
  const toAta = getAssociatedTokenAddressSync(mintPubkey, toPubkey, false, tokenProgramId)

  // rewardAmountRawはすでにdecimals込みなのでそのまま使う
  const tx = new Transaction()

  // 送金先ATAが存在しなければ作成
  const toAtaInfo = await connection.getAccountInfo(toAta)
  if (!toAtaInfo) {
    tx.add(createAssociatedTokenAccountInstruction(
      payer.publicKey, toAta, toPubkey, mintPubkey, tokenProgramId
    ))
  }

  tx.add(createTransferInstruction(
    fromAta, toAta, payer.publicKey, rewardAmountRaw, [], tokenProgramId
  ))

  tx.feePayer = payer.publicKey
  const { blockhash } = await connection.getLatestBlockhash()
  tx.recentBlockhash = blockhash

  tx.sign(payer)
  const sig = await connection.sendRawTransaction(tx.serialize())
  await connection.confirmTransaction(sig, 'confirmed')

  return sig
}
