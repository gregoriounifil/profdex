# Relatório de auditoria — ProfDex

**Data:** 2026-07-23

**Escopo:** frontend Vue, backend Nest/Prisma, autenticação, QR/progressão, batalha, assets, build, testes e dependências

**Ambiente:** Windows; Node v24.13.1; npm 11.8.0

**Decisão:** `REPROVADO`

**Score geral:** `35/100`

## 1. Resumo executivo

O ProfDex compila no frontend e no backend, e o smoke test renderizado da tela inicial até o login passou sem erro ou warning no console. O projeto também já apresenta boas bases: rotas lazy, validação global com whitelist, hash de senha, constraints únicas de progressão, guards JWT e um motor de batalha em JavaScript puro.

A release não deve ser aprovada. Há uma vulnerabilidade **Critical** que invalida a regra central do jogo: as APIs retornam o `captureToken` dos professores e permitem criar discovery enviando apenas um `professorId`. Em seguida, o próprio endpoint de captura por ID aceita esse estado. Assim, qualquer usuário autenticado pode descobrir e capturar todos os personagens sem ler QR ou cumprir a condição física de captura.

Também foram confirmadas vulnerabilidades High em dependências, CORS permissivo com credenciais, ausência de rate limit, tokens QR estáticos/reutilizáveis, JWT persistido por sete dias em `localStorage`, carregamento de scripts externos sem SRI/CSP, cobertura de backend de apenas 5,09% de statements e inexistência de testes automatizados no frontend. O e2e atual falha por ausência de banco de teste configurado.

O principal risco de performance está nos assets 3D: o GLB principal tem 77,18 MB e a variante mobile 12,80 MB, acima do gate proposto. O build também produz chunks de aproximadamente 960 KB e 1,02 MB antes de gzip para Tres/Three e model-viewer.

Esta iteração criou o framework permanente em `.codex`, mas não alterou o código da aplicação. O próximo ciclo obrigatório é corrigir os achados P0/P1, adicionar testes de regressão e repetir integralmente os gates.

## 2. Escopo e limitações

### Incluído

- código e configuração do frontend e backend;
- schema Prisma, serviços, DTOs e fluxo de autenticação;
- descoberta/captura via QR e markers;
- regras e integração do motor de batalha;
- lint, build, unit/coverage, e2e e auditoria npm;
- smoke test renderizado `home -> COMEÇAR -> login`;
- tamanho de bundles e assets.

### Não concluído

- e2e com PostgreSQL real/efêmero, pois o teste não possui `DATABASE_URL` de teste válida;
- câmera, QR real, MindAR, WebXR e GLB em dispositivo físico;
- DAST autenticado, load test, Web Vitals e profiler de GPU/memória;
- infraestrutura Vercel/Railway em produção;
- teste de intrusão ativo contra ambiente remoto;
- balanceamento estatístico de milhares de batalhas.

Itens não concluídos permanecem como risco, não como aprovação implícita.

## 3. Quality gates executados

| Gate | Resultado | Evidência principal |
|---|---|---|
| Frontend Oxlint | FAIL | 2 variáveis não usadas em `useArenaAR.js:53` e `battleEngine.js:231` |
| Frontend ESLint | FAIL | `props` não usado em `SceneContent.vue:10` e `Stage3D.vue:8` |
| Frontend build | PASS com warning | 608 módulos; chunks > 500 KB |
| Backend ESLint | FAIL | 15 erros de Prettier e 1 `no-floating-promises` |
| Backend unit + coverage | PASS insuficiente | 1 teste; 5,09% statements; 4,43% lines |
| Backend e2e | FAIL | Prisma sem URL PostgreSQL válida |
| Backend build | PASS | Nest build concluído |
| npm audit raiz | PASS | 0 vulnerabilidades |
| npm audit frontend | FAIL | 2 pacotes High; correção disponível |
| npm audit backend | FAIL | 2 High, 1 Moderate e 1 Low; correção disponível |
| Browser smoke | PASS | página não vazia, sem overlay/console error; botão levou a `/login` |
| Performance budgets | FAIL/NOT TESTED | assets e chunks excedem budgets; runtime físico não medido |

## 4. Achados

### P0-SEC-001 — Bypass completo de discovery/capture e exposição do segredo

