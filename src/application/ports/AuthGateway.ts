import type { User } from '@/domain/user/user'

export interface AuthGateway {
  /** The logged-in user, or null when there is no valid session. */
  currentUser(signal?: AbortSignal): Promise<User | null>

  /** @throws InvalidCredentialsError when username/password are wrong */
  login(username: string, password: string): Promise<User>

  logout(): Promise<void>
}
