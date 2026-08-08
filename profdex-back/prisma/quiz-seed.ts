// Popula o banco de questões do quiz de bancada.
//
//   npm run db:seed-quiz
//
// Idempotente: o enunciado é a chave única, então rodar de novo atualiza as
// alternativas/dificuldade em vez de duplicar. Questões que saíram deste
// arquivo NÃO são apagadas — são apenas desativadas (`active = false`), para
// não quebrar a foreign key das tentativas já registradas.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { QUIZ_QUESTIONS } from './quiz-questions';

const prisma = new PrismaClient();

async function main() {
  for (const q of QUIZ_QUESTIONS) {
    await prisma.quizQuestion.upsert({
      where: { prompt: q.prompt },
      update: {
        theme: q.theme,
        difficulty: q.difficulty,
        options: q.options,
        answer: q.answer,
        active: true,
      },
      create: {
        theme: q.theme,
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
      },
    });
  }

  const desativadas = await prisma.quizQuestion.updateMany({
    where: { prompt: { notIn: QUIZ_QUESTIONS.map((q) => q.prompt) } },
    data: { active: false },
  });

  const porTema = new Map<string, number>();
  for (const q of QUIZ_QUESTIONS) {
    porTema.set(q.theme, (porTema.get(q.theme) ?? 0) + 1);
  }

  console.log(
    `Quiz: ${QUIZ_QUESTIONS.length} questões em ${porTema.size} temas ` +
      `(${[...porTema].map(([t, n]) => `${t}=${n}`).join(', ')})`,
  );
  if (desativadas.count) {
    console.log(`${desativadas.count} questão(ões) fora do arquivo desativadas`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
