import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { BeyAvatar } from '../components/BeyAvatar'
import { calculateStatsFromRoundCodes } from '../lib/stats'
import { useBeys } from '../hooks/useData'
import { insertEvent, insertEntries, insertBey } from '../lib/db'
import type { Bey } from '../types/tracker'

// ─── Types ────────────────────────────────────────────────────────────────────

type RoundEntry = {
  code: string   // '0'–'9', 'a', 'b'
  isSelf: boolean
}

type EventBeyState = {
  beyId: string
  rounds: RoundEntry[]
  redoStack: RoundEntry[]   // rounds that were undone, available to redo
}

type ScoreBtn = {
  label: string
  winCode: string
  lossCode: string
  winPts: number
  lossPts: number
  canSelf: boolean
  // display overrides: what digit/char to show in the tape for the loss code
  lossDisplay?: string
}

// lossDisplay is what the user sees in the round tape for a/b codes
const SCORE_BUTTONS: ScoreBtn[] = [
  { label: 'Spin Finish',         winCode: '1', lossCode: '5', winPts: 1, lossPts: 1, canSelf: false },
  { label: 'Pocket Finish',       winCode: '2', lossCode: '6', winPts: 2, lossPts: 2, canSelf: true  },
  { label: 'Xtreme Finish',       winCode: '3', lossCode: '7', winPts: 3, lossPts: 3, canSelf: true  },
  { label: 'Burst Finish',        winCode: '4', lossCode: '8', winPts: 4, lossPts: 4, canSelf: true  },
  { label: 'Spin vs Stamina',     winCode: '0', lossCode: 'a', winPts: 2, lossPts: 2, canSelf: false, lossDisplay: '0' },
  { label: 'No Contact (launch)', winCode: '9', lossCode: 'b', winPts: 2, lossPts: 2, canSelf: false, lossDisplay: '9' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundsToCodeString(rounds: RoundEntry[]): string {
  return rounds.map((r) => r.code + (r.isSelf ? '.' : '')).join('')
}

/** What to show in the round tape for a given code */
function tapeDisplay(code: string): string {
  if (code === 'a') return '0'
  if (code === 'b') return '9'
  return code
}

function isWinCode(code: string): boolean {
  return ['0', '1', '2', '3', '4', '9'].includes(code)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BeyCarousel({
  entries, roster, activeBeyId, onSelect, onAddBey,
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
            {stats && <span className="carousel-chip-stat">{stats.wins}–{stats.losses}</span>}
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

function BeyStatRow({ beyId, rounds, roster }: { beyId: string; rounds: RoundEntry[]; roster: Bey[] }) {
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
  beyId, rounds, redoStack, roster, onAddRound, onUndo, onRedo,
}: {
  beyId: string
  rounds: RoundEntry[]
  redoStack: RoundEntry[]
  roster: Bey[]
  onAddRound: (round: RoundEntry) => void
  onUndo: () => void
  onRedo: () => void
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

      {/* Round tape */}
      {rounds.length > 0 && (
        <div className="round-tape">
          {rounds.map((r, i) => (
            <span key={i} className={`tape-code ${isWinCode(r.code) ? 'stat-positive' : 'stat-negative'}`}>
              {tapeDisplay(r.code)}{r.isSelf ? '.' : ''}
            </span>
          ))}
        </div>
      )}

      <BeyStatRow beyId={beyId} rounds={rounds} roster={roster} />

      <div className="score-btn-grid">
        {SCORE_BUTTONS.map((btn) => (
          <div key={btn.label} className="score-btn-row">
            {/* Loss arrow — shows -pts */}
            <button
              className="score-btn score-btn-loss"
              onClick={() => handleScore(btn, false)}
              type="button"
              aria-label={`Opponent ${btn.label}`}
            >
              <span className="score-btn-arrow">←</span>
              <span className="score-btn-side-pts">–{btn.lossPts}</span>
            </button>

            {/* Centre label */}
            <button
              className="score-btn-label"
              onClick={() => handleScore(btn, true)}
              type="button"
              aria-label={`You: ${btn.label} (+${btn.winPts})`}
            >
              {btn.label}
            </button>

            {/* Win arrow — shows +pts */}
            <button
              className="score-btn score-btn-win"
              onClick={() => handleScore(btn, true)}
              type="button"
              aria-label={`You ${btn.label}`}
            >
              <span className="score-btn-side-pts">+{btn.winPts}</span>
              <span className="score-btn-arrow">→</span>
            </button>
          </div>
        ))}

        {/* Footer: SF toggle + undo + redo */}
        <div className="score-panel-footer">
          <button
            className={`sf-toggle${isSelf ? ' sf-toggle-on' : ''}`}
            onClick={() => setIsSelf((v) => !v)}
            type="button"
            aria-pressed={isSelf}
          >
            {isSelf ? '✓ Self Finish' : 'SF?'}
          </button>
          <span className="sf-hint">Pocket / Xtreme / Burst (wins &amp; losses)</span>
          <div className="score-undo-redo">
            <button
              className="score-btn-undo"
              onClick={onUndo}
              disabled={rounds.length === 0}
              type="button"
              aria-label="Undo last round"
            >↩ Undo</button>
            <button
              className="score-btn-redo"
              onClick={onRedo}
              disabled={redoStack.length === 0}
              type="button"
              aria-label="Redo last undone round"
            >Redo ↪</button>
          </div>
        </div>

        {/* Last round reminder */}
        {lastRound && (
          <p className="last-round-reminder">
            Last:&nbsp;
            <span className={isWinCode(lastRound.code) ? 'stat-positive' : 'stat-negative'}>
              {tapeDisplay(lastRound.code)}{lastRound.isSelf ? '.' : ''}
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
  roster, alreadySelected, onPick, onClose, onBeyCreated,
}: {
  roster: Bey[]
  alreadySelected: string[]
  onPick: (beyId: string) => void
  onClose: () => void
  onBeyCreated: (bey: Bey) => void
}) {
  const [search, setSearch] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newBuild, setNewBuild] = useState('')
  const [newNickname, setNewNickname] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const available = roster
    .filter((b) => !alreadySelected.includes(b.id))
    .filter((b) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        b.build.toLowerCase().includes(q) ||
        (b.name ?? '').toLowerCase().includes(q)
      )
    })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newBuild.trim()) { setCreateError('Build string is required.'); return }
    setCreating(true)
    try {
      const created = await insertBey({
        name: newNickname.trim() || undefined,
        build: newBuild.trim(),
      })
      onBeyCreated(created)
      onPick(created.id)
      onClose()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create Bey.')
      setCreating(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Pick a Bey">
      <div className="modal-sheet">
        <div className="modal-header">
          <h2 className="modal-title">Add Bey to Event</h2>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Close">✕</button>
        </div>

        {/* Search */}
        <div className="modal-search-wrap">
          <input
            autoFocus
            className="modal-search"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search beys…"
            type="search"
            value={search}
          />
        </div>

        {/* New bey quick-add */}
        {!showNewForm ? (
          <button
            className="modal-new-bey-btn"
            onClick={() => setShowNewForm(true)}
            type="button"
          >
            + Create new Bey
          </button>
        ) : (
          <form className="modal-new-bey-form" onSubmit={handleCreate} noValidate>
            <p className="modal-new-bey-title">New Bey</p>
            <input
              autoFocus
              className={`form-input${createError ? ' form-input-error' : ''}`}
              maxLength={32}
              onChange={(e) => { setNewBuild(e.target.value); setCreateError('') }}
              placeholder="Build string e.g. WR 1-60H *"
              type="text"
              value={newBuild}
            />
            <input
              className="form-input"
              maxLength={48}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="Nickname (optional)"
              type="text"
              value={newNickname}
            />
            {createError && <span className="form-error-msg">{createError}</span>}
            <div className="modal-new-bey-actions">
              <button className="btn-primary" disabled={creating} type="submit">
                {creating ? 'Creating…' : 'Create & Add'}
              </button>
              <button
                className="btn-secondary"
                disabled={creating}
                onClick={() => { setShowNewForm(false); setNewBuild(''); setNewNickname(''); setCreateError('') }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Bey list */}
        {available.length === 0 && !showNewForm ? (
          <p className="modal-empty">
            {search.trim() ? `No beys match "${search}"` : 'All your Beys are already in this event.'}
          </p>
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

// ─── Sortable bey list with pointer-based drag + ghost ───────────────────────

function SortableBeyList({
  eventBeys,
  roster,
  onReorder,
  onSelectBey,
  onRemoveBey,
}: {
  eventBeys: EventBeyState[]
  roster: Bey[]
  onReorder: React.Dispatch<React.SetStateAction<EventBeyState[]>>
  onSelectBey: (id: string) => void
  onRemoveBey: (id: string) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)

  // Drag state stored in refs so pointer handlers don't need re-renders
  const dragging = useRef<{
    fromIndex: number
    offsetX: number
    offsetY: number
    itemHeight: number
  } | null>(null)
  const overIndex = useRef<number | null>(null)

  // React state only for the visual drop-target indicator
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Build and inject the ghost element into the body
  function createGhost(sourceEl: HTMLElement, clientX: number, clientY: number) {
    const rect = sourceEl.getBoundingClientRect()
    const ghost = sourceEl.cloneNode(true) as HTMLDivElement
    ghost.className = 'ebe-ghost'
    ghost.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.85;
      box-shadow: 0 8px 32px rgb(0 0 0 / 55%), 0 0 16px rgb(243 196 73 / 30%);
      border: 2px solid #f3c449;
      border-radius: 0.85rem;
      transform: rotate(1.5deg) scale(1.03);
      transition: box-shadow 0.1s;
      background: #221530;
    `
    document.body.appendChild(ghost)
    ghostRef.current = ghost
    dragging.current!.offsetX = clientX - rect.left
    dragging.current!.offsetY = clientY - rect.top
    dragging.current!.itemHeight = rect.height
  }

  function moveGhost(clientX: number, clientY: number) {
    const g = ghostRef.current
    const d = dragging.current
    if (!g || !d) return
    g.style.left = `${clientX - d.offsetX}px`
    g.style.top = `${clientY - d.offsetY}px`
  }

  function removeGhost() {
    ghostRef.current?.remove()
    ghostRef.current = null
  }

  // Compute which index the ghost is hovering over from pointer Y
  function indexAtY(clientY: number): number {
    const list = listRef.current
    if (!list || !dragging.current) return dragging.current!.fromIndex
    const items = Array.from(list.querySelectorAll<HTMLElement>('.event-bey-entry'))
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) return i
    }
    return items.length - 1
  }

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return
    moveGhost(e.clientX, e.clientY)
    const idx = indexAtY(e.clientY)
    if (idx !== overIndex.current) {
      overIndex.current = idx
      setDropTarget(idx)
    }
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return
    const from = dragging.current.fromIndex
    const to = overIndex.current ?? from
    removeGhost()
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    dragging.current = null
    overIndex.current = null
    setDragIndex(null)
    setDropTarget(null)
    if (from !== to) {
      onReorder((prev) => {
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      })
    }
  }, [onPointerMove, onReorder])

  function handleHandlePointerDown(e: React.PointerEvent, index: number) {
    e.preventDefault()
    e.stopPropagation()
    const article = (e.currentTarget as HTMLElement).closest<HTMLElement>('.event-bey-entry')
    if (!article) return
    dragging.current = { fromIndex: index, offsetX: 0, offsetY: 0, itemHeight: 0 }
    overIndex.current = index
    createGhost(article, e.clientX, e.clientY)
    setDragIndex(index)
    setDropTarget(index)
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
  }

  // Clean up if component unmounts mid-drag
  useEffect(() => {
    return () => {
      removeGhost()
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
    }
  }, [onPointerMove, onPointerUp])

  return (
    <div className="event-bey-list" ref={listRef}>
      {eventBeys.map(({ beyId, rounds }, index) => {
        const bey = roster.find((b) => b.id === beyId)
        const codeStr = roundsToCodeString(rounds)
        const isDragging = dragIndex === index
        const isDropTarget = dropTarget === index && dragIndex !== null && dragIndex !== index

        return (
          <article
            key={beyId}
            className={[
              'event-bey-entry',
              isDragging ? 'ebe-is-dragging' : '',
              isDropTarget ? 'ebe-drop-target' : '',
            ].filter(Boolean).join(' ')}
          >
            {/* Drag handle */}
            <span
              className="ebe-drag-handle"
              aria-hidden="true"
              title="Drag to reorder"
              onPointerDown={(e) => handleHandlePointerDown(e, index)}
            >⠿</span>

            <div className="ebe-left">
              <BeyAvatar bey={bey} size="md" />
            </div>
            <div
              className="ebe-main"
              onClick={() => !dragging.current && onSelectBey(beyId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectBey(beyId)}
            >
              <strong className="ebe-name"><BeyName bey={bey} /></strong>
              {codeStr.length > 0 ? (
                <code className="ebe-codes">
                  {[...codeStr].map((ch, i) => {
                    if (ch === '.') return <span key={i} className="ebe-dot">.</span>
                    return (
                      <span key={i} className={isWinCode(ch) ? 'stat-positive' : 'stat-negative'}>
                        {tapeDisplay(ch)}
                      </span>
                    )
                  })}
                </code>
              ) : (
                <span className="ebe-empty">No rounds yet — tap to score</span>
              )}
              <BeyStatRow beyId={beyId} rounds={rounds} roster={roster} />
            </div>
            <button
              className="ebe-remove"
              onClick={(e) => { e.stopPropagation(); onRemoveBey(beyId) }}
              type="button"
              aria-label={`Remove ${getBeyDisplayName(bey)} from event`}
            >✕</button>
          </article>
        )
      })}
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
  // Extra beys created from the picker that aren't in the fetched roster yet
  const [localRoster, setLocalRoster] = useState<Bey[]>([])

  const panelRef = useRef<HTMLDivElement>(null)
  const fetchedRoster = beysState.status === 'success' ? beysState.data : []
  // Merge fetched roster with any beys created mid-session
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

  function addRound(beyId: string, round: RoundEntry) {
    setEventBeys((prev) =>
      prev.map((eb) =>
        eb.beyId === beyId
          ? { ...eb, rounds: [...eb.rounds, round], redoStack: [] }
          : eb,
      ),
    )
  }

  function undoLastRound(beyId: string) {
    setEventBeys((prev) =>
      prev.map((eb) => {
        if (eb.beyId !== beyId || eb.rounds.length === 0) return eb
        const last = eb.rounds[eb.rounds.length - 1]
        return {
          ...eb,
          rounds: eb.rounds.slice(0, -1),
          redoStack: [last, ...eb.redoStack],
        }
      }),
    )
  }

  function redoLastRound(beyId: string) {
    setEventBeys((prev) =>
      prev.map((eb) => {
        if (eb.beyId !== beyId || eb.redoStack.length === 0) return eb
        const [next, ...rest] = eb.redoStack
        return {
          ...eb,
          rounds: [...eb.rounds, next],
          redoStack: rest,
        }
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

      {/* Bey list — hidden when score panel is open, supports drag-to-reorder */}
      {eventBeys.length > 0 && !activeBeyId && (
        <SortableBeyList
          eventBeys={eventBeys}
          roster={roster}
          onReorder={setEventBeys}
          onSelectBey={(id) => setActiveBeyId((prev) => (prev === id ? null : id))}
          onRemoveBey={removeBeyFromEvent}
        />
      )}

      {/* Score panel */}
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