- **Severidade:** Critical
- **Confiança:** Confirmada por revisão de código
- **Estado:** Open
- **OWASP:** A01:2025 Broken Access Control; A06:2025 Insecure Design; API3:2023 BOPLA; API6:2023 Unrestricted Access to Sensitive Business Flows
- **Locais:**
  - `profdex-back/src/professors/professors.service.ts:10-21`
  - `profdex-back/src/professors/professors.service.ts:25-26`
  - `profdex-back/src/discoveries/discoveries.controller.ts:11-13`
  - `profdex-back/src/discoveries/discoveries.service.ts:8-14`
  - `profdex-back/src/captures/captures.service.ts:8-20`
  - `profdex-back/src/captures/captures.service.ts:43-54`

**Evidência:** `findMany()` e `findUniqueOrThrow()` retornam a entidade `Professor` inteira, que contém `captureToken`. O spread `...p` preserva esse campo. Os `include: { professor: true }` de discoveries/captures também o retornam. `POST /discoveries` recebe apenas `professorId`; após isso, `POST /captures` exige somente a existência desse discovery.

**Impacto:** qualquer conta válida pode listar IDs/tokens e desbloquear todo o catálogo sem QR, professor, card ou dois markers. O ataque quebra progressão, integridade do jogo, métricas e qualquer prêmio associado.

**Correção:**

1. Criar DTO/mapper público com allowlist e remover `captureToken` de todas as respostas.
2. Substituir `POST /discoveries { professorId }` por resgate de uma prova server-side.
3. Remover ou proteger a captura direta por ID; validar a condição real no servidor.
4. Tornar discovery/capture atômicos e auditáveis.
5. Adicionar testes negativos que chamem diretamente os endpoints.

**Teste de regressão:** verificar que nenhum endpoint serializa o token; um usuário com todos os IDs não consegue descobrir/capturar sem prova; dois requests concorrentes resultam em uma transição.

### P0-SEC-002 — Tokens QR estáticos, versionados e reutilizáveis

- **Severidade:** High
- **Confiança:** Confirmada
- **Estado:** Open
- **OWASP:** A04:2025 Cryptographic Failures; A06:2025 Insecure Design; A08:2025 Integrity Failures
- **Local:** `profdex-back/src/seed/seed.service.ts:4-28`

Três tokens completos estão hardcoded no source e são gravados no banco. Não há expiração, hash em repouso, rotação, revogação, campanha ou proteção de replay. Uma foto ou cópia pode ser reutilizada por qualquer número de contas.

**Correção:** revogar os tokens atuais; remover segredos do Git e do seed; guardar somente hash; modelar prova com expiração/revogação/campanha e uma tabela de redemption. Para prêmio relevante, usar QR dinâmico ou challenge-response. Se o QR for deliberadamente compartilhável, documentar essa regra e ainda impedir sua exposição pelo catálogo.

### P1-SEC-003 — CORS permissivo com credenciais e hardening HTTP ausente

- **Severidade:** High
- **Confiança:** Alta
- **Estado:** Open
- **OWASP:** A02:2025 Security Misconfiguration
- **Local:** `profdex-back/src/main.ts:10-13`

`origin: true` reflete qualquer origem e `credentials: true` habilita credenciais. Não foram encontrados Helmet/CSP/HSTS/referrer policy nem configuração de limites e segurança por ambiente.

**Correção:** allowlist estrita de origens, validação de configuração no bootstrap, Helmet, CSP compatível com assets, limites de payload e documentação do proxy TLS. Remover `credentials` se o modelo Bearer não exigir cookies.

### P1-SEC-004 — Sessão exposta a XSS e autenticação sem proteção contra abuso

- **Severidade:** High
- **Confiança:** Alta
- **Estado:** Open
- **OWASP:** A07:2025 Authentication Failures; API2:2023 Broken Authentication
- **Locais:**
  - `profdex-front/src/stores/auth.js:6-32`
  - `profdex-front/src/services/api.js:7-10`
  - `profdex-back/src/auth/auth.module.ts:15-20`
  - `profdex-back/src/auth/auth.controller.ts:10-18`

O JWT de sete dias fica em `localStorage`; qualquer XSS no origin pode exfiltrá-lo. O frontend considera autenticado apenas pela presença do token, não trata expiração/401 globalmente e não existe revogação. Login/registro não têm rate limit.

**Correção:** preferir sessão em cookie `HttpOnly; Secure; SameSite` ou BFF; usar access token curto + refresh rotativo quando necessário; implementar 401/logout; adicionar throttling progressivo e alertas. A [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) recomenda não guardar credenciais/JWT em Web Storage.

