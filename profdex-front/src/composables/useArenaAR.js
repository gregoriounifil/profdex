import { ref } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Distância entre os dois lutadores na arena, em metros — frente a frente.
const ARENA_GAP = 1.7
// Altura-alvo de cada lutador em metros: normaliza qualquer GLB para escala humana.
const FIGHTER_HEIGHT = 1.6
// A normal do plano precisa apontar para cima o bastante para valer como "chão"
// (1 = perfeitamente horizontal). Rejeita paredes e teto no hit-test.
const FLOOR_NORMAL_MIN = 0.85

/**
 * AR ancorado de verdade: sessão WebXR `immersive-ar` com hit-test de chão.
 *
 * Diferente do model-viewer (single-scene) e do magic-window (preso na tela),
 * aqui os dois modelos são filhos de um mesmo grupo posicionado no plano que a
 * câmera detecta — então ficam ancorados no chão, a ARENA_GAP metros um do
 * outro, espelhados (o inimigo gira 180° para encarar o jogador).
 *
 * Reconhecimento de chão aprimorado:
 *  - só ancora em superfícies horizontais (filtra parede/teto pela normal);
 *  - usa `local-floor` quando disponível para o y=0 bater com o piso real;
 *  - cada modelo é escalado para ~1,6 m e tem os pés assentados em y=0;
 *  - sombra de contato (ShadowMaterial) "cola" os lutadores no chão.
 *
 * Funciona em Android/Chrome (WebXR). iOS Safari não tem WebXR: cai em
 * `arError` para o chamador tratar (ex.: manter o magic-window).
 */
