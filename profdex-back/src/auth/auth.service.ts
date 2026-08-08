import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// Nativo, não `bcryptjs` — ver a nota em users.service.ts e docs/CARGA-PVP.md.
import * as bcrypt from '@node-rs/bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

/**
 * Sessão por matrícula/senha.
 *
 * Não há criação de conta aqui de propósito: a única porta de entrada é o
 * Google (`GoogleAuthService`), que confirma o e-mail institucional. Este
 * serviço só autentica quem já existe.
 */
@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findByMatricula(dto.matricula);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const valid = await bcrypt.verify(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');
    return this.sign(user.id, user.matricula, user.name, user.role);
  }

  /**
   * `role` viaja no token só para o app saber se mostra a entrada do painel.
   * NÃO é a fonte de autorização: o AdminGuard confere o papel no banco a cada
   * request, então promover ou revogar um admin vale na hora, sem esperar a
   * sessão de 15min expirar.
   */
  private sign(userId: string, matricula: string, name: string, role: string) {
    return {
      accessToken: this.signSession(userId, matricula, name, role),
      user: { id: userId, matricula, name, role },
    };
  }

  /**
   * Emite o token de sessão avulso — usado pelo login com Google, que abre a
   * sessão sem passar por matrícula/senha.
   */
  signSession(
    userId: string,
    matricula: string,
    name: string,
    role: string,
  ): string {
    return this.jwt.sign({ sub: userId, matricula, name, role });
  }
}
