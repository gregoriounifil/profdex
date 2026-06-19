<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ARViewer from '../components/ARViewer.vue'
import { useProfessorsStore } from '../stores/professors'

const route = useRoute()
const router = useRouter()
const store = useProfessorsStore()

const routeCharacter = computed(() => window.history.state?.character || null)
const character = computed(() => {
  const id = route.params.id
  return (
    store.professors.find((professor) => String(professor.id) === String(id)) ||
    routeCharacter.value ||
    { id: 'modelo-padrao', name: 'Professor', slug: 'professor' }
  )
})

const viewerConfig = computed(() => ({
  src: character.value.modelUrl || '/models/seu-modelo.glb',
  alt: `Modelo 3D do Prof. ${character.value.name}`,
  arPlacement: 'floor',
  autoRotate: true,
  cameraControls: true,
  hotspots: [
    {
      id: 'nome',
      slot: 'hotspot-nome',
      position: '0m 1.35m 0.18m',
      normal: '0m 0m 1m',
      label: `Prof. ${character.value.name}`,
      description: 'Professor selecionado no ProfDex',
    },
  ],
}))

onMounted(() => {
  if (!store.professors.length) store.fetch().catch(() => {})
})
</script>

<template>
  <main class="character-ar page">
    <header class="character-ar__header">
      <button
        class="back-btn"
        type="button"
        @click="router.push({ name: 'batalha', query: { profId: character.id } })"
      >
        ← Voltar
      </button>
      <div>
        <span class="pixel eyebrow">VISUALIZADOR AR</span>
        <h1>Prof. {{ character.name }}</h1>
      </div>
    </header>

    <section class="viewer-panel">
      <ARViewer :config="viewerConfig" />
    </section>
  </main>
</template>

<style scoped>
.character-ar {
  min-height: 100%;
  padding: 18px 16px 24px;
  background: var(--bg);
  color: var(--text);
}

.character-ar__header {
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

.viewer-panel {
  height: min(72vh, 620px);
  min-height: 420px;
}

@media (max-width: 420px) {
  .viewer-panel {
    height: 68vh;
    min-height: 360px;
  }
}
</style>
