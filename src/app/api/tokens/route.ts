import { NextResponse } from 'next/server'
import { portalSupabase as supabase } from '@/lib/portalSupabase'

export const revalidate = 60

export async function GET() {
  try {
    // Fetch tokens
    const { data: tokens, error: tokErr } = await supabase
      .from('tokens')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (tokErr) throw tokErr

    // Fetch banners
    const { data: banners } = await supabase
      .from('token_banners')
      .select('*')

    // Fetch links
    const { data: links } = await supabase
      .from('token_links')
      .select('*')

    // Separate token-type and banner-type
    const tokenItems = tokens?.filter(t => t.type === 'token') || []
    const bannerItems = tokens?.filter(t => t.type === 'banner') || []

    // Get mint addresses for Dexscreener batch fetch
    const mintAddresses = tokenItems
      .filter(t => t.mint_address)
      .map(t => t.mint_address)

    let dexData: Record<string, any> = {}

    if (mintAddresses.length > 0) {
      // Batch fetch from Dexscreener (max 30 per request)
      const batchSize = 30
      for (let i = 0; i < mintAddresses.length; i += batchSize) {
        const batch = mintAddresses.slice(i, i + batchSize)
        try {
          const res = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${batch.join(',')}`,
            { next: { revalidate: 60 } }
          )
          const data = await res.json()
          if (data.pairs) {
            for (const pair of data.pairs) {
              const mint = pair.baseToken?.address
              if (mint && !dexData[mint]) {
                dexData[mint] = {
                  price: pair.priceUsd ? `$${parseFloat(pair.priceUsd).toFixed(4)}` : null,
                  priceChange24h: pair.priceChange?.h24 ?? null,
                  marketCap: pair.marketCap ?? null,
                  volume24h: pair.volume?.h24 ?? null,
                  poolAddress: pair.pairAddress ?? null,
                }
              }
            }
          }
        } catch (e) {
          console.error('Dexscreener fetch error:', e)
        }
      }
    }

    // Merge data
    const enrichedTokens = tokenItems.map(t => {
      const dex = t.mint_address ? dexData[t.mint_address] : null
      const tokenLinks = (links || []).filter(l => l.token_id === t.id)
      return {
        ...t,
        price: dex?.price ?? null,
        priceChange24h: dex?.priceChange24h ?? null,
        marketCap: dex?.marketCap ?? null,
        volume24h: dex?.volume24h ?? null,
        poolAddress: dex?.poolAddress ?? null,
        links: tokenLinks,
      }
    })

    // Enrich banners
    const enrichedBanners = bannerItems.map(b => {
      const banner = (banners || []).find(bn => bn.token_id === b.id)
      return { ...b, banner }
    })

    return NextResponse.json({
      tokens: enrichedTokens,
      banners: enrichedBanners,
    })
  } catch (err: any) {
    console.error('Tokens API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
