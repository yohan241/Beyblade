import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useBeys } from '../hooks/useData'
import { insertEvent, insertEntries } from '../lib/db'
import {
  type EventBeyState,
  roundsToCodeString,
  BeyCarousel,
  ScorePanel,
  SortableBeyList,
  BeyPickerModal,
} from '../components/EventWizard'
import type { Bey } from '../types/tracker'

type Step = 'details' | 'matches'

export function AddEventPage() {
  const navigate = useNavigate()
  const beysState = useBeys()

  const [step, setStep] = useState<Step>('details')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10))
  const [detailsError, setDetailsError] = useState('')
  const [eventBeys, setEventBeys] = useState<EventBeyState[]>([])
  const [activeBeyId, setActiveBeyId] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [localRoster, setLocalRoster] = useState<Bey[]>([])

  const panelRef = useRef<HTMLDivElement>(null)
  const fetchedRoster = beysState.status === 'success' ? beysState.data : []
  const roster = [
    ...fetchedRoster,
    ...localRoster.filter((lb) => !fetchedRoster.some((fb) => fb.id === lb.id)),
  ]

  function advanceToMatches(e: React.FormEvent) {
    e.preventDefault()
    if (!eventName.trim()) { setDetailsError('Event name is required.'); return }
    setDetailsError('')
    setStep('matches')
  }

  function addBeyToEvent(beyId: string) {
    if (eventBeys.some((eb) => eb.beyId === beyId)) return
    setEventBeys((prev) => [...prev, { beyId, rounds: [], redoStack: [] }])
    setActiveBeyId(beyId)
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function addRound(beyId: string, round: Parameters<typeof roundsToCodeString>[0][number]) {
    setEventBeys((prev) =>
      prev.map((eb) => eb.beyId === beyId ? { ...eb, rounds: [...eb.rounds, round], redoStack: [] } : eb),
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

  async function handleDone(e: React.FormEvent) {
    e.preventDefault()
    if (eventBeys.length === 0) return
    setSaving(true); setSaveError('')
    try {
      const newEvent = await insertEvent({ name: eventName, eventDate })
      await insertEntries(
        eventBeys.map(({ beyId, rounds }) => ({
          eventId: newEvent.id,
          beyId,
          roundCodes: roundsToCodeString(rounds),
        })),
      )
      navigate('/events')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save event.')
      setSaving(false)
    }
  }

  const activeBeyEntry = eventBeys.find((eb) => eb.beyId === activeBeyId)

  // ── Step 1 ────────────────────────────────────────────────────────────────

  if (step === 'details') {
    return (
      <section>
        <PageHeader
          eyebrow="Events"
          title="New Event"
          action={<button className="header-back-btn" type="button" onClick={() => navigate('/events')}>← Back</button>}
        />
        <form className="add-event-details-form" onSubmit={advanceToMatches} noValidate>
          <label className="form-label">
            Event name <span className="form-required">*</span>
            <input autoFocus className={`form-input${detailsError ? ' form-input-error' : ''}`} maxLength={64}
              onChange={(e) => { setEventName(e.target.value); setDetailsError('') }}
              placeholder="e.g. Metro Summer Open" type="text" value={eventName} />
            {detailsError && <span className="form-error-msg">{detailsError}</span>}
          </label>
          <label className="form-label">
            Date
            <input className="form-input" onChange={(e) => setEventDate(e.target.value)} type="date" value={eventDate} />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Next: Add Beys →</button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/events')}>Cancel</button>
          </div>
        </form>
      </section>
    )
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────

  return (
    <section>
      <PageHeader
        eyebrow={eventDate}
        title={eventName}
        action={<button className="header-back-btn" type="button" onClick={() => setStep('details')}>← Edit</button>}
      />

      {beysState.status === 'loading' && <p className="page-intro">Loading beys…</p>}
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
          <h2>No Beys yet</h2>
          <p>Tap the <strong>+ Add Bey</strong> chip above to pick which Beys you used.</p>
        </article>
      )}

      {saveError && <p className="form-error-msg" style={{ marginTop: '0.5rem' }}>{saveError}</p>}

      <form onSubmit={handleDone}>
        <div className="done-bar">
          <button className="btn-done" disabled={eventBeys.length === 0 || saving} type="submit">
            {saving ? 'Saving…' : 'Done'}
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
