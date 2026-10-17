/**
 * A camera decodes anything (menus, Wi-Fi configs, phishing links), so we never navigate to the
 * scanned URL: only our own approve link is accepted, and only its qrId is used.
 */
export type ApproveLinkResult =
  | { kind: 'ok'; qrId: string }
  /** Our link, but for another address (e.g. the desktop was opened via localhost). */
  | { kind: 'other-origin'; origin: string }
  | { kind: 'not-ours' }

const APPROVE_PATH = /^\/m\/approve\/([A-Za-z0-9_-]{43})$/

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
