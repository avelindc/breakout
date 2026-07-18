import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth(async (req) => {
  const { nextUrl } = req

  // Domain Lock Redirect to custom domain (except for local development)
  const host = req.headers.get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.");
  
  if (!isLocal && host !== "breakoutmusic.online" && host !== "www.breakoutmusic.online") {
    const redirectUrl = new URL(nextUrl.pathname + nextUrl.search, "https://breakoutmusic.online");
    return NextResponse.redirect(redirectUrl);
  }

  const isLoggedIn = !!req.auth?.user
  // @ts-ignore
  const role = req.auth?.user?.role || req.auth?.role || (req.auth?.user?.email === 'admin@breakoutmusic.online' ? 'ADMIN' : 'USER')
  // @ts-ignore
  const status = req.auth?.user?.status || req.auth?.status || 'APPROVED'

  // Maintenance Check
  const isMaintenanceRoute = nextUrl.pathname === '/maintenance'
  const isProtectedPath = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname === '/register'

  if (isProtectedPath && !isMaintenanceRoute && role !== 'ADMIN') {
    try {
      const res = await fetch(new URL('/api/maintenance', nextUrl.origin), {
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      const data = await res.json();
      if (data?.active) {
        return NextResponse.redirect(new URL('/maintenance', nextUrl));
      }
    } catch (error) {
      console.error("Middleware maintenance check failed:", error);
    }
  }

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
