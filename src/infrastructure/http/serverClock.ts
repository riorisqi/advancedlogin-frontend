/**
 * Converts a server timestamp to this browser's clock.
 *
 * The user's PC clock may be minutes off from the server's. So instead of trusting the absolute
 * time, take the *remaining lifetime* (serverTime − server's `Date` response header) and add it
 * to the local clock.
 */
export function toLocalClock(serverIso: string, res: Response): Date {
  const dateHeader = res.headers.get('Date')
  const serverNow = dateHeader ? new Date(dateHeader).getTime() : Date.now()
  const remainingMs = new Date(serverIso).getTime() - serverNow
  return new Date(Date.now() + remainingMs)
}
