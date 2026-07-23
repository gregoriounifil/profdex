<script setup>
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import { GLTFModel } from '@tresjs/cientos'

// Este componente vive DENTRO do <TresCanvas> (ver Stage3D.vue).
// Só aqui dentro o contexto do Tres existe — por isso o useLoop
// (o "game loop" de cada frame) e as tags <Tres*> ficam neste arquivo,
// e não no componente que hospeda o canvas.
defineProps({
  // Caminho de um .glb dentro de /public. Vazio = só a forma procedural.
  modelPath: { type: String, default: '' },
})

// shallowRef porque o valor é um objeto THREE.js (Mesh/Group) que não
// queremos que o Vue torne reativo em profundidade — só precisamos da
// referência para mexer na rotação a cada frame.
const shapeRef = shallowRef()
const modelRef = shallowRef()

// useLoop devolve um gancho que roda uma vez por frame (~60x/s).
// `delta` = segundos desde o frame anterior, então multiplicar por ele
// deixa a rotação independente do FPS da máquina.
const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  if (shapeRef.value) shapeRef.value.rotation.y += delta * 0.8
  if (modelRef.value) modelRef.value.rotation.y += delta * 0.4
})
</script>

<template>
  <!-- Forma 100% procedural: geometria + material declarados no template.
       É o equivalente TresJS de `new Mesh(new TorusKnotGeometry(...), mat)`. -->
  <TresMesh ref="shapeRef" :position="[-1.3, 0.7, 0]" cast-shadow>
    <TresTorusKnotGeometry :args="[0.4, 0.13, 128, 32]" />
    <TresMeshStandardMaterial color="#f2a900" :roughness="0.25" :metalness="0.6" />
  </TresMesh>

  <!-- Modelo GLB carregado da pasta public/models.
       O <GLTFModel> é assíncrono, por isso o pai (Stage3D) o envolve
       num <Suspense>. Envolvemos num <TresGroup> só para poder girar. -->
  <TresGroup v-if="modelPath" ref="modelRef" :position="[1.2, 0, 0]">
    <GLTFModel :path="modelPath" />
  </TresGroup>

  <!-- Chão, só para dar noção de escala e receber a sombra. -->
  <TresMesh :rotation="[-Math.PI / 2, 0, 0]" receive-shadow>
    <TresPlaneGeometry :args="[12, 12]" />
    <TresMeshStandardMaterial color="#161616" :roughness="1" />
  </TresMesh>
</template>
