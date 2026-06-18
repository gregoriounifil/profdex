import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PROFESSORS = [
  {
    id: 'prof-mario',
    name: 'Mario',
    slug: 'mario',
    captureToken: '2f257167-c20a-4f1c-b513-8a0d0bfb7e52',
    marker1Index: 0,
    marker2Index: 1,
  },
  {
    id: 'prof-eron',
    name: 'Eron',
    slug: 'eron',
    captureToken: '90c0b3f6-21a1-47f4-9cc8-d51a23f0dfbf',
    marker1Index: 2,
    marker2Index: 3,
  },
  {
    id: 'prof-gustavo',
    name: 'Gustavo',
    slug: 'gustavo',
    captureToken: 'f6cf062f-b4b4-4756-bfe4-0fc3d7bbfdfb',
    marker1Index: 4,
    marker2Index: 5,
  },
]

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name)

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.professor.count()
      if (count === 0) {
        for (const prof of PROFESSORS) {
          await this.prisma.professor.upsert({
            where: { slug: prof.slug },
            update: { captureToken: prof.captureToken },
            create: prof,
          })
        }
        this.logger.log(`Banco populado com ${PROFESSORS.length} professores`)
      }
    } catch {
      // Tabelas ainda não existem — aguarda npx prisma db push
      this.logger.warn('Tabelas não encontradas. Rode: npx prisma db push')
    }
  }
}
