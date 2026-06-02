<script setup>
import { onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAR } from '../composables/useAR'
import { useProfessorsStore } from '../stores/professors'

const router = useRouter()
const store = useProfessorsStore()
const containerRef = useTemplateRef('arContainer')

const { loading, error, start, addAnchor } = useAR(containerRef, '/markers.mind', 1)

const foundProfessor = ref(null)
const discovering = ref(false)
const avatarError = ref(false)

// Mapeamento correto para liberar a câmera ao voltar
function goBack() {
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }
  router.push({ name: 'profdex' })
}

// marker1Index por professor: Mário=0, Eron=1, Gustavo=2
const FIRST_MARKER_INDICES = [0, 1, 2]

onMounted(async () => {
  if (!store.professors.length) await store.fetch()
  await start()

  FIRST_MARKER_INDICES.forEach((markerIndex) => {
    const anchor = addAnchor(markerIndex)

    anchor.onTargetFound = async () => {
      const professor = store.professors.find((p) => p.marker1Index === markerIndex)
      if (!professor || foundProfessor.value) return
      avatarError.value = false
      foundProfessor.value = professor

      if (!professor.discovered) {
        discovering.value = true
        try {
          await store.discover(professor.id)
        } finally {
          discovering.value = false
        }
      }
    }

    anchor.onTargetLost = () => {
      if (foundProfessor.value?.marker1Index === markerIndex) {
        setTimeout(() => {
          if (foundProfessor.value?.marker1Index === markerIndex) {
            foundProfessor.value = null
          }
        }, 2500)
      }
    }
  })
})
</script>

<template>
  <div class="scan-view pk-pixel">
    <div ref="arContainer" class="ar-container" />

    <div class="scan-ui">
      <div class="scan-topbar">
        <button class="btn-voltar-retro" @click="goBack">Voltar</button>
        <span class="pixel scan-title">SCANNER</span>
      </div>

      <div v-if="loading" class="scan-loading">
        <div class="scan-loader">
          <div class="loader-ball" />
          <span class="pixel" style="font-size: 8px; color: white">Iniciando câmera AR...</span>
          <span style="font-size: 11px; color: rgba(255,255,255,0.5); text-align: center; max-width: 200px">
            Permita o acesso à câmera quando solicitado
          </span>
        </div>
      </div>

      <div v-else-if="error" class="scan-error">
        <div class="error-card">
          <span style="font-size: 32px">😕</span>
          <p class="pixel" style="font-size: 10px">Erro ao iniciar AR</p>
          <p style="font-size: 12px; color: var(--text-muted)">{{ error }}</p>
          <button class="btn-voltar-retro" style="pointer-events: auto" @click="goBack">
            VOLTAR
          </button>
        </div>
      </div>

      <template v-else>
        <div v-if="!foundProfessor" class="scan-hint">
          <div class="scan-frame">
            <div class="frame-corner frame-tl" />
            <div class="frame-corner frame-tr" />
            <div class="frame-corner frame-bl" />
            <div class="frame-corner frame-br" />
          </div>
          <p class="pixel scan-hint-text">Aponte para um marcador</p>
        </div>

        <div v-else class="found-overlay animate-fade-in">
          <div class="found-card">
            <div class="found-badge pixel">
              {{ foundProfessor.captured ? 'JÁ CAPTURADO' : foundProfessor.discovered ? 'PROFESSOR ENCONTRADO' : 'NOVO PROFESSOR!' }}
            </div>

            <div class="found-avatar">
              <img
                v-if="!avatarError"
                :src="`/professors/${foundProfessor.slug}-cartoon.png`"
                :alt="foundProfessor.name"
                class="found-avatar-img"
                :class="{ 'found-avatar-img--shadow': !foundProfessor.captured }"
                @error="avatarError = true"
              />
              <div v-else class="found-avatar-circle">{{ foundProfessor.name[0] }}</div>
              <div v-if="!foundProfessor.captured" class="found-avatar-question">?</div>
            </div>

            <div v-if="discovering" class="spinner-sm" />
            
            <template v-else>
              <h2 class="found-name">Prof. {{ foundProfessor.name }}</h2>
              <p class="found-desc">
                <template v-if="foundProfessor.captured">
                  Você já capturou este professor! Ele está no seu ProfDex. ✓
                </template>
                <template v-else>
                  Encontre o <strong>Prof. {{ foundProfessor.name }}</strong> pessoalmente e responda a pergunta dele para receber o card de captura!
                </template>
              </p>
              <button class="btn btn-primary found-btn" @click="foundProfessor = null">
                <span class="pixel">ENTENDIDO!</span>
              </button>
            </template>
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

.scan-view {
  position: fixed;
  inset: 0;
  background: black;
}

.ar-container {
  position: absolute;
  inset: 0;
}

.scan-ui {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  z-index: 10;
}

.scan-topbar {
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
   BOTÃO VOLTAR (IDÊNTICO AO COMPONENTE DE SAIR DA PROFDEX)
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

.scan-title {
  font-size: 12px;
  color: white;
  text-shadow: 2px 2px 0px #222222;
}

.scan-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loader-ball {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 4px solid rgba(255,255,255,0.2);
  border-top-color: #cc0000;
  animation: spin 1s linear infinite;
}

.scan-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

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

.scan-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.scan-frame {
  width: 220px;
  height: 220px;
  position: relative;
}

.frame-corner {
  position: absolute;
  width: 32px;
  height: 32px;
  border-color: #f8d030;
  border-style: solid;
  border-width: 0;
  animation: pulse 2s ease-in-out infinite;
}
.frame-tl { top: 0; left: 0; border-top-width: 3px; border-left-width: 3px; }
.frame-tr { top: 0; right: 0; border-top-width: 3px; border-right-width: 3px; }
.frame-bl { bottom: 0; left: 0; border-bottom-width: 3px; border-left-width: 3px; }
.frame-br { bottom: 0; right: 0; border-bottom-width: 3px; border-right-width: 3px; }

.scan-hint-text {
  font-size: 8px;
  color: rgba(255,255,255,0.85);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.8);
}

.found-overlay {
  flex: 1;
  display: flex;
  align-items: flex-end;
  padding: 0 16px 32px;
  pointer-events: auto;
}

.found-card {
  background: rgba(8, 8, 24, 0.96);
  border: 2px solid #f8d030;
  border-radius: 12px;
  padding: 24px 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 0 40px rgba(255, 222, 0, 0.25);
}

.found-badge {
  font-size: 8px;
  color: #f8d030;
  letter-spacing: 1px;
  animation: pulse 1.5s ease-in-out infinite;
}

.found-avatar {
  position: relative;
  width: 80px;
  height: 80px;
}

.found-avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f8d030;
}

.found-avatar-img--shadow {
  filter: brightness(0) contrast(1);
  border-color: rgba(255,255,255,0.2);
  opacity: 0.7;
}

.found-avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #cc0000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 900;
  color: white;
  border: 3px solid #f8d030;
}

.found-avatar-question {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 28px;
  height: 28px;
  background: #181c24;
  border: 2px solid #f8d030;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 14px;
  color: #f8d030;
}

.found-name {
  font-size: 20px;
  font-weight: 800;
}

.found-desc {
  font-size: 13px;
  color: #a8b8c0;
  text-align: center;
  line-height: 1.6;
}

.found-desc strong {
  color: white;
}

.found-btn {
  pointer-events: auto;
}

.spinner-sm {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255,255,255,0.2);
  border-top-color: #f8d030;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>