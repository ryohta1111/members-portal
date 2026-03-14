import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 300

// GeckoTerminal OHLCV timeframe configs
const TIMEFRAMES: Record<string, { timeframe: string; aggregate: number; limit: number }> = {
  '1h':  { timeframe: 'minute', aggregate: 5,  limit: 12 },
  '24h': { timeframe: 'hour',   aggregate: 1,  limit: 24 },
  '7d':  { timeframe: 'day',    aggregate: 1,  limit: 7  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  const { mint } = await params
  const period = request.nextUrl.searchParams.get('period') || '7d'
  const config = TIMEFRAMES[period] || TIMEFRAMES['7d']

  try {
    // Look up pool address from tokens table
    // First try to get from Dexscreener
    const dexRes = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
      { next: { revalidate: 300 } }
    )
    const dexData = await dexRes.json()

    if (!dexData.pairs || dexData.pairs.length === 0) {
      return NextResponse.json({ prices: [] })
    }

    const poolAddress = dexData.pairs[0].pairAddress

    // Fetch from GeckoTerminal
    const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/ohlcv/${config.timeframe}?aggregate=${config.aggregate}&limit=${config.limit}`
    const gtRes = await fetch(url, { next: { revalidate: 300 } })
    const gtData = await gtRes.json()

    const ohlcv = gtData?.data?.attributes?.ohlcv_list || []
    // ohlcv format: [timestamp, open, high, low, close, volume]
    // Return close prices (index 4), oldest first
    const prices = ohlcv
      .map((d: number[]) => d[4])
      .reverse()

    return NextResponse.json({ prices })
  } catch (err: any) {
    console.error('Chart API error:', err)
    return NextResponse.json({ prices: [] })
  }
}
