import type { Bey, EventBeyEntry, TrackerEvent } from '../types/tracker'

export const beys: Bey[] = [
  { id: 'wr-1-60h', name: 'Purple Reign TITEEEE', build: 'WR 1-60H', createdAt: '2026-07-20T10:00:00Z' },
  { id: 'hw-9-60fb', build: 'HW 9-60FB', createdAt: '2026-07-18T10:00:00Z' },
  { id: 'pw-1-70lr', name: 'Pegasus', build: 'PW 1-70LR', createdAt: '2026-07-14T10:00:00Z' },
  { id: 'dr-3-60t', build: 'DR 3-60T', createdAt: '2026-07-10T10:00:00Z' },
  { id: 'cr-5-70p', name: 'Crimson Tide', build: 'CR 5-70P', createdAt: '2026-07-05T10:00:00Z' },
  { id: 'bs-7-60u', build: 'BS 7-60U', createdAt: '2026-06-29T10:00:00Z' },
  { id: 'sl-2-80gp', name: 'Solar Flare', build: 'SL 2-80GP', createdAt: '2026-06-24T10:00:00Z' },
  { id: 'kn-4-60lf', build: 'KN 4-60LF', createdAt: '2026-06-18T10:00:00Z' },
  { id: 'rh-1-80b', name: 'Black Rose', build: 'RH 1-80B', createdAt: '2026-06-12T10:00:00Z' },
]

export const events: TrackerEvent[] = [
  { id: 'metro-jul-12', name: 'Metro Summer Open', eventDate: '2026-07-12' },
  { id: 'harbor-jun-28', name: 'Harbour Clash', eventDate: '2026-06-28' },
  { id: 'local-jun-03', name: 'Local Battles', eventDate: '2026-06-03' },
  { id: 'night-may-17', name: 'Friday Night X', eventDate: '2026-05-17' },
]

export const eventBeyEntries: EventBeyEntry[] = [
  { id: 'metro-wr', eventId: 'metro-jul-12', beyId: 'wr-1-60h', roundCodes: '2431505' },
  { id: 'metro-hw', eventId: 'metro-jul-12', beyId: 'hw-9-60fb', roundCodes: '4355552' },
  { id: 'metro-pw', eventId: 'metro-jul-12', beyId: 'pw-1-70lr', roundCodes: '2425527' },
  { id: 'metro-dr', eventId: 'metro-jul-12', beyId: 'dr-3-60t', roundCodes: '3145650' },
  { id: 'metro-cr', eventId: 'metro-jul-12', beyId: 'cr-5-70p', roundCodes: '4257165' },

  { id: 'harbor-hw', eventId: 'harbor-jun-28', beyId: 'hw-9-60fb', roundCodes: '2345502' },
  { id: 'harbor-bs', eventId: 'harbor-jun-28', beyId: 'bs-7-60u', roundCodes: '3524651' },
  { id: 'harbor-sl', eventId: 'harbor-jun-28', beyId: 'sl-2-80gp', roundCodes: '2165742' },
  { id: 'harbor-kn', eventId: 'harbor-jun-28', beyId: 'kn-4-60lf', roundCodes: '4425560' },
  { id: 'harbor-rh', eventId: 'harbor-jun-28', beyId: 'rh-1-80b', roundCodes: '1256753' },

  { id: 'local-wr', eventId: 'local-jun-03', beyId: 'wr-1-60h', roundCodes: '1761243' },
  { id: 'local-pw', eventId: 'local-jun-03', beyId: 'pw-1-70lr', roundCodes: '2257415' },
  { id: 'local-dr', eventId: 'local-jun-03', beyId: 'dr-3-60t', roundCodes: '4352165' },
  { id: 'local-bs', eventId: 'local-jun-03', beyId: 'bs-7-60u', roundCodes: '3125564' },
  { id: 'local-kn', eventId: 'local-jun-03', beyId: 'kn-4-60lf', roundCodes: '2451672' },

  { id: 'night-cr', eventId: 'night-may-17', beyId: 'cr-5-70p', roundCodes: '2345551' },
  { id: 'night-sl', eventId: 'night-may-17', beyId: 'sl-2-80gp', roundCodes: '4236175' },
  { id: 'night-kn', eventId: 'night-may-17', beyId: 'kn-4-60lf', roundCodes: '3552146' },
  { id: 'night-rh', eventId: 'night-may-17', beyId: 'rh-1-80b', roundCodes: '2147562' },
  { id: 'night-hw', eventId: 'night-may-17', beyId: 'hw-9-60fb', roundCodes: '4523517' },
]
