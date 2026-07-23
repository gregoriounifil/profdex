// Tabela de movimentos/ataques.
// ⚠️ Placeholder: quando as tabelas reais de movimentos e ataques chegarem,
// basta substituir DEFAULT_MOVES (e/ou mapear golpes por professor em MOVES_BY_SLUG)
// mantendo o mesmo formato — o resto do jogo já consome essa estrutura.
//
// Formato de um golpe:
// {
//   id: string        — identificador único
//   name: string      — nome exibido no botão
//   power: number     — dano base
//   accuracy: number  — chance de acertar (0 a 1)
//   description: string — texto exibido na mensagem de batalha
// }

export const DEFAULT_MOVES = [
  {
    id: 'chamada-oral',
    name: 'Chamada Oral',
    power: 14,
    accuracy: 0.95,
    description: 'Uma pergunta direta que ninguém esperava.',
  },
  {
    id: 'prova-surpresa',
    name: 'Prova Surpresa',
    power: 20,
    accuracy: 0.8,
    description: 'Golpe forte, mas pode falhar.',
  },
  {
    id: 'lista-exercicios',
    name: 'Lista de Exercícios',
    power: 12,
    accuracy: 1,
    description: 'Dano garantido, pouco a pouco.',
  },
  {
    id: 'trabalho-grupo',
    name: 'Trab. em Grupo',
    power: 26,
    accuracy: 0.65,
    description: 'Devastador quando acerta.',
  },
]

// Golpes específicos por professor (preencher junto com as tabelas reais).
export const MOVES_BY_SLUG = {
  // exemplo: 'gustavo': [ { id: '...', name: '...', power: 0, accuracy: 1, description: '' } ],
}

export function getMovesFor(professor) {
  return MOVES_BY_SLUG[professor?.slug] || DEFAULT_MOVES
}
