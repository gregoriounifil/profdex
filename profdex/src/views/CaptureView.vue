<script setup>
import { onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAR } from '../composables/useAR'
import { useProfessorsStore } from '../stores/professors'

const router = useRouter()
const store = useProfessorsStore()
const containerRef = useTemplateRef('arContainer')

const { loading, error, start, addAnchor } = useAR(containerRef, '/markers.mind', 2)

const capturedProfessor = ref(null)
const capturing = ref(false)
const celebrating = ref(false)
const celebrateImgError = ref(false)

// Mapeamento para limpar a câmera e liberar o hardware ao sair da tela
function goBack() {
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }
  router.push({ name: 'profdex' })
}

// Pares [marker1Index, marker2Index] — Mário(0,4), Eron(1,5), Gustavo(2,3)
const MARKER_PAIRS = [
  [0, 4],
  [1, 5],
  [2, 3],
]

onMounted(async () => {
  if (!store.professors.length) await store.fetch()
  await start()

  const visibleSet = new Set()

  MARKER_PAIRS.forEach(([m1, m2]) => {
    const anchor1 = addAnchor(m1)
    const anchor2 = addAnchor(m2)

    const checkPair = async () => {
      if (visibleSet.has(m1) && visibleSet.has(m2) && !capturing.value && !celebrating.value) {
        const professor = store.professors.find(
          (p) => p.marker1Index === m1 && p.marker2Index === m2,
        )
        if (!professor || professor.captured) return
        if (!professor.discovered) return

        await triggerCapture(professor)
      }
    }

    anchor1.onTargetFound = () => { visibleSet.add(m1); checkPair() }
    anchor1.onTargetLost = () => visibleSet.delete(m1)
    anchor2.onTargetFound = () => { visibleSet.add(m2); checkPair() }
    anchor2.onTargetLost = () => visibleSet.delete(m2)
  })
})

async function triggerCapture(professor) {
  capturing.value = true
  celebrateImgError.value = false
  capturedProfessor.value = professor
  try {
    await store.capture(professor.id)
    celebrating.value = true
  } catch (err) {
    capturedProfessor.value = null
  } finally {
    capturing.value = false
  }
}

function finish() {
  goBack()
}
</script>

<template>
  <div class="capture-view pk-pixel" :class="{ 'flash': celebrating }">
    <div ref="arContainer" class="ar-container" />

    <div class="capture-ui">
      <div class="capture-topbar">
        <button class="btn-voltar-retro" @click="goBack">Voltar</button>
        <span class="pixel capture-title">CAPTURA AR</span>
      </div>

      <div v-if="loading" class="capture-loading">
        <div class="capture-loader">
          <div class="loader-pokeball">
            <div class="pb-top" />
            <div class="pb-mid" />
            <div class="pb-bot" />
          </div>
          <span class="pixel" style="font-size: 8px; color: white">Iniciando AR...</span>
        </div>
      </div>

      <div v-else-if="error" class="capture-error">
        <div class="error-card">
          <span style="font-size: 32px">😕</span>
          <p class="pixel" style="font-size: 10px">Erro ao iniciar AR</p>
          <button class="btn-voltar-retro" style="pointer-events: auto; position: static;" @click="goBack">
            VOLTAR
          </button>
        </div>
      </div>

      <template v-else>
        <div v-if="!capturedProfessor" class="capture-hint">
          <div class="hint-content">
            <div class="hint-icon">📷 + 🃏</div>
            <p class="pixel hint-title">Coloque os dois marcadores</p>
            <p class="hint-subtitle">
              Posicione o marcador do evento <strong>e</strong> o verso do card do professor na câmera ao mesmo tempo
            </p>

            <div class="hint-markers">
              <div class="marker-slot">
                <div class="marker-frame" />
                <span class="pixel" style="font-size: 7px">Marcador 1</span>
              </div>
              <div class="hint-plus pixel">+</div>
              <div class="marker-slot">
                <div class="marker-frame marker-frame--card" />
                <span class="pixel" style="font-size: 7px">Card (verso)</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="capturing" class="capturing-overlay animate-fade-in">
          <div class="capturing-card">
            <div class="capturing-ball">
              <div class="pb-top" />
              <div class="pb-mid" />
              <div class="pb-bot" />
            </div>
            <p class="pixel" style="font-size: 10px; color: #f8d030">CAPTURANDO!</p>
            <p style="font-size: 12px; color: #a8b8c0">Prof. {{ capturedProfessor.name }}</p>
          </div>
        </div>

        <div v-else-if="celebrating" class="celebrate-overlay animate-fade-in">
          <div class="celebrate-card">
            <div class="celebrate-emoji">🎉</div>
            <div class="pixel celebrate-title">CAPTURADO!</div>
            <div class="celebrate-avatar">
              <img
                v-if="!celebrateImgError"
                :src="`/professors/${capturedProfessor.slug}-cartoon.png`"
                :alt="capturedProfessor.name"
                class="celebrate-img"
                @error="celebrateImgError = true"
              />
              <div v-else class="celebrate-fallback">{{ capturedProfessor.name[0] }}</div>
            </div>
            <div class="celebrate-prof-name">Prof. {{ capturedProfessor.name }}</div>
            <p style="font-size: 13px; color: #a8b8c0; text-align: center; line-height: 1.6">
              O Prof. <strong>{{ capturedProfessor.name }}</strong> foi adicionado ao seu ProfDex!
            </p>
            <button class="btn btn-primary celebrate-btn" @click="finish">
              <span class="pixel">VER PROFDEX</span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.pk-pixel {
  font-family: 'Press Start 2P', monospace !important;
}

