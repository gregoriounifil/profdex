// Abre a câmera traseira PRINCIPAL (1x), e não a ultra-wide (0.5x).
//
// Pedir `facingMode: 'environment'` só diz "quero uma câmera de trás" — em
// aparelho com várias lentes traseiras quem escolhe qual é o navegador, e em
// boa parte deles a escolhida é a ultra-wide. O resultado é o app abrindo em
// 0.5x: enquadramento distorcido e, no scanner, QR pequeno demais para o jsQR
// resolver. Por isso, depois de abrir a câmera padrão, reabrimos na lente certa.
//
// A escolha usa dois sinais, porque os rótulos mudam por plataforma:
//
//  - iOS/Safari usa rótulos descritivos ("Back Camera", "Back Ultra Wide
//    Camera", "Back Dual Wide Camera"). A principal é a que NÃO tem qualificador
//    de lente; as virtuais "Dual"/"Triple" agregam a ultra-wide e podem abrir
//    justamente em 0.5x.
//  - Android/Chrome usa rótulos genéricos ("camera2 0, facing back"). Ali o
//    índice segue a ordem do Android, onde a traseira principal costuma ser a de
//    menor número e as auxiliares (ultra-wide, tele, profundidade) vêm depois.

// Qualificadores que indicam uma lente que não é a principal.
const AUX_LENS = /ultra|wide.?angle|angular|0[.,]5|dual|triple|tele|macro|depth|profundidade|infra|mono/i

const BACK_LENS = /back|rear|traseira|environment/i

// "camera2 0, facing back" → 0. Sem índice no rótulo, vai para o fim da ordem.
function lensIndex(label) {
  const match = label.match(/camera2?\s+(\d+)/i)
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

function pickMainBackCamera(devices) {
  const backs = devices.filter((d) => d.kind === 'videoinput' && BACK_LENS.test(d.label))
  if (!backs.length) return null

  // Sem nenhuma lente "limpa" (caso do Android, onde o rótulo não diz o tipo),
  // continuamos com todas as traseiras e deixamos o índice decidir.
  const primary = backs.filter((d) => !AUX_LENS.test(d.label))
  const pool = primary.length ? primary : backs

  return pool.slice().sort((a, b) => lensIndex(a.label) - lensIndex(b.label))[0]
}

// Alguns aparelhos expõem a traseira como UMA câmera lógica com zoom contínuo
// (0.5x a 10x) em vez de vários dispositivos. Nesses, trocar de deviceId não
// resolve — o que tira do 0.5x é fixar o zoom em 1.
function resetZoomTo1x(stream) {
  const track = stream.getVideoTracks()[0]
  if (!track?.getCapabilities) return // Firefox não implementa

  try {
    const zoom = track.getCapabilities().zoom
    if (!zoom || zoom.min > 1 || zoom.max < 1) return
    track.applyConstraints({ advanced: [{ zoom: 1 }] }).catch(() => {})
  } catch {
    // Capability de zoom é opcional: se não der, fica o zoom padrão.
  }
}

/**
 * Abre a câmera traseira principal.
 *
 * @param {MediaTrackConstraints} videoConstraints Restrições extras de vídeo
 *   (resolução etc.) aplicadas nas duas tentativas de abertura.
 * @returns {Promise<MediaStream>}
 */
export async function openBackCamera(videoConstraints = {}) {
  // A primeira abertura serve para dois fins: garantir a permissão (sem ela
  // `enumerateDevices` devolve rótulos vazios e não dá para identificar a lente)
  // e ter um stream utilizável caso a seleção fina não funcione.
  let stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, ...videoConstraints },
    audio: false,
  })

  try {
    const wanted = pickMainBackCamera(await navigator.mediaDevices.enumerateDevices())
    const current = stream.getVideoTracks()[0]?.getSettings?.().deviceId

    if (wanted?.deviceId && wanted.deviceId !== current) {
      const better = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: wanted.deviceId }, ...videoConstraints },
        audio: false,
      })
      stream.getTracks().forEach((t) => t.stop())
      stream = better
    }
  } catch {
    // Se a lente escolhida recusar as restrições (OverconstrainedError) ou o
    // navegador não deixar enumerar, seguimos com o stream que já funciona.
  }

  resetZoomTo1x(stream)

  // Em dev, registra a lente que acabou valendo. Se ainda abrir em 0.5x, esse
  // rótulo é o que diz qual regra acima precisa de ajuste para o aparelho.
  if (import.meta.env.DEV) {
    console.info('[camera]', stream.getVideoTracks()[0]?.label || '(sem rótulo)')
  }

  return stream
}
