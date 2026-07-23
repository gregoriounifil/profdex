# Regras permanentes de auditoria

## 1. Princípios

- Auditar comportamento, não apenas sintaxe.
- Exigir evidência reproduzível para confirmar ou encerrar um achado.
- Preferir causa raiz a remendos locais.
- Tratar cliente, QR Code, parâmetros de rota e estado do navegador como entrada não confiável.
- Considerar segurança, qualidade, desempenho e gameplay como gates independentes.
- Preservar mudanças do usuário e limitar correções ao escopo acordado.

## 2. Modelo de severidade

| Nível | Critério | SLA recomendado |
|---|---|---|
| Critical | Compromete autenticação/autorização, segredos, integridade global, regra central do jogo, dados em massa ou disponibilidade total; exploração simples ou impacto catastrófico | Bloquear imediatamente |
| High | Impacto relevante em conta, progressão, dados, disponibilidade, dependência vulnerável ou fluxo primário | Corrigir antes de release |
| Medium | Regressão importante, edge case frequente, dívida com alto custo futuro ou defesa em profundidade ausente | Próxima iteração |
| Low | Manutenibilidade, consistência, UX menor ou hardening sem exploração prática demonstrada | Backlog priorizado |

Registrar também:

- **Confiança:** confirmada, alta, média ou baixa.
- **Estado:** open, fixing, retest, resolved, accepted-risk ou blocked.
- **Origem:** SAST, DAST, teste, revisão manual, dependência ou observabilidade.

## 3. Evidência mínima por achado

Incluir:

1. ID e título.
2. Severidade e confiança.
3. Arquivo/linha, endpoint, tela ou ativo.
4. Pré-condição e passos de reprodução.
5. Resultado atual e resultado esperado.
6. Impacto técnico e no jogador.
7. Causa raiz.
8. Mapeamento CWE/OWASP quando aplicável.
9. Correção proposta.
10. Teste de regressão e risco residual.

## 4. Bugs, inconsistências e edge cases

Verificar:

- estados vazio, loading, erro, offline, timeout, retry, dados parciais e resposta fora de ordem;
- null, undefined, string vazia, Unicode, limites, IDs inválidos e objetos inesperados;
- duplo clique, dupla leitura de QR, concorrência, idempotência e repetição;
- refresh, deep link, voltar/avançar, token expirado e estado local corrompido;
- permissão de câmera negada, câmera ausente, troca de orientação e desmontagem da tela;
- QR inválido, expirado, reutilizado, fotografado, compartilhado ou de host não confiável;
- personagem inexistente, não descoberto ou não capturado tentando batalhar;
- empate, KO simultâneo, status no último turno, escudo expirado, deck vazio e RNG extremo;
- falha de banco no meio de uma operação e consistência entre descoberta/captura;
- diferenças entre documentação, UI, API e regra real.

## 5. Código morto, imports e duplicações

- Remover imports, variáveis, componentes, stores, composables, rotas e estilos sem consumidor.
- Não manter cópias com sufixos como `(1)`, `copy`, `old`, `backup` ou `final`.
- Exigir justificativa e owner para código desativado por feature flag.
- Detectar duplicação de regra de negócio entre frontend, backend, seed e documentação.
- Centralizar dados de personagens, marcadores, tipos, golpes e assets em fontes canônicas.

## 6. SOLID, clean code e acoplamento

- Manter responsabilidade única por módulo, service, composable e componente.
- Separar domínio puro de Vue, HTTP, Prisma, câmera, renderização e animação.
- Depender de contratos explícitos em fronteiras externas.
- Evitar controllers com regra de negócio e views com máquinas de estado extensas.
- Não expor entidades Prisma diretamente; mapear DTOs de saída com allowlist.
- Injetar relógio e RNG no motor de batalha para testes determinísticos.
- Evitar estado global quando estado local ou parâmetro explícito for suficiente.
- Tornar extensões de personagem e golpe orientadas a dados, sem editar várias telas.

## 7. Complexidade e tamanho

- Preferir função com complexidade ciclomática até 10.
- Abrir achado Medium acima de 10 e High acima de 15 sem justificativa/testes.
- Preferir função até 40 linhas e módulo de lógica até 300 linhas.
- Revisar SFC acima de 400 linhas para extrair estado, seções ou estilos.
- Evitar mais de três níveis de aninhamento.
- Substituir cadeias extensas de `if/switch` por tabelas/estratégias quando o domínio crescer.

Limites são gatilhos de revisão, não metas mecânicas. Código maior pode permanecer quando mais legível e plenamente testado.

## 8. Tratamento de erros

- Definir timeout em toda chamada de rede.
- Propagar erro com contexto sem expor segredo ou stack ao usuário.
- Diferenciar erro recuperável, validação, autenticação, autorização, conflito e falha interna.
- Proibir `catch {}` silencioso em fluxos críticos.
- Limpar câmera, animation loop, WebGL, listeners, timers e streams em sucesso e falha.
- Implementar idempotência para descoberta e captura.
- Falhar de forma fechada em autorização e configuração de segurança.
- Registrar eventos de segurança com correlação, sem senha, JWT ou token de QR.

## 9. Nomenclatura, modularização e legibilidade

- Usar inglês para símbolos técnicos e português consistente para texto ao jogador.
- Nomear booleanos com `is`, `has`, `can` ou `should`.
- Nomear ações com verbo e entidades com substantivo.
- Evitar abreviações opacas e comentários que apenas repetem o código.
- Documentar por que uma decisão existe, sua invariante e sua consequência.
- Manter imports em grupos: plataforma, terceiros, aliases internos e relativos.
- Usar constantes nomeadas para limites, timeouts, rotas e budgets.

## 10. Arquitetura e contratos

- Definir módulos de domínio: Identity, Catalog, Discovery, Capture, Battle e Assets/AR.
- Manter o servidor autoritativo para progressão e ações que gerem vantagem.
- Versionar contrato de API e validar entrada e saída.
- Separar migrations, seed e bootstrap da aplicação.
- Projetar transações atômicas para mudanças de progressão.
- Usar índices e constraints como última linha de integridade, não como única validação.
- Criar observabilidade por fluxo: login, scan, discovery, capture e battle.

## 11. Gate de auditoria

Reprovar quando ocorrer qualquer item:

- bug Critical ou vulnerabilidade aberta;
- segredo ou token de negócio exposto;
- bypass do fluxo de QR/captura;
- lint/build/teste obrigatório falhando;
- teste e2e obrigatório não executado sem estado `BLOCKED`;
- cobertura abaixo do piso;
- dependência High/Critical vulnerável;
- fluxo primário sem validação renderizada proporcional ao risco.
