import { useEffect, useState } from 'react'
import { formatCountdown, secondsUntilExpiry } from '@/domain/qr/qrSession'

/** Self-updating "m:ss" until `deadline`. Pure display: it doesn't decide anything. */
export function Countdown({ deadline }: { deadline: Date }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return <>{formatCountdown(secondsUntilExpiry(deadline, now))}</>
}
