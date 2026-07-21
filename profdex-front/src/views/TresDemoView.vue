<script setup>
import { useRouter } from 'vue-router'
import Stage3D from '@/components/Stage3D.vue'

const router = useRouter()

// A página só descreve O QUE mostrar; o Stage3D cuida do COMO renderizar.
const stageConfig = {
  modelPath: '/models/seu-modelo.glb',
  clearColor: '#1a1a1a',
}
</script>

<template>
  <main class="tres-demo page">
    <header class="tres-demo__header">
      <button class="back-btn" type="button" @click="router.push({ name: 'batalha' })">
        ← Voltar
      </button>
      <div>
        <span class="pixel eyebrow">EXEMPLO TRESJS</span>
        <h1>Cena 3D declarativa</h1>
      </div>
    </header>

    <section class="stage-panel">
      <Stage3D :config="stageConfig" />
    </section>

    <p class="hint">
      Arraste para girar · pinça/scroll para zoom. O toroide é geometria
      procedural; o modelo à direita é o GLB carregado de <code>/public/models</code>.
    </p>
  </main>
</template>

<style scoped>
.tres-demo {
  min-height: 100%;
  padding: 18px 16px 24px;
  background: var(--bg);
  color: var(--text);
}

.tres-demo__header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.back-btn {
  flex: 0 0 auto;
  min-height: 38px;
  padding: 0 14px;
  border-radius: var(--radius);
  background: var(--bg-surface);
  color: var(--text);
  border: 1px solid var(--border);
}

.eyebrow {
  display: block;
  margin-bottom: 6px;
  color: var(--yellow);
  font-size: 8px;
}

h1 {
  font-size: 22px;
  line-height: 1.15;
}

.stage-panel {
  height: min(72vh, 620px);
  min-height: 420px;
}

.hint {
  margin-top: 14px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted);
}

.hint code {
  font-size: 11px;
  color: var(--yellow);
}

@media (max-width: 420px) {
  .stage-panel {
    height: 68vh;
    min-height: 360px;
  }
}
</style>
