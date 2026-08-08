import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Não existe `create` aqui: contas só nascem pelo login com Google, em
 * `GoogleAuthService.completeSignup`, onde o e-mail institucional já foi
 * verificado e o papel (aluno/admin) sai do domínio. Um criador genérico neste
 * serviço seria um caminho paralelo capaz de burlar essa verificação.
 */
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByMatricula(matricula: string) {
    return this.prisma.user.findUnique({ where: { matricula } });
  }
}
