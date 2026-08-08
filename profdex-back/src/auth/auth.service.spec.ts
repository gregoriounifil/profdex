import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from '@node-rs/bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    matricula: '123',
    name: 'Player',
    password: '',
  };

  function createSubject() {
    const users = {
      findByMatricula: jest.fn(),
    };
    const jwt = {
      sign: jest.fn().mockReturnValue('signed.jwt'),
    };
    return {
      jwt,
      service: new AuthService(
        users as unknown as UsersService,
        jwt as unknown as JwtService,
      ),
      users,
    };
  }

  // Toda conta nasce do login com Google; este serviço só autentica.
  it('exposes no registration path', () => {
    expect('register' in AuthService.prototype).toBe(false);
  });

  it('returns the same generic error for missing and invalid credentials', async () => {
    const { service, users } = createSubject();
    users.findByMatricula.mockResolvedValue(null);

    await expect(
      service.login({ matricula: 'missing', password: 'invalid password' }),
    ).rejects.toThrow('Credenciais inválidas');

    const passwordHash = await bcrypt.hash('valid password', 4);
    users.findByMatricula.mockResolvedValue({
      ...user,
      password: passwordHash,
    });
    await expect(
      service.login({ matricula: user.matricula, password: 'wrong password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('signs a session for valid credentials', async () => {
    const { service, users } = createSubject();
    const passwordHash = await bcrypt.hash('valid password', 4);
    users.findByMatricula.mockResolvedValue({
      ...user,
      password: passwordHash,
    });

    await expect(
      service.login({
        matricula: user.matricula,
        password: 'valid password',
      }),
    ).resolves.toEqual({
      accessToken: 'signed.jwt',
      user: {
        id: user.id,
        matricula: user.matricula,
        name: user.name,
      },
    });
  });
});
