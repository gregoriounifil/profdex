import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PROFESSORS = [
  {
    id: 'prof-mario',
    name: 'Mario',
    slug: 'mario',
    marker1Index: 0,
    marker2Index: 1,
  },
  {
    id: 'prof-eron',
    name: 'Eron',
    slug: 'eron',
    marker1Index: 2,
    marker2Index: 3,
  },
  {
    id: 'prof-gustavo',
    name: 'Gustavo',
    slug: 'gustavo',
    marker1Index: 4,
    marker2Index: 5,
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.professor.count();
      if (count === 0) {
        for (const prof of PROFESSORS) {
          await this.prisma.professor.upsert({
            where: { slug: prof.slug },
            update: {},
            create: prof,
          });
        }
        this.logger.log(`Banco populado com ${PROFESSORS.length} professores`);
      }
    } catch {
      // Tabelas ainda não existem — aguarda npx prisma db push
      this.logger.warn('Tabelas não encontradas. Rode: npx prisma db push');
    }
  }
}
