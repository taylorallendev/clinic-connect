import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/(auth-pages)(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Get the pathname from the URL
  const { pathname } = req.nextUrl;

  // If user is signed in and trying to access the landing page or auth pages, redirect to dashboard
  if (auth.userId && (pathname === "/" || pathname.startsWith("/(auth-pages)"))) {
    return NextResponse.redirect(new URL("/app/dashboard/current-case", req.url));
  }

  // If user is not signed in and trying to access protected routes, redirect to sign-in
  if (!auth.userId && pathname.startsWith("/app")) {
    await auth.protect();
  }

  return NextResponse.next();
});

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
