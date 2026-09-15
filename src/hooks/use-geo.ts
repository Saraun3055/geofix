import { useCallback, useEffect, useState } from 'react'

export interface Coords {
  lat: number
  lng: number
}

export function useCurrentLocation(enabled = true) {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const locate = useCallback(() => {
    if (!enabled) return
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not available in this browser')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => {
        setError('Could not get your location. Allow access or enter it manually.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [enabled])

  useEffect(() => {
    locate()
  }, [locate])

  return { coords, error, loading, locate }
}

export const DEFAULT_LOCATION: Coords = { lat: 9.9252, lng: 78.1198 }