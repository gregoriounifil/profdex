<script setup>
import { useRouter } from 'vue-router'
import BinaryTunnelScene from '@/components/BinaryTunnelScene.vue'

const router = useRouter()
</script>

<template>
  <main class="tunnel-view page">
    <header class="tunnel-view__header">
      <button class="back-btn" type="button" @click="router.push({ name: 'batalha' })">
        ← Voltar
      </button>
      <div>
        <span class="pixel eyebrow">CENÁRIO 3D</span>
        <h1>Túnel binário</h1>
      </div>
    </header>

    <section class="stage-panel">
      <BinaryTunnelScene :speed="7" color="#ff2bc4" :controls="true" />
    </section>

    <p class="hint">
      As linhas do grid são fileiras de <code>0</code> e <code>1</code> monoespaçados —
      arraste para orbitar, scroll/pinça para zoom.
    </p>
  </main>
</template>

<style scoped>
.tunnel-view {
  min-height: 100%;
  padding: 18px 16px 24px;
  background: var(--bg);
  color: var(--text);
}

.tunnel-view__header {
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
  height: min(74vh, 640px);
  min-height: 440px;
  border-radius: var(--radius-lg, 16px);
  overflow: hidden;
}

.hint {
  margin-top: 14px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted);
}

.hint code {
  font-size: 12px;
  color: var(--yellow);
}

@media (max-width: 420px) {
  .stage-panel {
    height: 70vh;
    min-height: 380px;
  }
}
</style>
