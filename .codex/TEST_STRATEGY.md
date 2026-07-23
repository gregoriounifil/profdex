# Estratégia de testes

## 1. Objetivos

- Detectar regressão antes do jogador.
- Provar regras de progressão e autorização no servidor.
- Tornar o motor de batalha determinístico e amplamente exercitado.
- Validar UI, câmera e 3D em dispositivos representativos.
- Manter testes rápidos na base e poucos e2e de alto valor.

## 2. Pirâmide

### Unitários

- Funções puras, mappers, validators, policies e motor de batalha.
- RNG e relógio injetados.
- Property-based tests para invariantes matemáticas e sequências.
- Mocks apenas em fronteiras; não testar implementação interna.

### Integração

- Services Nest com banco PostgreSQL efêmero.
- Constraints, transactions, idempotência e concorrência.
- Auth/JWT, DTO validation, mappers de saída e CORS/config.
- Não substituir Prisma por mock quando o objetivo for integridade.

### Componentes Vue

- Estados loading/error/empty/success.
- Eventos, acessibilidade, cleanup e store interaction.
- Scanner com media APIs e BarcodeDetector simulados.
- Arena com adapter do motor, sem depender de WebGL real no teste unitário.

### E2E/API

- Registrar -> autenticar -> descobrir por prova -> capturar -> listar.
- Negativos de autorização com dois usuários.
- QR inválido, expirado, repetido e concorrente.
- Token expirado e logout/revogação.
- Falha de banco e timeout controlado.

### Browser/dispositivo

- Chrome/Android como alvo primário; Safari/iOS para câmera/Quick Look quando aplicável.
- Desktop smoke para navegação.
- Dispositivo sem BarcodeDetector usando `jsQR`.
- Permissão de câmera permitida, negada e removida.
- Visual regression de telas críticas.

### Segurança e performance

- SAST, SCA, secret scan e lint em toda PR.
- DAST/API fuzz em ambiente efêmero.
- Teste de rate limit e abuse cases.
- Bundle budget, Lighthouse/Web Vitals e load test em release candidate.

## 3. Matriz crítica

| Fluxo | Unit | Integration | E2E | Browser/device |
|---|---:|---:|---:|---:|
| Registro/login | X | X | X | X |
| Catálogo/progresso | X | X | X | X |
| Discovery QR | X | X | X | X |
| Capture QR/markers | X | X | X | X |
| Motor de batalha | X |  | X | X |
| AR/model viewer | X |  |  | X |
| Config/deploy | X | X | X | smoke |

## 4. Casos obrigatórios de segurança

- Usuário A não lê nem altera progresso de B.
- Catálogo e includes não retornam `captureToken`.
- `POST /discoveries` não aceita apenas professorId como prova.
- Captura direta por ID falha sem condição server-side válida.
- QR secreto não existe em source, seed público, logs ou resposta.
- Login sofre rate limit e não diferencia usuário inexistente de senha errada.
- CORS rejeita origem fora da allowlist.
- Entrada extra é rejeitada e saída segue allowlist.
- JWT expirado/revogado falha e limpa sessão do cliente.

## 5. Casos obrigatórios do motor

- Multiplicadores de tipo 0,25x, 0,5x, 1x, 2x e 4x.
- STAB, accuracy, evasion e limites de stage.
- multi-hit, reflect, recoil, block, reduce e evade.
- paralisia, confusão, DoT, cleanse e imunidade.
- buff temporário sob clamp e expiração.
- undo damage com ambas as ordens de turno.
- KO por ataque, DoT, confusão, reflect e recoil.
- deck vazio/movimento inválido sem crash.
- dez mil simulações sem HP inválido, evento inválido ou loop infinito.

## 6. Cobertura

Pisos para considerar auditoria concluída:

| Escopo | Statements/Lines | Branches | Functions |
|---|---:|---:|---:|
| Total frontend | 80% | 75% | 80% |
| Total backend | 80% | 75% | 80% |
| Auth/progressão/QR | 95% | 90% | 95% |
| Motor de batalha | 95% | 90% | 95% |
| Código novo/alterado | 90% | 85% | 90% |

Cobertura não substitui qualidade dos asserts. Mutação é recomendada para policies e battle engine.

## 7. Ambientes e dados

- Usar `.env.test` sem segredo real.
- Subir PostgreSQL efêmero por suite/worker ou schema isolado.
- Aplicar migrations reais.
- Seed mínimo e determinístico.
- Nunca depender de banco de desenvolvimento/produção.
- Congelar horário e RNG quando necessário.
- Limpar dados de forma segura e limitada ao ambiente de teste.

## 8. CI recomendado

1. Install imutável (`npm ci`).
2. Lint/format check sem `--fix`.
3. Unit/component em paralelo.
4. Build frontend/backend.
5. Integration/e2e com Postgres efêmero.
6. Coverage gates.
7. SCA/secret scan/SAST.
8. Browser smoke.
9. Budgets de bundle/performance.
10. Relatório e artifacts.

## 9. Política de flakes

- Não repetir automaticamente para transformar vermelho em verde.
- Quarentena exige issue, owner e prazo.
- Investigar relógio, RNG, rede, animação e isolamento.
- Um teste flaky em fluxo crítico reprova o gate.

## 10. Comandos atuais

Executar da raiz:

```powershell
.\.codex\scripts\run-quality-gates.ps1
.\.codex\scripts\run-quality-gates.ps1 -IncludeE2E
.\.codex\scripts\run-quality-gates.ps1 -IncludeDependencyAudit
```

Não executar scripts `lint` que contenham `--fix` durante uma auditoria somente leitura.
