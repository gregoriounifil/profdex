import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_PROFESSOR_SELECT } from '../professors/public-professor.select';
import { DiscoveriesService } from './discoveries.service';

describe('DiscoveriesService', () => {
  it('filters nested professors through the public allowlist', async () => {
    const records = [{ id: 'discovery-1' }];
    const prisma = {
      discovery: {
        findMany: jest.fn().mockResolvedValue(records),
      },
    };
    const service = new DiscoveriesService(prisma as unknown as PrismaService);

    await expect(service.findAll('user-1')).resolves.toEqual(records);
    expect(prisma.discovery.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: {
        professor: { select: PUBLIC_PROFESSOR_SELECT },
      },
      orderBy: { discoveredAt: 'desc' },
    });
  });
});
