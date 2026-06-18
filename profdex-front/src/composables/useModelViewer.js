import { ref, onMounted, onUnmounted } from 'vue'

export function useModelViewer(config) {
    const arStatus = ref('checking') // 'idle' | 'ar-active' | 'not-supported' | 'checking'
    const isLoading = ref(true)
    const activeHotspot = ref(null)
    const viewerRef = ref(null)

    // Detecta se o dispositivo suporta AR
    async function checkARSupport() {
        // iOS: Quick Look funciona no Safari iOS 12+ sem checar WebXR
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        if (isIOS) {
            arStatus.value = 'idle'
            return
        }

        // Android: checa suporte WebXR
        if ('xr' in navigator) {
            try {
                const supported = await navigator.xr.isSessionSupported('immersive-ar')
                arStatus.value = supported ? 'idle' : 'not-supported'
            } catch {
                arStatus.value = 'not-supported'
            }
        } else {
            arStatus.value = 'not-supported'
        }
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
    }

    function onARStatusChange(event) {
        const status = event?.detail?.status
        if (status === 'session-started') {
            arStatus.value = 'ar-active'
        } else if (status === 'not-presenting') {
            arStatus.value = 'idle'
        }
    }

    onMounted(() => {
        checkARSupport()

        const el = viewerRef.value
        if (!el) return
        el.addEventListener('load', onLoad)
        el.addEventListener('ar-status', onARStatusChange)
    })

    onUnmounted(() => {
        const el = viewerRef.value
        if (!el) return
        el.removeEventListener('load', onLoad)
        el.removeEventListener('ar-status', onARStatusChange)
    })

    return {
        viewerRef,
        arStatus,
        isLoading,
        activeHotspot,
        openHotspot,
        closeHotspot,
        config,
    }
}