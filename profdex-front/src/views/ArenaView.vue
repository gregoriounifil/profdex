<script setup>
import '@google/model-viewer'
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BattleHpBar from '../components/BattleHpBar.vue'
import BinaryTunnelScene from '../components/BinaryTunnelScene.vue'
import { useBattle } from '../composables/useBattle.js'
import { useArenaAR } from '../composables/useArenaAR.js'
import { useProfessorsStore } from '../stores/professors'
import { getMovesFor } from '../data/moves.js'

const route = useRoute()
const router = useRouter()
const store = useProfessorsStore()

onMounted(() => {
  if (!store.professors.length) store.fetch().catch(() => {})
})

// ── Realidade aumentada: fundo é a câmera (padrão). Ao desligar, o combate
// acontece dentro do cenário do túnel binário. ────────────────────────────
const arEnabled = ref(true)
const arError = ref(null)
const camVideo = useTemplateRef('camVideo')
let camStream = null

async function startCamera() {
  arError.value = null
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    const v = camVideo.value
    if (v) {
      v.srcObject = camStream
      v.setAttribute('playsinline', '')
      v.muted = true
      await v.play()
    }
  } catch (e) {
    // Sem câmera/permissão: cai para o cenário 3D em vez de travar o combate.
    arError.value = e?.message ?? 'Câmera indisponível'
    arEnabled.value = false
  }
}

function stopCamera() {
  if (camStream) {
    camStream.getTracks().forEach((t) => t.stop())
    camStream = null
  }
  if (camVideo.value) camVideo.value.srcObject = null
}

async function toggleAR() {
  arEnabled.value = !arEnabled.value
  if (arEnabled.value) await startCamera()
  else stopCamera()
}

onMounted(() => {
  if (arEnabled.value) startCamera()
})
onUnmounted(stopCamera)

// Professor inimigo: vem da rota (/arena/:id) com fallback para o modelo padrão
const enemyProfessor = computed(() => {
  const id = route.params.id
  return (
    store.professors.find((p) => String(p.id) === String(id)) ||
    window.history.state?.character || { id: 'modelo-padrao', name: 'Professor', slug: 'professor' }
  )
})

const enemy = computed(() => ({
  name: enemyProfessor.value.name,
  maxHp: 60,
  moves: getMovesFor(enemyProfessor.value),
}))

const player = {
  name: 'Você',
  maxHp: 60,
}

const playerMoves = getMovesFor(null)

const {
  playerHp,
  enemyHp,
  phase,
  message,
  enemyHit,
  playerHit,
  isOver,
  start,
  useMove,
  flee,
} = useBattle({ player, enemy: enemy.value })

onMounted(start)

// Por enquanto os dois lados usam o mesmo modelo (duplicata);
// depois o jogador terá o próprio modelo/professor capturado.
const enemyModelSrc = computed(
  () => enemyProfessor.value.modelUrl || '/models/seu-modelo-mobile.glb'
)
const playerModelSrc = enemyModelSrc

// ── AR ancorado (WebXR): coloca os dois lutadores a 1,7 m no plano detectado.
// Independente do magic-window acima; iOS/sem WebXR cai em `xrError`. ────────
const arOverlay = useTemplateRef('arOverlay')
const {
  arSupport,
  arActive,
  arError: xrError,
  hint: arHint,
  checkSupport,
  enterAR,
  exitAR,
} = useArenaAR()

onMounted(checkSupport)

function launchAR() {
  enterAR({
    enemySrc: enemyModelSrc.value,
    playerSrc: playerModelSrc.value,
    overlay: arOverlay.value,
  })
}

function goBack() {
  router.push({ name: 'batalha', query: { profId: enemyProfessor.value.id } })
}
</script>

