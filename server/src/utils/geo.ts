import type { Request } from 'express'

/** Shape of a verified access-token payload. */
export interface JwtPayloadShape {
  sub: string
  role: 'customer' | 'worker' | 'admin'
}

/** Request with auth middleware attached. */
export interface AuthRequest extends Request {
  user?: {
    id: string
    role: 'customer' | 'worker' | 'admin'
  }
}

/** GeoJSON Point (Mongo stores [lng, lat]). */
export interface GeoPoint {
  type: 'Point'
  coordinates: [number, number]
}

/** Lat/lng shape used by the frontend (`g.geopoint`). */
export interface LatLng {
  latitude: number
  longitude: number
}

export function latLngToGeo(p: LatLng): GeoPoint {
  return { type: 'Point', coordinates: [p.longitude, p.latitude] }
}

export function geoToLatLng(g: GeoPoint): LatLng {
  return { latitude: g.coordinates[1], longitude: g.coordinates[0] }
}

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Haversine distance in METERS (matches the frontend's `_distance` units). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function parseLatLng(value: unknown): LatLng | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  const lat = Number(v.latitude)
  const lng = Number(v.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { latitude: lat, longitude: lng }
}