export function useArenaAR() {
  const arSupport = ref('checking') // 'checking' | 'supported' | 'unsupported'
  const arActive = ref(false)
  const arError = ref(null)
  const hint = ref('Aponte a câmera para o chão')

  const loader = new GLTFLoader()

  let renderer = null
  let scene = null
  let camera = null
  let reticle = null
  let fighters = null // grupo com os dois modelos
  let placed = false
  let hitTestSource = null
  let localSpace = null // espaço de referência do chão (local-floor|local)
  let viewerSpace = null
  let session = null

  // Reutilizáveis para não alocar por frame.
  const WORLD_UP = new THREE.Vector3(0, 1, 0)
  const tmpNormal = new THREE.Vector3()
  const tmpEuler = new THREE.Euler(0, 0, 0, 'YXZ')
  const tmpMatrix = new THREE.Matrix4()

  async function checkSupport() {
    if (!navigator.xr) {
      arSupport.value = 'unsupported'
      return false
    }
    try {
      const ok = await navigator.xr.isSessionSupported('immersive-ar')
      arSupport.value = ok ? 'supported' : 'unsupported'
      return ok
    } catch {
      arSupport.value = 'unsupported'
      return false
    }
  }

  function loadModel(src) {
    return new Promise((resolve, reject) => {
      loader.load(src, (gltf) => resolve(gltf.scene), undefined, reject)
    })
  }

  // Normaliza um GLB para escala humana e assenta os PÉS no y=0, centrado em
  // x/z — assim, ao posicionar o pivô no plano, o modelo fica em pé sobre o
  // chão (e não com a origem/centro no chão, meio corpo enterrado).
  function groundModel(model, targetHeight) {
    model.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const scale = targetHeight / (size.y || 1)
    model.scale.setScalar(scale)

    // Recalcula a caixa já escalada e desloca para pés no chão, centrado.
    model.updateMatrixWorld(true)
    box.setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    model.position.x -= center.x
    model.position.z -= center.z
    model.position.y -= box.min.y

    model.traverse((o) => {
      if (o.isMesh) o.castShadow = true
    })
    return model
  }

  // Envolve o modelo aterrado num pivô, para separar o ajuste de "pés no chão"
  // do posicionamento do lutador na arena (posição/rotação ficam no pivô).
  function makeFighter(model) {
    const pivot = new THREE.Group()
    pivot.add(groundModel(model, FIGHTER_HEIGHT))
    return pivot
  }

  // Monta o grupo dos dois lutadores frente a frente, ainda invisível
  // (só aparece depois que o jogador ancora no plano).
  async function buildFighters(enemySrc, playerSrc) {
    const [enemyModel, playerModel] = await Promise.all([
      loadModel(enemySrc),
      loadModel(playerSrc),
    ])

    const player = makeFighter(playerModel)
    const enemy = makeFighter(enemyModel)
    player.position.set(0, 0, ARENA_GAP / 2)
    enemy.position.set(0, 0, -ARENA_GAP / 2)
    enemy.rotation.y = Math.PI // espelha: fica de frente para o jogador

    const group = new THREE.Group()
    group.add(player, enemy)

    // Sombra de contato: um plano no y=0 que só recebe as sombras dos modelos,
    // amarrando os dois lutadores ao chão detectado.
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4).rotateX(-Math.PI / 2),
      new THREE.ShadowMaterial({ opacity: 0.3 }),
    )
    shadow.receiveShadow = true
    group.add(shadow)

    group.visible = false
    return group
  }

  function buildScene() {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera() // pose é controlada pelo XR

    scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.0))
    const dir = new THREE.DirectionalLight(0xffffff, 1.5)
    dir.position.set(1.5, 4, 2)
    dir.castShadow = true
    dir.shadow.mapSize.set(1024, 1024)
    dir.shadow.camera.near = 0.1
    dir.shadow.camera.far = 20
    dir.shadow.camera.left = -3
    dir.shadow.camera.right = 3
    dir.shadow.camera.top = 3
    dir.shadow.camera.bottom = -3
    scene.add(dir)

    // Reticle: anel + miolo no chão marcando onde a arena vai surgir. Fica
    // deitado (rotateX) para acompanhar o plano horizontal detectado.
    reticle = new THREE.Group()
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.15, 40).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffd166 }),
    )
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.03, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffd166 }),
    )
    reticle.add(ring, dot)
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    scene.add(reticle)
  }

  // Entre os hits do frame, escolhe o primeiro que seja realmente chão
  // (normal apontando para cima). Retorna o array da matriz ou null.
  function pickFloorHit(results) {
    for (const result of results) {
      const pose = result.getPose(localSpace)
      if (!pose) continue
      const m = pose.transform.matrix
      // Coluna Y da matriz (m[4],m[5],m[6]) = normal da superfície detectada.
      tmpNormal.set(m[4], m[5], m[6])
      if (tmpNormal.dot(WORLD_UP) >= FLOOR_NORMAL_MIN) return m
    }
    return null
  }

  // Toque na tela: ancora os lutadores na posição do reticle (uma vez só).
  // Mantém em pé usando só o yaw do plano — se o piso vier levemente
  // inclinado, os modelos não tombam.
  function onSelect() {
    if (placed || !reticle.visible || !fighters) return
    fighters.position.setFromMatrixPosition(reticle.matrix)
    tmpEuler.setFromRotationMatrix(reticle.matrix)
    fighters.rotation.set(0, tmpEuler.y, 0)
    fighters.visible = true
    reticle.visible = false
    placed = true
    hint.value = 'Ande ao redor da arena'
  }

  function onXRFrame(_time, frame) {
    if (frame && !placed && hitTestSource) {
      const results = frame.getHitTestResults(hitTestSource)
      const floor = pickFloorHit(results)
      if (floor) {
        reticle.visible = true
        reticle.matrix.fromArray(floor)
        hint.value = 'Toque para posicionar a arena'
      } else {
        reticle.visible = false
        hint.value = results.length
          ? 'Aponte para uma superfície plana no chão'
          : 'Mova o aparelho devagar para achar o chão'
      }
    }
    renderer.render(scene, camera)
  }

  async function enterAR({ enemySrc, playerSrc, overlay } = {}) {
    arError.value = null
    const supported = arSupport.value === 'supported' || (await checkSupport())
    if (!supported) {
      arError.value = 'Este dispositivo não suporta AR (WebXR).'
      return false
    }

    try {
      // O compositor XR desenha neste canvas próprio (não precisa ir ao DOM).
      const canvas = document.createElement('canvas')
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.xr.enabled = true

      buildScene()
      fighters = await buildFighters(enemySrc, playerSrc)
      scene.add(fighters)
      placed = false

      const init = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['local-floor'],
      }
      if (overlay) {
        init.optionalFeatures.push('dom-overlay')
        init.domOverlay = { root: overlay }
      }

      session = await navigator.xr.requestSession('immersive-ar', init)
      session.addEventListener('select', onSelect)
      session.addEventListener('end', onSessionEnd)

      // Prefere o chão real (local-floor: y=0 no piso). Cai para 'local' onde
      // não houver suporte. O MESMO tipo vai para o renderer e para o espaço de
      // pose do hit-test, senão os modelos flutuariam/afundariam.
      let refSpaceType = 'local'
      try {
        localSpace = await session.requestReferenceSpace('local-floor')
        refSpaceType = 'local-floor'
      } catch {
        localSpace = await session.requestReferenceSpace('local')
      }
      renderer.xr.setReferenceSpaceType(refSpaceType)
      await renderer.xr.setSession(session)

      viewerSpace = await session.requestReferenceSpace('viewer')
      hitTestSource = await session.requestHitTestSource({ space: viewerSpace })

      hint.value = 'Aponte para o chão e toque para posicionar'
      arActive.value = true
      renderer.setAnimationLoop(onXRFrame)
      return true
    } catch (e) {
      arError.value = e?.message ?? 'Não foi possível iniciar o AR.'
      cleanup()
      return false
    }
  }

  function onSessionEnd() {
    cleanup()
  }

  async function exitAR() {
    try {
      await session?.end()
    } catch {
      // encerrar duas vezes ou sessão já morta: ignora
    }
  }

  function cleanup() {
    renderer?.setAnimationLoop(null)
    hitTestSource?.cancel?.()
    hitTestSource = null
    if (session) {
      session.removeEventListener('select', onSelect)
      session.removeEventListener('end', onSessionEnd)
      session = null
    }
    renderer?.dispose?.()
    renderer = null
    scene = null
    camera = null
    reticle = null
    fighters = null
    localSpace = null
    viewerSpace = null
    placed = false
    arActive.value = false
  }

  return { arSupport, arActive, arError, hint, checkSupport, enterAR, exitAR }
}
