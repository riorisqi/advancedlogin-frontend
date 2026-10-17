import { useEffect, useState, type RefObject } from 'react'
import { parseApproveLink, type ApproveLinkResult } from '@/domain/qr/approveLink'
import { useDependencies } from '../dependencies'
import { CameraUnavailableError, type CameraProblem } from './errors'

export type QrScannerState =
  | { kind: 'starting' }
  | { kind: 'scanning'; lastRejected?: Exclude<ApproveLinkResult, { kind: 'ok' }> }
  | { kind: 'found'; qrId: string }
  | { kind: 'error'; problem: CameraProblem }

/** @param expectedOrigin our own origin; links to anywhere else are refused */
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
        stop?.() // release the camera right away
        setState({ kind: 'found', qrId: result.qrId })
      } else {
        setState({ kind: 'scanning', lastRejected: result })
      }
    }

    // queueMicrotask: under StrictMode (dev) the cancelled first run never touches the camera,
    // instead of racing the second run for the same <video>.
    queueMicrotask(() => {
      if (cancelled) return
      qrCodeScanner
        .start(video, (text) => !cancelled && handleText(text))
        .then((stopCamera) => {
          // Unmounted while starting (e.g. Cancel tapped): stop now, or the camera light stays on.
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
