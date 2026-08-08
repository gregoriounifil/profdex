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

  // Contas nascem só pelo Google (GoogleAuthService.completeSignup). Um criador
  // aqui reabriria o cadastro sem verificação de e-mail institucional.
  it('exposes no way to create a user', () => {
    expect('create' in UsersService.prototype).toBe(false);
  });
});
