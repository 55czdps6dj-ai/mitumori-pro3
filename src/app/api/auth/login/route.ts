import { NextResponse } from 'next/server';
import { createAuthToken } from '../../../../lib/authToken';

export const runtime = 'nodejs';

const COOKIE_NAME = 'mitumori_auth';

export async function POST(request: Request) {
  const configuredEmail = process.env.APP_ACCESS_EMAIL;
  const configuredPassword = process.env.APP_ACCESS_PASSWORD;
  const cookieSecret = process.env.AUTH_COOKIE_SECRET || configuredPassword;

  if (!configuredEmail || !configuredPassword || !cookieSecret) {
    return NextResponse.json(
      { message: 'APP_ACCESS_EMAIL または APP_ACCESS_PASSWORD が未設定です。' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const inputEmail = String(body?.email || '').trim().toLowerCase();
  const allowedEmail = configuredEmail.trim().toLowerCase();

  if (inputEmail !== allowedEmail || body?.password !== configuredPassword) {
    return NextResponse.json(
      { message: 'メールアドレスまたはパスワードが違います。' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: await createAuthToken(cookieSecret),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return response;
}
