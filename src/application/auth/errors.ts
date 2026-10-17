/** Too many sign-in attempts for this account or from this network (HTTP 429). */
export class TooManyAttemptsError extends Error {
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super(`Too many sign-in attempts. Try again in ${retryAfterSeconds} seconds.`)
    this.name = 'TooManyAttemptsError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

// Application-level error: the UI can show "wrong username or password" without knowing
// that the backend signalled it with HTTP 401.
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid username or password')
    this.name = 'InvalidCredentialsError'
  }
}