.capture-view {
  position: fixed;
  inset: 0;
  background: black;
}

.capture-view.flash {
  animation: captureFlash 0.8s ease forwards;
}

.ar-container {
  position: absolute;
  inset: 0;
}

.capture-ui {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  z-index: 10;
}

.capture-topbar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 20px 16px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.75), transparent);
  pointer-events: auto;
  position: relative;
  flex-shrink: 0;
}

/* ==========================================================================
   ESTILO DO NOVO BOTÃO RETRÔ (PULSE / RELEVO 3D ORIGINAL DO BOTÃO SAIR)
   ========================================================================== */
.btn-voltar-retro {
  position: absolute;
  left: 20px;
  background: #a81808;
  border: 2px solid #222222;
  box-shadow: inset -2px -2px 0px #701008, inset 2px 2px 0px #d82810;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  pointer-events: auto;
}

.btn-voltar-retro:active {
  transform: scale(0.95);
  box-shadow: inset 2px 2px 0px #701008, inset -2px -2px 0px #d82810;
}

.capture-title {
  font-size: 12px;
  color: white;
  text-shadow: 2px 2px 0px #222222;
}

.capture-loading, .capture-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.capture-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loader-pokeball, .capturing-ball {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255,255,255,0.3);
  animation: spin 1s linear infinite;
}

.capturing-ball {
  width: 72px;
  height: 72px;
  animation: spin 0.5s linear infinite;
  border-color: #f8d030;
}

.pb-top { height: 50%; background: #cc0000; }
.pb-mid { height: 8px; background: #222; }
.pb-bot { height: calc(50% - 8px); background: white; }

.error-card {
  background: rgba(0,0,0,0.88);
  border: 2px solid #cc0000;
  border-radius: 12px;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  pointer-events: auto;
  width: 100%;
}

.capture-hint {
  flex: 1;
  display: flex;
  align-items: flex-end;
  padding: 0 16px 32px;
}

.hint-content {
  background: rgba(8, 8, 24, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 24px 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.hint-icon {
  font-size: 28px;
}

.hint-title {
  font-size: 9px;
  color: #f8d030;
  text-align: center;
  letter-spacing: 0.5px;
}

.hint-subtitle {
  font-size: 13px;
  color: #a8b8c0;
  text-align: center;
  line-height: 1.6;
}

.hint-subtitle strong {
  color: white;
}

.hint-markers {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.marker-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.marker-frame {
  width: 56px;
  height: 56px;
  border: 2px dashed #f8d030;
  border-radius: 6px;
  animation: pulse 2s ease-in-out infinite;
}

.marker-frame--card {
  border-color: #ff7070;
  animation-delay: 0.5s;
}

.hint-plus {
  font-size: 18px;
  color: white;
}

.capturing-overlay {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.capturing-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.celebrate-overlay {
  flex: 1;
  display: flex;
  align-items: flex-end;
  padding: 0 16px 32px;
  pointer-events: auto;
}

.celebrate-card {
  background: rgba(8, 8, 24, 0.97);
  border: 2px solid #f8d030;
  border-radius: 12px;
  padding: 28px 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 0 48px rgba(255, 222, 0, 0.35);
}

.celebrate-emoji {
  font-size: 48px;
  animation: pulse 1s ease-in-out infinite;
}

.celebrate-title {
  font-size: 18px;
  color: #f8d030;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
  letter-spacing: 2px;
}

.celebrate-avatar {
  width: 96px;
  height: 96px;
  position: relative;
}

.celebrate-img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f8d030;
  box-shadow: 0 0 24px rgba(255, 222, 0, 0.4);
  animation: pulse 1s ease-in-out infinite;
}

.celebrate-fallback {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #cc0000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  font-weight: 900;
  color: white;
  border: 3px solid #f8d030;
  animation: pulse 1s ease-in-out infinite;
}

.celebrate-prof-name {
  font-size: 22px;
  font-weight: 800;
}

.celebrate-btn {
  pointer-events: auto;
  margin-top: 4px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}

@keyframes captureFlash {
  0% { background: white; }
  100% { background: black; }
}
</style>