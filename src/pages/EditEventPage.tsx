import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useBeys, useEvent, useEntriesForEvent } from '../hooks/useData'
import { updateEvent, replaceEntriesForEvent } from '../lib/db'
import {
  type EventBeyState,
  type RoundEntry,
  roundsToCodeString,
  parseCodeStringToEntries,
  BeyCarousel,
  ScorePanel,
  SortableBeyList,
  BeyPickerModal,
} from '../components/EventWizard'
import type { Bey } from '../types/tracker'

type Step = 'details' | 'matches'

export function EditEventPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const eventState = useEvent(eventId)
  const entriesState = useEntriesForEvent(eventId)
  const beysState = useBeys()

  // ── Form state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('details')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [detailsError, setDetailsError] = useState('')

  const [eventBeys, setEventBeys] = useState<EventBeyState[]>([])
  const [activeBeyId, setActiveBeyId] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [localRoster, setLocalRoster] = useState<Bey[]>([])

  // Track whether we've seeded state from loaded data (only do it once)
  const seeded = useRef(false)

  const panelRef = useRef<HTMLDivElement>(null)

  // ── Seed form fields once data is ready ──────────────────────────────────
  useEffect(() => {
    if (seeded.current) return
    if (
      eventState.status !== 'success' ||
      entriesState.status !== 'success' ||
      !eventState.data
    ) return

    setEventName(eventState.data.name)
    setEventDate(eventState.data.eventDate)

    // Convert each existing entry's roundCodes string back into EventBeyState
    setEventBeys(
      entriesState.data.map((entry) => ({
        beyId: entry.beyId,
        rounds: parseCodeStringToEntries(entry.roundCodes),
        redoStack: [],
      })),
    )

    seeded.current = true
  }, [eventState, entriesState])

  // ── Computed roster ───────────────────────────────────────────────────────
  const fetchedRoster = beysState.status === 'success' ? beysState.data : []
  const roster = [
    ...fetchedRoster,
    ...localRoster.filter((lb) => !fetchedRoster.some((fb) => fb.id === lb.id)),
  ]

  // ── Loading / error guard ─────────────────────────────────────────────────
  const loading =
    eventState.status === 'loading' ||
    entriesState.status === 'loading' ||
    beysState.status === 'loading'

  if (loading) return <section><PageHeader title="Loading…" /></section>

  if (!eventState.data) {
    return (
      <section>
        <PageHeader title="Event not found" />
        <button className="text-link" onClick={() => navigate('/events')} type="button">
          Return to Events
        </button>
      </section>
    )
  }

  // ── Round / bey helpers ───────────────────────────────────────────────────

  function addBeyToEvent(beyId: string) {
    if (eventBeys.some((eb) => eb.beyId === beyId)) return
    setEventBeys((prev) => [...prev, { beyId, rounds: [], redoStack: [] }])
    setActiveBeyId(beyId)
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function addRound(beyId: string, round: RoundEntry) {
    setEventBeys((prev) =>
      prev.map((eb) =>
        eb.beyId === beyId ? { ...eb, rounds: [...eb.rounds, round], redoStack: [] } : eb,
      ),
    )
  }

  function undoLastRound(beyId: string) {
    setEventBeys((prev) =>
      prev.map((eb) => {
        if (eb.beyId !== beyId || eb.rounds.length === 0) return eb
        const last = eb.rounds[eb.rounds.length - 1]
        return { ...eb, rounds: eb.rounds.slice(0, -1), redoStack: [last, ...eb.redoStack] }
      }),
    )
  }

  function redoLastRound(beyId: string) {
    setEventBeys((prev) =>
      prev.map((eb) => {
        if (eb.beyId !== beyId || eb.redoStack.length === 0) return eb
        const [next, ...rest] = eb.redoStack
        return { ...eb, rounds: [...eb.rounds, next], redoStack: rest }
      }),
    )
  }

  function removeBeyFromEvent(beyId: string) {
    setEventBeys((prev) => prev.filter((eb) => eb.beyId !== beyId))
    if (activeBeyId === beyId) setActiveBeyId(null)
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  function advanceToMatches(e: React.FormEvent) {
    e.preventDefault()
    if (!eventName.trim()) { setDetailsError('Event name is required.'); return }
    setDetailsError('')
    setStep('matches')
  }

  async function handleDone(e: React.FormEvent) {
    e.preventDefault()
    if (!eventId) return
    setSaving(true); setSaveError('')
    try {
      await updateEvent(eventId, { name: eventName.trim(), eventDate })
      await replaceEntriesForEvent(
        eventId,
        eventBeys.map(({ beyId, rounds }) => ({
          beyId,
          roundCodes: roundsToCodeString(rounds),
        })),
      )
      navigate(`/events/${eventId}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save event.')
      setSaving(false)
    }
  }

  const activeBeyEntry = eventBeys.find((eb) => eb.beyId === activeBeyId)

  // ── Step 1: Details ───────────────────────────────────────────────────────

  if (step === 'details') {
    return (
      <section>
        <PageHeader
          eyebrow="Events"
          title="Edit Event"
          action={
            <button className="header-back-btn" type="button" onClick={() => navigate(`/events/${eventId}`)}>
              ← Back
            </button>
          }
        />
        <form className="add-event-details-form" onSubmit={advanceToMatches} noValidate>
          <label className="form-label">
            Event name <span className="form-required">*</span>
            <input
              autoFocus
              className={`form-input${detailsError ? ' form-input-error' : ''}`}
              maxLength={64}
              onChange={(e) => { setEventName(e.target.value); setDetailsError('') }}
              placeholder="e.g. Metro Summer Open"
              type="text"
              value={eventName}
            />
            {detailsError && <span className="form-error-msg">{detailsError}</span>}
          </label>
          <label className="form-label">
            Date
            <input
              className="form-input"
              onChange={(e) => setEventDate(e.target.value)}
              type="date"
              value={eventDate}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Next: Edit Beys →</button>
            <button type="button" className="btn-secondary" onClick={() => navigate(`/events/${eventId}`)}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    )
  }

  // ── Step 2: Matches ───────────────────────────────────────────────────────

  return (
    <section>
      <PageHeader
        eyebrow={eventDate}
        title={eventName}
        action={
          <button className="header-back-btn" type="button" onClick={() => setStep('details')}>
            ← Edit details
          </button>
        }
      />

      {beysState.status === 'error' && <p className="form-error-msg">{beysState.error}</p>}

      <BeyCarousel
        entries={eventBeys}
        roster={roster}
        activeBeyId={activeBeyId}
        onSelect={(id) => {
          setActiveBeyId((prev) => (prev === id ? null : id))
          setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        }}
        onAddBey={() => setShowPicker(true)}
      />

      {eventBeys.length > 0 && !activeBeyId && (
        <SortableBeyList
          eventBeys={eventBeys}
          roster={roster}
          onReorder={setEventBeys}
          onSelectBey={(id) => setActiveBeyId((prev) => (prev === id ? null : id))}
          onRemoveBey={removeBeyFromEvent}
        />
      )}

      {activeBeyEntry && (
        <div ref={panelRef} className="score-panel-wrapper">
          <ScorePanel
            beyId={activeBeyEntry.beyId}
            rounds={activeBeyEntry.rounds}
            redoStack={activeBeyEntry.redoStack}
            roster={roster}
            onAddRound={(round) => addRound(activeBeyEntry.beyId, round)}
            onUndo={() => undoLastRound(activeBeyEntry.beyId)}
            onRedo={() => redoLastRound(activeBeyEntry.beyId)}
          />
        </div>
      )}

      {eventBeys.length === 0 && (
        <article className="empty-state">
          <h2>No Beys</h2>
          <p>Tap <strong>+ Add Bey</strong> to add beys to this event.</p>
        </article>
      )}

      {saveError && <p className="form-error-msg" style={{ marginTop: '0.5rem' }}>{saveError}</p>}

      <form onSubmit={handleDone}>
        <div className="done-bar">
          <button className="btn-done" disabled={saving} type="submit">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {showPicker && (
        <BeyPickerModal
          roster={roster}
          alreadySelected={eventBeys.map((eb) => eb.beyId)}
          onPick={addBeyToEvent}
          onClose={() => setShowPicker(false)}
          onBeyCreated={(bey) => setLocalRoster((prev) => [...prev, bey])}
        />
      )}
    </section>
  )
}
