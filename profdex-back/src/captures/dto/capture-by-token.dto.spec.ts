import { validate } from 'class-validator';
import { CaptureByTokenDto } from './capture-by-token.dto';

describe('CaptureByTokenDto', () => {
  async function errorsFor(token: unknown) {
    const dto = new CaptureByTokenDto();
    dto.token = token as string;
    return validate(dto);
  }

  it('accepts a high-entropy URL-safe token', async () => {
    await expect(errorsFor('a'.repeat(32))).resolves.toHaveLength(0);
  });

  it.each(['', 'short', 'a'.repeat(257), `${'a'.repeat(31)}!`, 123])(
    'rejects an invalid token: %p',
    async (token) => {
      expect(await errorsFor(token)).not.toHaveLength(0);
    },
  );
});
