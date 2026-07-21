# Contexto — Cenário 3D (TresJS) + Combate em AR

Documento de retomada. Última atualização: 2026-07-21.
Complementa o [BATALHA.md](./BATALHA.md) (contexto geral da batalha) e o
[GUIA-TIPOS.md](./GUIA-TIPOS.md) (sistema de tipos).

## O que foi feito nesta rodada

1. **Camada 3D com TresJS** introduzida no projeto (wrapper de Three.js para Vue 3),
   com um exemplo de estrutura de componente.
2. **Cenário "Túnel binário"** — um túnel neon de grid cujas linhas são fileiras
   perfeitas de código binário (`0`/`1`), inspirado numa imagem de referência.
3. **Combate em Realidade Aumentada** na `ArenaView`: ao clicar em **Batalha**, o
   combate abre com a **câmera como fundo (AR)**. Um **botão de canto liga/desliga**
   a AR; ao desligar, o fundo vira o **cenário do túnel binário**.
4. **Correções de visualização** do combate: reposição dos personagens, camadas
   (z-index) e **contornos coloridos** (vermelho no inimigo, azul no jogador).

## Dependências adicionadas

Em `profdex-front/`:

```bash
npm install @tresjs/core @tresjs/cientos three
```

Versões instaladas: `@tresjs/core` 5.8, `@tresjs/cientos` 5.8, `three` 0.185.

> Decisão de arquitetura: em vez de A-Frame/PlayCanvas isolados, ficou-se **dentro
> do ecossistema Vue** com TresJS — sintaxe declarativa (`<TresMesh>`, `<TresPerspectiveCamera>`)
> rodando sobre Three.js, reativo com Pinia/props, sem reescrever a arquitetura.

## Arquivos

| Arquivo | Estado | Papel |
|---|---|---|
| `vite.config.js` | editado | `isCustomElement` agora reconhece `model-viewer` **e** tags `Tres*` (menos `TresCanvas`, que é componente Vue real). |
| `src/components/BinaryTunnel.vue` | novo | O túnel: 4 paredes + halo do ponto de fuga + animação de voo. |
| `src/components/BinaryTunnelScene.vue` | novo | Empacota o túnel (canvas + câmera + `BinaryTunnel`) para reuso; preenche o pai. Prop `controls` liga a órbita. |
| `src/views/BinaryTunnelView.vue` | novo | Página de demonstração do túnel, rota `/tunel-binario`. |
| `src/components/Stage3D.vue` | novo | Exemplo genérico de palco TresJS (câmera, luzes, `OrbitControls`, GLB girando). |
| `src/components/SceneContent.vue` | novo | Conteúdo do `Stage3D` (usa `useLoop`; toroide procedural + GLB). |
| `src/views/TresDemoView.vue` | novo | Página de exemplo do TresJS, rota `/tres-demo`. |
| `src/views/ArenaView.vue` | editado | Combate com toggle AR (câmera) ↔ cenário 3D; reposição/camadas/contornos. |
| `src/router/index.js` | editado | Rotas `/tres-demo` e `/tunel-binario` (ambas sem guarda de auth, para testar). |

## Como o TresJS funciona aqui (padrão a seguir)

- **`<TresCanvas>` é o único componente Vue "de verdade"** da árvore 3D: cria o
  `WebGLRenderer`. Tudo dentro dele (`<TresMesh>`, luzes, câmera…) é interpretado
  pelo renderer do TresJS.
- **Animação (`useLoop`) só funciona em componentes FILHOS do `<TresCanvas>`**,
  pois dependem do contexto que ele injeta. Por isso `SceneContent`/`BinaryTunnel`
  são filhos do canvas, e não o componente que hospeda o canvas.
- **Não nomeie componentes próprios com prefixo `Tres`** — a regra `isCustomElement`
  os trataria como custom element e eles renderizariam vazios. (Foi o motivo de
  `TresStage` virar `Stage3D`.)
- Modelos GLB via `<GLTFModel>` do cientos são assíncronos → precisam de `<Suspense>`.

## O cenário do túnel binário

Arquivo: `src/components/BinaryTunnel.vue`.

**A ideia central** (que corrige o "defeito" da imagem de referência, onde os
dígitos derretem): a textura de **uma única célula** tem binário só nas arestas de
cima e da esquerda. Ao repetir a textura (`RepeatWrapping`) pelas paredes, as
arestas se encontram e formam **linhas contínuas de 0/1** perfeitamente alinhadas
(monospace tiled, sem deformação).

- 4 paredes (chão/teto/esquerda/direita) + halo radial no fundo (ponto de fuga).
- `AdditiveBlending` dá o brilho neon (sobreposições somam luz → núcleo branco no centro).
- `W`/`H`/`L` são múltiplos de `CELL` → o tiling fecha sem emenda.
- Props: `color` (default `#ff2bc4`) e `speed` (default 7).

