import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname === '/auth'
  const isDashboardPage = req.nextUrl.pathname === '/dashboard'

  // Redirect to Webflow home page if not authenticated and trying to access dashboard
  if (!session && isDashboardPage) {
    return NextResponse.redirect('https://trypoducate.com/home')
  }

  // Redirect to dashboard if authenticated and trying to access auth page
  if (session && isAuthPage) {
    return NextResponse.redirect('https://app.trypoducate.com/dashboard')
  }

  // Redirect unauthenticated users to auth page for dashboard access
  if (!session && isDashboardPage) {
    return NextResponse.redirect('https://app.trypoducate.com/auth')
  }

  // For all other routes, allow the request to proceed
  return res
}

export const config = {
  matcher: ['/dashboard', '/auth'],
}