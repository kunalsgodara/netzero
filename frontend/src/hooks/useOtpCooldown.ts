import { useState, useEffect, useCallback } from "react"


export function useOtpCooldown(defaultSeconds: number = 30) {
  const [cooldown, setCooldown] = useState<number>(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(prev => (prev > 0 ? prev - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const startCooldown = useCallback((seconds: number = defaultSeconds) => {
    setCooldown(seconds)
  }, [defaultSeconds])

  return { cooldown, startCooldown }
}
