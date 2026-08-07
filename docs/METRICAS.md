# Métricas de uso e painel administrativo

Como o ProfDex mede o engajamento dos alunos durante o evento, e como os
organizadores acompanham isso.

## Por que não medir como rede social

O modelo comum — contar curtidas, comentários, compartilhamentos — não serve
aqui. Uma interação neste app não é um clique: **capturar um professor exige
estar fisicamente diante do QR** e **uma batalha consome minutos dos dois
jogadores**. Contar "interações" achatando tudo faria o aluno que abriu o app 30
vezes parecer mais engajado que o que atravessou o campus e batalhou.

Por isso a régua é ponderada e o tempo entra como métrica de primeira classe.

## As três camadas

| Camada | Tabela | Papel |
|---|---|---|
| Sessão de uso | `user_sessions` | Quanto tempo, quando, por quem |
| Evento bruto | `app_events` | O que aconteceu — trilha de auditoria |
| Agregado horário | `metrics_hourly` | O que o painel lê |

**O painel nunca lê `app_events`.** Um job recalcula os agregados a cada 5
minutos; sem isso, cada abertura do painel varreria a tabela de eventos inteira
— e o painel é aberto justamente durante o evento, quando há menos folga.

### Tempo só conta com a aba visível

`user_sessions.active_ms` acumula **apenas** o tempo com a aba em primeiro
plano (`visibilitychange` no cliente). Sem essa regra, quem esquece o app aberto
a noite toda lidera qualquer métrica de tempo e o número perde o sentido.

O cliente é quem sabe se a aba está visível, então ele reporta o delta — mas o
servidor **limita o valor pelo tempo real decorrido** (com 50% de folga para
atraso de rede). Não dá para digitar um número grande e liderar o ranking.

Sessões sem sinal de vida por 3 minutos são encerradas por varredura, incluindo
as que ficaram órfãs de um restart do servidor.

## Pontuação de engajamento

| Ação | Pontos |
|---|---|
| Primeira sessão do dia | 5 |
| Minuto ativo | 1 (teto de 60/dia) |
| Professor descoberto | 20 |
| **Professor capturado** | **50** |
| Convite de batalha enviado | 5 |
| **Batalha concluída** | **80** |
| Vitória | +30 |
| Coleção completa | 200 |

Definidos em `src/metrics/engagement.ts`.

Dois cuidados embutidos:

- **Teto diário no tempo** — senão deixar a aba aberta renderia mais que jogar.
- **Nada pontua duas vezes** — re-escanear o mesmo QR não gera nova captura, e
  o servidor detecta isso antes de pontuar.

### O que o servidor registra sozinho

As ações que valem muitos pontos **não passam pelo cliente**:

| Evento | Onde é registrado |
|---|---|
| `professor_discovered`, `professor_captured`, `collection_completed` | `captures.service.ts` |
| `battle_finished`, `battle_won` | `battle-room.service.ts` |

O cliente só reporta o que é barato e inofensivo (navegação, telas abertas).
Um front adulterado não consegue inflar o próprio placar.

## Impacto em carga

Métrica não pode competir com o PvP pelo servidor (ver
[`CARGA-PVP.md`](CARGA-PVP.md)). Por isso:

- **Nenhum request por interação.** Eventos vão para uma fila no cliente e
  sobem em lote a cada 10s.
- **Nenhuma linha por heartbeat.** O heartbeat só atualiza memória no servidor;
  o estado das sessões é descarregado em lote a cada 10s, numa única query.
- **Buffer com teto** (50 mil eventos). Se o banco cair, métrica antiga é
  descartada em vez de a memória crescer até derrubar o app.
- **Falha de métrica nunca quebra a ação.** Todos os pontos de registro são
  silenciosos em caso de erro — o aluno já escaneou o QR.

## Painel administrativo

`/admin/metricas` — **somente leitura**. Todas as rotas são `GET` e o serviço
não tem nenhum método de escrita, por desenho: ser administrador dá acesso a
acompanhar números e **absolutamente nada além do que um aluno pode fazer**.

