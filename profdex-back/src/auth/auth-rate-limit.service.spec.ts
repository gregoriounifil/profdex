import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthRateLimitService } from './auth-rate-limit.service';

describe('AuthRateLimitService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('blocks after five failed attempts without revealing credentials', () => {
    const limiter = new AuthRateLimitService();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      limiter.assertAllowed('ip:user');
      limiter.recordFailure('ip:user');
    }

    expect(() => limiter.assertAllowed('ip:user')).toThrow(HttpException);
    try {
      limiter.assertAllowed('ip:user');
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('resets failures after a successful authentication', () => {
    const limiter = new AuthRateLimitService();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      limiter.recordFailure('ip:user');
    }

    limiter.reset('ip:user');

    expect(() => limiter.assertAllowed('ip:user')).not.toThrow();
  });

  it('expires old attempt windows', () => {
    const now = 1_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const limiter = new AuthRateLimitService();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      limiter.recordFailure('ip:user');
    }
    jest.spyOn(Date, 'now').mockReturnValue(now + 15 * 60 * 1000);

    expect(() => limiter.assertAllowed('ip:user')).not.toThrow();
  });
});
