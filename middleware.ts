import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to Webflow site if accessing root of trypoducate.com
  if (req.nextUrl.hostname === 'trypoducate.com' && req.nextUrl.pathname === '/') {
    return NextResponse.redirect('https://trypoducate.com/home')
  }

  // Handle app.trypoducate.com routes
  if (req.nextUrl.hostname === 'app.trypoducate.com') {
    if (req.nextUrl.pathname === '/') {
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      } else {
        return NextResponse.redirect(new URL('/auth', req.url))
      }
    }

    if (!session && req.nextUrl.pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/auth', req.url))
    }

    if (session && req.nextUrl.pathname === '/auth') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}