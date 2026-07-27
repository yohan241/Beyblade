import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { BeyAvatar } from '../components/BeyAvatar'
import { calculateStatsFromRoundCodes } from '../lib/stats'
import { useBeys } from '../hooks/useData'
import { insertEvent, insertEntries } from '../lib/db'
import type { Bey } from '../types/tracker'

// ─── Types ────────────────────────────────────────────────────────────────────

type RoundEntry = {
  code: string
  isSelf: boolean
}

type EventBeyState = {
  beyId: string
  rounds: RoundEntry[]
}

type ScoreBtn = {
  label: string
  winCode: string
  lossCode: string
  pts: number
  canSelf: boolean
}

const SCORE_BUTTONS: ScoreBtn[] = [
  { label: 'Spin Finish',         winCode: '1', lossCode: '5', pts: 1, canSelf: false },
  { label: 'Pocket Finish',       winCode: '2', lossCode: '6', pts: 2, canSelf: true  },
  { label: 'Xtreme Finish',       winCode: '3', lossCode: '7', pts: 3, canSelf: true  },
  { label: 'Burst Finish',        winCode: '4', lossCode: '8', pts: 4, canSelf: true  },
  { label: 'Spin vs Stamina',     winCode: '0', lossCode: '5', pts: 2, canSelf: false },
  { label: 'No Contact (launch)', winCode: '9', lossCode: '5', pts: 2, canSelf: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundsToCodeString(rounds: RoundEntry[]): string {
  return rounds.map((r) => r.code + (r.isSelf ? '.' : '')).join('')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BeyCarousel({
  entries,
  roster,
  activeBeyId,
  onSelect,
  onAddBey,
}: {
  entries: EventBeyState[]
  roster: Bey[]
  activeBeyId: string | null
  onSelect: (id: string) => void
  onAddBey: () => void
}) {
  return (
    <div className="bey-carousel" role="listbox" aria-label="Beys in this event">
      {entries.map(({ beyId, rounds }) => {
        const bey = roster.find((b) => b.id === beyId)
        const isActive = beyId === activeBeyId
        const codeStr = roundsToCodeString(rounds)
        const stats = codeStr.length > 0
          ? calculateStatsFromRoundCodes(beyId, getBeyDisplayName(bey), codeStr)
          : null
        return (
          <button
            key={beyId}
            className={`carousel-chip${isActive ? ' carousel-chip-active' : ''}`}
            onClick={() => onSelect(beyId)}
            role="option"
            aria-selected={isActive}
            type="button"
          >
            <BeyAvatar bey={bey} size="sm" />
            <span className="carousel-chip-name">{getBeyDisplayName(bey)}</span>
            {stats && (
              <span className="carousel-chip-stat">{stats.wins}–{stats.losses}</span>
            )}
          </button>
        )
      })}
      <button
        className="carousel-chip carousel-chip-add"
        onClick={onAddBey}
        role="option"
        aria-selected={false}
        type="button"
        aria-label="Add Bey to event"
      >
        <div className="carousel-chip-add-icon" aria-hidden="true">+</div>
        <span className="carousel-chip-name">Add Bey</span>
      </button>
    </div>
  )
}

function BeyStatRow({
  beyId,
  rounds,
  roster,
}: {
  beyId: string
  rounds: RoundEntry[]
  roster: Bey[]
}) {
  const bey = roster.find((b) => b.id === beyId)
  const codeStr = roundsToCodeString(rounds)
  if (codeStr.length === 0) return null
  const stats = calculateStatsFromRoundCodes(beyId, getBeyDisplayName(bey), codeStr)
  return (
    <div className="bey-stat-row">
      <span className="bsr-frac">
        <span className="stat-positive">{stats.wins}</span>/
        <span className="stat-negative">{stats.losses}</span>
        <span className="bsr-label"> W/L</span>
      </span>
      <span className="bsr-frac">
        <span className="stat-positive">{stats.pointsFor}</span>–
        <span className="stat-negative">{stats.pointsAgainst}</span>
        <span className="bsr-label"> pts</span>
      </span>
      <span className={stats.winRate >= 50 ? 'stat-positive' : 'stat-negative'}>
        {Math.round(stats.winRate)}% WR
      </span>
      {stats.scoreOverOpponentRate !== null && (
        <span>{Math.round(stats.scoreOverOpponentRate)}% SOOR</span>
      )}
      {stats.statPoints !== null && (
        <strong className="bsr-stat">{stats.statPoints} SP</strong>
      )}
    </div>
  )
}

function ScorePanel({
  beyId,
  rounds,
  roster,
  onAddRound,
  onUndo,
}: {
  beyId: string
  rounds: RoundEntry[]
  roster: Bey[]
  onAddRound: (round: RoundEntry) => void
  onUndo: () => void
}) {
  const bey = roster.find((b) => b.id === beyId)
  const [isSelf, setIsSelf] = useState(false)

  function handleScore(btn: ScoreBtn, isWin: boolean) {
    const code = isWin ? btn.winCode : btn.lossCode
    const applySelf = btn.canSelf && isSelf
    onAddRound({ code, isSelf: applySelf })
    setIsSelf(false)
  }

  const lastRound = rounds[rounds.length - 1]

  return (
    <div className="score-panel">
      <div className="score-panel-header">
        <span className="score-panel-name">{getBeyDisplayName(bey)}</span>
        <span className="score-panel-match">Match {rounds.length + 1}</span>
      </div>

      {rounds.length > 0 && (
        <div className="round-tape">
          {rounds.map((r, i) => {
            const isWin = ['0','1','2','3','4','9'].includes(r.code)
            return (
              <span key={i} className={`tape-code ${isWin ? 'stat-positive' : 'stat-negative'}`}>
                {r.code}{r.isSelf ? '.' : ''}
              </span>
            )
          })}
        </div>
      )}

      <BeyStatRow beyId={beyId} rounds={rounds} roster={roster} />

      <div className="score-btn-grid">
        {SCORE_BUTTONS.map((btn) => (
          <div key={btn.label} className="score-btn-row">
            <button
              className="score-btn score-btn-loss"
              onClick={() => handleScore(btn, false)}
              type="button"
              aria-label={`Opponent ${btn.label}`}
            >←</button>
            <button
              className="score-btn-label"
              onClick={() => handleScore(btn, true)}
              type="button"
              aria-label={`You: ${btn.label} (+${btn.pts})`}
            >
              {btn.label}
              <span className="score-btn-pts">+{btn.pts}</span>
            </button>
            <button
              className="score-btn score-btn-win"
              onClick={() => handleScore(btn, true)}
              type="button"
              aria-label={`You ${btn.label}`}
            >→</button>
          </div>
        ))}

        <div className="score-panel-footer">
          <button
            className={`sf-toggle${isSelf ? ' sf-toggle-on' : ''}`}
            onClick={() => setIsSelf((v) => !v)}
            type="button"
            aria-pressed={isSelf}
          >
            {isSelf ? '✓ Self Finish' : 'SF?'}
          </button>
          <span className="sf-hint">Applies to Pocket / Xtreme / Burst (wins &amp; losses)</span>
          {rounds.length > 0 && (
            <button
              className="score-btn-undo"
              onClick={onUndo}
              type="button"
              aria-label="Undo last round"
            >↩ Undo</button>
          )}
        </div>

        {lastRound && (
          <p className="last-round-reminder">
            Last:&nbsp;
            <span className={['0','1','2','3','4','9'].includes(lastRound.code) ? 'stat-positive' : 'stat-negative'}>
              {lastRound.code}{lastRound.isSelf ? '.' : ''}
            </span>
            &nbsp;—&nbsp;
            {SCORE_BUTTONS.find(
              (b) => b.winCode === lastRound.code || b.lossCode === lastRound.code,
            )?.label ?? 'Unknown'}
            {lastRound.isSelf ? ' (Self)' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

function BeyPickerModal({
  roster,
  alreadySelected,
  onPick,
  onClose,
}: {
  roster: Bey[]
  alreadySelected: string[]
  onPick: (beyId: string) => void
  onClose: () => void
}) {
  const available = roster.filter((b) => !alreadySelected.includes(b.id))
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Pick a Bey">
      <div className="modal-sheet">
        <div className="modal-header">
          <h2 className="modal-title">Add Bey to Event</h2>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Close">✕</button>
        </div>
        {available.length === 0 ? (
          <p className="modal-empty">All your Beys are already in this event.</p>
        ) : (
          <ul className="bey-pick-list">
            {available.map((bey) => (
              <li key={bey.id}>
                <button
                  className="bey-pick-item"
                  onClick={() => { onPick(bey.id); onClose() }}
                  type="button"
                >
                  <BeyAvatar bey={bey} size="md" />
                  <div>
                    <strong><BeyName bey={bey} /></strong>
                    <p>{bey.build}</p>
                  </div>                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

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

  const panelRef = useRef<HTMLDivElement>(null)
  const roster = beysState.status === 'success' ? beysState.data : []

  function advanceToMatches(e: React.FormEvent) {
    e.preventDefault()
    if (!eventName.trim()) { setDetailsError('Event name is required.'); return }
    setDetailsError('')
    setStep('matches')
  }

  function addBeyToEvent(beyId: string) {
    setEventBeys((prev) => [...prev, { beyId, rounds: [] }])
    setActiveBeyId(beyId)
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function addRound(beyId: string, round: RoundEntry) {
    setEventBeys((prev) =>
      prev.map((eb) => eb.beyId === beyId ? { ...eb, rounds: [...eb.rounds, round] } : eb),
    )
  }

  function undoLastRound(beyId: string) {
    setEventBeys((prev) =>
      prev.map((eb) => eb.beyId === beyId ? { ...eb, rounds: eb.rounds.slice(0, -1) } : eb),
    )
  }

  function removeBeyFromEvent(beyId: string) {
    setEventBeys((prev) => prev.filter((eb) => eb.beyId !== beyId))
    if (activeBeyId === beyId) setActiveBeyId(null)
  }

  async function handleDone(e: React.FormEvent) {
    e.preventDefault()
    if (eventBeys.length === 0) return

    setSaving(true)
    setSaveError('')
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
          action={
            <button className="header-back-btn" type="button" onClick={() => navigate('/events')}>
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
            <button type="submit" className="btn-primary">Next: Add Beys →</button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/events')}>
              Cancel
            </button>
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
        action={
          <button className="header-back-btn" type="button" onClick={() => setStep('details')}>
            ← Edit
          </button>
        }
      />

      {beysState.status === 'loading' && <p className="page-intro">Loading beys…</p>}
      {beysState.status === 'error' && (
        <p className="form-error-msg">{beysState.error}</p>
      )}

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
        <div className="event-bey-list">
          {eventBeys.map(({ beyId, rounds }) => {
            const bey = roster.find((b) => b.id === beyId)
            const codeStr = roundsToCodeString(rounds)
            return (
              <article
                key={beyId}
                className="event-bey-entry"
                onClick={() => setActiveBeyId((prev) => (prev === beyId ? null : beyId))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && setActiveBeyId((prev) => (prev === beyId ? null : beyId))
                }
              >
                <div className="ebe-left">
                  <BeyAvatar bey={bey} size="md" />
                </div>
                <div className="ebe-main">
                  <strong className="ebe-name"><BeyName bey={bey} /></strong>
                  {codeStr.length > 0 ? (
                    <code className="ebe-codes">
                      {[...codeStr].map((ch, i) => {
                        if (ch === '.') return <span key={i} className="ebe-dot">.</span>
                        const isWin = /[0-4]|9/.test(ch)
                        return <span key={i} className={isWin ? 'stat-positive' : 'stat-negative'}>{ch}</span>
                      })}
                    </code>
                  ) : (
                    <span className="ebe-empty">No rounds yet — tap to score</span>
                  )}
                  <BeyStatRow beyId={beyId} rounds={rounds} roster={roster} />
                </div>
                <button
                  className="ebe-remove"
                  onClick={(e) => { e.stopPropagation(); removeBeyFromEvent(beyId) }}
                  type="button"
                  aria-label={`Remove ${getBeyDisplayName(bey)} from event`}
                >✕</button>
              </article>
            )
          })}
        </div>
      )}

      {activeBeyEntry && (
        <div ref={panelRef} className="score-panel-wrapper">
          <ScorePanel
            beyId={activeBeyEntry.beyId}
            rounds={activeBeyEntry.rounds}
            roster={roster}
            onAddRound={(round) => addRound(activeBeyEntry.beyId, round)}
            onUndo={() => undoLastRound(activeBeyEntry.beyId)}
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
          <button
            className="btn-done"
            disabled={eventBeys.length === 0 || saving}
            type="submit"
          >
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
        />
      )}
    </section>
  )
}
