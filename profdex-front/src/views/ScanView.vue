<script setup>
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useProfessorsStore } from '../stores/professors'

const router = useRouter()
const store = useProfessorsStore()

const videoRef = useTemplateRef('qrVideo')
const canvasRef = useTemplateRef('qrCanvas')

const loading = ref(true)
const error = ref(null)
const foundProfessor = ref(null)
const discovering = ref(false)
const capturing = ref(false)
const captured = ref(false)
const avatarError = ref(false)
const captureAvatarError = ref(false)

let stream = null
let animFrame = null
let detector = null
let lastScannedData = null
let lastScannedAt = 0

// ── Carrega jsQR do CDN como fallback ─────────────────────────────────────
function loadJsQR() {
  return new Promise((resolve, reject) => {
    if (window.jsQR) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
    s.onload = resolve
    s.onerror = () => reject(new Error('Falha ao carregar jsQR'))
    document.head.appendChild(s)
  })
}

// ── Detecta se o dado do QR é um token de captura ─────────────────────────
// Aceita: "capture:TOKEN" ou URL com path /capture/TOKEN
function extractCaptureToken(data) {
  if (!data) return null

  // Formato direto: "capture:TOKEN"
  const direct = data.trim().match(/^capture:(.+)$/i)
  if (direct) return direct[1].trim()

  // Formato URL: qualquer URL com /capture/TOKEN no path
  try {
    const url = new URL(data)
    const match = url.pathname.match(/\/capture\/(.+)/)
    if (match) return match[1]
  } catch { /* não é URL */ }

  return null
}

// ── Extrai slug de professor do dado do QR ─────────────────────────────────
// Aceita: URL com /professor/slug, /slug, ou slug direto
function extractSlug(data) {
  if (!data) return null
  const lower = data.trim().toLowerCase()

  try {
    const url = new URL(data)
    const segments = url.pathname.split('/').filter(Boolean)
    // Ignora paths de captura
    if (segments[0] === 'capture') return null
    const last = segments[segments.length - 1]?.toLowerCase()
    if (last) return last
  } catch {
    // não é URL válida — testa como slug direto
  }

  return lower.replace(/[^a-z0-9]/g, '') || null
}

// ── Encontra professor pelo slug (ou nome) ─────────────────────────────────
function matchProfessor(rawSlug) {
  if (!rawSlug) return null
  const slug = rawSlug.toLowerCase()
  return store.professors.find(
    (p) => p.slug?.toLowerCase() === slug ||
           p.name?.toLowerCase().replace(/\s+/g, '') === slug
  ) ?? null
}

// ── Processa dado lido pelo scanner ───────────────────────────────────────
async function onQRDetected(data) {
  const now = Date.now()
  // Debounce: ignora o mesmo código por 3 s
  if (data === lastScannedData && now - lastScannedAt < 3000) return
  lastScannedData = data
  lastScannedAt = now

  // ── Caminho 1: token de captura ──────────────────────────────────────────
  const token = extractCaptureToken(data)
  if (token && !capturing.value && !captured.value) {
    capturing.value = true
    captureAvatarError.value = false
    try {
      const result = await store.captureByToken(token)
      foundProfessor.value = result.professor
      captured.value = true
    } catch {
      // token inválido — ignora silenciosamente, não trava o scanner
      lastScannedData = null
    } finally {
      capturing.value = false
    }
    return
  }

  // ── Caminho 2: slug de descoberta ────────────────────────────────────────
  const slug = extractSlug(data)
  const professor = matchProfessor(slug)

  if (!professor) return

  avatarError.value = false
  foundProfessor.value = professor

  if (!professor.discovered && !discovering.value) {
    discovering.value = true
    try {
      await store.discover(professor.id)
      foundProfessor.value = store.professors.find((p) => p.id === professor.id) ?? professor
    } finally {
      discovering.value = false
    }
  }
}

// ── Loop de scanning (BarcodeDetector ou jsQR) ────────────────────────────
function startScanLoop() {
  const video = videoRef.value
  if (!video) return

  const hasBarcodeDetector = 'BarcodeDetector' in window

  if (hasBarcodeDetector) {
    detector = new window.BarcodeDetector({ formats: ['qr_code'] })

    async function loopNative() {
      if (!stream) return
      try {
        const codes = await detector.detect(video)
        if (codes.length > 0) await onQRDetected(codes[0].rawValue)
      } catch { /* ignora erros de frame */ }
      animFrame = requestAnimationFrame(loopNative)
    }
    animFrame = requestAnimationFrame(loopNative)
  } else {
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    function loopJsQR() {
      if (!stream || !video.videoWidth) { animFrame = requestAnimationFrame(loopJsQR); return }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })
      if (code) onQRDetected(code.data)
      animFrame = requestAnimationFrame(loopJsQR)
    }
    animFrame = requestAnimationFrame(loopJsQR)
  }
}

