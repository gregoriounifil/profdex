import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Observa `canActivateAR` até ele estabilizar.
 *
 * A escolha do modo de AR no model-viewer é assíncrona: ele sonda o WebXR antes
 * de cair para scene-viewer/quick-look. No iOS esse caminho é o mais longo (o
 * WebXR falha primeiro), então logo após o evento `load` a propriedade ainda é
 * `false` e uma leitura única marcaria o aparelho como sem AR por engano.
 * Reconsulta algumas vezes e para no primeiro `true`.
 */
export function pollARSupport(getElement, apply, tries = 10, intervalMs = 150) {
    let remaining = tries
    let timer = null

    const tick = () => {
        timer = null
        const el = getElement()
        if (!el) return
        const supported = Boolean(el.canActivateAR)
        apply(supported)
        if (!supported && --remaining > 0) timer = setTimeout(tick, intervalMs)
    }

    tick()
    return () => {
        remaining = 0
        if (timer) clearTimeout(timer)
    }
}

export function useModelViewer(config) {
    const arStatus = ref('checking') // 'idle' | 'ar-active' | 'not-supported' | 'checking'
    const isLoading = ref(true)
    const loadProgress = ref(0)
    const errorMessage = ref('')
    const activeHotspot = ref(null)
    const viewerRef = ref(null)

    // Cancela a sondagem anterior antes de começar outra (evita dois timers).
    let stopPolling = null

    // O model-viewer considera WebXR, Scene Viewer e Quick Look.
    // Checar apenas navigator.xr desabilita AR por engano em vários Androids.
    function updateARSupport() {
        stopPolling?.()
        stopPolling = pollARSupport(
            () => viewerRef.value,
            (supported) => {
                arStatus.value = supported ? 'idle' : 'not-supported'
            },
        )
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
        stopPolling?.()
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
