import { ref, onMounted, onUnmounted } from 'vue'

export function useModelViewer(config) {
    const arStatus = ref('checking') // 'idle' | 'ar-active' | 'not-supported' | 'checking'
    const isLoading = ref(true)
    const loadProgress = ref(0)
    const errorMessage = ref('')
    const activeHotspot = ref(null)
    const viewerRef = ref(null)

    // O model-viewer considera WebXR, Scene Viewer e Quick Look.
    // Checar apenas navigator.xr desabilita AR por engano em vários Androids.
    function updateARSupport() {
        const el = viewerRef.value
        arStatus.value = el?.canActivateAR ? 'idle' : 'not-supported'
    }

    // Abre/fecha o tooltip do hotspot clicado
    function openHotspot(id) {
        activeHotspot.value = activeHotspot.value === id ? null : id
    }

    function closeHotspot() {
        activeHotspot.value = null
    }

    // Callbacks dos eventos do model-viewer
    function onLoad() {
        isLoading.value = false
        loadProgress.value = 1
        errorMessage.value = ''

        // A capacidade de AR só fica confiável depois que o modelo carregou.
        requestAnimationFrame(updateARSupport)
    }

    function onProgress(event) {
        const progress = Number(event?.detail?.totalProgress)
        if (Number.isFinite(progress)) loadProgress.value = progress
    }

    function onError() {
        isLoading.value = false
        arStatus.value = 'not-supported'
        errorMessage.value = 'Não foi possível carregar o modelo 3D.'
    }

    function onARStatusChange(event) {
        const status = event?.detail?.status
        if (status === 'session-started') {
            arStatus.value = 'ar-active'
        } else if (status === 'not-presenting') {
            updateARSupport()
        } else if (status === 'failed') {
            updateARSupport()
            errorMessage.value = 'Não foi possível abrir a câmera em realidade aumentada.'
        }
    }

    onMounted(() => {
        const el = viewerRef.value
        if (!el) return
        el.addEventListener('load', onLoad)
        el.addEventListener('progress', onProgress)
        el.addEventListener('error', onError)
        el.addEventListener('ar-status', onARStatusChange)
    })

    onUnmounted(() => {
        const el = viewerRef.value
        if (!el) return
        el.removeEventListener('load', onLoad)
        el.removeEventListener('progress', onProgress)
        el.removeEventListener('error', onError)
        el.removeEventListener('ar-status', onARStatusChange)
    })

    return {
        viewerRef,
        arStatus,
        isLoading,
        loadProgress,
        errorMessage,
        activeHotspot,
        openHotspot,
        closeHotspot,
        config,
    }
}
