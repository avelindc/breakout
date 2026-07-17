import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth?.user
  // @ts-ignore
  const role = req.auth?.user?.role || req.auth?.role || (req.auth?.user?.email === 'admin@breakoutmusic.online' ? 'ADMIN' : 'USER')
  // @ts-ignore
  const status = req.auth?.user?.status || req.auth?.status || 'APPROVED'

  const isAuthRoute = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isUserRoute = nextUrl.pathname.startsWith('/dashboard')



  if (isAuthRoute) {
    if (isLoggedIn) {
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', nextUrl))
      }
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && (isAdminRoute || isUserRoute)) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isAdminRoute && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  if (isUserRoute && role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin', nextUrl))
  }

  // Handle status
  if (isUserRoute && status !== 'APPROVED') {
    if (nextUrl.pathname !== '/dashboard/pending') {
      return NextResponse.redirect(new URL('/dashboard/pending', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
