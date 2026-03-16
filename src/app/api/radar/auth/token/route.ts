import { NextRequest, NextResponse } from 'next/server'
import { getRadarSupabaseAdmin } from '@/lib/radarSupabase'

export async function POST(req: NextRequest) {
  const { code, code_verifier, wallet } = await req.json()

  if (!code || !code_verifier || !wallet) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const clientId = process.env.X_OAUTH_CLIENT_ID || ''
  const clientSecret = process.env.X_OAUTH_CLIENT_SECRET || ''
  const redirectUri = `${req.nextUrl.origin}/api/radar/auth/callback`

  // Exchange code for access token
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
      code_verifier: code_verifier,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error('Token exchange failed:', err)
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 })
  }

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  // Get user info
  const userRes = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!userRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
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

  return NextResponse.json({
    ok: true,
    username: xUser.username,
    x_id: xUser.id,
  })
}
