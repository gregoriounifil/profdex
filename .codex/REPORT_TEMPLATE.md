# Relatório de auditoria — ProfDex

**Data:** YYYY-MM-DD

**Versão/commit:** `<ref>`

**Auditor(es):** `<nomes>`

**Escopo:** `<frontend/backend/fluxos>`

**Decisão:** `APROVADO | REPROVADO | BLOCKED`

**Score geral:** `NN/100`

## 1. Resumo executivo

Descrever em até cinco parágrafos:

- estado geral e decisão;
- risco mais importante para negócio/jogador;
- evidências principais;
- o que mudou nesta iteração;
- próximo passo obrigatório.

## 2. Escopo e limitações

### Incluído

- `<itens>`

### Não incluído

- `<itens e motivo>`

### Ambiente

| Item | Valor |
|---|---|
| OS/Node/NPM | |
| Frontend URL/build | |
| Backend/database | |
| Browser/dispositivo | |
| Data de advisories | |

## 3. Evidências e quality gates

| Gate | Comando/método | Resultado | Evidência |
|---|---|---|---|
| Frontend lint | | PASS/FAIL | |
| Frontend build | | PASS/FAIL | |
| Backend lint | | PASS/FAIL | |
| Unit + coverage | | PASS/FAIL | |
| Integration/e2e | | PASS/FAIL/BLOCKED | |
| Dependency audit | | PASS/FAIL | |
| Browser smoke | | PASS/FAIL | |
| Performance budgets | | PASS/FAIL/NOT TESTED | |

## 4. Achados

### `<ID>` — `<título>`

- **Severidade:** Critical/High/Medium/Low
- **Confiança:** Confirmada/Alta/Média/Baixa
- **Estado:** Open/Fixing/Retest/Resolved/Blocked
- **Local:** `<arquivo:linha, endpoint ou tela>`
- **OWASP/CWE:** `<mapeamento>`
- **Impacto:** `<técnico e negócio>`
- **Evidência/reprodução:** `<passos e resultado>`
- **Causa raiz:** `<causa>`
- **Correção:** `<mudança recomendada ou aplicada>`
- **Teste de regressão:** `<teste>`
- **Risco residual:** `<risco>`

Repetir por achado e apresentar primeiro os de maior severidade.

## 5. Análise de arquitetura

- Fronteiras e módulos.
- Fonte de verdade.
- Acoplamento/duplicação.
- Contratos e DTOs.
- Evolução recomendada.

## 6. Análise de gameplay

- Loop central e progressão.
- Anti-cheat/QR.
- Motor de batalha e balanceamento.
- AR/câmera.
- UX, acessibilidade e resiliência.

## 7. Performance

| Métrica/ativo | Atual | Budget | Estado |
|---|---:|---:|---|
| JS inicial gzip | | | |
| Chunks 3D/AR | | | |
| GLB mobile | | | |
| Scanner FPS/custo | | | |
| API p95 | | | |

Descrever gargalos, impacto e prioridade.

## 8. Testes e cobertura

| Área | Statements | Branches | Functions | Lines | Gap |
|---|---:|---:|---:|---:|---|
| Frontend | | | | | |
| Backend | | | | | |
| Auth/progressão | | | | | |
| Battle engine | | | | | |

Listar suites executadas, falhas, cenários ausentes e flakes.

## 9. Plano de ação

| Prioridade | Ação | Owner | Esforço | Dependência | Critério de aceite |
|---|---|---|---|---|---|
| P0 | | | | | |

## 10. Recomendações futuras

- 0–30 dias.
- 31–60 dias.
- 61–90 dias.

## 11. Score

| Dimensão | Peso | Nota | Evidência |
|---|---:|---:|---|
| Segurança | 25 | | |
| Correção/reliability | 15 | | |
| Testes | 15 | | |
| Arquitetura/manutenibilidade | 15 | | |
| Performance | 15 | | |
| Qualidade de código | 10 | | |
| Operação/observabilidade | 5 | | |
| **Total** | **100** | **NN** | |

Aplicar teto:

- Critical aberto: score máximo 49 e decisão REPROVADO.
- Vulnerabilidade High aberta: score máximo 59 e decisão REPROVADO.
- Testes críticos não executados: score máximo 69.

## 12. Decisão e risco residual

**Decisão:** `<estado>`

**Justificativa:** `<evidência objetiva>`

**Risco residual:** `<itens>`

**Próxima reauditoria:** `<gatilho/data>`

## 13. Referências

- Links para standards, tickets, PRs, logs e artifacts.
