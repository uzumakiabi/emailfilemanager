import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isPublicAsset = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/og-') || pathname.startsWith('/api/auth') || pathname.startsWith('/api/signup') || pathname === '/robots.txt' || pathname === '/sitemap.xml'
  if (isPublicAsset) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    if (isAuthPage) return NextResponse.next()
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.svg|og-image.png).*)',
  ],
}
