import { CapturesController } from './captures.controller';

describe('CapturesController', () => {
  it('does not expose a capture command by professor id', () => {
    expect(Object.getOwnPropertyNames(CapturesController.prototype)).toEqual([
      'constructor',
      'captureByToken',
      'findAll',
    ]);
  });
});
