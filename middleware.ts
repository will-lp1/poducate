import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname === '/auth'
  const isDashboardPage = req.nextUrl.pathname === '/dashboard'
  const isHomePage = req.nextUrl.pathname === '/home'

  // Allow access to the landing page for all users
  if (isHomePage) {
    return res
  }

  // Redirect to dashboard if authenticated and trying to access auth page
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect to landing page if not authenticated and trying to access dashboard
  if (!session && isDashboardPage) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  // For all other routes, allow the request to proceed
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}