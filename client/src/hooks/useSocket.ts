import { useEffect, useState } from 'react'

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [ticksCount, setTicksCount] = useState(0)
  const [lastTick, setLastTick] = useState<any>(null)

  useEffect(() => {
    setIsConnected(true)
    const interval = window.setInterval(() => {
      setTicksCount((count) => count + 1)
      setLastTick({ last_price: Math.random() * 500 + 100 })
    }, 5000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return { isConnected, ticksCount, lastTick }
}
