import { InvalidCredentialsError, TooManyAttemptsError } from '@/application/auth/errors'
import type { AuthGateway } from '@/application/ports/AuthGateway'
import type { User } from '@/domain/user/user'
import { HttpError, send } from '../http/httpClient'

// Wire format of UserResponse (AuthController on the backend).
type UserDto = {
  id: string
  username: string
  displayName: string
}

export function createHttpAuthGateway(): AuthGateway {
  return {
    async currentUser(signal) {
      const res = await send('GET', '/api/me', { signal })
      if (res.status === 401) return null
      if (!res.ok) throw HttpError.from(res)
      return toDomain(await res.json())
    },

    async login(username, password) {
      const res = await send('POST', '/api/auth/login', { body: { username, password } })
      if (res.status === 401 || res.status === 400) throw new InvalidCredentialsError()
      if (res.status === 429) throw new TooManyAttemptsError(HttpError.from(res).retryAfterSeconds ?? 60)
      if (!res.ok) throw HttpError.from(res)
      return toDomain(await res.json())
    },

    async logout() {
      const res = await send('POST', '/api/auth/logout')
      if (!res.ok) throw HttpError.from(res)
    },
  }
}

function toDomain(dto: UserDto): User {
  return { id: dto.id, username: dto.username, displayName: dto.displayName }
}
