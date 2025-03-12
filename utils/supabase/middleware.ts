import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export function createClient(request: NextRequest) {
  // Create an unmodified response
  const response = NextResponse.next();

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.delete({
            name,
            ...options,
          });
          response.cookies.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  return { supabase, response };
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get the pathname from the URL
  const { pathname } = request.nextUrl;

  // If user is signed in and trying to access the landing page or auth pages, redirect to appointments
  if (session) {
    if (pathname === "/" || pathname.startsWith("/(auth-pages)")) {
      return NextResponse.redirect(new URL("/app/dashboard/appointments", request.url));
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

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
