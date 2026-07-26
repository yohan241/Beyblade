import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { beys as rosterBeys } from '../data/mockData'
import { calculateStatsFromRoundCodes } from '../lib/stats'
// ─── Types ────────────────────────────────────────────────────────────────────

/** One round recorded for a bey in this event */
type RoundEntry = {
  code: string       // '0'–'9'
  isSelf: boolean    // true = self-finish (dot suffix, only valid for 2/3/4)
}

/** Per-bey state inside the event form */
type EventBeyState = {
  beyId: string
  rounds: RoundEntry[]
}

// ─── Score button definitions ─────────────────────────────────────────────────

type ScoreBtn = {
  label: string
  winCode: string   // digit to push when YOU score this
  lossCode: string  // digit to push when OPPONENT scores this on you
  pts: number
  canSelf: boolean  // whether the SF? toggle is relevant
}

const SCORE_BUTTONS: ScoreBtn[] = [
  { label: 'Spin Finish',        winCode: '1', lossCode: '5', pts: 1, canSelf: false },
  { label: 'Pocket Finish',      winCode: '2', lossCode: '6', pts: 2, canSelf: true  },
  { label: 'Xtreme Finish',      winCode: '3', lossCode: '7', pts: 3, canSelf: true  },
  { label: 'Burst Finish',       winCode: '4', lossCode: '8', pts: 4, canSelf: true  },
  { label: 'Spin vs Stamina',    winCode: '0', lossCode: '5', pts: 2, canSelf: false },
  { label: 'No Contact (launch)',winCode: '9', lossCode: '5', pts: 2, canSelf: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundsToCodeString(rounds: RoundEntry[]): string {
  return rounds.map((r) => r.code + (r.isSelf ? '.' : '')).join('')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Horizontal scrollable carousel of bey chips + trailing Add chip */
function BeyCarousel({
  entries,
  activeBeyId,
  onSelect,
  onAddBey,
}: {
  entries: EventBeyState[]
  activeBeyId: string | null
  onSelect: (id: string) => void
  onAddBey: () => void
}) {
  const roster = rosterBeys
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
            <div className="carousel-chip-image" aria-hidden="true" />
            <span className="carousel-chip-name">
              {getBeyDisplayName(bey)}
            </span>
            {stats && (
              <span className="carousel-chip-stat">
                {stats.wins}–{stats.losses}
              </span>
            )}
          </button>
        )
      })}

      {/* Always-visible Add chip at the end of the carousel */}
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

/** The live stats row shown per bey in the match list */
function BeyStatRow({ beyId, rounds }: { beyId: string; rounds: RoundEntry[] }) {
  const bey = rosterBeys.find((b) => b.id === beyId)
  const codeStr = roundsToCodeString(rounds)
  if (codeStr.length === 0) return null
  const stats = calculateStatsFromRoundCodes(beyId, getBeyDisplayName(bey), codeStr)
  return (
    <div className="bey-stat-row">
      <span className="bsr-frac">
        <span className="stat-positive">{stats.wins}</span>
        /
        <span className="stat-negative">{stats.losses}</span>
        <span className="bsr-label"> W/L</span>
      </span>
      <span className="bsr-frac">
        <span className="stat-positive">{stats.pointsFor}</span>
        –
        <span className="stat-negative">{stats.pointsAgainst}</span>
        <span className="bsr-label"> pts</span>
      </span>
      {stats.winRate !== undefined && (
        <span className={stats.winRate >= 50 ? 'stat-positive' : 'stat-negative'}>
          {Math.round(stats.winRate)}% WR
        </span>
      )}
      {stats.scoreOverOpponentRate !== null && stats.scoreOverOpponentRate !== undefined && (
        <span>{Math.round(stats.scoreOverOpponentRate)}% SOOR</span>
      )}
      {stats.statPoints !== null && (
        <strong className="bsr-stat">{stats.statPoints} SP</strong>
      )}
    </div>
  )
}