## Combate em AR (`ArenaView`)

- `arEnabled` (ref, **padrão `true`**) controla o modo.
- **AR ligada** → `<video>` com a câmera traseira (`getUserMedia`, `facingMode: environment`)
  como fundo; os dois `model-viewer` ficam por cima → AR "magic window".
- **AR desligada** → `<BinaryTunnelScene>` como fundo, personagens por cima.
- **Fallback automático**: se a câmera falhar/for negada, cai para o cenário 3D e
  mostra o aviso "Sem câmera — usando o cenário 3D".
- Botão de canto (`.arena__ar-toggle`, canto superior direito, abaixo do voltar)
  alterna entre "AR ligada" / "Cenário 3D".

> ⚠️ É AR **"magic window"** (câmera de fundo + personagens posicionados na tela),
> **não WebXR ancorado** ao mundo real. AR com tracking de superfície seria um
> esforço bem maior (WebXR/MindAR precisa de marcador). O projeto já tem
> `useAR.js` (MindAR, âncora por imagem) usado em outro fluxo.

## Ajustes de visualização (referência rápida)

Tudo em `src/views/ArenaView.vue`.

### Posição dos personagens (CSS, no `<style>`)

```css
.arena__model--enemy { top; left; width; height; }   /* adversário (de frente, ao fundo) */
.arena__model--player { right; bottom; width; height; } /* jogador (de costas, na frente) */
```
- `top`/`left`/`bottom`/`right`: posição na tela (relativa ao palco).
- `bottom` **menor** = jogador mais **para baixo**.
- `width` **e** `height` juntos (mesma proporção) = tamanho; menor = "mais fundo" (perspectiva).

### Ângulo da câmera de cada modelo (no `<template>`)

Atributo `camera-orbit="θ φ raio"` no `<model-viewer>`:
- **θ (horizontal)**: `0deg` frente · `90deg` perfil · `180deg` costas.
- **φ (vertical)**: `90deg` altura dos olhos · menor = de cima · maior = de baixo.
- **raio**: menor `%` = câmera mais perto (maior na tela); maior `%` = mais longe.
- Relacionados: `camera-target="Xm Ym Zm"` (recentra o enquadramento) e
  `field-of-view` (abre/fecha a lente).
- Valores atuais: inimigo `-15deg 86deg 105%`, jogador `165deg 88deg 105%`.

### Camadas (z-index) — NÃO alterar sem cuidado

`.arena__stage` = `z-index: 0` (vira contexto de empilhamento e "prende" os
modelos), `.arena__model` = `1`, `.arena__hud` = `2`. É isso que mantém
**botões/textos/HP na frente dos bonecos**. Mudar quebra as camadas.

### Contornos coloridos dos modelos

Via `filter: drop-shadow(...)` (acompanha a silhueta do modelo, pois o canvas do
`model-viewer` é transparente — `border`/`outline` só fariam um retângulo):

```css
.arena__model--enemy  { filter: drop-shadow(0 0 1px var(--error)) drop-shadow(0 0 2px var(--error)); }        /* vermelho */
.arena__model--player { filter: drop-shadow(0 0 1px var(--ds-blue-glow)) drop-shadow(0 0 2px var(--ds-blue-glow)); } /* azul */
```
- Mais grosso: aumentar os raios (`2px`/`4px`). Mais fino: deixar só um `drop-shadow`.
- Durante o flash de dano (`.arena__model--hit`), o `filter` é substituído por
  `brightness`, então o contorno some por ~0,4s e volta.

> ⚠️ **Variáveis de cor enganosas**: `--red` do tema é **marrom** (`#995200`) e
> `--red-dark` é cinza. O vermelho real da paleta é **`--error` (#ff6b6b)**. Azuis:
> `--ds-blue` (#3c7fa1, apagado), `--ds-blue-glow` (#7ec5e6, mais nítido).

## Limitações do ambiente de verificação

No preview usado durante o desenvolvimento:
- A **câmera é bloqueada** → o modo AR não pôde ser testado visualmente (cai no
  cenário, como esperado). No device real (https + permissão) a AR funciona.
- A **aba fica oculta** → `requestAnimationFrame` congela, então TresJS e
  `model-viewer` não animam sozinhos e **screenshots travam**. A renderização do
  túnel foi validada forçando um frame manual e lendo o framebuffer (≈18% de
  pixels acesos, convergindo ao centro). O visual final vale conferir no celular.

## Próximos passos em aberto

- Testar o modo **AR ligada** num device real (câmera + https).
- Ligar `effectiveness()` do sistema de tipos ao `rollDamage` (ver GUIA-TIPOS.md).
- Dar modelo/professor próprio ao jogador (hoje os dois lados usam o mesmo GLB).
- Afinar enquadramento (posição/câmera) dos personagens no device.
- Avaliar AR ancorado (WebXR/MindAR) se quiser personagens presos ao mundo real.
