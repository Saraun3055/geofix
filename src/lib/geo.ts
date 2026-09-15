import type { GeoPointLike } from './types'

const EARTH_RADIUS_M = 6_371_000

export function haversine(a: GeoPointLike, b: GeoPointLike) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(x))
}

/* ────────────────────────────────────────────────────────
   Geohash encoding (RFC base-32) + bounding-box helpers.
   Used by the fallback query when geo lookups are done client-side.
   ──────────────────────────────────────────────────────── */
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

export function encodeGeohash(lat: number, lon: number, precision = 12): string {
  let minLat = -90,
    maxLat = 90,
    minLon = -180,
    maxLon = 180
  let hash = ''
  let bit = 0
  let ch = 0
  while (hash.length < precision) {
    if (bit & 1) {
      const mid = (minLon + maxLon) / 2
      if (lon >= mid) {
        ch |= 1 << (4 - bit >> 1)
        minLon = mid
      } else {
        maxLon = mid
      }
    } else {
      const mid = (minLat + maxLat) / 2
      if (lat >= mid) {
        ch |= 1 << (4 - bit >> 1)
        minLat = mid
      } else {
        maxLat = mid
      }
    }
    if (bit < 4) {
      bit++
    } else {
      hash += BASE32[ch]
      bit = 0
      ch = 0
    }
  }
  return hash
}

export function geohashBoundingBox(lat: number, lon: number, radiusM: number) {
  const latDelta = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI)
  const lonDelta =
    latDelta / Math.cos((lat * Math.PI) / 180)
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta,
  }
}

export function geoPointToLatLng(gp: GeoPointLike): { lat: number; lng: number } {
  return { lat: gp.latitude, lng: gp.longitude }
}

export function toLatLng(pt: GeoPointLike) {
  return { lat: pt.latitude, lng: pt.longitude }
}