/** Score entry panel (right panel in wireframe) */
function ScorePanel({
  beyId,
  rounds,
  onAddRound,
  onUndo,
}: {
  beyId: string
  rounds: RoundEntry[]
  onAddRound: (round: RoundEntry) => void
  onUndo: () => void
}) {
  const bey = rosterBeys.find((b) => b.id === beyId)
  const [isSelf, setIsSelf] = useState(false)

  function handleScore(btn: ScoreBtn, isWin: boolean) {
    const code = isWin ? btn.winCode : btn.lossCode
    const applySelf = btn.canSelf && isSelf   // applies to both wins (2/3/4) and losses (6/7/8)
    onAddRound({ code, isSelf: applySelf })
    setIsSelf(false)
  }

  const lastRound = rounds[rounds.length - 1]

  return (
    <div className="score-panel">
      {/* Header */}
      <div className="score-panel-header">
        <span className="score-panel-name">{getBeyDisplayName(bey)}</span>
        <span className="score-panel-match">Match {rounds.length + 1}</span>
      </div>

      {/* Round code tape */}
      {rounds.length > 0 && (
        <div className="round-tape">
          {rounds.map((r, i) => {
            const isWin = ['0','1','2','3','4','9'].includes(r.code)
            return (
              <span
                key={i}
                className={`tape-code ${isWin ? 'stat-positive' : 'stat-negative'}`}
              >
                {r.code}{r.isSelf ? '.' : ''}
              </span>
            )
          })}
        </div>
      )}

      {/* Live stats */}
      <BeyStatRow beyId={beyId} rounds={rounds} />

      {/* Score buttons — each row: [← decrement label +2 →] style but here win/loss */}
      <div className="score-btn-grid">
        {SCORE_BUTTONS.map((btn) => (
          <div key={btn.label} className="score-btn-row">
            {/* Loss (opponent scored on you) */}
            <button
              className="score-btn score-btn-loss"
              onClick={() => handleScore(btn, false)}
              type="button"
              aria-label={`Opponent ${btn.label}`}
            >
              ←
            </button>

            {/* Label */}
            <button
              className="score-btn-label"
              onClick={() => handleScore(btn, true)}
              type="button"
              aria-label={`You: ${btn.label} (+${btn.pts})`}
            >
              {btn.label}
              <span className="score-btn-pts">+{btn.pts}</span>
            </button>

            {/* Win (you scored) */}
            <button
              className="score-btn score-btn-win"
              onClick={() => handleScore(btn, true)}
              type="button"
              aria-label={`You ${btn.label}`}
            >
              →
            </button>
          </div>
        ))}

        {/* SF? toggle + undo row */}
        <div className="score-panel-footer">
          <button
            className={`sf-toggle${isSelf ? ' sf-toggle-on' : ''}`}
            onClick={() => setIsSelf((v) => !v)}
            type="button"
            aria-pressed={isSelf}
          >
            {isSelf ? '✓ Self Finish' : 'SF?'}
          </button>
          <span className="sf-hint">
            Applies to Pocket / Xtreme / Burst (wins &amp; losses)
          </span>
          {rounds.length > 0 && (
            <button
              className="score-btn-undo"
              onClick={onUndo}
              type="button"
              aria-label="Undo last round"
            >
              ↩ Undo
            </button>
          )}
        </div>

        {/* Last round reminder */}
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

/** Bey selector modal — pick from roster */
function BeyPickerModal({
  alreadySelected,
  onPick,
  onClose,
}: {
  alreadySelected: string[]
  onPick: (beyId: string) => void
  onClose: () => void
}) {
  const available = rosterBeys.filter((b) => !alreadySelected.includes(b.id))
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
                  <div className="bey-image-placeholder" aria-hidden="true" />
                  <div>
                    <strong><BeyName bey={bey} /></strong>
                    <p>{bey.build}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Step = 'details' | 'matches'

export function AddEventPage() {
  const navigate = useNavigate()

  // Step
  const [step, setStep] = useState<Step>('details')

  // Step 1 — event details
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10))
  const [detailsError, setDetailsError] = useState('')

  // Step 2 — beys & matches
  const [eventBeys, setEventBeys] = useState<EventBeyState[]>([])
  const [activeBeyId, setActiveBeyId] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)

  // ── helpers ──

  function advanceToMatches(e: React.FormEvent) {
    e.preventDefault()
    if (!eventName.trim()) {
      setDetailsError('Event name is required.')
      return
    }
    setDetailsError('')
    setStep('matches')
  }

  function addBeyToEvent(beyId: string) {
    setEventBeys((prev) => [...prev, { beyId, rounds: [] }])
    setActiveBeyId(beyId)
    // scroll panel into view after render
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function addRound(beyId: string, round: RoundEntry) {
    setEventBeys((prev) =>
      prev.map((eb) =>
        eb.beyId === beyId ? { ...eb, rounds: [...eb.rounds, round] } : eb,
      ),
    )
  }

  function undoLastRound(beyId: string) {
    setEventBeys((prev) =>
      prev.map((eb) =>
        eb.beyId === beyId ? { ...eb, rounds: eb.rounds.slice(0, -1) } : eb,
      ),
    )
  }

  function removeBeyFromEvent(beyId: string) {
    setEventBeys((prev) => prev.filter((eb) => eb.beyId !== beyId))
    if (activeBeyId === beyId) setActiveBeyId(null)
  }

  function handleDone(e: React.FormEvent) {
    e.preventDefault()
    if (eventBeys.length === 0) return
    // TODO: persist event + entries to store / backend
    navigate('/events')
  }

  const activeBeyEntry = eventBeys.find((eb) => eb.beyId === activeBeyId)

  // ── Step 1: Event details ─────────────────────────────────────────────────

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

  // ── Step 2: Beys & matches ────────────────────────────────────────────────

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

      {/* ── Carousel (always shown once we're on step 2, includes Add chip) ── */}
      <BeyCarousel
        entries={eventBeys}
        activeBeyId={activeBeyId}
        onSelect={(id) => {
          setActiveBeyId((prev) => (prev === id ? null : id))
          setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        }}
        onAddBey={() => setShowPicker(true)}
      />

      {/* ── Bey list — only visible when no bey is selected (score panel takes over) ── */}
      {eventBeys.length > 0 && !activeBeyId && (
        <div className="event-bey-list">
          {eventBeys.map(({ beyId, rounds }) => {
            const bey = rosterBeys.find((b) => b.id === beyId)
            const codeStr = roundsToCodeString(rounds)
            return (
              <article
                key={beyId}
                className={`event-bey-entry${activeBeyId === beyId ? ' event-bey-entry-active' : ''}`}
                onClick={() => setActiveBeyId((prev) => (prev === beyId ? null : beyId))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveBeyId((prev) => (prev === beyId ? null : beyId))}
              >
                <div className="ebe-left">
                  <div className="bey-image-placeholder" aria-hidden="true" />
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
                  {/* Only show stats when this bey is NOT the active one (score panel shows instead) */}
                  {activeBeyId !== beyId && <BeyStatRow beyId={beyId} rounds={rounds} />}
                </div>
                <button
                  className="ebe-remove"
                  onClick={(e) => { e.stopPropagation(); removeBeyFromEvent(beyId) }}
                  type="button"
                  aria-label={`Remove ${getBeyDisplayName(bey)} from event`}
                >
                  ✕
                </button>
              </article>
            )
          })}
        </div>
      )}

      {/* ── Score panel (shows when a bey is active) ── */}
      {activeBeyEntry && (
        <div ref={panelRef} className="score-panel-wrapper">
          <ScorePanel
            beyId={activeBeyEntry.beyId}
            rounds={activeBeyEntry.rounds}
            onAddRound={(round) => addRound(activeBeyEntry.beyId, round)}
            onUndo={() => undoLastRound(activeBeyEntry.beyId)}
          />
        </div>
      )}

      {/* ── Empty state ── */}
      {eventBeys.length === 0 && (
        <article className="empty-state">
          <h2>No Beys yet</h2>
          <p>Tap the <strong>+ Add Bey</strong> chip in the row above to pick which Beys you used in this event.</p>
        </article>
      )}

      {/* ── Done button ── */}
      <form onSubmit={handleDone}>
        <div className="done-bar">
          <button
            className="btn-done"
            disabled={eventBeys.length === 0}
            type="submit"
          >
            Done
          </button>
        </div>
      </form>

      {/* ── Bey picker modal ── */}
      {showPicker && (
        <BeyPickerModal
          alreadySelected={eventBeys.map((eb) => eb.beyId)}
          onPick={addBeyToEvent}
          onClose={() => setShowPicker(false)}
        />
      )}
    </section>
  )
}
