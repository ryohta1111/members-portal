import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// X OAuth 2.0 PKCE Authorization URL generator
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 })

  const clientId = process.env.X_OAUTH_CLIENT_ID || ''
  const redirectUri = `${req.nextUrl.origin}/api/radar/auth/callback`

  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  // Generate state with wallet address
  const state = Buffer.from(JSON.stringify({ wallet, ts: Date.now() })).toString('base64url')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'users.read tweet.read',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`

  // Return the auth URL and code_verifier (client stores in sessionStorage)
  return NextResponse.json({ authUrl, codeVerifier, state })
}