// ── Inicia câmera ─────────────────────────────────────────────────────────
onMounted(async () => {
  if (!store.professors.length) await store.fetch()

  const hasBarcodeDetector = 'BarcodeDetector' in window
  if (!hasBarcodeDetector) {
    try { await loadJsQR() } catch (e) { error.value = e.message; loading.value = false; return }
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    })
    const video = videoRef.value
    video.srcObject = stream
    video.setAttribute('playsinline', '')
    video.setAttribute('muted', '')
    await video.play()
    loading.value = false
    startScanLoop()
  } catch (e) {
    error.value = e.message ?? 'Sem acesso à câmera'
    loading.value = false
  }
})

// ── Limpeza ───────────────────────────────────────────────────────────────
onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
  if (stream) stream.getTracks().forEach((t) => t.stop())
  stream = null
})
</script>

<template>
  <div class="scan-view" :class="{ flash: captured }">
    <!-- Stream da câmera -->
    <video ref="qrVideo" class="scan-video" autoplay playsinline muted />
    <!-- Canvas oculto para jsQR fallback -->
    <canvas ref="qrCanvas" class="scan-canvas-hidden" />

    <!-- Overlay de UI -->
    <div class="scan-ui">
      <div class="scan-topbar">
        <button class="back-btn" @click="router.push({ name: 'profdex' })">← Voltar</button>
        <span class="pixel scan-title">SCANNER</span>
      </div>

      <!-- Carregando câmera -->
      <div v-if="loading" class="scan-center">
        <div class="scan-loader">
          <div class="loader-pokeball">
            <div class="pb-top" /><div class="pb-mid" /><div class="pb-bot" />
          </div>
          <span class="pixel" style="font-size:8px;color:white">Iniciando câmera...</span>
        </div>
      </div>

      <!-- Erro -->
      <div v-else-if="error" class="scan-center">
        <div class="error-card">
          <span style="font-size:32px">😕</span>
          <p class="pixel" style="font-size:10px">{{ error }}</p>
          <button class="btn btn-primary" style="pointer-events:auto" @click="router.push({ name: 'profdex' })">
            <span class="pixel">VOLTAR</span>
          </button>
        </div>
      </div>

      <template v-else>
        <!-- Capturando via token (chamada API em andamento) -->
        <div v-if="capturing" class="scan-center">
          <div class="discovering-card">
            <div class="loader-pokeball discovering-ball">
              <div class="pb-top" /><div class="pb-mid" /><div class="pb-bot" />
            </div>
            <p class="pixel" style="font-size:10px;color:var(--yellow)">CAPTURANDO!</p>
          </div>
        </div>

        <!-- Captura concluída -->
        <div v-else-if="captured && foundProfessor" class="scan-bottom">
          <div class="capture-card animate-fade-in">
            <div class="capture-emoji">🎉</div>
            <p class="pixel" style="font-size:14px;color:var(--yellow);letter-spacing:2px">CAPTURADO!</p>
            <div class="capture-avatar">
              <img
                v-if="!captureAvatarError"
                :src="`/professors/${foundProfessor.slug}-cartoon.png`"
                :alt="foundProfessor.name"
                class="capture-img"
                @error="captureAvatarError = true"
              />
              <div v-else class="capture-fallback">{{ foundProfessor.name[0] }}</div>
            </div>
            <span class="capture-name">Prof. {{ foundProfessor.name }}</span>
            <p style="font-size:12px;color:var(--text-muted);text-align:center;line-height:1.6">
              Adicionado ao seu ProfDex!
            </p>
            <button class="btn btn-primary" style="pointer-events:auto;margin-top:4px" @click="router.push({ name: 'profdex' })">
              <span class="pixel">VER PROFDEX</span>
            </button>
          </div>
        </div>

        <!-- Viewfinder + hint quando nada foi detectado ainda -->
        <div v-else-if="!foundProfessor && !discovering" class="scan-hint">
          <div class="viewfinder">
            <div class="vf-corner vf-tl" /><div class="vf-corner vf-tr" />
            <div class="vf-corner vf-bl" /><div class="vf-corner vf-br" />
            <div class="vf-line" />
          </div>

          <div class="hint-content">
            <div class="hint-icon">📷</div>
            <p class="pixel hint-title">Aponte para o QR code</p>
            <p class="hint-subtitle">Escaneie o QR de descoberta ou o QR de captura do professor.</p>
          </div>
        </div>

        <!-- Descobrindo (chamada API em andamento) -->
        <div v-else-if="discovering" class="scan-center">
          <div class="discovering-card">
            <div class="loader-pokeball discovering-ball">
              <div class="pb-top" /><div class="pb-mid" /><div class="pb-bot" />
            </div>
            <p class="pixel" style="font-size:10px;color:var(--yellow)">DESCOBRINDO!</p>
          </div>
        </div>

        <!-- Professor descoberto (slug QR) -->
        <div v-else-if="foundProfessor" class="scan-bottom">
          <div class="found-card animate-fade-in">
            <div class="found-avatar">
              <img
                v-if="!avatarError"
                :src="`/professors/${foundProfessor.slug}-face.png`"
                :alt="foundProfessor.name"
                class="found-img"
                @error="avatarError = true"
              />
              <div v-else class="found-fallback">{{ foundProfessor.name[0] }}</div>
            </div>
            <div class="found-info">
              <span class="pixel found-label">
                {{ foundProfessor.discovered ? 'JÁ DESCOBERTO' : 'DESCOBERTO!' }}
              </span>
              <span class="found-name">Prof. {{ foundProfessor.name }}</span>
              <span class="found-hint">
                Peça o QR de captura ao professor para adicioná-lo ao ProfDex!
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.scan-view {
  position: fixed;
  inset: 0;
  background: black;
}