### P1-SCA-001 — Dependências de produção vulneráveis

- **Severidade:** High
- **Confiança:** Confirmada pelo registro npm em 2026-07-23
- **Estado:** Open
- **OWASP:** A03:2025 Software Supply Chain Failures

**Frontend:** `axios` direto e `form-data` transitivo resultaram em 2 pacotes High; upgrade disponível.

**Backend:** `@nestjs/platform-express`/`multer` High, `qs` Moderate e `body-parser` Low; upgrade disponível.

**Raiz:** zero vulnerabilidades.

Alguns advisories do Axios são específicos do adapter Node e a explorabilidade no bundle do browser precisa ser confirmada; isso não elimina o gate SCA. O advisory de Multer também requer análise de reachability, pois não foram identificados endpoints de upload, mas a dependência vulnerável está instalada.

**Correção:** atualizar locks em branch dedicada, executar `npm audit`, build e todas as suites; remover dependência transitiva não necessária quando possível; adicionar Renovate/Dependabot e SCA no CI.

### P1-SEC-005 — Scripts remotos sem integridade e duas versões de Three.js

- **Severidade:** High
- **Confiança:** Alta
- **Estado:** Open
- **OWASP:** A03/A08:2025 Supply Chain e Integrity Failures
- **Locais:**
  - `profdex-front/src/composables/useAR.js:16-20`
  - `profdex-front/src/views/ScanView.vue:28-36`
  - `profdex-front/index.html:11-13`

Three 0.140.0, MindAR 1.1.5 e jsQR 1.4.0 são injetados em runtime via jsDelivr, sem SRI/CSP. O projeto também empacota Three 0.183.2, criando duplicação e risco de incompatibilidade.

**Correção:** importar dependências pelo build/lockfile; adotar uma versão compatível de Three; servir fontes/assets controlados; implantar CSP. Se CDN for obrigatório, usar SRI e allowlist mínima.

### P1-QA-001 — Estratégia de testes insuficiente e e2e não hermético

- **Severidade:** High
- **Confiança:** Confirmada
- **Estado:** Open

O backend tem somente o teste scaffold de `AppController`: 1 suite/1 teste. A cobertura global é 5,09% statements, 3,57% branches, 6,97% functions e 4,43% lines; auth, captures, discoveries, professors e users estão em 0%. O frontend não possui runner nem testes. O e2e usa o app real e falha antes do assert porque `DATABASE_URL` não aponta para PostgreSQL.

**Correção:** seguir [TEST_STRATEGY.md](TEST_STRATEGY.md); criar Postgres efêmero com migrations; priorizar testes de autorização/progressão e do battle engine; adicionar Vitest/Vue Test Utils e Playwright/browser smoke no CI.

### P1-PERF-001 — Assets 3D e chunks acima do budget móvel

- **Severidade:** High
- **Confiança:** Confirmada para tamanho; runtime não medido
- **Estado:** Open

| Ativo/chunk | Tamanho atual |
|---|---:|
| `seu-modelo.glb` | 77.182.072 bytes |
| `seu-modelo-mobile.glb` | 12.802.000 bytes |
| `gustavo-marker.png` | 4.224.704 bytes |
| `markers.mind` | 1.663.305 bytes |
| chunk model-viewer | 1.024,41 KB / 290,39 KB gzip |
| chunk Tres/Cientos | 959,87 KB / 259,39 KB gzip |

A arena cria dois `<model-viewer>` com o mesmo GLB, o que pode duplicar parse, scene e recursos de GPU mesmo quando a transferência é cacheada. O fallback jsQR lê o canvas em cada `requestAnimationFrame` com câmera ideal de 1280×720, elevando CPU e bateria.

**Correção:** comprimir/decimar GLB, KTX2/Meshopt/Draco, LOD mobile <= 10 MB (alvo 5 MB), otimizar marker, limitar detecção a 10–15 fps e frame reduzido/Worker, medir memória e FPS em Android intermediário.

### P2-GAME-001 — Batalha aceita estados inválidos e contém regras inconsistentes

- **Severidade:** Medium
- **Confiança:** Alta por revisão; testes ausentes
- **Estado:** Open
- **Locais:**
  - `profdex-front/src/views/BatalhaView.vue:14-25`
  - `profdex-front/src/composables/battleEngine.js:89-149`
  - `profdex-front/src/composables/battleEngine.js:333-352`
  - `profdex-front/src/composables/battleEngine.js:407-425`
  - `profdex-front/src/composables/battleEngine.js:443-465`

