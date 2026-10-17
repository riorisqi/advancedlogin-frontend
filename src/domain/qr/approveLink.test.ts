import { describe, expect, test } from 'bun:test'
import { parseApproveLink } from './approveLink'

const ORIGIN = 'https://192.168.1.5:5173'
const ID = 'a'.repeat(21) + '_-' + 'B'.repeat(20) // 43 chars of base64url

describe('parseApproveLink', () => {
  test('extracts the qrId from our own approve link', () => {
    expect(parseApproveLink(`${ORIGIN}/m/approve/${ID}`, ORIGIN)).toEqual({ kind: 'ok', qrId: ID })
  })

  test('tolerates surrounding whitespace from the decoder', () => {
    expect(parseApproveLink(`  ${ORIGIN}/m/approve/${ID}\n`, ORIGIN)).toEqual({ kind: 'ok', qrId: ID })
  })

  test('flags our link pointing at another address', () => {
    expect(parseApproveLink(`http://localhost:5173/m/approve/${ID}`, ORIGIN)).toEqual({
      kind: 'other-origin',
      origin: 'http://localhost:5173',
    })
  })

  test.each([
    'WIFI:S:CafeNet;T:WPA;P:hunter2;;', // not a URL at all
    'https://evil.example/login', // some other site
    `${ORIGIN}/m/approve/short`, // malformed id
    `${ORIGIN}/m/approve/${ID}/extra`, // extra path
    `${ORIGIN}/m/approve/${ID}?next=https://evil.example`, // smuggled query
    `${ORIGIN}/m/approve/${ID}#x`, // fragment
    `javascript:alert(1)//${ORIGIN}/m/approve/${ID}`,
  ])('rejects %p', (text) => {
    expect(parseApproveLink(text, ORIGIN).kind).not.toBe('ok')
  })
})
