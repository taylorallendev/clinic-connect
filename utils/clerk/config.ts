// Configuration for Clerk authentication
export const authConfig = {
  // Routes that don't require authentication
  publicRoutes: [
    "/",
    "/sign-in*",
    "/sign-up*",
    "/forgot-password*",
    "/api/authenticate*"
  ],
  
  // Routes that require authentication
  protectedRoutes: [
    "/app/*",
    "/api/appointments*",
    "/api/providers*"
  ],

  // Custom redirection logic
  afterSignInUrl: '/app/dashboard/current-case',
  afterSignUpUrl: '/app/dashboard/current-case',
  
  // Authentication token options
  tokenRefreshEnabled: true,
  
  // User session cookie settings
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true
  }
};