import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// User Portal - Only regular_user allowed
const ALLOWED_ROLES = ['regular_user'];
const PORTAL_TYPE = 'user';

export function middleware(request: NextRequest) {
  // Check for auth token in cookies or headers
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    // No token, allow access (will be handled by client-side auth)
    return NextResponse.next();
  }

  // Verify user role from token (you may want to decode JWT here)
  // For now, we'll rely on client-side validation
  // In production, you should validate the JWT server-side
  
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
