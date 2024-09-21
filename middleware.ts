import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to landing page if not authenticated and trying to access dashboard
  if (!session && req.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  // Redirect to dashboard if authenticated and trying to access auth page
  if (session && req.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Allow access to the landing page for all users
  if (req.nextUrl.pathname === '/home') {
    return res
  }

  // Redirect unauthenticated users to the landing page for all other routes
  if (!session && req.nextUrl.pathname !== '/auth') {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}