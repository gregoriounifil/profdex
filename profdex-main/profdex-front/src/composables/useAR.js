import { onUnmounted, ref } from 'vue'

let scriptLoaded = false

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.crossOrigin = 'anonymous'
    script.onload = resolve
    script.onerror = () => reject(new Error(`Falha ao carregar: ${src}`))
    document.head.appendChild(script)
  })
}

async function loadMindAR() {
  if (scriptLoaded) return
  await loadScript('https://cdn.jsdelivr.net/npm/three@0.140.0/build/three.min.js')
  await loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.1.5/dist/mindar-image-three.prod.js')
  scriptLoaded = true
}

export function useAR(containerRef, mindFile, maxTrack = 2) {
  const loading = ref(true)
  const error = ref(null)
  let mindarInstance = null
  let animating = false

  async function start() {
    loading.value = true
    error.value = null

    try {
      await loadMindAR()

      const { MindARThree } = window.MINDAR.IMAGE

      mindarInstance = new MindARThree({
        container: containerRef.value,
        imageTargetSrc: mindFile,
        maxTrack,
        uiLoading: 'no',
        uiError: 'no',
        uiScanning: 'no',
      })

      const { renderer, scene, camera } = mindarInstance

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      const ambient = new window.THREE.AmbientLight(0xffffff, 0.8)
      scene.add(ambient)
      const dirLight = new window.THREE.DirectionalLight(0xffffff, 1)
      dirLight.position.set(0, 1, 1)
      scene.add(dirLight)

      await mindarInstance.start()

      animating = true
      renderer.setAnimationLoop(() => {
        if (animating) renderer.render(scene, camera)
      })

      loading.value = false
      return mindarInstance
    } catch (err) {
      error.value = err.message ?? 'Erro ao iniciar câmera AR'
      loading.value = false
      throw err
    }
  }

  function addAnchor(targetIndex) {
    if (!mindarInstance) throw new Error('AR não iniciado')
    return mindarInstance.addAnchor(targetIndex)
  }

  function getScene() {
    return mindarInstance?.renderer ? {
      renderer: mindarInstance.renderer,
      scene: mindarInstance.scene ?? mindarInstance._scene,
      camera: mindarInstance.camera ?? mindarInstance._camera,
    } : null
  }

  async function stop() {
    animating = false
    if (mindarInstance) {
      try {
        mindarInstance.renderer.setAnimationLoop(null)
        await mindarInstance.stop()
      } catch {
        // ignore cleanup errors
      }
      mindarInstance = null
    }
  }

  onUnmounted(stop)

  return { loading, error, start, stop, addAnchor, getScene }
}
