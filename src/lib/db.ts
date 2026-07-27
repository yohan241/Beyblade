import { supabase } from './supabase'
import type { BeyRow, EventRow, EventBeyEntryRow } from './supabase'
import type { Bey, TrackerEvent, EventBeyEntry } from '../types/tracker'

// ─── Row → App type converters ────────────────────────────────────────────────

export function rowToBey(row: BeyRow): Bey {
  return {
    id: row.id,
    name: row.name ?? undefined,
    build: row.build,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
  }
}

export function rowToEvent(row: EventRow): TrackerEvent {
  return {
    id: row.id,
    name: row.name,
    eventDate: row.event_date,
  }
}

export function rowToEntry(row: EventBeyEntryRow): EventBeyEntry {
  return {
    id: row.id,
    eventId: row.event_id,
    beyId: row.bey_id,
    roundCodes: row.round_codes,
  }
}

// ─── Beys ─────────────────────────────────────────────────────────────────────

export async function fetchBeys(): Promise<Bey[]> {
  const { data, error } = await supabase
    .from('beys')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as BeyRow[]).map(rowToBey)
}

export async function insertBey(bey: {
  name?: string
  build: string
  imageUrl?: string
}): Promise<Bey> {
  const { data, error } = await supabase
    .from('beys')
    .insert({
      name: bey.name?.trim() || null,
      build: bey.build.trim(),
      image_url: bey.imageUrl ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToBey(data as BeyRow)
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function fetchEvents(): Promise<TrackerEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as EventRow[]).map(rowToEvent)
}

export async function fetchEvent(id: string): Promise<TrackerEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return rowToEvent(data as EventRow)
}

export async function insertEvent(event: {
  name: string
  eventDate: string
}): Promise<TrackerEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: event.name.trim(),
      event_date: event.eventDate,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToEvent(data as EventRow)
}

export async function updateBey(
  id: string,
  fields: { name?: string; build?: string; imageUrl?: string | null },
): Promise<Bey> {
  const patch: Record<string, unknown> = {}
  if (fields.build !== undefined) patch.build = fields.build.trim()
  if ('name' in fields) patch.name = fields.name?.trim() || null
  if ('imageUrl' in fields) patch.image_url = fields.imageUrl ?? null

  const { data, error } = await supabase
    .from('beys')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToBey(data as BeyRow)
}

export async function deleteBey(id: string): Promise<void> {
  const { error } = await supabase.from('beys').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateEvent(
  id: string,
  fields: { name?: string; eventDate?: string },
): Promise<TrackerEvent> {
  const patch: Record<string, unknown> = {}
  if (fields.name !== undefined) patch.name = fields.name.trim()
  if (fields.eventDate !== undefined) patch.event_date = fields.eventDate

  const { data, error } = await supabase
    .from('events')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToEvent(data as EventRow)
}

export async function deleteEvent(id: string): Promise<void> {
  // event_bey_entries cascade-deletes via FK
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Supabase Storage — bey images ───────────────────────────────────────────

/** Upload a cropped blob to the 'bey-images' bucket, return the public URL. */
export async function uploadBeyImage(beyId: string, blob: Blob): Promise<string> {
  const ext = blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `${beyId}.${ext}`

  const { error: upError } = await supabase.storage
    .from('bey-images')
    .upload(path, blob, { upsert: true, contentType: blob.type })

  if (upError) throw new Error(upError.message)

  const { data } = supabase.storage.from('bey-images').getPublicUrl(path)
  // Bust cache with a timestamp so updates show immediately
  return `${data.publicUrl}?t=${Date.now()}`
}

// ─── Event Bey Entries ────────────────────────────────────────────────────────

export async function fetchEntriesForEvent(eventId: string): Promise<EventBeyEntry[]> {
  const { data, error } = await supabase
    .from('event_bey_entries')
    .select('*')
    .eq('event_id', eventId)

  if (error) throw new Error(error.message)
  return (data as EventBeyEntryRow[]).map(rowToEntry)
}

export async function fetchAllEntries(): Promise<EventBeyEntry[]> {
  const { data, error } = await supabase
    .from('event_bey_entries')
    .select('*')

  if (error) throw new Error(error.message)
  return (data as EventBeyEntryRow[]).map(rowToEntry)
}

export async function insertEntries(entries: {
  eventId: string
  beyId: string
  roundCodes: string
}[]): Promise<void> {
  const { error } = await supabase
    .from('event_bey_entries')
    .insert(
      entries.map((e) => ({
        event_id: e.eventId,
        bey_id: e.beyId,
        round_codes: e.roundCodes,
      })),
    )

  if (error) throw new Error(error.message)
}
