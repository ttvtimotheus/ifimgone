import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware ensures that pages with searchParams are properly handled
export function middleware(request: NextRequest) {
  // We can add custom logic here if needed in the future
  return NextResponse.next();
}

// Configure middleware to run on specific paths that use searchParams
export const config = {
  // Match all pages that might use searchParams and need dynamic rendering
  matcher: [
    '/auth/:path*',
    '/profile/:path*',
    '/security/:path*',
    '/settings/:path*',
    '/verify-contact/:path*'
  ],
};
