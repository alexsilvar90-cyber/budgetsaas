import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Public paths — always pass through
  if (
    pathname.startsWith('/auth') ||
    pathname === '/api/auth/session'
  ) {
    return supabaseResponse
  }

  // Root redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // /dashboard: let through even without session so the client-side
  // getSession guard in dashboard/page.tsx can process the Google token
  if (!user && pathname === '/dashboard') {
    return supabaseResponse
  }

  // Not logged in → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Fetch role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  // Inactive user → logout
  if (profile && !profile.is_active) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/auth/login?error=inactive', request.url))
  }

  const role = profile?.role ?? 'manager'

  // Manager trying to access admin-only areas
  if (role === 'manager') {
    if (pathname.startsWith('/upload') || pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
