export class QrNotFoundError extends Error {
  constructor() {
    super('This QR code has expired or is invalid')
    this.name = 'QrNotFoundError'
  }
}

export class QrConflictError extends Error {
  constructor(message = 'This QR code is already being used by another account') {
    super(message)
    this.name = 'QrConflictError'
  }
}

export type CameraProblem = 'insecure-context' | 'permission-denied' | 'no-camera' | 'unsupported' | 'unknown'

export class CameraUnavailableError extends Error {
  readonly problem: CameraProblem

  constructor(problem: CameraProblem) {
    super(`Camera unavailable: ${problem}`)
    this.name = 'CameraUnavailableError'
    this.problem = problem
  }
}
