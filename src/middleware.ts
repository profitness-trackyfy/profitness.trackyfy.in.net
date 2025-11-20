// middleware.ts
import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from 'next/server';

const isPrivateRoute = createRouteMatcher([
  "/user(.*)",
  "/admin(.*)",
  "/seller(.*)",
  "/account(.*)",
  // Exclude payment callback routes
]);


// Add CORS handling for API routes
function handleCors(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS method
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }
    
    return response;
  }
  
  return NextResponse.next();
}

export default clerkMiddleware(async (auth, request) => {
  // Handle CORS first
  const corsResponse = handleCors(request);
  if (corsResponse.status === 200 && request.method === 'OPTIONS') {
    return corsResponse;
  }
  
  // Then handle authentication
  if (isPrivateRoute(request)) {
    await auth.protect();
  }
  
  return corsResponse;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
