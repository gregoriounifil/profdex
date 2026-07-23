import { NextFunction, Request, Response } from 'express';

const DEFAULT_DEVELOPMENT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

export function getAllowedOrigins(env: NodeJS.ProcessEnv): string[] {
  const configured = env.CORS_ORIGINS ?? env.FRONTEND_URL;
  const origins = configured
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins?.length) return origins;
  if (env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGINS must be configured in production');
  }
  return DEFAULT_DEVELOPMENT_ORIGINS;
}

export function getPort(value: string | undefined): number {
  const port = Number(value ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return port;
}

export function securityHeaders(
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  response.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'",
  );
  response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Strict-Transport-Security', 'max-age=31536000');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  next();
}
