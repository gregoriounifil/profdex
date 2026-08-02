import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
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
