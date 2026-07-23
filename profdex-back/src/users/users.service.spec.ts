import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  it('finds a user only by the unique matricula', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new UsersService(prisma as unknown as PrismaService);

    await service.findByMatricula('123');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { matricula: '123' },
    });
  });

  it('hashes passwords before persistence', async () => {
    const prisma = {
      user: {
        create: jest.fn(
          ({
            data,
          }: {
            data: { matricula: string; name: string; password: string };
          }) => ({ id: 'user-1', ...data }),
        ),
      },
    };
    const service = new UsersService(prisma as unknown as PrismaService);

    const result = await service.create('123', 'Player', 'valid password');

    expect(result.password).not.toBe('valid password');
    await expect(
      bcrypt.compare('valid password', result.password),
    ).resolves.toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        matricula: '123',
        name: 'Player',
        password: result.password,
      },
    });
  });
});
