// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Public/static you must allow no matter what (assets, auth, username flow)
const isStatic = createRouteMatcher([
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/_next/(.*)',
  '/images/(.*)',
  '/fonts/(.*)'
]);

// Auth pages (must stay open)
const isAuth = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

// Onboarding route itself must be reachable
const isUsername = createRouteMatcher(['/username(.*)']);

// Minimal APIs needed for onboarding (tweak to match your backend proxy routes)
const isOnboardingApi = createRouteMatcher([
  '/api/health(.*)',
  '/api/profile(.*)' // reading/saving profile to set username
]);

// Helper to check backend for username (runs at the edge)
async function hasUsername(req: NextRequest) {
  // IMPORTANT: point this at your backend “me/profile” endpoint
  // It must respect the Clerk session cookie forwarded by the browser.
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL; // or BACKEND_URL
  if (!backend) return false;

  try {
    const r = await fetch(`${backend}/api/profile/me`, {
      headers: {
        // forward cookies so backend can read your session
        cookie: req.headers.get('cookie') ?? '',
        'cache-control': 'no-cache',
        accept: 'application/json'
      }
    });

    if (!r.ok) return false;
    const j = await r.json().catch(() => null);
    const username = j?.data?.username?.trim?.();
    return Boolean(username && username.length >= 3);
  } catch {
    return false; // fail-closed (i.e., treat as not having username)
  }
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  const url = req.nextUrl;

  // Always allow static, auth pages, username page, and minimal onboarding APIs
  if (isStatic(req) || isAuth(req) || isUsername(req) || isOnboardingApi(req)) {
    return NextResponse.next();
  }

  // If not signed in → normal public browsing is allowed
  if (!userId) {
    return NextResponse.next();
  }

  // Signed in: if they already have the soft cookie, skip the fetch (fast path)
  const hasCookie = req.cookies.get('has_username')?.value === '1';
  if (hasCookie) {
    return NextResponse.next();
  }

  // Check backend for username (authoritative)
  const ok = await hasUsername(req);
  if (ok) {
    // Set a soft cache cookie to avoid calling backend on every request
    const res = NextResponse.next();
    res.cookies.set('has_username', '1', {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });
    return res;
  }

  // No username → force them to /username
  const nextParam = encodeURIComponent(url.pathname + url.search);
  const redirectUrl = new URL(`/username?next=${nextParam}`, url);
  return NextResponse.redirect(redirectUrl);
});

// Apply to everything except Next internals/static
export const config = {
  matcher: [
    // Run on all routes except the static assets & _next/image …
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'
  ]
};
