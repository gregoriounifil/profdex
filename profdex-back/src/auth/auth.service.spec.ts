import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
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
      create: jest.fn(),
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

  it('registers a unique user and signs a short-lived session payload', async () => {
    const { jwt, service, users } = createSubject();
    users.findByMatricula.mockResolvedValue(null);
    users.create.mockResolvedValue(user);

    await expect(
      service.register({
        matricula: user.matricula,
        name: user.name,
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
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: user.id,
      matricula: user.matricula,
      name: user.name,
    });
  });

  it('rejects duplicate registration without creating a user', async () => {
    const { service, users } = createSubject();
    users.findByMatricula.mockResolvedValue(user);

    await expect(
      service.register({
        matricula: user.matricula,
        name: user.name,
        password: 'valid password',
      }),
    ).rejects.toThrow(ConflictException);
    expect(users.create).not.toHaveBeenCalled();
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
