/**
 * The user's clock may be minutes off, so a server deadline becomes "remaining lifetime
 * (deadline − server's now) added to the local clock".
 */
export function toLocalClock(serverIso: string, serverNowMs: number): Date {
  const remainingMs = new Date(serverIso).getTime() - serverNowMs
  return new Date(Date.now() + remainingMs)
}

/** For fetch responses: the server's "now" is the `Date` response header. */
export function toLocalClockFromResponse(serverIso: string, res: Response): Date {
  const dateHeader = res.headers.get('Date')
  return toLocalClock(serverIso, dateHeader ? new Date(dateHeader).getTime() : Date.now())
}