<template>
  <main class="arena">
    <!-- Palco: inimigo ao fundo (de frente) e jogador em primeiro plano (de costas) -->
    <div class="arena__stage" :class="{ 'arena__stage--ar': arEnabled }">
      <!-- Fundo do combate: câmera (AR) ou o cenário do túnel binário -->
      <video
        v-show="arEnabled"
        ref="camVideo"
        class="arena__camera"
        autoplay
        playsinline
        muted
      />
      <BinaryTunnelScene v-if="!arEnabled" class="arena__scenario" :speed="4" />

      <model-viewer
        class="arena__model arena__model--enemy"
        :class="{ 'arena__model--hit': enemyHit }"
        :src="enemyModelSrc"
        :alt="`Prof. ${enemyProfessor.name} em batalha`"
        camera-orbit="-10deg 86deg 95%"
        interaction-prompt="none"
        disable-zoom
        disable-tap
        disable-pan
        shadow-intensity="1"
        shadow-softness="1"
        exposure="1"
      />
      <model-viewer
        class="arena__model arena__model--player"
        :class="{ 'arena__model--hit': playerHit }"
        :src="playerModelSrc"
        alt="Seu personagem, de costas"
        camera-orbit="165deg 88deg 105%"
        interaction-prompt="none"
        disable-zoom
        disable-tap
        disable-pan
        shadow-intensity="1"
        shadow-softness="0.8"
        exposure="1"
      />
    </div>

    <!-- HUD sobreposto ao palco -->
    <div class="arena__hud" :class="{ 'arena__hud--player-hit': playerHit }">
      <button class="arena__back" type="button" @click="goBack">←</button>

      <!-- Botão de canto: liga/desliga a realidade aumentada -->
      <button
        class="arena__ar-toggle"
        :class="{ 'arena__ar-toggle--on': arEnabled }"
        type="button"
        :aria-pressed="arEnabled"
        @click="toggleAR"
      >
        <span class="arena__ar-dot" aria-hidden="true" />
        {{ arEnabled ? 'Desativar AR' : 'Ativar AR' }}
      </button>
      <p v-if="arError && !arEnabled" class="arena__ar-note" role="status">
        Sem câmera — usando o cenário 3D
      </p>

      <!-- AR ancorado (WebXR): joga os dois lutadores no chão a 1,7 m -->
      <button
        v-if="arSupport === 'supported'"
        class="arena__ar-real"
        type="button"
        @click="launchAR"
      >
        Ver batalha em AR
      </button>
      <p
        v-else-if="arSupport === 'unsupported'"
        class="arena__ar-note arena__ar-note--xr"
        role="status"
      >
        AR ancorado indisponível neste aparelho
      </p>
      <p v-if="xrError" class="arena__ar-note arena__ar-note--xr" role="status">
        {{ xrError }}
      </p>

      <!-- Barra do inimigo (topo esquerdo, como no esboço) -->
      <!-- Nome fixo temporário; original: :name="`Prof. ${enemy.name}`" -->
      <BattleHpBar
        class="arena__enemy-bar"
        name="Prof. Gustavo"
        :hp="enemyHp"
        :max-hp="enemy.maxHp"
        :level="7"
        :avatar-src="`/professors/${enemyProfessor.slug}-cartoon.png`"
      />

      <!-- Barra do jogador (acima do painel de comandos) -->
      <BattleHpBar
        class="arena__player-bar"
        :name="player.name"
        :hp="playerHp"
        :max-hp="player.maxHp"
        :level="5"
      />

      <!-- Painel de comandos: mensagem + golpes + fugir -->
      <section class="battle-panel" aria-label="Comandos de batalha">
        <div class="battle-panel__message pixel" aria-live="polite">
          {{ message }}
        </div>

        <div v-if="phase === 'player-turn'" class="battle-panel__moves">
          <button
            v-for="move in playerMoves"
            :key="move.id"
            class="move-btn"
            type="button"
            @click="useMove(move)"
          >
            <span class="pixel move-btn__name">{{ move.name }}</span>
            <span class="pixel move-btn__meta">PWR {{ move.power }}</span>
          </button>
        </div>

        <div v-else-if="isOver" class="battle-panel__end">
          <button class="btn btn-primary pixel" type="button" @click="goBack">
            {{ phase === 'victory' ? 'Vitória! Voltar' : 'Voltar' }}
          </button>
        </div>

        <button
          v-if="!isOver"
          class="flee-btn pixel"
          type="button"
          :disabled="phase !== 'player-turn'"
          @click="flee"
        >
          Fugir
        </button>
      </section>
    </div>

    <!-- Overlay do DOM durante a sessão WebXR (dom-overlay). Fica sempre no
         DOM (exigência do WebXR), mas só mostra controles com o AR ativo. -->
    <div ref="arOverlay" class="arena__xr-overlay">
      <template v-if="arActive">
        <p class="arena__xr-hint" aria-live="polite">{{ arHint }}</p>
        <button class="arena__xr-exit" type="button" @click="exitAR">
          Sair do AR
        </button>
      </template>
    </div>
  </main>
</template>

<style scoped>
.arena {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--bg-deep);
}