Problemas:

- seleção cai para discovered ou até primeiro professor, permitindo batalha sem captura;
- `shield.turns` é armazenado, mas nunca decrementado;
- `debuffImmuneTurns` protege stage change, mas não paralisia/confusão/DoT;
- `UNDO_DAMAGE` usa `hpAtTurnStart` atualizado no upkeep do próprio turno e pode não representar o dano do turno anterior;
- KO do defensor retorna antes de aplicar recoil;
- deck vazio leva `chooseEnemyMove` a retornar `undefined`;
- `canAct: c.hp > 0 ? false : false` é código redundante e sinal de lógica não revisada;
- RNG global impede reprodução determinística.

**Correção:** especificar regras, injetar RNG, validar config e cobrir a matriz de [GAME_REVIEW.md](GAME_REVIEW.md).

### P2-ARCH-001 — Catálogo e captura pouco escaláveis

- **Severidade:** Medium
- **Confiança:** Confirmada
- **Estado:** Open
- **Locais:** `CaptureView.vue:18-23`, `ArenaView.vue:94-108`, `seed.service.ts:4-28`, `professorTypes.js`

Novos professores exigem mudanças coordenadas em seed, pares de marker no frontend, tipos, assets e fallbacks. O player e modelos de batalha ainda estão hardcoded. Entidades Prisma são usadas como contrato externo.

**Correção:** criar schema canônico versionado de personagem, policy server-side para progressão, DTOs de saída e registry validado para tipos/moves/assets. Separar Catalog, Discovery, Capture e Battle.

### P2-REL-001 — Timeouts, falhas e configuração não são tratados consistentemente

- **Severidade:** Medium
- **Confiança:** Alta
- **Estado:** Open

- Axios não define timeout; somente o preload da rota implementa race local.
- JSON corrompido em `localStorage.user` pode lançar no bootstrap do store.
- `CaptureView` aguarda fetch/start sem try/catch final, enquanto `useAR.start()` relança o erro.
- `SeedService` captura qualquer exceção e assume “tabelas não existem”.
- Backend ignora `PORT` documentada e fixa 3000; `.env.example` declara `PORT=5173`.
- `bootstrap()` não trata a Promise rejeitada.

**Correção:** timeout/cancelamento central, error taxonomy, configuração validada, seed separado e observabilidade de causa.

### P3-CODE-001 — Lint, código morto e duplicações

- **Severidade:** Low
- **Confiança:** Confirmada
- **Estado:** Open

- 4 declarações não usadas no frontend;
- 15 erros de formato e 1 promise não tratada no backend;
- `ProfCard (1).vue` não possui consumidor;
- `counter.js`, `ARViewer.vue`/`useModelViewer.js` e `useArenaAR.js` aparentam ser código de laboratório/desativado;
- views chegam a 761, 595, 557 e 520 linhas;
- botão “Quiz” não tem ação nem estado “em breve”.

**Correção:** remover/feature-flag com owner; modularizar Scan/Arena; aplicar formato revisando diff; adicionar CI sem auto-fix.

## 5. Análise de arquitetura

### Pontos positivos

- Nest separado de Vue e Prisma encapsulado em service global.
- ValidationPipe usa `whitelist` e `forbidNonWhitelisted`.
- JWT é verificado no backend e `userId` vem do principal autenticado.
- `@@unique([userId, professorId])` e upsert favorecem idempotência.
- Battle engine é independente de Vue e retorna eventos, uma boa base para testes.
- Rotas Vue são lazy e preload possui timeout local.

### Arquitetura alvo

```text
HTTP DTO -> Authenticated Principal -> Domain Policy -> Transaction -> Output Mapper

Catalog
  ├── CharacterDefinition
  └── PublicCharacterDto (sem segredo)

Progression
  ├── QrProof (hash, campanha, expiração, revogação)
  ├── DiscoveryPolicy
  ├── CapturePolicy
  └── Redemption/AuditEvent

Battle
  ├── BattleData registry
  ├── Pure deterministic engine
  └── Vue animation adapter
```

Discovery e capture devem ser transições de domínio, não CRUD por ID. A condição dos dois markers hoje existe apenas no cliente e, portanto, não é uma garantia. O produto deve decidir se a captura é casual/cliente-trusted ou se gera valor competitivo; no segundo caso, é necessária uma prova server-side (por exemplo, segundo QR/challenge assinado).

