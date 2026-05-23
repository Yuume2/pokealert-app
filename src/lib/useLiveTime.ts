import { useEffect, useState } from 'react'

/**
 * Hook qui re-render le composant toutes les `intervalMs` ms.
 * Permet aux timestamps relatifs ("il y a X min") de rester live sans fetch.
 */
export function useLiveTime(intervalMs = 30_000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}

/**
 * Formate un timestamp en "il y a Xs / Xmin / Xh".
 * Court et compact.
 */
export function formatRelativeShort(iso?: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 10) return 'à l’instant'
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} j`
}

/**
 * Formate un timestamp en "il y a X" version longue pour les sections détaillées.
 */
export function formatRelativeLong(iso?: string | null): string {
  if (!iso) return 'jamais'
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `à l’instant`
  const min = Math.floor(sec / 60)
  if (min < 60) return `il y a ${min} minute${min > 1 ? 's' : ''}`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} heure${h > 1 ? 's' : ''}`
  const d = Math.floor(h / 24)
  return `il y a ${d} jour${d > 1 ? 's' : ''}`
}
