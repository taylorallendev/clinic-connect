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

  // If user is signed in and trying to access the landing page or auth pages, redirect to dashboard
  if (session) {
    if (
      pathname === "/" ||
      pathname.startsWith("/sign-in") ||
      pathname.startsWith("/sign-up")
    ) {
      return NextResponse.redirect(
        new URL("/app/dashboard/current-case", request.url)
      );
    }
  }

  // If user is not signed in and trying to access protected routes, redirect to sign-in
  if (!session) {
    if (pathname.startsWith("/app")) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  // Return the response for all other cases
  return response;
}