Mostra:

- Usuários hoje / na semana, sessões, média por sessão, minutos ativos
- **Usuários logados por hora** (e outras séries: capturas, batalhas, sessões)
- Funil: cadastrados → descobriram → capturaram → batalharam
- Retenção D1: dos que estrearam ontem, quantos voltaram
- Ranking de engajamento

### Quem é administrador

Contas com `users.role = 'admin'`. A intenção final é derivar isso do domínio do
e-mail institucional (**`@unifil.br` = admin**, `@edu.unifil.br` = aluno) quando
o login com Google entrar. Até lá, por matrícula:

```bash
npm run db:set-admin                       # lista os admins atuais
npm run db:set-admin -- 202312345          # promove
npm run db:set-admin -- 202312345 --remover
```

A conta precisa entrar de novo para o app mostrar o painel: o papel viaja no
cookie de sessão (15min). A **autorização**, porém, é conferida no banco a cada
request pelo `AdminGuard` — revogar um admin vale na hora.

## Endpoints

**Ingestão** (aluno autenticado; tudo sempre atribuído ao dono da sessão):

| Método | Rota |
|---|---|
| POST | `/api/metrics/session` — abre sessão, devolve `sessionId` |
| POST | `/api/metrics/session/heartbeat` — `{ sessionId, activeMs }` |
| POST | `/api/metrics/session/end` — `{ sessionId }` |
| POST | `/api/metrics/events` — lote de até 50 eventos |

**Painel** (admin, somente leitura):

| Método | Rota |
|---|---|
| GET | `/api/admin/metrics/overview` |
| GET | `/api/admin/metrics/series?metric=&hours=` |
| GET | `/api/admin/metrics/funnel` |
| GET | `/api/admin/metrics/engagement?limit=` |
| GET | `/api/admin/metrics/retention` |

Métricas de série disponíveis: `logged_users`, `active_users`,
`sessions_started`, `active_minutes` e `event_<tipo>` (ex.:
`event_professor_captured`).

## Privacidade

O sistema registra, por aluno identificado, quanto tempo usou o app e o que fez
dentro dele. Duas providências ficam **pendentes** e valem decidir antes do
evento:

1. **Aviso no primeiro acesso**, explicando o que é coletado e para quê.
2. **Política de retenção** — sugestão: apagar `app_events` com mais de 90 dias,
   mantendo apenas os agregados de `metrics_hourly`, que não identificam
   ninguém.

Nenhuma das duas está implementada.

## Validação

Executado em 07/08/2026 contra Postgres 16 e o servidor no ar:

- Migration `20260807000000_add_metrics` aplicada com sucesso.
- Batalha real → `battle_finished` para os dois jogadores, `battle_won` para o
  vencedor; placares **exatamente** conforme a tabela (110 = 80 + 30 para quem
  venceu, 80 para quem perdeu).
- Ciclo de sessão completo: abrir, heartbeat, eventos, encerrar.
- **O clamp anti-fraude funcionou**: um heartbeat declarando 65s de uso após
  milissegundos reais decorridos foi recusado, e o tempo não foi creditado.
- Tipos de evento desconhecidos são ignorados sem derrubar o lote.
- Painel recusa aluno (403) e anônimo (401).
- Sob carga (496 conexões, 260 batalhas), o rollup agregou 458 eventos de
  batalha sem atrasar o PvP — ver [`CARGA-PVP.md`](CARGA-PVP.md).

## Limitações conhecidas

- O SQL dos agregados é **específico do Postgres** (`generate_series`,
  `date_trunc`, `gen_random_uuid`) — não roda em SQLite.
- O teto diário de pontos por tempo vive em memória: um restart do servidor
  zera o contador do dia. A alternativa seria uma leitura no banco a cada
  heartbeat.
- Minutos ativos são atribuídos à hora em que a sessão **fechou**, não
  repartidos proporcionalmente entre as horas que ela atravessou.
