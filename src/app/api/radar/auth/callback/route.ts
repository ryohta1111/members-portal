import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabaseAdmin } from '@/lib/radarSupabase'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(new URL('/radar?error=missing_params', req.url))
  }

  // Decode state to get wallet address
  let wallet: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    wallet = decoded.wallet
  } catch {
    return NextResponse.redirect(new URL('/radar?error=invalid_state', req.url))
  }

  // Get code_verifier from query (passed by client via redirect)
  const codeVerifier = req.nextUrl.searchParams.get('code_verifier')

  // If no code_verifier in URL, redirect to client page to complete the flow
  if (!codeVerifier) {
    // Redirect to radar page with code and state, let client-side handle token exchange
    const params = new URLSearchParams({ code, state })
    return NextResponse.redirect(new URL(`/radar?oauth_callback=1&${params.toString()}`, req.url))
  }

  // Exchange code for token
  const clientId = process.env.X_OAUTH_CLIENT_ID || ''
  const clientSecret = process.env.X_OAUTH_CLIENT_SECRET || ''
  const redirectUri = `${req.nextUrl.origin}/api/radar/auth/callback`

  const tokenRes = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error('Token exchange failed:', err)
    return NextResponse.redirect(new URL('/radar?error=token_exchange', req.url))
  }

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  // Get user info from X
  const userRes = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!userRes.ok) {
    return NextResponse.redirect(new URL('/radar?error=user_fetch', req.url))
  }

  const userData = await userRes.json()
  const xUser = userData.data

  // Save to radar_users
  const db = getRadarSupabaseAdmin()
  await db.from('radar_users').upsert({
    wallet_address: wallet,
    x_username: xUser.username,
    x_id: xUser.id,
  }, { onConflict: 'wallet_address' })

  return NextResponse.redirect(new URL('/radar?oauth_success=1', req.url))
}
