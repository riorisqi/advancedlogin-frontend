export class TooManyAttemptsError extends Error {
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super(`Too many sign-in attempts. Try again in ${retryAfterSeconds} seconds.`)
    this.name = 'TooManyAttemptsError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid username or password')
    this.name = 'InvalidCredentialsError'
  }
}
