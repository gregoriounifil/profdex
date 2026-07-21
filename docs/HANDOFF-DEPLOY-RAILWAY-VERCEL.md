# Passagem de contexto — deploy do ProfDex

Atualizado em **21/07/2026**.

Este documento registra o que foi alterado e configurado para publicar o backend do ProfDex no Railway e conectar o frontend hospedado no Vercel.

## Arquitetura escolhida

- Frontend: `profdex-front`, hospedado no Vercel.
- Backend: `profdex-back`, NestJS hospedado no Railway.
- Banco: PostgreSQL gerenciado pelo Railway.
- Repositório: `gregoriounifil/profdex`.
- Branch usada no deploy: `feature/Battle`.

## Alterações realizadas no repositório

O backend foi preparado para PostgreSQL e Railway:

- `profdex-back/prisma/schema.prisma`
  - `provider` alterado de `sqlite` para `postgresql`.
  - `DATABASE_URL` configurada como conexão principal.
  - `DIRECT_URL` adicionada para migrations.
- `profdex-back/package.json`
  - adicionado `"postinstall": "prisma generate"`.
- As migrations existentes já estavam em formato PostgreSQL, inclusive `migration_lock.toml`. Por isso, não foi necessário apagá-las ou recriá-las.
- O Prisma schema foi validado, o Prisma Client foi gerado e o backend compilou localmente sem erros.

Commit criado:

```text
e0ddd82 chore(back): configure Prisma PostgreSQL for Railway
```

A branch local foi sincronizada com o commit remoto do frontend e enviada ao GitHub. O commit de integração enviado foi:

```text
64838f4 Merge remote-tracking branch 'origin/feature/Battle' into feature/Battle
```

As alterações locais que já existiam em arquivos da Arena/AR não foram incluídas no commit do backend.

## Railway — recursos criados

Projeto:

- Nome gerado pelo Railway: `just-achievement`.
- Painel: https://railway.com/project/e9bd1e3d-8018-4a32-b526-aa402bcf00fd
- Ambiente: `production`.

Serviços:

- Backend: `profdex`.
- Banco: `Postgres`.
- O Postgres foi verificado como **Online**.
- Foi criado um volume persistente `postgres-volume`.

Domínio público do backend:

```text
https://profdex-production.up.railway.app
```

Prefixo global da API:

```text
https://profdex-production.up.railway.app/api
```

## Railway — configuração do backend

Configurações aplicadas ao serviço `profdex`:

| Configuração | Valor |
|---|---|
| Repositório | `gregoriounifil/profdex` |
| Branch | `feature/Battle` |
| Root Directory | `/profdex-back` |
| Build Command | `npm run build` |
| Start Command | `npm run start:prod` |
| Pre-deploy Command | `npx prisma migrate deploy` |
| Domínio | `profdex-production.up.railway.app` |
| Target Port | `3000` |
| Região mostrada no painel | US West |

Variáveis configuradas no backend:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<chave nova, longa e aleatória, salva apenas no Railway>
```

O valor de `JWT_SECRET` não está neste documento e não deve ser enviado por mensagem ou commitado no Git.

## Estado observado no Railway

Na última verificação, o PostgreSQL estava **Online**, mas os deploys do backend permaneciam com status **Queued**. O domínio público ainda mostrava a página do Railway com a mensagem de que o serviço não havia chegado à estação.

Teste realizado:

```text
GET https://profdex-production.up.railway.app/api/professors
```

Resultado observado naquele momento: página `404 Not Found` do próprio Railway, pois nenhum container do backend estava ativo.

Havia vários deploys na fila, inclusive o primeiro há mais de dez minutos. Isso não era um erro de compilação do NestJS: o build ainda nem havia começado. A documentação atual do Railway informa que contas Trial/Free podem ter novos deploys enfileirados durante períodos de capacidade limitada. Quando a capacidade volta, eles são processados automaticamente.

Referência: https://docs.railway.com/deployments/reference

### Como continuar no Railway

1. Abrir o serviço `profdex` no painel do projeto.
2. Conferir a aba **Deployments**.
3. Aguardar o deploy mais recente passar de `Queued` para `Building` e depois `Success`.
4. Se o painel exibir **Limited Access**, aguardar o fim da restrição de capacidade ou avaliar um plano que elimine a fila.
5. Quando o deploy iniciar, acompanhar as abas **Build** e **Deploy**.
6. Confirmar que o pre-deploy executou `prisma migrate deploy` sem erros.
7. Testar novamente:

   ```text
   GET https://profdex-production.up.railway.app/api/professors
   ```

   O resultado esperado sem token é **401 Unauthorized**. Isso confirma que o NestJS está no ar e que a rota protegida foi encontrada.

## Causa do erro 404 no frontend

O frontend usa a configuração abaixo em `profdex-front/src/services/api.js`:

```js
baseURL: import.meta.env.VITE_API_URL || '/api'
```

Como `VITE_API_URL` ainda não está definida no projeto correto do Vercel, o navegador envia o cadastro para:

```text
/api/auth/register
```

no próprio domínio do frontend. O Vercel não possui essa rota e responde `404`.

Erro observado no console:

```text
api/auth/register:1 Failed to load resource: the server responded with a status of 404
```

## Ação necessária no Vercel

O acesso disponível durante esta configuração abriu a conta/equipe `kenzo-yamamoto-s-projects`, que só mostrava `solvetechvarejo` e `wizardsgrimoire`. O projeto `profdex` não estava disponível nessa conta. Portanto, esta etapa precisa ser executada pelo responsável que possui acesso ao projeto correto do Vercel.

No projeto `profdex` do Vercel:

1. Abrir **Settings → Environment Variables**.
2. Criar a variável:

   | Campo | Valor |
   |---|---|
   | Name | `VITE_API_URL` |
   | Value | `https://profdex-production.up.railway.app/api` |

3. Aplicar pelo menos ao ambiente **Production**.
4. Recomenda-se aplicar também a **Preview**, para que os deploys de teste usem o mesmo backend.
5. Salvar a variável.
6. Abrir **Deployments** e fazer um **Redeploy** do frontend. Variáveis `VITE_*` são incorporadas durante o build, portanto apenas salvar a variável não atualiza um deploy já existente.

Importante: o redeploy do Vercel pode ser feito antes, mas cadastro e login só funcionarão quando o backend do Railway estiver em `Success`.

## Verificação final

Depois que Railway e Vercel estiverem publicados:

1. Abrir diretamente `https://profdex-production.up.railway.app/api/professors` e confirmar `401`.
2. Abrir o frontend do Vercel em uma janela anônima ou atualizar sem cache.
3. Fazer um novo cadastro.
4. No DevTools → Network, confirmar que a requisição vai para:

   ```text
   https://profdex-production.up.railway.app/api/auth/register
   ```

5. Confirmar resposta `201` ou `200`, conforme o controller.
6. Testar login e listagem de professores.
7. Verificar que não há erros de CORS.

## Segurança e observações

- O `.env` local do backend está ignorado pelo Git e não foi enviado ao repositório.
- O Railway recebeu um `JWT_SECRET` novo, diferente do segredo local antigo.
- Não copiar segredos para `.env.example`.
- O backend atualmente usa CORS com `origin: true`; depois que o fluxo estiver estável, recomenda-se restringir a origem ao domínio oficial do Vercel.
- O arquivo de instruções recebido mencionava um `profdex-back/docker-compose.yml`, mas esse arquivo não existia neste checkout. Isso não bloqueou o deploy porque as migrations PostgreSQL já estavam presentes e foram validadas sem subir um banco local.