## 6. Cobertura e validação de UI

| Área | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| Backend total | 5,09% | 3,57% | 6,97% | 4,43% |
| Backend auth/progressão | 0% | 0% | 0% | 0% |
| Frontend | Não instrumentado | Não instrumentado | Não instrumentado | Não instrumentado |
| Battle engine | 0% | 0% | 0% | 0% |

Smoke renderizado:

- **URL:** `http://127.0.0.1:4173/`
- **Browser:** navegador integrado
- **Fluxo:** app carrega -> conteúdo significativo aparece -> “COMEÇAR” -> `/login`
- **Page identity:** PASS (`ProfDex`)
- **Blank/overlay:** PASS
- **Console error/warn:** PASS (nenhum relevante)
- **Interaction proof:** PASS; tela de login apresentou matrícula, senha e botão entrar
- **Não testado:** autenticação real, câmera, catálogo, captura, arena e mobile físico

## 7. Plano de ação

| Prioridade | Ação | Critério de aceite |
|---|---|---|
| P0 | Revogar/remover tokens expostos e criar DTO de saída | Nenhuma resposta/source contém token; teste automatizado |
| P0 | Redesenhar discovery/capture como resgate de prova | Chamada por ID não libera; concorrência/idempotência testadas |
| P1 | Corrigir CORS, sessão, rate limit e headers | Testes negativos e configuração por ambiente |
| P1 | Atualizar dependências vulneráveis | `npm audit --omit=dev` = 0 nos três pacotes |
| P1 | Criar banco e2e efêmero + suites críticas | e2e verde; auth/progressão >= 95/90 |
| P1 | Otimizar GLB/scanner/chunks | budgets de `GAME_PERFORMANCE.md` verdes |
| P2 | Especificar/corrigir motor de batalha | matriz e propriedades verdes com RNG injetado |
| P2 | Remover hardcodes e código morto | um registry canônico; lint verde |
| P2 | Adicionar observabilidade e config validation | falhas distinguíveis, request ID e alertas |

## 8. Roadmap recomendado

### 0–30 dias

- P0 de progressão/segredos.
- Dependências, CORS, rate limit e sessão.
- Testes de autorização, DTOs e Postgres e2e.
- CI com lint/build/test/audit/secret scan.

### 31–60 dias

- Cobertura frontend e battle engine.
- Catálogo data-driven e modularização do Scan/Arena.
- Compressão de GLB, throttle/Worker do scanner e budgets CI.
- Logs estruturados e alertas de abuso.

### 61–90 dias

- Threat modeling por feature.
- Simulações de balanceamento e property/mutation testing.
- Telemetria de Web Vitals, API e GPU/dispositivo.
- Estratégia anti-replay/QR dinâmico conforme valor do prêmio.

## 9. Score geral

| Dimensão | Peso | Nota | Justificativa |
|---|---:|---:|---|
| Segurança | 25 | 3 | bypass Critical, tokens expostos, SCA/CORS/session |
| Correção/reliability | 15 | 8 | builds/smoke passam; battle/error gaps |
| Testes | 15 | 2 | 1 teste, 5,09%, e2e falha, frontend zero |
| Arquitetura/manutenibilidade | 15 | 8 | boa separação inicial; políticas/DTOs/hardcodes faltam |
| Performance | 15 | 5 | lazy routes; GLB/chunks/scanner acima do budget |
| Qualidade de código | 10 | 6 | estrutura legível; lint, arquivos grandes e código morto |
| Operação/observabilidade | 5 | 3 | configs básicas; logs/alerts/health/test env insuficientes |
| **Total** | **100** | **35** | teto Critical aplicado |

## 10. Decisão e risco residual

**Decisão:** `REPROVADO`

**Justificativa:** vulnerabilidade Critical de progressão, vulnerabilidades High e gates QA/SCA falhando.

**Risco residual:** elevado; o loop central pode ser burlado e os segredos atuais devem ser considerados comprometidos.

**Próxima reauditoria:** imediatamente após concluir P0 e atualizar dependências; repetir o ciclo completo, não apenas os testes afetados.

## 11. Referências

- [OWASP Top 10:2025](https://owasp.org/Top10/)
- [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/en/0x03-introduction/)
- [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0_release)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Framework de auditoria](SKILL.md)
