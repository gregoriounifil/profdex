import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByMatricula(dto.matricula);
    if (existing) throw new ConflictException('Matrícula já cadastrada');
    const user = await this.users.create(dto.matricula, dto.name, dto.password);
    return this.sign(user.id, user.matricula, user.name);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByMatricula(dto.matricula);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');
    return this.sign(user.id, user.matricula, user.name);
  }

  private sign(userId: string, matricula: string, name: string) {
    return {
      access_token: this.jwt.sign({ sub: userId, matricula, name }),
      user: { id: userId, matricula, name },
    };
  }
}
