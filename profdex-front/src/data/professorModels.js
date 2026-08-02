// Modelo 3D (.glb) de cada professor.
//
// Os arquivos ficam em /public/models e seguem a convenção
// `modelo-<slug>.glb` — mas o mapa é explícito de propósito: um professor sem
// modelo próprio cai no padrão em vez de pedir um arquivo que não existe (404
// dentro do model-viewer, que só mostra o spinner para sempre).
//
// Chave = nome normalizado (mesma regra de professorTypes.js), então tanto o
// slug ('mario') quanto o nome vindo da API ('Mário') resolvem o mesmo modelo.

import { normalizeKey, PLAYER_KEY } from './professorTypes.js'

export const PROFESSOR_MODELS = {
  eron: '/models/modelo-eron.glb',
  gustavo: '/models/modelo-gustavo.glb',
  mario: '/models/modelo-mario.glb',
}

// Padrão para quem ainda não tem modelo próprio: o Gustavo, que é também o
// boneco do jogador (era o antigo `seu-modelo.glb`).
export const DEFAULT_MODEL_URL = PROFESSOR_MODELS.gustavo

// Modelo do jogador — fixo, porque a arena sempre coloca o Gustavo do nosso lado.
export const PLAYER_MODEL_URL = PROFESSOR_MODELS[PLAYER_KEY] ?? DEFAULT_MODEL_URL

// Resolve o modelo de um professor. O `modelUrl` da API vence quando existir
// (permite trocar o arquivo sem novo deploy do front); depois o mapa local por
// slug/nome; por fim o padrão.
export function modelUrlForProfessor(professor) {
  if (professor?.modelUrl) return professor.modelUrl

  const candidates = [professor?.slug, professor?.name].filter(Boolean)
  for (const c of candidates) {
    const hit = PROFESSOR_MODELS[normalizeKey(c)]
    if (hit) return hit
  }

  return DEFAULT_MODEL_URL
}
