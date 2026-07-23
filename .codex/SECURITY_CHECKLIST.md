# Checklist de segurança

Base normativa revisada em 2026-07-23:

- [OWASP Top 10:2025](https://owasp.org/Top10/)
- [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/en/0x03-introduction/)
- [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0_release)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

Para cada item, registrar `PASS`, `FAIL`, `N/A` ou `NOT TESTED` e anexar evidência. `N/A` exige justificativa.

## A01 — Broken Access Control

- [ ] Aplicar autenticação e autorização no servidor a cada endpoint protegido.
- [ ] Impedir acesso a professor, captura ou batalha não liberados ao usuário.
- [ ] Derivar `userId` exclusivamente da identidade autenticada.
- [ ] Usar allowlist de propriedades em toda resposta; nunca serializar entidade Prisma inteira.
- [ ] Não retornar `captureToken`, hashes, segredos ou campos internos.
- [ ] Testar troca de IDs, slugs, tokens, parâmetros e mass assignment.
- [ ] Testar acesso horizontal entre dois usuários.
- [ ] Negar por padrão quando política, usuário ou recurso estiver ausente.

## A02 — Security Misconfiguration

- [ ] Restringir CORS a origens explícitas por ambiente.
- [ ] Não combinar origem refletida/ampla com credenciais.
- [ ] Aplicar Helmet, CSP, HSTS, `nosniff`, frame protection e Referrer-Policy.
- [ ] Desativar ferramentas de desenvolvimento e endpoints de laboratório em produção.
- [ ] Definir limites de body, query, headers, upload e tempo.
- [ ] Validar configuração na inicialização e falhar fechada.
- [ ] Usar `PORT` e demais variáveis de ambiente de forma coerente.
- [ ] Não expor stack traces, versões ou detalhes de infraestrutura.

## A03 — Software Supply Chain Failures

- [ ] Executar `npm audit --omit=dev` em raiz, frontend e backend.
- [ ] Manter zero vulnerabilidades conhecidas para concluir a auditoria.
- [ ] Revisar lockfiles e impedir ranges não controlados em produção.
- [ ] Executar SCA, secret scan e license check no CI.
- [ ] Evitar scripts remotos em runtime; preferir bundle local.
- [ ] Se inevitável, fixar versão, usar SRI, CSP e origem confiável.
- [ ] Gerar SBOM e registrar origem dos assets GLB, imagens e fontes.
- [ ] Revisar scripts de install e pacotes abandonados.

## A04 — Cryptographic Failures

- [ ] Exigir HTTPS em produção.
- [ ] Gerar `JWT_SECRET` longo e aleatório em secret manager.
- [ ] Rotacionar segredos e registrar `kid`/estratégia de migração quando aplicável.
- [ ] Armazenar senha com algoritmo apropriado e custo revisado.
- [ ] Impor tamanho mínimo forte e tamanho máximo seguro para senha.
- [ ] Não incluir PII desnecessária em JWT.
- [ ] Não persistir JWT em `localStorage`/`sessionStorage`; preferir cookie `HttpOnly; Secure; SameSite`.
- [ ] Proteger dados sensíveis em backup, logs e trânsito.

## A05 — Injection

- [ ] Validar tipo, tamanho, formato e enum de todas as entradas.
- [ ] Usar queries parametrizadas/Prisma e revisar cada `$queryRaw`.
- [ ] Não concatenar entrada em SQL, shell, HTML, URL ou caminho.
- [ ] Proibir `v-html`, `innerHTML`, `eval` e `new Function` sem revisão formal.
- [ ] Sanitizar conteúdo rico no servidor e codificar no contexto de saída.
- [ ] Restringir `modelUrl` e URLs de assets a esquemas/origens permitidos.
- [ ] Testar prototype pollution, objetos aninhados e chaves inesperadas.

## A06 — Insecure Design

- [ ] Documentar threat model e fronteiras de confiança.
- [ ] Manter progressão e recompensas autoritativas no servidor.
- [ ] Modelar discovery/capture como transição de estado válida e atômica.
- [ ] Exigir prova de posse do QR que não possa ser inferida de respostas públicas.
- [ ] Planejar fraude por foto, compartilhamento, replay, automação e geolocalização falsa.
- [ ] Definir abuso aceitável e limites por usuário/dispositivo/IP.
- [ ] Fazer arquitetura suportar rotação/revogação de tokens.

## A07 — Authentication Failures

- [ ] Aplicar rate limit crescente em login e registro.
- [ ] Testar brute force, credential stuffing e enumeração de matrícula.
- [ ] Invalidar sessão expirada e limpar estado do cliente em 401.
- [ ] Implementar revogação/logout real ou sessões curtas com refresh rotativo.
- [ ] Reautenticar para ações sensíveis quando necessário.
- [ ] Não confiar apenas na presença de um token no cliente.
- [ ] Registrar falhas de autenticação sem registrar senha.

## A08 — Software or Data Integrity Failures

- [ ] Verificar integridade e procedência de scripts, modelos, marcadores e dados de golpes.
- [ ] Assinar ou validar artefatos críticos do pipeline.
- [ ] Proteger CI/CD, environments e branches.
- [ ] Validar migrations e seeds antes de produção.
- [ ] Impedir que o cliente envie resultado autoritativo de batalha/recompensa.

## A09 — Security Logging and Alerting Failures

- [ ] Gerar correlation/request ID.
- [ ] Registrar login, falhas, bloqueios, discovery, capture, replay e mudanças administrativas.
- [ ] Não registrar senha, JWT, QR secret ou dados pessoais desnecessários.
- [ ] Definir alertas para brute force, token inválido em massa e captura anômala.
- [ ] Proteger integridade, acesso e retenção dos logs.
- [ ] Testar se alertas chegam a um responsável.

## A10 — Mishandling of Exceptional Conditions

- [ ] Tratar explicitamente falha de banco, timeout, resposta parcial e indisponibilidade.
- [ ] Não engolir exceções amplas em bootstrap/seed.
- [ ] Garantir rollback/transação em operação composta.
- [ ] Evitar fail-open em autorização, CORS, configuração e QR.
- [ ] Encerrar recursos em `finally`/lifecycle.
- [ ] Testar degradação e recuperação.

## Segurança específica da API

- [ ] BOLA/BFLA: testar recursos e funções com usuário incorreto.
- [ ] BOPLA: filtrar campos sensíveis em entrada e saída.
- [ ] Unrestricted Resource Consumption: limitar custo, tamanho e frequência.
- [ ] Unrestricted Access to Sensitive Business Flows: proteger descoberta/captura.
- [ ] SSRF/Unsafe Consumption: allowlist e timeout em chamadas/URLs externas.
- [ ] Inventariar endpoints, versões, ambientes e consumidores.

## Segurança específica de QR e progressão

- [ ] Nunca usar ID/slug público como prova de descoberta.
- [ ] Nunca retornar o segredo do QR em catálogo, captura ou descoberta.
- [ ] Não versionar tokens de produção em código, seed ou documentação.
- [ ] Usar token aleatório de alta entropia, armazenado como hash.
- [ ] Incluir expiração, rotação, replay protection e contexto de campanha.
- [ ] Tornar resgate idempotente e auditável.
- [ ] Definir se um QR é reutilizável entre usuários; aplicar a regra no servidor.
- [ ] Considerar challenge-response/dynamic QR para prêmio de alto valor.
- [ ] Detectar velocidade e sequência impossíveis de capturas.

## Privacidade e dispositivo

- [ ] Solicitar câmera apenas no fluxo que precisa dela.
- [ ] Explicar finalidade e permitir fallback.
- [ ] Parar tracks e remover listeners ao sair.
- [ ] Não enviar frames sem consentimento explícito.
- [ ] Revisar LGPD: finalidade, minimização, retenção e direitos do titular.

## Gate final

- [ ] Zero Critical, High, Medium ou Low confirmados abertos.
- [ ] Zero dependências vulneráveis conhecidas.
- [ ] Testes negativos de autorização aprovados.
- [ ] Evidência DAST/SAST/SCA anexada.
- [ ] Risco residual documentado e decisão final registrada.
