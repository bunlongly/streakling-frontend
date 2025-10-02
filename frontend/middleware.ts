// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/', // public home
  '/sign-in(.*)', // auth pages
  '/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // allow public routes
  if (isPublicRoute(req)) return;

  // for everything else, require a session
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    // send users to Clerk sign-in (preserves the current URL)
    return redirectToSignIn();
  }
});

// Next.js matcher for middleware
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api)(.*)']
};
