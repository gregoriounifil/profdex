import { CookieOptions, Request } from 'express';

export const SESSION_COOKIE_NAME = 'profdex_session';
export const SESSION_MAX_AGE_MS = 15 * 60 * 1000;

export function getSessionCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_MS,
    path: '/api',
    sameSite: 'lax',
    secure: isProduction,
  };
}

export function extractSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator < 0) continue;
    const name = cookie.slice(0, separator).trim();
    if (name !== SESSION_COOKIE_NAME) continue;
    const value = cookie.slice(separator + 1).trim();
    return value ? decodeURIComponent(value) : null;
  }

  return null;
}
