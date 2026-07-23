import { hashCaptureToken } from './capture-token';

describe('hashCaptureToken', () => {
  it('creates a deterministic SHA-256 digest without preserving plaintext', () => {
    const token = 'A'.repeat(32);
    const digest = hashCaptureToken(token);

    expect(digest).toHaveLength(64);
    expect(digest).toMatch(/^[a-f0-9]+$/);
    expect(digest).not.toContain(token);
    expect(hashCaptureToken(token)).toBe(digest);
    expect(hashCaptureToken(`${token}B`)).not.toBe(digest);
  });
});
