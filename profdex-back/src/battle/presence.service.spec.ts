import { PresenceService } from './presence.service';

describe('PresenceService', () => {
  let service: PresenceService;
  const ana = { id: 'user-ana', name: 'Ana' };
  const bia = { id: 'user-bia', name: 'Bia' };

  beforeEach(() => {
    service = new PresenceService();
  });

  it('reports firstSocket only on the first connection of a user', () => {
    expect(service.join('s1', ana)).toEqual({ firstSocket: true });
    expect(service.join('s2', ana)).toEqual({ firstSocket: false });
  });

  it('reports lastSocket only when the final socket leaves', () => {
    service.join('s1', ana);
    service.join('s2', ana);

    expect(service.leave('s1', ana.id)).toEqual({ lastSocket: false });
    expect(service.isOnline(ana.id)).toBe(true);
    expect(service.leave('s2', ana.id)).toEqual({ lastSocket: true });
    expect(service.isOnline(ana.id)).toBe(false);
  });

  it('ignores leave for a user that never joined', () => {
    expect(service.leave('s1', 'ghost')).toEqual({ lastSocket: false });
  });

  it('lists online users with status disponivel by default', () => {
    service.join('s1', ana);
    service.join('s2', bia);

    expect(service.snapshot()).toEqual(
      expect.arrayContaining([
        { id: ana.id, name: 'Ana', status: 'disponivel' },
        { id: bia.id, name: 'Bia', status: 'disponivel' },
      ]),
    );
    expect(service.snapshot()).toHaveLength(2);
  });

  it('updates status only for online users', () => {
    service.join('s1', ana);

    expect(service.setStatus(ana.id, 'em_batalha')).toBe(true);
    expect(service.getUser(ana.id)?.status).toBe('em_batalha');
    expect(service.setStatus('ghost', 'em_batalha')).toBe(false);
  });

  it('keeps the newest name when the user reconnects', () => {
    service.join('s1', ana);
    service.join('s2', { id: ana.id, name: 'Ana Clara' });

    expect(service.getUser(ana.id)?.name).toBe('Ana Clara');
  });

  it('tracks socket ids per user for targeted emits', () => {
    service.join('s1', ana);
    service.join('s2', ana);

    expect(service.socketsOf(ana.id).sort()).toEqual(['s1', 's2']);
    expect(service.socketsOf('ghost')).toEqual([]);
  });
});
