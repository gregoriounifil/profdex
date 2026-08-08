# Batalha que "dá refresh" e trava os ataques

Sintoma relatado: no meio da batalha a tela recarrega sozinha; depois disso o
jogador não consegue mais escolher golpe, e só um F5 manual resolve. Acontece
com mais frequência no **Safari do iOS** e, mais raramente, no **Chrome
Android**.

São **dois problemas encadeados**: um que provoca o recarregamento e outro que
impede o app de se recuperar dele. O primeiro já foi corrigido; o segundo está
diagnosticado e ainda não.

---

## Parte 1 — por que a página recarrega sozinha (CORRIGIDO)

Ninguém deu refresh. O **Safari descartou a aba por falta de memória** e a
recarregou quando o usuário voltou a olhar — comportamento normal do iOS sob
pressão de memória, e a razão de o sintoma ser muito mais comum lá.

O que a arena estava carregando:

| Arquivo | Tamanho |
|---|---|
| `public/models/modelo-gustavo.glb` | **73,6 MB** |
| `public/models/modelo-eron.glb` | 27,0 MB |
| `public/models/modelo-mario.glb` | 26,8 MB |
| `@google/model-viewer` (JS) | 440 kB |

A arena PvP monta **dois** `<model-viewer>` ao mesmo tempo, um por combatente.
No pior caso a aba baixava e mantinha decodificados **~148 MB de geometria**,
em **dois contextos WebGL** — mais um terceiro contexto do fundo animado
(`BinaryTunnelScene`, três.js). Um iPhone trabalha com um orçamento na casa das
centenas de MB por aba: isso não é "pesado", é acima do teto.

**Correção aplicada:** a batalha (PvP e PvE) passou a desenhar os combatentes
com os sprites 2D que já existiam (`/professors/<slug>-cartoon.png`, ~90 kB
cada), via `src/data/professorSprites.js`. Os `.glb` continuam no repositório e
seguem servindo a tela de **AR**, onde o modelo é o ponto da experiência e só um
carrega por vez.

Efeito no bundle da rota de batalha: `professorModels` (440 kB, que era o
`model-viewer`) saiu; entrou `professorSprites` (1,6 kB).

---

## Parte 2 — por que o app não se recupera (DIAGNOSTICADO, NÃO CORRIGIDO)

O recarregamento era o gatilho, mas **qualquer** interrupção longa produz o
mesmo travamento: o celular bloquear a tela, o aluno trocar de app por alguns
minutos, o Wi-Fi do evento oscilar. A cadeia é esta:

**1. O servidor encerra a batalha depois de 3 minutos de silêncio.**
`TURN_TIMEOUT_MS = 60s` × `MAX_MISSED_TURNS = 3` (`battle-room.service.ts`).
Passou disso, a sala é fechada por abandono.

**2. O `battle:end` é emitido para um socket que já morreu.** Enquanto a aba
está congelada, o iOS mantém a página viva mas sem rede. O servidor emite; a
mensagem se perde. Não há `connectionStateRecovery` configurado no gateway, ou
seja, o Socket.IO **não reenvia** o que foi perdido.

**3. Ao reconectar, o servidor não diz nada.** Em `battle.gateway.ts`:

```ts
if (this.rooms.hasActiveRoom(user.id)) {
  this.setStatus(user.id, 'em_batalha');
  const snapshot = this.rooms.resync(user.id);
  if (snapshot) client.emit('battle:resync', snapshot);
}
```

A sala já não existe → **nenhum evento é enviado**. O resync só cobre "voltei e
a batalha continua"; o caso "voltei e a batalha acabou sem mim" não é coberto
por ninguém.

**4. O cliente fica preso no estado antigo.** O store continua com
`pvp.phase === 'active'` e, se o jogador tinha enviado um golpe,
`pvp.youMoved === true`. E o botão de ataque depende exatamente disso
(`PvpArenaView.vue`):

```js
const canAct = computed(() =>
  pvp.value?.phase === 'active' &&
  !pvp.value.youMoved &&        // ← só volta a false com battle:round ou resync
  !animating.value &&
  !showResult.value)
```

Nenhum dos dois chega mais. **Os ataques ficam mortos para sempre**, e o F5
"resolve" porque joga fora o estado em memória.

