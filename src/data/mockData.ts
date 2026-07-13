import type { Bey, EventBeyEntry, TrackerEvent } from '../types/tracker'

export const beys: Bey[] = [
  { id: 'wr-1-60h', name: 'WR 1-60H' },
  { id: 'hw-9-60fb', name: 'HW 9-60FB' },
  { id: 'pw-1-70lr', name: 'PW 1-70LR' },
]

export const events: TrackerEvent[] = [
  { id: 'melb-dec-12', name: 'Melbourne Tournament', eventDate: '2026-12-12' },
  { id: 'local-jun-03', name: 'Local Battles', eventDate: '2026-06-03' },
]

export const eventBeyEntries: EventBeyEntry[] = [
  { id: 'melb-wr', eventId: 'melb-dec-12', beyId: 'wr-1-60h', roundCodes: '21505' },
  { id: 'melb-hw', eventId: 'melb-dec-12', beyId: 'hw-9-60fb', roundCodes: '435555' },
  { id: 'melb-pw', eventId: 'melb-dec-12', beyId: 'pw-1-70lr', roundCodes: '52.5425525527' },
  { id: 'local-wr', eventId: 'local-jun-03', beyId: 'wr-1-60h', roundCodes: '17612' },
]
