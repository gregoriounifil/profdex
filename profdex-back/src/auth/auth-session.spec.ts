import { Request } from 'express';
import {
  extractSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from './auth-session';

describe('auth session', () => {
  it('uses an HttpOnly, SameSite cookie and requires HTTPS in production', () => {
    expect(getSessionCookieOptions(true)).toEqual(
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/api',
      }),
    );
    expect(getSessionCookieOptions(false)).toHaveProperty('secure', false);
  });

  it('extracts only the named session cookie', () => {
    const request = {
      headers: {
        cookie: `other=value; ${SESSION_COOKIE_NAME}=signed.jwt.value`,
      },
    } as Request;

    expect(extractSessionToken(request)).toBe('signed.jwt.value');
  });

  it.each([undefined, 'other=value', `${SESSION_COOKIE_NAME}=`, 'malformed'])(
    'returns null when the session cookie is absent: %p',
    (cookie) => {
      expect(
        extractSessionToken({ headers: { cookie } } as Request),
      ).toBeNull();
    },
  );
});
