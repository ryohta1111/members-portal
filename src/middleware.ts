import { NextRequest, NextResponse } from 'next/server'

const SITE_PASSWORD = process.env.SITE_PASSWORD || 'p6LVXTwc'
const COOKIE_NAME = 'site-auth'

export function middleware(request: NextRequest) {
  // API routes and static files should bypass auth
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname === '/auth'
  ) {
    return NextResponse.next()
  }

  // Check auth cookie
  const authCookie = request.cookies.get(COOKIE_NAME)
  if (authCookie?.value === 'authenticated') {
    return NextResponse.next()
  }

  // Check if this is a POST to /auth (login attempt)
  if (request.nextUrl.pathname === '/auth' && request.method === 'POST') {
    return NextResponse.next()
  }

  // Redirect to auth page
  const url = request.nextUrl.clone()
  url.pathname = '/auth'
  url.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
