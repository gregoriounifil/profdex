---
name: profdex-audit
description: Auditar, corrigir e evoluir continuamente o ProfDex, um jogo Vue/JavaScript com API Nest/Prisma, QR Codes, desbloqueio de personagens, AR e batalhas. Usar para revisões de código, segurança OWASP, arquitetura, gameplay, desempenho, testes, preparação de release e reauditorias, aplicando um ciclo estrito até não restarem bugs críticos nem vulnerabilidades conhecidas.
---

# Auditoria contínua do ProfDex

Aplicar este skill como processo permanente de engenharia. Preservar evidências, não esconder falhas e não declarar conclusão enquanto os critérios de saída não forem satisfeitos.

## Carregar as referências

1. Ler [STOP_CONDITIONS.md](STOP_CONDITIONS.md) e [AUDIT_RULES.md](AUDIT_RULES.md) em toda auditoria.
2. Ler [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) ao tocar autenticação, autorização, QR, API, banco, dependências, segredos, upload, conteúdo remoto ou deploy.
3. Ler [GAME_REVIEW.md](GAME_REVIEW.md) ao tocar progressão, captura, personagens, tipos, golpes, batalha, AR ou anti-cheat.
4. Ler [CODE_STYLE.md](CODE_STYLE.md) antes de alterar código.
5. Ler [GAME_PERFORMANCE.md](GAME_PERFORMANCE.md) ao tocar câmera, scanner, Three.js, GLB, imagens, animação, rede, banco ou bundles.
6. Ler [TEST_STRATEGY.md](TEST_STRATEGY.md) para selecionar testes e medir cobertura.
7. Usar [REPORT_TEMPLATE.md](REPORT_TEMPLATE.md) para toda entrega de auditoria.

## Executar o ciclo obrigatório

### 1. Analisar

- Definir o escopo, os fluxos afetados e as invariantes de negócio.
- Registrar baseline de branch, ambiente, comandos, builds, testes, cobertura, lint e auditoria de dependências.
- Inspecionar código, configuração, banco, contratos de API, ativos e comportamento renderizado.
- Procurar bugs, inconsistências, edge cases, código morto, imports não usados, duplicações, acoplamento, violações SOLID, complexidade, falhas de erro, nomenclatura, modularização, legibilidade, desempenho e vulnerabilidades.
- Classificar cada achado por severidade, confiança, impacto, evidência, reprodução e owner provável.

### 2. Corrigir

- Corrigir primeiro Critical, depois High, Medium e Low.
- Aplicar o menor conjunto coerente de mudanças que remova a causa raiz.
- Reforçar controles no servidor; nunca confiar em validação, estado ou permissões apenas no cliente.
- Adicionar um teste que falhe antes da correção e passe depois sempre que o comportamento for automatizável.
- Evitar refatoração oportunista sem relação com o achado.

### 3. Testar

- Executar lint sem correção automática, testes unitários, integração, e2e, build e auditoria de dependências.
- Testar o fluxo afetado em navegador quando houver UI.
- Medir cobertura do código alterado e dos domínios críticos.
- Validar falhas, timeouts, concorrência, repetição, entradas inválidas e dispositivos lentos.
- Guardar comando, resultado e evidência; não resumir falha como sucesso parcial.

### 4. Reanalisar

- Revisar o diff completo e as fronteiras de confiança.
- Procurar regressões, bypasses alternativos, novos acoplamentos e efeitos colaterais.
- Reexecutar as checklists aplicáveis e atualizar o risco residual.
- Confirmar que a correção não apenas ocultou o sintoma.

### 5. Repetir

- Voltar a **Analisar** se qualquer gate falhar ou surgir novo achado.
- Repetir até satisfazer integralmente [STOP_CONDITIONS.md](STOP_CONDITIONS.md).
- Marcar como `BLOCKED`, nunca como concluído, quando um ambiente ou autoridade externa impedir validação obrigatória.

## Regras invioláveis de saída

- Manter zero bugs Critical abertos.
- Manter zero vulnerabilidades conhecidas ou confirmadas, em qualquer severidade, dentro do escopo.
- Manter zero achados High sem correção.
- Exigir lint, build e suites obrigatórias aprovadas.
- Exigir cobertura mínima definida em [TEST_STRATEGY.md](TEST_STRATEGY.md).
- Exigir evidência de reanálise e risco residual explícito.

Não rebaixar severidade para liberar a entrega. Não aceitar risco em nome do usuário sem decisão explícita de um responsável. Mesmo com aceite formal, registrar a entrega como exceção de risco, não como auditoria limpa.

## Produzir a entrega

- Atualizar o relatório profissional usando [REPORT_TEMPLATE.md](REPORT_TEMPLATE.md).
- Incluir resumo executivo, escopo, evidências, achados, arquitetura, desempenho, testes, recomendações, riscos residuais e score.
- Separar fato confirmado, inferência e item não testado.
- Encerrar com uma decisão inequívoca: `APROVADO`, `REPROVADO` ou `BLOCKED`.

## Automação local

Executar `scripts/run-quality-gates.ps1` a partir da raiz para os gates não destrutivos. Acrescentar `-IncludeE2E` quando houver banco de teste configurado e `-IncludeDependencyAudit` quando houver acesso ao registro npm.
