import { Injectable } from '@nestjs/common';
// `@node-rs/bcrypt` (nativo, roda na threadpool do libuv) e não `bcryptjs`
// (JS puro, síncrono na thread principal): 20 hashes simultâneos com o bcryptjs
// congelam o event loop por ~1,3s — nenhum websocket atendido, nenhum timer de
// turno disparado. Ver docs/CARGA-PVP.md. O formato do hash é o mesmo, então
// senhas já cadastradas continuam válidas.
import * as bcrypt from '@node-rs/bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByMatricula(matricula: string) {
    return this.prisma.user.findUnique({ where: { matricula } });
  }

  async create(matricula: string, name: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { matricula, name, password: hashed },
    });
  }
}