.scan-view.flash {
  animation: captureFlash 0.8s ease forwards;
}

.scan-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-canvas-hidden { display: none; }

.scan-ui {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  z-index: 10;
}

/* ── Topbar ── */
.scan-topbar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 20px 16px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.75), transparent);
  pointer-events: auto;
  position: relative;
  flex-shrink: 0;
}
.back-btn {
  position: absolute;
  left: 20px;
  color: white;
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 13px;
  pointer-events: auto;
}
.scan-title { font-size: 12px; color: white; }

/* ── Centro ── */
.scan-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.scan-loader, .discovering-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.loader-pokeball {
  width: 60px; height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255,255,255,0.3);
  animation: spin 1s linear infinite;
}
.discovering-ball {
  width: 72px; height: 72px;
  animation-duration: 0.5s;
  border-color: var(--yellow);
}
.pb-top  { height: 50%; background: var(--red); }
.pb-mid  { height: 8px; background: #222; }
.pb-bot  { height: calc(50% - 8px); background: white; }
.error-card {
  background: rgba(0,0,0,0.88);
  border: 1px solid var(--red);
  border-radius: var(--radius-lg);
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  pointer-events: auto;
  width: 100%;
}

/* ── Viewfinder ── */
.scan-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 32px;
}
.viewfinder {
  position: relative;
  width: 220px; height: 220px;
  margin-top: 20px;
}
.vf-corner {
  position: absolute;
  width: 28px; height: 28px;
  border-color: var(--yellow);
  border-style: solid;
  border-width: 0;
}
.vf-tl { top: 0; left: 0;   border-top-width: 3px; border-left-width: 3px; }
.vf-tr { top: 0; right: 0;  border-top-width: 3px; border-right-width: 3px; }
.vf-bl { bottom: 0; left: 0;  border-bottom-width: 3px; border-left-width: 3px; }
.vf-br { bottom: 0; right: 0; border-bottom-width: 3px; border-right-width: 3px; }
.vf-line {
  position: absolute;
  top: 50%; left: 4px; right: 4px;
  height: 2px;
  background: var(--yellow);
  opacity: 0.7;
  animation: scan-line 2s ease-in-out infinite;
}
@keyframes scan-line {
  0%, 100% { top: 10%; opacity: 0.4; }
  50%       { top: 88%; opacity: 1; }
}
.hint-content {
  background: rgba(8,8,24,0.92);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.hint-icon   { font-size: 24px; }
.hint-title  { font-size: 9px; color: var(--yellow); text-align: center; }
.hint-subtitle { font-size: 13px; color: var(--text-muted); text-align: center; line-height: 1.6; }

/* ── Descoberto (slug QR) ── */
.scan-bottom {
  flex: 1;
  display: flex;
  align-items: flex-end;
  padding: 0 16px 32px;
  pointer-events: auto;
}
.found-card {
  background: rgba(8,8,24,0.95);
  border: 2px solid var(--yellow);
  border-radius: var(--radius-lg);
  padding: 20px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 0 32px rgba(255,222,0,0.25);
}
.found-avatar { flex-shrink: 0; width: 64px; height: 64px; }
.found-img {
  width: 64px; height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--yellow);
}
.found-fallback {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: var(--red);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 900; color: white;
  border: 2px solid var(--yellow);
}
.found-info    { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.found-label   { font-size: 7px; color: var(--yellow); }
.found-name    { font-size: 18px; font-weight: 800; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.found-hint    { font-size: 12px; color: var(--text-muted); line-height: 1.5; }

/* ── Capturado (token QR) ── */
.capture-card {
  background: rgba(8,8,24,0.97);
  border: 2px solid var(--yellow);
  border-radius: var(--radius-lg);
  padding: 28px 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 0 48px rgba(255,222,0,0.35);
}
.capture-emoji { font-size: 48px; animation: pulse 1s ease-in-out infinite; }
.capture-avatar { width: 96px; height: 96px; }
.capture-img {
  width: 96px; height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--yellow);
  box-shadow: 0 0 24px rgba(255,222,0,0.4);
  animation: pulse 1s ease-in-out infinite;
}
.capture-fallback {
  width: 96px; height: 96px;
  border-radius: 50%;
  background: var(--red);
  display: flex; align-items: center; justify-content: center;
  font-size: 42px; font-weight: 900; color: white;
  border: 3px solid var(--yellow);
  animation: pulse 1s ease-in-out infinite;
}
.capture-name { font-size: 22px; font-weight: 800; color: white; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes captureFlash {
  0%   { filter: brightness(1); }
  15%  { filter: brightness(3); }
  100% { filter: brightness(1); }
}
</style>
