<template>
  <!-- eslint-disable vue/no-deprecated-slot-attribute -- model-viewer uses native web-component slots. -->
  <div class="ar-viewer">

    <!-- Aparece enquanto o modelo carrega -->
    <Transition name="fade">
      <div v-if="isLoading" class="ar-loading">
        <div class="ar-loading__spinner" />
        <span>Carregando modelo... {{ Math.round(loadProgress * 100) }}%</span>
      </div>
    </Transition>

    <!-- O elemento principal da lib — renderiza o modelo 3D -->
    <model-viewer ref="viewerRef" :src="config.src" :poster="config.poster" :alt="config.alt ?? 'Modelo 3D'"
      :ios-src="config.iosSrc" :ar="arStatus !== 'not-supported'" ar-modes="webxr scene-viewer quick-look"
      :ar-placement="config.arPlacement ?? 'floor'" :auto-rotate="config.autoRotate ?? false"
      :camera-controls="config.cameraControls ?? true" shadow-intensity="1" shadow-softness="0.8" exposure="1"
      ar-scale="auto" ar-usdz-max-texture-size="2048" touch-action="pan-y" class="ar-viewer__canvas">
      <!-- Hotspots: pontos clicáveis sobre o modelo -->
      <template v-if="config.hotspots">
        <button v-for="hs in config.hotspots" :key="hs.id" :slot="hs.slot" :data-position="hs.position"
          :data-normal="hs.normal" class="hotspot" :class="{ 'hotspot--active': activeHotspot === hs.id }"
          @click="openHotspot(hs.id)">
          <span class="hotspot__dot" />

          <!-- Tooltip que aparece ao clicar no hotspot -->
          <Transition name="tooltip">
            <div v-if="activeHotspot === hs.id" class="hotspot__tooltip">
              <strong>{{ hs.label }}</strong>
              <p v-if="hs.description">{{ hs.description }}</p>
              <button class="hotspot__close" @click.stop="closeHotspot">✕</button>
            </div>
          </Transition>
        </button>
      </template>

      <!-- Botão que abre a câmera AR -->
      <div slot="ar-button" class="ar-button-wrapper">
        <button class="ar-button" :disabled="arStatus === 'not-supported'">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 12L12 2l10 10-10 10z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>{{ arStatus === 'not-supported' ? 'AR não disponível' : 'Ver em RA' }}</span>
        </button>
      </div>
    </model-viewer>

    <div v-if="errorMessage" class="ar-message ar-message--error" role="alert">
      {{ errorMessage }}
    </div>

    <div v-else-if="!isLoading && arStatus === 'not-supported'" class="ar-message">
      O modelo 3D está disponível, mas este navegador não oferece realidade aumentada.
    </div>

    <!-- Badge que aparece quando a câmera AR está ativa -->
    <Transition name="fade">
      <div v-if="arStatus === 'ar-active'" class="ar-status-badge">
        <span class="ar-status-badge__dot" />
        AR ativo — aponte para o chão
      </div>
    </Transition>
  </div>
</template>

<script setup>
import '@google/model-viewer'
import { useModelViewer } from '@/composables/useModelViewer.js'

const props = defineProps({
  config: {
    type: Object,
    required: true,
    // config espera: { src, iosSrc?, poster?, alt?, arPlacement?,
    //                  autoRotate?, cameraControls?, hotspots? }
  }
})

const {
  viewerRef,
  arStatus,
  isLoading,
  loadProgress,
  errorMessage,
  activeHotspot,
  openHotspot,
  closeHotspot,
} = useModelViewer(props.config)
</script>

<style scoped>
.ar-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: var(--bg-deep);
}

.ar-viewer__canvas {
  width: 100%;
  height: 100%;
  --poster-color: transparent;
}

.ar-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(26, 26, 26, 0.92);
  z-index: 10;
  font-size: 14px;
  color: var(--text-muted);
}

.ar-loading__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--surface-border);
  border-top-color: var(--unifil-gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.ar-button-wrapper {
  display: flex;
  justify-content: center;
}

.ar-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--surface);
  color: var(--text-primary);
  border: none;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.ar-button:hover:not(:disabled) {
  background: var(--unifil-orange);
  transform: translateY(-1px);
}

.ar-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.hotspot {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.hotspot__dot {
  display: block;
  width: 16px;
  height: 16px;
  background: var(--surface);
  border: 2px solid var(--surface-border);
  border-radius: 50%;
  transition: transform 0.2s;
}

.hotspot--active .hotspot__dot,
.hotspot:hover .hotspot__dot {
  transform: scale(1.3);
  background: var(--unifil-orange);
}

.hotspot__tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  padding: 10px 14px;
  min-width: 160px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  text-align: left;
  z-index: 20;
}

.hotspot__tooltip strong {
  display: block;
  font-size: 13px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.hotspot__tooltip p {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.hotspot__close {
  position: absolute;
  top: 6px;
  right: 8px;
  background: none;
  border: none;
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
}

.ar-status-badge {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: var(--text-primary);
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 100px;
}

.ar-status-badge__dot {
  width: 8px;
  height: 8px;
  background: var(--success-bg);
  color: var(--success-text);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.ar-message {
  position: absolute;
  right: 12px;
  bottom: 12px;
  left: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  background: rgba(17, 17, 17, 0.86);
  color: var(--text-primary);
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  z-index: 5;
}

.ar-message--error {
  border-color: rgba(255, 90, 90, 0.55);
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
