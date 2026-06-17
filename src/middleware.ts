import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from './lib/authToken';

const COOKIE_NAME = 'mitumori_auth';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/favicon.ico',
  '/next.svg',
  '/vercel.svg',
];

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((path) => pathname === path) ||
  pathname.startsWith('/_next/');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const configuredPassword = process.env.APP_ACCESS_PASSWORD;
  const cookieSecret = process.env.AUTH_COOKIE_SECRET || configuredPassword;

  if (!configuredPassword || !cookieSecret) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('reason', 'missing-auth-config');
    return NextResponse.redirect(loginUrl);
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAuthToken(token, cookieSecret);
  if (isAuthenticated) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!.*\\..*).*)', '/api/:path*'],
};
