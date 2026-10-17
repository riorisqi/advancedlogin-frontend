import { useCallback, useEffect, useState } from 'react'
import type { LoginRequest } from '@/domain/qr/loginRequest'
import { useDependencies } from '../dependencies'
import { QrConflictError, QrNotFoundError } from './errors'

export type QrApprovalFailure = 'expired' | 'conflict' | 'unknown'

export type QrApprovalState =
  | { kind: 'loading' }
  | { kind: 'ready'; request: LoginRequest; busy: boolean }
  | { kind: 'approved' }
  | { kind: 'rejected' }
  | { kind: 'failed'; reason: QrApprovalFailure; message: string }

/** Scanning is idempotent on the backend, so StrictMode's double mount in dev is harmless. */
export function useQrApproval(qrId: string) {
  const { qrApprovalGateway } = useDependencies()
  const [state, setState] = useState<QrApprovalState>({ kind: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    qrApprovalGateway
      .scan(qrId, controller.signal)
      .then((request) => setState({ kind: 'ready', request, busy: false }))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setState(toFailure(err))
      })
    return () => controller.abort()
  }, [qrApprovalGateway, qrId])

  const decide = useCallback(
    async (decision: 'approve' | 'reject') => {
      setState((prev) => (prev.kind === 'ready' ? { ...prev, busy: true } : prev))
      try {
        if (decision === 'approve') {
          await qrApprovalGateway.approve(qrId)
          setState({ kind: 'approved' })
        } else {
          await qrApprovalGateway.reject(qrId)
          setState({ kind: 'rejected' })
        }
      } catch (err) {
        setState(toFailure(err))
      }
    },
    [qrApprovalGateway, qrId],
  )

  const approve = useCallback(() => decide('approve'), [decide])
  const reject = useCallback(() => decide('reject'), [decide])

  return { state, approve, reject }
}

function toFailure(err: unknown): QrApprovalState {
  if (err instanceof QrNotFoundError) return { kind: 'failed', reason: 'expired', message: err.message }
  if (err instanceof QrConflictError) return { kind: 'failed', reason: 'conflict', message: err.message }
  return { kind: 'failed', reason: 'unknown', message: 'Something went wrong. Please try again.' }
}
