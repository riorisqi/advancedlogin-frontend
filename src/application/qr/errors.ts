/** The QR session is unknown or has expired (HTTP 404). */
export class QrNotFoundError extends Error {
  constructor() {
    super('This QR code has expired or is invalid')
    this.name = 'QrNotFoundError'
  }
}

/** The move isn't allowed now, e.g. another account already scanned it (HTTP 409). */
export class QrConflictError extends Error {
  constructor(message = 'This QR code is already being used by another account') {
    super(message)
    this.name = 'QrConflictError'
  }
}

export type CameraProblem = 'insecure-context' | 'permission-denied' | 'no-camera' | 'unsupported' | 'unknown'

/** The camera can't be used; `problem` says why, so the UI can give the right advice. */
export class CameraUnavailableError extends Error {
  readonly problem: CameraProblem

  constructor(problem: CameraProblem) {
    super(`Camera unavailable: ${problem}`)
    this.name = 'CameraUnavailableError'
    this.problem = problem
  }
}
