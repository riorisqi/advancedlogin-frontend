import type { QrCodeScanner } from '@/application/ports/QrCodeScanner'
import { CameraUnavailableError } from '@/application/qr/errors'

// ~5 frames/s feels instant and keeps phones cool.
const SCAN_INTERVAL_MS = 200

/**
 * Only Chromium ships BarcodeDetector natively, so the `barcode-detector` ponyfill (ZXing as
 * WebAssembly) provides it everywhere. Loaded lazily: users who never scan don't download it.
 */
export function createCameraQrCodeScanner(): QrCodeScanner {
  return {
    async start(video, onText) {
      // Browsers only expose the camera to secure contexts (https:// or http://localhost).
      if (!window.isSecureContext) throw new CameraUnavailableError('insecure-context')
      if (!navigator.mediaDevices?.getUserMedia) throw new CameraUnavailableError('unsupported')

      const stream = await openCamera()
      try {
        video.srcObject = stream
        video.muted = true
        video.playsInline = true // iOS: play inline instead of going fullscreen
        await video.play()

        const detector = await createDetector()
        let stopped = false
        let timer: ReturnType<typeof setTimeout> | undefined

        // setTimeout chain: never decode a new frame while the previous one is still running.
        const tick = async () => {
          if (stopped) return
          try {
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              for (const code of await detector.detect(video)) {
                if (!stopped && code.rawValue) onText(code.rawValue)
              }
            }
          } catch {
            // Undecodable frames (e.g. mid-resize) aren't errors.
          }
          if (!stopped) timer = setTimeout(tick, SCAN_INTERVAL_MS)
        }
        void tick()

        return () => {
          stopped = true
          clearTimeout(timer)
          stopCamera(stream, video)
        }
      } catch (err) {
        stopCamera(stream, video)
        throw err instanceof CameraUnavailableError ? err : new CameraUnavailableError('unknown')
      }
    },
  }
}

async function openCamera(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      // "ideal": prefer the back camera on phones, but accept a laptop's only (front) camera.
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
  } catch (err) {
    const name = err instanceof DOMException ? err.name : ''
    if (name === 'NotAllowedError' || name === 'SecurityError') throw new CameraUnavailableError('permission-denied')
    if (name === 'NotFoundError' || name === 'OverconstrainedError') throw new CameraUnavailableError('no-camera')
    throw new CameraUnavailableError('unknown')
  }
}

async function createDetector() {
  const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
    import('barcode-detector/ponyfill'),
    // Serve the .wasm from our build instead of the library's default CDN (offline LAN, no third party).
    import('zxing-wasm/reader/zxing_reader.wasm?url'),
  ])
  prepareZXingModule({
    overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) },
  })
  return new BarcodeDetector({ formats: ['qr_code'] })
}

function stopCamera(stream: MediaStream, video: HTMLVideoElement) {
  stream.getTracks().forEach((track) => track.stop()) // turns the camera light off
  // Only detach our own stream: another start() may already be using this <video>.
  if (video.srcObject === stream) video.srcObject = null
}
