import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { prisma } from 'src/lib/prisma'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value }) => supabaseResponse.cookies.set(name, value))
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: Don't remove getClaims()
  const { data } = await supabase.auth.getClaims()

  const user = data?.claims
  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/sign-in', '/auth', '/login']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Dashboard routes that require authentication
  const isDashboardRoute = pathname.startsWith('/dashboard')

  // If accessing dashboard routes without authentication, redirect to sign-in
  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('redirect', pathname)
    
    // Copy cookies to the redirect response
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // If authenticated, check user role for role-based route protection
  if (user && isDashboardRoute) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        // Get user role from database
        const dbUser = await prisma.user.findUnique({
          where: { auth_user_id: authUser.id },
          select: { role: true }
        })

        const role = dbUser?.role as 'admin' | 'super_admin' | null

        // If user has no role, redirect to sign-in
        if (!role) {
          const url = request.nextUrl.clone()
          url.pathname = '/sign-in'
          
          const redirectResponse = NextResponse.redirect(url)
          supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
          })
          return redirectResponse
        }

        // Protect admin routes - only admin can access
        if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
          const url = request.nextUrl.clone()
          // Redirect super_admin to their dashboard
          if (role === 'super_admin') {
            url.pathname = '/dashboard/super-admin'
          } else {
            url.pathname = '/dashboard'
          }
          
          const redirectResponse = NextResponse.redirect(url)
          supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
          })
          return redirectResponse
        }

        // Protect super-admin routes - only super_admin can access
        if (pathname.startsWith('/dashboard/super-admin') && role !== 'super_admin') {
          const url = request.nextUrl.clone()
          // Redirect admin to their dashboard
          if (role === 'admin') {
            url.pathname = '/dashboard/admin'
          } else {
            url.pathname = '/dashboard'
          }
          
          const redirectResponse = NextResponse.redirect(url)
          supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
          })
          return redirectResponse
        }
      }
    } catch (error) {
      console.error('[MIDDLEWARE] Error checking user role:', error)
      // If error, redirect to sign-in for safety
      const url = request.nextUrl.clone()
      url.pathname = '/sign-in'
      
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value)
      })
      return redirectResponse
    }
  }

  // If authenticated user tries to access sign-in, redirect to dashboard
  if (user && pathname === '/sign-in') {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const dbUser = await prisma.user.findUnique({
          where: { auth_user_id: authUser.id },
          select: { role: true }
        })

        const role = dbUser?.role as 'admin' | 'super_admin' | null
        
        const url = request.nextUrl.clone()
        if (role === 'super_admin') {
          url.pathname = '/dashboard/super-admin'
        } else if (role === 'admin') {
          url.pathname = '/dashboard/admin'
        } else {
          url.pathname = '/dashboard'
        }
        
        // Copy cookies to the redirect response
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
      }
    } catch (error) {
      console.error('[MIDDLEWARE] Error checking user role:', error)
      // Continue with normal flow if error
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}