.arena__stage {
  position: absolute;
  inset: 0;
  /* z-index explícito -> a etapa vira um contexto de empilhamento próprio,
    prendendo os modelos (z-index:1) abaixo do HUD (z-index:2). Assim os
    bonecos nunca cobrem os botões/textos. */
  z-index: 0;
  /* Piso da arena: gradiente sutil para dar profundidade */
  background:
    radial-gradient(ellipse 65% 18% at 32% 42%, rgba(237, 175, 104, 0.12), transparent),
    radial-gradient(ellipse 70% 16% at 72% 74%, rgba(237, 175, 104, 0.14), transparent),
    linear-gradient(180deg, var(--bg-deep) 0%, #1a1e26 55%, var(--bg-deep) 100%);
}

/* No modo AR o gradiente some para a câmera aparecer limpa */
.arena__stage--ar {
  background: #000;
}

/* Camada de fundo: feed da câmera (AR) */
.arena__camera {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

/* Camada de fundo: cenário do túnel binário (AR desligada) */
.arena__scenario {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* Modelos 3D estáticos: sem rotação nem zoom (câmera travada) */
.arena__model {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  --poster-color: transparent;
  --progress-bar-color: var(--unifil-gold);
}

/* Inimigo: mais ao centro e menor -> parece mais fundo no túnel (perspectiva) */
.arena__model--enemy {
  top: 24%;
  left: 10%;
  width: 50%;
  height: 34%;
  /* Contorno vermelho discreto: drop-shadow segue a silhueta do modelo
     (o canvas é transparente), diferente de um border/outline retangular.
     --error é o vermelho real da paleta (--red do tema é marrom). */
  filter:
    drop-shadow(0 0 1px var(--error))
    drop-shadow(0 0 2px var(--error));
}

/* Jogador: em primeiro plano, à direita, de costas — abaixado (mais para baixo) */
.arena__model--player {
  right: -10%;
  bottom: 17%;
  width: 88%;
  height: 50%;
  /* Mesmo contorno, em azul */
  filter:
    drop-shadow(0 0 1px var(--ds-blue-glow))
    drop-shadow(0 0 2px var(--ds-blue-glow));
}

/* Flash + tremida no modelo que tomou dano */
.arena__model--hit {
  animation: shake 0.4s ease;
  filter: brightness(1.6) saturate(0.4);
}

.arena__hud {
  position: absolute;
  inset: 0;
  z-index: 2; /* acima do palco (z-index:0) e dos modelos -> botões/textos na frente */
  display: flex;
  flex-direction: column;
  pointer-events: none;
  /* só os controles recebem toque; o resto deixa girar o modelo */
}

.arena__hud>* {
  pointer-events: auto;
}

/* Flash vermelho na tela quando o jogador toma dano */
.arena__hud--player-hit::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 107, 107, 0.25);
  pointer-events: none;
}

.arena__back {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  right: 12px;
  width: 38px;
  height: 38px;
  border-radius: var(--radius);
  background: rgba(0, 0, 0, 0.45);
  color: var(--text);
  border: 1px solid var(--border);
  font-size: 18px;
}

/* Botão de canto para alternar AR (abaixo do voltar) */
.arena__ar-toggle {
  position: absolute;
  top: calc(58px + env(safe-area-inset-top));
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 100px;
  background: rgba(0, 0, 0, 0.55);
  color: var(--text);
  border: 1px solid var(--border);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.arena__ar-toggle--on {
  border-color: var(--ds-blue);
  color: var(--ds-blue-glow);
}

.arena__ar-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
}

.arena__ar-toggle--on .arena__ar-dot {
  background: var(--ds-blue-glow);
  box-shadow: 0 0 8px var(--ds-blue-glow);
}

.arena__ar-note {
  position: absolute;
  top: calc(100px + env(safe-area-inset-top));
  right: 12px;
  max-width: 60%;
  padding: 6px 10px;
  border-radius: var(--radius);
  background: rgba(0, 0, 0, 0.55);
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1.4;
  text-align: right;
}

.arena__ar-note--xr {
  top: calc(136px + env(safe-area-inset-top));
}

/* Botão de AR ancorado (WebXR) — abaixo do toggle de câmera */
.arena__ar-real {
  position: absolute;
  top: calc(96px + env(safe-area-inset-top));
  right: 12px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 100px;
  background: var(--ds-blue);
  color: var(--bg-deep);
  border: 1px solid var(--ds-blue-glow);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* Overlay do DOM durante a sessão imersiva. Sem AR ativo fica invisível e
   deixa o toque passar (pointer-events: none); só os controles recebem toque. */
.arena__xr-overlay {
  position: fixed;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

.arena__xr-hint {
  position: absolute;
  top: calc(16px + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  max-width: 80%;
  padding: 8px 14px;
  border-radius: 100px;
  background: rgba(0, 0, 0, 0.7);
  color: var(--text);
  font-size: 12px;
  text-align: center;
}

.arena__xr-exit {
  position: absolute;
  bottom: calc(24px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  min-height: 44px;
  padding: 0 28px;
  border-radius: 100px;
  background: rgba(0, 0, 0, 0.7);
  color: var(--text);
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 700;
  pointer-events: auto;
}

.arena__enemy-bar {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  left: 12px;
  max-width: 62%;
}

.arena__player-bar {
  position: absolute;
  left: 12px;
  bottom: 256px;
  max-width: 58%;
}

/* Painel inferior: mensagem + grid 2x2 + fugir */
.battle-panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(18, 20, 24, 0.55), var(--bg-deep) 32%);
}

.battle-panel__message {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border: 2px solid var(--yellow);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text);
  font-size: 9px;
  line-height: 1.6;
}

.battle-panel__moves {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.move-btn {
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: var(--radius);
  background: var(--bg-card);
  border: 2px solid var(--border);
  color: var(--text);
  transition: transform 0.1s, border-color 0.15s;
}

.move-btn:active {
  transform: scale(0.97);
  border-color: var(--yellow);
}

.move-btn__name {
  font-size: 8px;
  text-align: left;
}

.move-btn__meta {
  font-size: 6px;
  color: var(--text-muted);
}

.flee-btn {
  align-self: center;
  min-height: 38px;
  padding: 0 26px;
  border-radius: var(--radius);
  background: transparent;
  border: 2px solid var(--error);
  color: var(--error);
  font-size: 8px;
}

.flee-btn:disabled {
  opacity: 0.4;
}

.battle-panel__end {
  display: flex;
}
</style>
