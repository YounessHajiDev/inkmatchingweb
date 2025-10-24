import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Enforce admin area served at a dedicated admin host (e.g. admin.inkmatching.com)
const ADMIN_HOST = process.env.NEXT_PUBLIC_ADMIN_HOST || 'admin.inkmatching.com'

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const { pathname, search } = req.nextUrl

  // If someone hits /admin on the primary site, redirect them to the admin subdomain
  if (pathname.startsWith('/admin')) {
    if (!host.includes(ADMIN_HOST)) {
      const target = `https://${ADMIN_HOST}${pathname}${search}`
      return NextResponse.redirect(target, 308)
    }
    return NextResponse.next()
  }

  // If host is admin subdomain but path isn't under /admin, rewrite to the admin path so the
  // app can continue using /admin routes internally (keeps routing consistent).
  if (host.includes(ADMIN_HOST) && !pathname.startsWith('/admin')) {
    const target = new URL(req.url)
    target.pathname = `/admin${pathname}`
    return NextResponse.rewrite(target)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