### Três agravantes que também precisam de conserto

**a) Socket zumbi.** Quando o iOS congela a aba, o `socket.connected` do cliente
continua `true` por até ~45s (`pingInterval` 25s + `pingTimeout` 20s) depois de
a conexão já estar morta. Nessa janela `command()` acha que tem conexão, emite
no vazio e só devolve erro no timeout de 5s. E `battle.connect()` é:

```js
function connect() { if (socket) return; /* … */ }
```

— com um objeto de socket zumbi em mãos, chamar `connect()` de novo **não faz
nada**.

**b) Corrida no `onMounted` da arena.** Depois de um recarregamento de verdade,
`pvp` é sempre `null` (estado do Pinia é memória). A tela decide o redirect no
mesmo tick em que pede a conexão:

```js
battle.connect()                       // assíncrono: o resync chega depois
if (!pvp.value || pvp.value.phase === 'picking') {
  router.replace({ name: pvp.value ? 'pvp-pick' : 'batalha' })
  return                               // já saiu da arena
}
```

O resync chega depois e manda voltar para a arena — duas navegações
concorrentes, e o vue-router descarta a que estiver em andamento. Dependendo de
quem ganha, o jogador fica no lobby com uma batalha viva, ou na arena com o
cronômetro nunca iniciado.

**c) Sessão de 15 minutos.** O JWT do cookie expira em 15min (`auth.module.ts`).
Se a reconexão acontecer depois disso, o handshake falha, o servidor manda
`error:unauthorized`, e o cliente faz `disconnect()` e **desiste de reconectar**
— sem nada na tela explicando. Num evento de horas isso acontece sozinho. Já
estava anotado como item 11 de [CARGA-PVP.md](./CARGA-PVP.md).

---

## Correções propostas, na ordem que eu faria

**P1 — o servidor sempre responde a reconexão.** Emitir `battle:resync` também
quando não há sala, com `{ phase: 'idle' }`; no cliente, `phase === 'idle'`
limpa o `pvp` pendente, avisa "a batalha foi encerrada enquanto você esteve sem
conexão" e volta ao lobby. É a correção que fecha o buraco principal e mexe em
poucas linhas dos dois lados.

**P2 — detectar o socket zumbi na volta do app.** No `visibilitychange` para
`visible`, disparar um `battle:sync` com ack e timeout curto (~2s); sem
resposta, forçar `socket.disconnect(); socket.connect()`. Resolve a janela de
45s de conexão morta **e** já traz o snapshot na volta — um mecanismo para os
dois problemas.

**P3 — não redirecionar antes do resync.** Na arena e na seleção, quando `pvp`
está `null` logo após montar, mostrar "reconectando…" e dar ~3s para o snapshot
chegar antes de decidir sair. Elimina a corrida de navegação e o pisca-pisca.

**P4 — `connect()` reconectar de fato.** Se o socket existe mas está
desconectado, chamar `socket.connect()` em vez de retornar.

**P5 — sessão compatível com a duração do evento.** Renovar o cookie a cada
request autenticado, ou subir o TTL para a janela do evento. Sem isso, P1–P4
consertam a batalha e o aluno cai no login no meio dela.

**P6 (opcional) — cortar o último contexto WebGL no celular.** O
`BinaryTunnelScene` ainda carrega o três.js (716 kB) e mantém um canvas
animado. Trocar por um fundo CSS em telas pequenas ou com
`prefers-reduced-motion` tira o que sobrou de pressão de memória.

## O que ficou provado e o que é hipótese

Provado lendo o código e medindo os arquivos: os tamanhos dos `.glb` e os dois
`<model-viewer>` simultâneos; o abandono em 3 minutos; a ausência de resync
quando a sala não existe; o `battle:end` sem reenvio; a dependência de
`youMoved` no botão de ataque; a corrida no `onMounted`; o `connect()` que
retorna cedo; a expiração em 15min.

**Hipótese não reproduzida:** que o descarte da aba pelo Safari seja o gatilho
específico dos casos relatados — não tenho iPhone para reproduzir. O que é
certo é que o consumo de memória estava muito acima do razoável e que, *seja
qual for* a causa da interrupção, a Parte 2 trava o jogo do mesmo jeito. Por
isso ela precisa ser corrigida mesmo agora que o 3D saiu.
