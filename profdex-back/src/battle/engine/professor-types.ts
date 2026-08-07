// Tipos de cada professor — port TS de profdex-front/src/data/professorTypes.js
// (planilha "Tipos-Professores"). Fonte canônica em PvP: o servidor resolve os
// tipos ao montar o combatente.

import { typeIdFromSeed } from './types';

export const PROFESSOR_TYPES: Record<string, string[]> = {
  gustavo: ['arquitetura'],
  mario: ['algoritmos'],
  'ricardo-petri': ['ia-ml'],
  ricardo: ['ia-ml'],
  simone: ['npi'],
  eron: ['arquitetura', 'ia-ml'],
  't-camis': ['calculo', 'logica'],
  camis: ['calculo', 'logica'],
  joao: ['logica', 'algoritmos'],
  marcelo: ['logica'], // Programação → Lógica
  guilherme: ['logica'],
  renata: ['npi'],
  serginho: ['ia-ml'],
  marcos: ['banco'], // Banco (+Segurança descartada)
  igor: ['robotica', 'redes'],
  edson: ['banco'], // Segurança descartada → Banco
};

// Normaliza um texto para chave: sem acentos, minúsculo, espaços→hífen.
export function normalizeKey(text: string | null | undefined): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Retorna os tipos (1–2) de um professor. Tenta slug e nome; sem match, deriva
// 1 tipo estável da semente — mesmo fallback do front.
export function typesForProfessor(professor: {
  slug?: string | null;
  name?: string | null;
  id?: string | null;
}): string[] {
  const candidates = [professor?.slug, professor?.name].filter(
    (c): c is string => !!c,
  );
  for (const c of candidates) {
    const hit = PROFESSOR_TYPES[normalizeKey(c)];
    if (hit) return hit;
  }
  const seed = professor?.slug || professor?.id || professor?.name;
  return [typeIdFromSeed(seed)];
}
