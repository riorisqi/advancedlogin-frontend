import { useEffect, useState, type RefObject } from 'react'
import { parseApproveLink, type ApproveLinkResult } from '@/domain/qr/approveLink'
import { useDependencies } from '../dependencies'
import { CameraUnavailableError, type CameraProblem } from './errors'

export type QrScannerState =
  | { kind: 'starting' }
  | { kind: 'scanning'; lastRejected?: Exclude<ApproveLinkResult, { kind: 'ok' }> }
  | { kind: 'found'; qrId: string }
  | { kind: 'error'; problem: CameraProblem }

/**
 * Phone-side use case: point the camera at the desktop until one of *our* approve links is seen.
 *
 * @param videoRef     where the camera preview is shown (owned by the page)
 * @param expectedOrigin our own origin; links to anywhere else are refused (see parseApproveLink)
 */
export function useQrScanner(videoRef: RefObject<HTMLVideoElement | null>, expectedOrigin: string): QrScannerState {
  const { qrCodeScanner } = useDependencies()
  const [state, setState] = useState<QrScannerState>({ kind: 'starting' })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let cancelled = false
    let stop: (() => void) | undefined

    const handleText = (text: string) => {
      const result = parseApproveLink(text, expectedOrigin)
      if (result.kind === 'ok') {
        stop?.() // got it: release the camera right away
        setState({ kind: 'found', qrId: result.qrId })
      } else {
        // Keep scanning, but tell the user why this code didn't work.
        setState({ kind: 'scanning', lastRejected: result })
      }
    }

    // queueMicrotask: React StrictMode (dev) runs effect → cleanup → effect synchronously. The
    // first, cancelled run then never touches the camera, instead of starting it and racing the
    // second run for the same <video> element.
    queueMicrotask(() => {
      if (cancelled) return
      qrCodeScanner
        .start(video, (text) => !cancelled && handleText(text))
        .then((stopCamera) => {
          // Unmounted while the camera was starting (e.g. user tapped Cancel): stop it at once,
          // or the camera light would stay on.
          if (cancelled) stopCamera()
          else {
            stop = stopCamera
            setState((prev) => (prev.kind === 'starting' ? { kind: 'scanning' } : prev))
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setState({ kind: 'error', problem: err instanceof CameraUnavailableError ? err.problem : 'unknown' })
          }
        })
    })

    return () => {
      cancelled = true
      stop?.()
    }
  }, [qrCodeScanner, videoRef, expectedOrigin])

  return state
}
