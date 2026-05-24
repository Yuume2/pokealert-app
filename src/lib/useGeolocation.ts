import { useEffect, useState } from 'react'

export interface GeolocState {
  lat?: number
  lng?: number
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  error?: string
}

const KEY = 'pokealert.v2.geoloc_consent'

/**
 * Demande géoloc UNE SEULE FOIS (mémorisé localStorage).
 * Si refusée ou indisponible, ne re-demande pas avant 24h.
 */
export function useGeolocation(autoRequest = true): GeolocState & {
  request: () => void
} {
  const [state, setState] = useState<GeolocState>({ status: 'idle' })

  const request = () => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'unavailable' })
      return
    }
    setState({ status: 'requesting' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: 'granted',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        try {
          localStorage.setItem(
            KEY,
            JSON.stringify({ ts: Date.now(), status: 'granted' }),
          )
        } catch {}
      },
      (err) => {
        setState({ status: 'denied', error: err.message })
        try {
          localStorage.setItem(
            KEY,
            JSON.stringify({ ts: Date.now(), status: 'denied' }),
          )
        } catch {}
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    )
  }

  useEffect(() => {
    if (!autoRequest) return
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const { ts, status } = JSON.parse(raw)
        const fresh = Date.now() - ts < 24 * 3600 * 1000
        if (status === 'denied' && fresh) {
          setState({ status: 'denied' })
          return
        }
      }
    } catch {}
    request()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRequest])

  return { ...state, request }
}
