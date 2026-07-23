import { NextFunction, Request, Response } from 'express';
import { getAllowedOrigins, getPort, securityHeaders } from './http-security';

describe('HTTP security configuration', () => {
  it('uses an explicit comma-separated CORS allowlist', () => {
    expect(
      getAllowedOrigins({
        CORS_ORIGINS: 'https://app.example, https://admin.example ',
      }),
    ).toEqual(['https://app.example', 'https://admin.example']);
  });

  it('fails closed when production has no configured origin', () => {
    expect(() => getAllowedOrigins({ NODE_ENV: 'production' })).toThrow(
      'CORS_ORIGINS',
    );
  });

  it('allows only local frontend origins by default in development', () => {
    expect(getAllowedOrigins({ NODE_ENV: 'development' })).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
  });

  it.each([
    [undefined, 3000],
    ['8080', 8080],
  ])('parses a valid port %p', (input, expected) => {
    expect(getPort(input)).toBe(expected);
  });

  it.each(['0', '65536', 'abc', '1.5'])(
    'rejects an invalid port %s',
    (input) => {
      expect(() => getPort(input)).toThrow('PORT');
    },
  );

  it('sets the API hardening headers', () => {
    const setHeader = jest.fn();
    const response = {
      setHeader,
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    securityHeaders({} as Request, response, next);

    expect(setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'",
    );
    expect(setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000',
    );
    expect(setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
