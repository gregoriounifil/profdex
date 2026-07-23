# Condições de parada

## 1. Estados possíveis

- `APROVADO`: todos os gates obrigatórios passaram.
- `REPROVADO`: há achado que viola um gate e existe caminho de correção conhecido.
- `BLOCKED`: validação obrigatória depende de acesso, ambiente, decisão ou autoridade externa indisponível.
- `EM_ANDAMENTO`: o ciclo Analisar–Corrigir–Testar–Reanalisar ainda está ativo.

## 2. Parar como APROVADO somente quando

- [ ] Zero bugs Critical abertos.
- [ ] Zero vulnerabilidades conhecidas/confirmadas em qualquer severidade.
- [ ] Zero achados High abertos.
- [ ] Todos os achados Medium/Low foram corrigidos ou demonstrados como falso positivo; risco aceito não equivale a auditoria limpa.
- [ ] Lint frontend e backend passam sem auto-fix.
- [ ] Builds frontend e backend passam.
- [ ] Suites unit, integration e e2e obrigatórias passam.
- [ ] Cobertura satisfaz [TEST_STRATEGY.md](TEST_STRATEGY.md).
- [ ] Auditoria de dependências retorna zero vulnerabilidades.
- [ ] Secret scan não encontra credencial/token real versionado.
- [ ] Testes negativos de autorização e progressão passam.
- [ ] Fluxos UI alterados foram verificados em navegador/dispositivo proporcional ao risco.
- [ ] Budgets de performance passam.
- [ ] Diff foi reanalisado por regressões e bypasses.
- [ ] Relatório contém evidências, risco residual e score.

## 3. Parar imediatamente a correção e marcar BLOCKED quando

- houver risco de destruir dados ou executar migration irreversível sem backup/rollback;
- for necessário segredo, conta, dispositivo ou permissão não fornecidos;
- o ambiente de teste apontar para produção ou não puder ser isolado;
- houver dúvida material de regra de negócio cuja escolha altere progressão, prêmio ou segurança;
- a correção exigir autoridade fora do escopo;
- dependência/serviço externo impedir teste obrigatório;
- evidência sugerir incidente ativo que exija resposta organizacional.

Antes de bloquear, executar todos os checks seguros e independentes. Registrar exatamente o que falta e como desbloquear.

## 4. Não considerar bloqueio

- trabalho difícil, demorado ou com muitos achados;
- teste vermelho que pode ser corrigido localmente;
- cobertura baixa;
- dívida técnica;
- necessidade de refatorar causa raiz;
- vulnerabilidade com patch disponível;
- ausência de documentação que possa ser criada no escopo.

## 5. Condições de reprovação de release

Reprovar automaticamente por:

- bypass de autenticação, autorização, QR, discovery ou capture;
- segredo/token de negócio exposto em source, resposta, log ou artifact;
- dependência Critical/High vulnerável;
- CORS permissivo com credenciais;
- ausência de rate limit em autenticação exposta;
- teste crítico ausente ou falhando;
- e2e não executável em CI;
- corrupção/perda de progressão;
- crash reproduzível no loop central;
- performance acima do gate máximo.

## 6. Exceções

Aceite de risco deve conter responsável, justificativa, prazo, compensação e ticket. Ele permite uma decisão de negócio externa, mas o relatório técnico permanece `REPROVADO — risco aceito` até o achado ser resolvido.

## 7. Decisão rápida

| Situação | Estado |
|---|---|
| Todos os gates verdes | APROVADO |
| Vulnerabilidade ou Critical aberto | REPROVADO |
| High, lint, build, teste, cobertura ou budget falhando | REPROVADO |
| Evidência obrigatória impossível por dependência externa | BLOCKED |
| Correções/testes ainda sendo iterados | EM_ANDAMENTO |
