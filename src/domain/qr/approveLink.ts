/**
 * What the phone does with text read from *any* QR code. A camera happily decodes a menu, a
 * Wi-Fi password or a phishing link, so we never navigate to the scanned URL. We only accept our
 * own approve link and pull the qrId out of it.
 */
export type ApproveLinkResult =
  | { kind: 'ok'; qrId: string }
  /** Our link, but for another address (e.g. the desktop was opened via localhost). */
  | { kind: 'other-origin'; origin: string }
  | { kind: 'not-ours' }

const APPROVE_PATH = /^\/m\/approve\/([A-Za-z0-9_-]{43})$/

/** @param expectedOrigin the phone app's own origin, e.g. "https://192.168.1.5:5173" */
export function parseApproveLink(text: string, expectedOrigin: string): ApproveLinkResult {
  let url: URL
  try {
    url = new URL(text.trim())
  } catch {
    return { kind: 'not-ours' }
  }

  const match = APPROVE_PATH.exec(url.pathname)
  if (!match || url.search || url.hash) return { kind: 'not-ours' }
  if (url.origin !== expectedOrigin) return { kind: 'other-origin', origin: url.origin }
  return { kind: 'ok', qrId: match[1] }
}
