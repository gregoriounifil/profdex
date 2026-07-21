<script setup>
import { shallowRef, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { useLoop } from '@tresjs/core'

// Túnel de grid neon cujas linhas são, literalmente, fileiras de código binário.
// Vive DENTRO do <TresCanvas> (ver BinaryTunnelView.vue), por isso o useLoop
// e o grupo THREE são montados aqui.
const props = defineProps({
  color: { type: String, default: '#ff2bc4' }, // rosa/magenta neon
  speed: { type: Number, default: 7 }, // unidades de mundo por segundo (voo pra frente)
})

// Dimensões do túnel. CELL = lado de uma célula do grid (tudo em unidades de mundo).
// W, H e L são múltiplos de CELL para o tiling fechar sem emenda.
const W = 11, H = 11, L = 143, CELL = 2.2

// --- 1) Textura de UMA célula: binário só nas arestas de cima e da esquerda ---
// Ao repetir a textura (RepeatWrapping), a aresta de baixo de uma célula encosta
// na de cima da seguinte -> as fileiras de dígitos viram linhas contínuas do grid.
// Assim cada "linha" é de fato uma sequência perfeita de 0s e 1s monoespaçados.
function makeCellCanvas() {
  const S = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')
  const N = 12 // dígitos por aresta
  const step = S / N
  const fs = step * 1.08
  ctx.font = `700 ${fs}px "Courier New", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = props.color
  ctx.shadowColor = props.color
  ctx.shadowBlur = fs * 0.7 // brilho embutido na textura (neon sem pós-processamento)
  const bit = () => (Math.random() > 0.5 ? '1' : '0')
  for (let i = 0; i < N; i++) ctx.fillText(bit(), i * step + step / 2, step * 0.5) // aresta de cima
  for (let i = 0; i < N; i++) ctx.fillText(bit(), step * 0.5, i * step + step / 2) // aresta da esquerda
  return cv
}
const cellCanvas = makeCellCanvas()

function wallTexture(rx, ry) {
  const t = new THREE.CanvasTexture(cellCanvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.anisotropy = 8
  return t
}
function wallMaterial(tex) {
  return new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    blending: THREE.AdditiveBlending, // sobreposições somam luz -> núcleo brilhante
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false, // não deixa o tone mapping apagar o rosa saturado
  })
}

// --- 2) Halo do ponto de fuga no fundo do túnel ---
function makeGlowTexture() {
  const S = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,220,250,1)')
  g.addColorStop(0.35, props.color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  return new THREE.CanvasTexture(cv)
}

// --- 3) Montagem do grupo: 4 paredes + halo ---
const tunnel = new THREE.Group()
const scrollers = [] // { tex, axis } — texturas que rolam no tempo
const disposables = []

function addWall({ w, h, rot, pos, repeat, axis }) {
  const tex = wallTexture(repeat[0], repeat[1])
  const geo = new THREE.PlaneGeometry(w, h)
  const mesh = new THREE.Mesh(geo, wallMaterial(tex))
  mesh.rotation.set(rot[0], rot[1], rot[2])
  mesh.position.set(pos[0], pos[1], pos[2])
  tunnel.add(mesh)
  scrollers.push({ tex, axis })
  disposables.push(geo, mesh.material, tex)
}

// Chão / teto: plano W×L, eixo do túnel = coordenada V (offset.y)
addWall({ w: W, h: L, rot: [-Math.PI / 2, 0, 0], pos: [0, -H / 2, -L / 2], repeat: [W / CELL, L / CELL], axis: 'y' })
addWall({ w: W, h: L, rot: [Math.PI / 2, 0, 0], pos: [0, H / 2, -L / 2], repeat: [W / CELL, L / CELL], axis: 'y' })
// Paredes esq / dir: plano L×H, eixo do túnel = coordenada U (offset.x)
addWall({ w: L, h: H, rot: [0, Math.PI / 2, 0], pos: [-W / 2, 0, -L / 2], repeat: [L / CELL, H / CELL], axis: 'x' })
addWall({ w: L, h: H, rot: [0, -Math.PI / 2, 0], pos: [W / 2, 0, -L / 2], repeat: [L / CELL, H / CELL], axis: 'x' })

// Halo no fundo
const glowTex = makeGlowTexture()
const glowMat = new THREE.MeshBasicMaterial({
  map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
})
const glowGeo = new THREE.PlaneGeometry(W * 1.15, H * 1.15)
const glow = new THREE.Mesh(glowGeo, glowMat)
glow.position.set(0, 0, -L + 0.5)
tunnel.add(glow)
disposables.push(glowGeo, glowMat, glowTex)

// --- 4) Ligação com a cena + animação ---
// Anexo o grupo pré-montado ao <TresGroup> (evita o elemento <primitive>).
const root = shallowRef()
onMounted(() => root.value?.add(tunnel))

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  // Rola as texturas ao longo do eixo do túnel -> sensação de voar pra frente.
  const d = (props.speed * delta) / CELL
  for (const s of scrollers) s.tex.offset[s.axis] -= d
})

onBeforeUnmount(() => {
  for (const o of disposables) o.dispose?.()
})
</script>

<template>
  <TresGroup ref="root" />
</template>
