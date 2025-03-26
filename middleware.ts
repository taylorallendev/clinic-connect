import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: ["/", "/(auth-pages)(.*)"],
  afterAuth(auth, req) {
    // Get the pathname from the URL
    const { pathname } = req.nextUrl;

    // If user is signed in and trying to access the landing page or auth pages, redirect to dashboard
    if (auth.userId && (pathname === "/" || pathname.startsWith("/(auth-pages)"))) {
      return NextResponse.redirect(new URL("/app/dashboard/current-case", req.url));
    }

    // If user is not signed in and trying to access protected routes, redirect to sign-in
    if (!auth.userId && pathname.startsWith("/app")) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    return NextResponse.next();
  },
});

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
