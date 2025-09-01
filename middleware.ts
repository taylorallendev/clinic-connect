import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get the pathname from the URL
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/api/authenticate",
    "/api/deepgram/authenticate"
  ];

  // Define auth routes that should redirect to dashboard if already logged in
  const authRoutes = [
    "/sign-in",
    "/sign-up",
    "/forgot-password"
  ];

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(
      new URL("/app/dashboard", request.url)
    );
  }

  // If user is not signed in and trying to access protected routes, redirect to sign-in
  if (!session && pathname.startsWith("/app")) {
    // Store the attempted URL to redirect back after login
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Return the response for all other cases
  return response;
}
