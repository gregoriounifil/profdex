<script setup>
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import BinaryTunnel from '@/components/BinaryTunnel.vue'

// Cenário do túnel binário empacotado para reuso: preenche o elemento pai.
// Usado na página de demonstração (com controles) e como fundo do combate 3D.
defineProps({
  speed: { type: Number, default: 7 },
  color: { type: String, default: '#ff2bc4' },
  controls: { type: Boolean, default: false }, // órbita por toque/mouse
})
</script>

<template>
  <TresCanvas clear-color="#08000f" :dpr="[1, 2]">
    <TresPerspectiveCamera :position="[0, 0, 8]" :fov="72" :look-at="[0, 0, -50]" />
    <OrbitControls v-if="controls" :target="[0, 0, -50]" :enable-damping="true" :enable-pan="false" />
    <BinaryTunnel :speed="speed" :color="color" />
  </TresCanvas>
</template>
