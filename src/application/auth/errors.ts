// Application-level error: the UI can show "wrong username or password" without knowing
// that the backend signalled it with HTTP 401.
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid username or password')
    this.name = 'InvalidCredentialsError'
  }
}
