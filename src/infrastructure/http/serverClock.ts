/**
 * Converting server timestamps to this browser's clock.
 *
 * The user's PC clock may be minutes off from the server's. So instead of trusting the absolute
 * time, take the *remaining lifetime* (deadline − server's "now") and add it to the local clock.
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
