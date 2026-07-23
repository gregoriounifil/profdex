import { Prisma } from '@prisma/client';

export const PUBLIC_PROFESSOR_SELECT = {
  id: true,
  name: true,
  slug: true,
  modelUrl: true,
  marker1Index: true,
  marker2Index: true,
} satisfies Prisma.ProfessorSelect;

export type PublicProfessor = Prisma.ProfessorGetPayload<{
  select: typeof PUBLIC_PROFESSOR_SELECT;
}>;
