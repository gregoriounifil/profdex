# ProfDex — backend

API NestJS + Prisma que atende o app de WebAR: autenticação, catálogo de
professores, captura por QR e o **PvP ranqueado** (lobby, convites e batalhas
por WebSocket).

## Requisitos

- Node.js 20+
- Um banco **PostgreSQL** — Supabase (usado no deploy) ou local via Docker

## Configuração

```bash
npm install
cp .env.example .env    # preencha os valores
npx prisma migrate deploy
npm run db:seed         # professores iniciais
npm run db:seed-quiz    # 90 questões do quiz de bancada
```

> **Cadastro é só pelo Google.** Não existe `POST /auth/register`: a conta nasce
> em `/auth/google` e é concluída com matrícula, nome e senha — que passam a
> valer para o login normal. Ver [`docs/AUTENTICACAO.md`](../docs/AUTENTICACAO.md).

### Banco local via Docker

Não é preciso Supabase para desenvolver. O [`docker-compose.yml`](docker-compose.yml)
sobe um Postgres 16 em `localhost:55432` (porta escolhida para não conflitar com
um Postgres já instalado na máquina):

```bash
npm run db:up                              # sobe e espera ficar saudável
# no .env, use as duas linhas comentadas em "Postgres local via Docker":
#   DATABASE_URL="postgresql://profdex:profdex@localhost:55432/profdex"
#   DIRECT_URL="postgresql://profdex:profdex@localhost:55432/profdex"
npx prisma migrate deploy && npm run db:seed
```

`npm run db:down` para o container preservando os dados; `npm run db:nuke`
descarta o volume junto (útil para recomeçar do zero).

Como não há pgbouncer aqui, `DATABASE_URL` e `DIRECT_URL` são iguais e sem
`?pgbouncer=true` — o resto do app não muda, o `schema.prisma` já é PostgreSQL.

### Variáveis de ambiente

| Variável | Obrigatória | Para que serve |
|---|---|---|
| `DATABASE_URL` | ✅ | Conexão usada em runtime (no Supabase, via pgbouncer na porta 6543). |
| `DIRECT_URL` | ✅ | Conexão direta (porta 5432), usada **só** pelo Prisma Migrate. Sem ela, `prisma validate` falha com `P1012`. Com Postgres local é igual à `DATABASE_URL`. |
| `JWT_SECRET` | ✅ | Assina o cookie de sessão **e** valida o handshake do WebSocket de batalha. |
| `CORS_ORIGINS` | ✅ | Origens liberadas no HTTP e no WebSocket, separadas por vírgula. |
| `PORT` | — | Padrão `3000`. |
| `LOAD_*` | — | Só para o teste de carga. Ver [`scripts/loadtest/`](scripts/loadtest/README.md). |

> **Atenção:** o schema exige PostgreSQL (`provider = "postgresql"` em
> `schema.prisma` e em `migrations/migration_lock.toml`). Um `.env` antigo
> apontando para `file:./dev.db` (SQLite) **não funciona** — é uma pegadinha
> comum em máquinas que acompanharam a migração.

## Rodando

```bash
npm run start:dev     # watch
npm run start:prod    # a partir de dist/
```

## Testes

```bash
npm test              # unitários
npm run test:e2e      # end-to-end
npm run test:cov      # cobertura
```

### PvP

```bash
npm run pvp:smoke     # fluxo completo de batalha contra um servidor no ar
```

Percorre registro → lobby → convite → aceite → pick às cegas → turnos → Elo →
ranking → cooldown, tudo pela rede. Exige o servidor rodando e o seed aplicado.

### Teste de carga

```bash
npx artillery run scripts/loadtest/pvp-load.yml
```

Centenas de conexões simultâneas no lobby e em batalha. Documentação em
[`scripts/loadtest/README.md`](scripts/loadtest/README.md); a análise dos
gargalos que ele investiga está em [`docs/CARGA-PVP.md`](../docs/CARGA-PVP.md).

## Manutenção do banco

```bash
npm run db:migrate                                    # cria migration (dev)
npm run db:studio                                     # inspeção visual
npm run db:reset-ranking                              # prévia (não altera nada)
npm run db:reset-ranking -- --yes                     # zera ranking e batalhas
npm run db:reset-ranking -- --yes --purge-test-users  # + remove contas de teste
npm run db:set-admin                                  # lista administradores
npm run db:set-admin -- 202312345                     # promove a admin
npm run db:seed-quiz                                  # questões do quiz
npm run qr:generate                                   # QR codes de captura
```

`--purge-test-users` só apaga contas com prefixo de teste (`smoke`, `bat`,
`inv`, `proxy`, `dbg`, `load`). Contas reais nunca são removidas — apenas têm a
pontuação zerada.

## Documentação

- [`docs/BATALHA-PVP.md`](../docs/BATALHA-PVP.md) — regras do PvP, Elo, tiers
- [`docs/CARGA-PVP.md`](../docs/CARGA-PVP.md) — análise de carga do multiplayer
- [`docs/METRICAS.md`](../docs/METRICAS.md) — métricas de uso e painel admin
- [`docs/QUIZ.md`](../docs/QUIZ.md) — quiz de bancada do evento
- [`docs/AUTENTICACAO.md`](../docs/AUTENTICACAO.md) — login Google, papéis e reset de senha
- [`docs/BUG-BATALHA-TRAVANDO.md`](../docs/BUG-BATALHA-TRAVANDO.md) — travamento da arena no iOS
- [`docs/GUIA-TIPOS.md`](../docs/GUIA-TIPOS.md) — tipos e efetividade
- [`docs/HANDOFF-DEPLOY-RAILWAY-VERCEL.md`](../docs/HANDOFF-DEPLOY-RAILWAY-VERCEL.md) — deploy
