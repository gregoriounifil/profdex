import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type Attempt = {
  failures: number;
  resetAt: number;
};

@Injectable()
export class AuthRateLimitService {
  private readonly attempts = new Map<string, Attempt>();

  assertAllowed(key: string): void {
    const attempt = this.getCurrentAttempt(key);
    if (attempt && attempt.failures >= MAX_FAILURES) {
      throw new HttpException(
        'Muitas tentativas. Tente novamente mais tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(key: string): void {
    const current = this.getCurrentAttempt(key);
    this.attempts.set(key, {
      failures: (current?.failures ?? 0) + 1,
      resetAt: current?.resetAt ?? Date.now() + WINDOW_MS,
    });
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  private getCurrentAttempt(key: string): Attempt | undefined {
    const attempt = this.attempts.get(key);
    if (attempt && attempt.resetAt <= Date.now()) {
      this.attempts.delete(key);
      return undefined;
    }
    return attempt;
  }
}
