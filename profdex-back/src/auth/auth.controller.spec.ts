import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { SESSION_COOKIE_NAME } from './auth-session';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const user = { id: 'user-1', matricula: '123', name: 'Player' };

  function createSubject() {
    const auth = {
      login: jest.fn(),
      register: jest.fn(),
    };
    const rateLimit = {
      assertAllowed: jest.fn(),
      recordFailure: jest.fn(),
      reset: jest.fn(),
    };
    const controller = new AuthController(
      auth as unknown as AuthService,
      rateLimit as unknown as AuthRateLimitService,
    );
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    const request = { ip: '127.0.0.1', user } as unknown as Request & {
      user: typeof user;
    };
    return { auth, controller, rateLimit, request, response };
  }

  it('sets an HttpOnly cookie and never returns the JWT in the body', async () => {
    const { auth, controller, rateLimit, request, response } = createSubject();
    auth.login.mockResolvedValue({ accessToken: 'signed.jwt', user });

    const result = await controller.login(
      { matricula: '123', password: 'valid password' },
      request,
      response as unknown as Response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      'signed.jwt',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
    expect(rateLimit.reset).toHaveBeenCalledWith('127.0.0.1:123');
    expect(result).toEqual({ user });
    expect(JSON.stringify(result)).not.toContain('signed.jwt');
  });

  it('counts authentication failures and preserves the original error', async () => {
    const { auth, controller, rateLimit, request, response } = createSubject();
    auth.login.mockRejectedValue(new UnauthorizedException('invalid'));

    await expect(
      controller.login(
        { matricula: ' 123 ', password: 'invalid password' },
        request,
        response as unknown as Response,
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(rateLimit.recordFailure).toHaveBeenCalledWith('127.0.0.1:123');
  });

  it('applies the same protection to registration', async () => {
    const { auth, controller, rateLimit, request, response } = createSubject();
    auth.register.mockResolvedValue({ accessToken: 'signed.jwt', user });

    await controller.register(
      { matricula: '123', name: 'Player', password: 'valid password' },
      request,
      response as unknown as Response,
    );

    expect(rateLimit.assertAllowed).toHaveBeenCalledWith('127.0.0.1:123');
    expect(response.cookie).toHaveBeenCalled();
  });

  it('returns the authenticated principal and clears logout cookies', () => {
    const { controller, request, response } = createSubject();

    expect(controller.me(request)).toEqual({ user });
    controller.logout(response as unknown as Response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      expect.objectContaining({ path: '/api' }),
    );
  });
});
