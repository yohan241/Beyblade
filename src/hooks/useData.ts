import { useState, useEffect } from 'react'
import type { Bey, TrackerEvent, EventBeyEntry } from '../types/tracker'
import {
  fetchBeys,
  fetchEvents,
  fetchEvent,
  fetchEntriesForEvent,
  fetchAllEntries,
} from '../lib/db'

// ─── Generic async hook ───────────────────────────────────────────────────────

type AsyncState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'error';   data: null; error: string }
  | { status: 'success'; data: T;    error: null }

function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'loading',
    data: null,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', data: null, error: null })

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            status: 'error',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

// ─── Domain hooks ─────────────────────────────────────────────────────────────

export function useBeys() {
  return useAsync<Bey[]>(fetchBeys)
}

export function useEvents() {
  return useAsync<TrackerEvent[]>(fetchEvents)
}

export function useEvent(id: string | undefined) {
  return useAsync<TrackerEvent | null>(() => (id ? fetchEvent(id) : Promise.resolve(null)), [id])
}

export function useEntriesForEvent(eventId: string | undefined) {
  return useAsync<EventBeyEntry[]>(
    () => (eventId ? fetchEntriesForEvent(eventId) : Promise.resolve([])),
    [eventId],
  )
}

export function useAllEntries() {
  return useAsync<EventBeyEntry[]>(fetchAllEntries)
}
