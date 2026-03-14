import { NextResponse } from 'next/server'

export const revalidate = 60

const MINT_035HP = 'CLD7wRUSwM68q51ayc1wt4Yipc6b2fwLqVm7Rv4Dpump'
const HELIUS_KEY = process.env.HELIUS_API_KEY || ''

async function getHolderCount(): Promise<number | null> {
  try {
    let holders = 0
    let cursor: string | undefined
    // Paginate through all token accounts
    do {
      const body: any = {
        jsonrpc: '2.0', id: 1,
        method: 'getTokenAccounts',
        params: { mint: MINT_035HP, limit: 1000, ...(cursor ? { cursor } : {}) },
      }
      const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      const accounts = data.result?.token_accounts || []
      holders += accounts.filter((a: any) => parseFloat(a.amount) > 0).length
      cursor = data.result?.cursor
    } while (cursor)
    return holders
  } catch (e) {
    console.error('Holder count error:', e)
    return null
  }
}

export async function GET() {
  try {
    const [dexRes, holders] = await Promise.all([
      fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${MINT_035HP}`,
        { next: { revalidate: 60 } }
      ),
      getHolderCount(),
    ])
    const data = await dexRes.json()

    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json({
        price: null,
        priceChange24h: null,
        marketCap: null,
        volume24h: null,
        holders,
      })
    }

    // Use the pair with highest liquidity
    const pair = data.pairs.sort(
      (a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0]

    return NextResponse.json({
      price: pair.priceUsd ? `$${parseFloat(pair.priceUsd).toFixed(4)}` : null,
      priceChange24h: pair.priceChange?.h24 ?? null,
      marketCap: pair.marketCap ?? null,
      volume24h: pair.volume?.h24 ?? null,
      holders,
      poolAddress: pair.pairAddress ?? null,
    })
  } catch (err: any) {
    console.error('035hp-stats error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
