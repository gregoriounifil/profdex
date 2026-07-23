import { DiscoveriesController } from './discoveries.controller';

describe('DiscoveriesController', () => {
  it('does not expose a discovery command by professor id', () => {
    expect(Object.getOwnPropertyNames(DiscoveriesController.prototype)).toEqual(
      ['constructor', 'findAll'],
    );
  });
});
