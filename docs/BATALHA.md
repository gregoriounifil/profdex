# Contexto — Sistema de Batalha (RPG de turnos em AR)

Documento para retomar o desenvolvimento da batalha. Última atualização: 2026-07-20.

## Visão geral

O ProfDex é uma "Pokédex de professores": o aluno escaneia QR codes pelo campus
para descobrir/capturar professores. A **batalha** é um RPG de turnos estilo
Pokémon onde o professor capturado vira o inimigo, renderizado em 3D (com opção
de AR via `model-viewer`).

Fluxo de telas:
`ProfdexView` → `BatalhaView` (menu) → botão **Batalha** → `ArenaView` (o combate).

## Como rodar

Da raiz do projeto (`profdex/`):

```bash
npm run dev          # sobe front (5173) + back (3000) juntos
# ou separados:
npm run dev:front
npm run dev:back
```

- Front: Vue 3 + Vite + Pinia + vue-router. Proxy `/api` → `http://localhost:3000`.
- Back: NestJS + Prisma + **PostgreSQL** (Supabase/Railway). JWT em `.env`.
- **A batalha precisa de login** (rota tem `meta: { auth: true }`).

### ⚠️ Banco de dados — atenção ao rodar localmente
O commit `e0ddd82 (chore(back): configure Prisma PostgreSQL for Railway)` trocou o
Prisma de SQLite para **PostgreSQL**. Consequências para rodar local:
- O `profdex-back/.env` precisa de `DATABASE_URL` e `DIRECT_URL` no formato
  `postgresql://...` (ver `profdex-back/.env.example` — modelo Supabase pooler).
  Um `DATABASE_URL="file:./dev.db"` (SQLite antigo) faz o backend quebrar no boot
  com `PrismaClientInitializationError P1012` ("URL must start with postgresql://").
- O antigo `dev.db` (SQLite) e o usuário de teste `teste123/senha123` **não valem
  mais** — o banco agora é Postgres e precisa ser migrado/semeado:
  `npm run db:migrate` e `npm run db:seed` (em `profdex-back/`) apontando para o Postgres.
- Alternativa p/ dev offline: reverter o datasource de `schema.prisma` para
  `provider = "sqlite"` + `DATABASE_URL="file:./dev.db"` — mas isso desfaz a config
  de deploy do Railway; combine com o time antes.

## Arquivos da batalha

| Arquivo | Papel |
|---|---|
| `profdex-front/src/views/ArenaView.vue` | A tela de combate: palco 3D + HUD + comandos. |
| `profdex-front/src/composables/useBattle.js` | Máquina de turnos (estado + regras), sem UI. |
| `profdex-front/src/components/BattleHpBar.vue` | Barra de HP reutilizável (inimigo e jogador). |
| `profdex-front/src/data/moves.js` | **Tabela de golpes (placeholder).** Ver abaixo. |
| `profdex-front/src/router/index.js` | Rota `/arena/:id` (name `arena`). |
| `profdex-front/src/views/BatalhaView.vue` | Menu; `goToArena()` navega para a arena. |

O `ARViewer.vue` / `useModelViewer.js` NÃO são usados na arena (só na tela
"Ver Prof." / `CharacterARView`). A arena instancia `<model-viewer>` direto.

## Como a batalha funciona hoje

### Máquina de turnos (`useBattle.js`)
- Estado reativo: `playerHp`, `enemyHp`, `phase`, `message`, `enemyHit`, `playerHit`, `isOver`.
- Fases: `intro` → `player-turn` → `busy` (animações + turno inimigo) → volta a
  `player-turn`, terminando em `victory` | `defeat` | `fled`.
- `useMove(move)`: aplica o golpe do jogador, checa vitória, depois o inimigo
  escolhe um golpe aleatório e revida, checa derrota.
- Dano = `power` × variação aleatória de ±20%; `accuracy` decide se erra.
- `flee()` encerra a batalha.

### Tela (`ArenaView.vue`)
- **Palco**: dois `<model-viewer>` estáticos (sem `camera-controls`, sem
  `auto-rotate`, com `disable-zoom/tap/pan` + `pointer-events:none`).
  - Inimigo: fundo/esquerda, de frente — `camera-orbit="-15deg 86deg 105%"`.
  - Jogador: primeiro plano/direita, **de costas** — `camera-orbit="165deg 88deg 105%"`.
  - Posição/tamanho vêm do CSS (`.arena__model--enemy` / `--player`).
  - **Não fixar `field-of-view`**: isso quebra o auto-enquadramento e corta o
    modelo. Deixe o model-viewer calcular a distância; ajuste só o `orbit` e o CSS.
- **HUD** sobreposto: barra do inimigo no topo-esquerdo, barra do jogador
  embaixo-esquerda, botão voltar, painel de comandos (mensagem + grid 2×2 de
  golpes + Fugir). Flash/shake quando cada lado toma dano.

### Modelo 3D
- Por enquanto **os dois lados usam o mesmo GLB** (`/models/seu-modelo-mobile.glb`,
  ~12,8 MB): `playerModelSrc = enemyModelSrc`. Duplicata proposital até o jogador
  ter modelo próprio.
- HP fixo em 60 para ambos.

## Tabela de golpes — o principal "próximo passo"

`data/moves.js` é **placeholder**. Formato de um golpe:
```js
{ id, name, power, accuracy /* 0..1 */, description }
```
- `DEFAULT_MOVES`: 4 golpes genéricos usados hoje por jogador e inimigo.
- `MOVES_BY_SLUG`: mapa vazio para golpes por professor.
- `getMovesFor(professor)` retorna os golpes do slug ou o default.

**Quando as tabelas reais de movimentos e ataques chegarem**: substituir o
conteúdo aqui mantendo o formato. Se as tabelas tiverem tipos/fraquezas, ajustar
também o cálculo de dano em `useBattle.js` (`rollDamage`).

## Limitações conhecidas / decisões em aberto

1. **AR real com 2 personagens**: `model-viewer` só coloca **um** modelo na câmera
   AR nativa (Scene Viewer/Quick Look), e o HUD da página some dentro dela. Uma
   batalha com os dois bonecos sobre a câmera exige **WebXR + DOM overlay**
   (Android/Chrome; iOS não suporta). Por isso a arena hoje é 3D na tela, não AR.
2. **HP e golpes por professor** ainda não existem — tudo fixo/genérico.
3. **Ângulos dos modelos** foram calibrados "no olho"; podem precisar de ajuste
   fino no dispositivo real (mexer em `camera-orbit` e no CSS `.arena__model--*`).
4. O preview em navegador de desenvolvimento não renderiza o GLB pesado (WebGL por
   software trava); testar 3D no celular.

## Ideias de continuação

- Plugar tabelas reais de movimentos/ataques em `moves.js`.
- HP, nível e golpes por professor (usar `MOVES_BY_SLUG` + campos do backend).
- Tela de vitória com recompensa (captura, XP).
- Sistema de tipos/fraquezas no cálculo de dano.
- Avaliar WebXR para a batalha acontecer sobre a câmera.
