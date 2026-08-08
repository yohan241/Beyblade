// ─── Shared types, helpers and sub-components used by AddEventPage + EditEventPage ───
import { useState, useRef, useEffect, useCallback } from 'react'
import { BeyName, getBeyDisplayName } from './BeyName'
import { BeyAvatar } from './BeyAvatar'
import { calculateStatsFromRoundCodes } from '../lib/stats'
import { insertBey } from '../lib/db'
import type { Bey } from '../types/tracker'

// ─── Types (exported so both pages can reference them) ────────────────────────

export type RoundEntry = {
  code: string   // '0'–'9', 'a', 'b'
  isSelf: boolean
}

export type EventBeyState = {
  beyId: string
  rounds: RoundEntry[]
  redoStack: RoundEntry[]
}

type ScoreBtn = {
  label: string
  winCode: string
  lossCode: string
  winPts: number
  lossPts: number
  canSelf: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SCORE_BUTTONS: ScoreBtn[] = [
  { label: 'Spin Finish',         winCode: '1', lossCode: '5', winPts: 1, lossPts: 1, canSelf: false },
  { label: 'Pocket Finish',       winCode: '2', lossCode: '6', winPts: 2, lossPts: 2, canSelf: true  },
  { label: 'Xtreme Finish',       winCode: '3', lossCode: '7', winPts: 3, lossPts: 3, canSelf: true  },
  { label: 'Burst Finish',        winCode: '4', lossCode: '8', winPts: 4, lossPts: 4, canSelf: true  },
  { label: 'Spin vs Stamina',     winCode: '0', lossCode: 'a', winPts: 2, lossPts: 2, canSelf: false },
  { label: 'No Contact (launch)', winCode: '9', lossCode: 'b', winPts: 2, lossPts: 2, canSelf: false },
]

// ─── Helpers (exported) ───────────────────────────────────────────────────────

export function roundsToCodeString(rounds: RoundEntry[]): string {
  return rounds.map((r) => r.code + (r.isSelf ? '.' : '')).join('')
}

export function tapeDisplay(code: string): string {
  if (code === 'a') return '0'
  if (code === 'b') return '9'
  return code
}

export function isWinCode(code: string): boolean {
  return ['0', '1', '2', '3', '4', '9'].includes(code)
}

/** Convert an existing roundCodes string back into RoundEntry[] */
export function parseCodeStringToEntries(roundCodes: string): RoundEntry[] {
  const normalized = roundCodes.replace(/\s/g, '')
  const entries: RoundEntry[] = []
  let i = 0
  while (i < normalized.length) {
    const code = normalized[i]
    const isSelf = normalized[i + 1] === '.'
    entries.push({ code, isSelf })
    i += isSelf ? 2 : 1
  }
  return entries
}

// ─── BeyStatRow ───────────────────────────────────────────────────────────────

export function BeyStatRow({
  beyId, rounds, roster,
}: { beyId: string; rounds: RoundEntry[]; roster: Bey[] }) {
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

// ─── BeyCarousel ─────────────────────────────────────────────────────────────

export function BeyCarousel({
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

// ─── ScorePanel ───────────────────────────────────────────────────────────────

export function ScorePanel({
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
  const lastRound = rounds[rounds.length - 1]

  function handleScore(btn: ScoreBtn, isWin: boolean) {
    const code = isWin ? btn.winCode : btn.lossCode
    onAddRound({ code, isSelf: btn.canSelf && isSelf })
    setIsSelf(false)
  }

  return (
    <div className="score-panel">
      <div className="score-panel-header">
        <span className="score-panel-name">{getBeyDisplayName(bey)}</span>
        <span className="score-panel-match">Match {rounds.length + 1}</span>
      </div>
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
            <button className="score-btn score-btn-loss" onClick={() => handleScore(btn, false)} type="button" aria-label={`Opponent ${btn.label}`}>
              <span className="score-btn-arrow">←</span>
            </button>
            <button className="score-btn-label" onClick={() => handleScore(btn, true)} type="button" aria-label={`You: ${btn.label} (+${btn.winPts})`}>
                            <span className="score-btn-side-pts">–{btn.lossPts}</span>
{btn.label}
              <span className="score-btn-side-pts">+{btn.winPts}</span>

            </button>
            <button className="score-btn score-btn-win" onClick={() => handleScore(btn, true)} type="button" aria-label={`You ${btn.label}`}>
              <span className="score-btn-arrow">→</span>
            </button>
          </div>
        ))}
        <div className="score-panel-footer">
          <button className={`sf-toggle${isSelf ? ' sf-toggle-on' : ''}`} onClick={() => setIsSelf((v) => !v)} type="button" aria-pressed={isSelf}>
            {isSelf ? '✓ Self Finish' : 'SF?'}
          </button>
          <span className="sf-hint">Pocket / Xtreme / Burst (wins &amp; losses)</span>
          <div className="score-undo-redo">
            <button className="score-btn-undo" onClick={onUndo} disabled={rounds.length === 0} type="button">↩ Undo</button>
            <button className="score-btn-redo" onClick={onRedo} disabled={redoStack.length === 0} type="button">Redo ↪</button>
          </div>
        </div>
        {lastRound && (
          <p className="last-round-reminder">
            Last:&nbsp;
            <span className={isWinCode(lastRound.code) ? 'stat-positive' : 'stat-negative'}>
              {tapeDisplay(lastRound.code)}{lastRound.isSelf ? '.' : ''}
            </span>
            &nbsp;—&nbsp;
            {SCORE_BUTTONS.find((b) => b.winCode === lastRound.code || b.lossCode === lastRound.code)?.label ?? 'Unknown'}
            {lastRound.isSelf ? ' (Self)' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── BeyPickerModal ───────────────────────────────────────────────────────────

export function BeyPickerModal({
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
      return b.build.toLowerCase().includes(q) || (b.name ?? '').toLowerCase().includes(q)
    })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newBuild.trim()) { setCreateError('Build string is required.'); return }
    setCreating(true)
    try {
      const created = await insertBey({ name: newNickname.trim() || undefined, build: newBuild.trim() })
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
        <div className="modal-search-wrap">
          <input autoFocus className="modal-search" onChange={(e) => setSearch(e.target.value)} placeholder="Search beys…" type="search" value={search} />
        </div>
        {!showNewForm ? (
          <button className="modal-new-bey-btn" onClick={() => setShowNewForm(true)} type="button">+ Create new Bey</button>
        ) : (
          <form className="modal-new-bey-form" onSubmit={handleCreate} noValidate>
            <p className="modal-new-bey-title">New Bey</p>
            <input autoFocus className={`form-input${createError ? ' form-input-error' : ''}`} maxLength={32} onChange={(e) => { setNewBuild(e.target.value); setCreateError('') }} placeholder="Build string e.g. WR 1-60H *" type="text" value={newBuild} />
            <input className="form-input" maxLength={48} onChange={(e) => setNewNickname(e.target.value)} placeholder="Nickname (optional)" type="text" value={newNickname} />
            {createError && <span className="form-error-msg">{createError}</span>}
            <div className="modal-new-bey-actions">
              <button className="btn-primary" disabled={creating} type="submit">{creating ? 'Creating…' : 'Create & Add'}</button>
              <button className="btn-secondary" disabled={creating} onClick={() => { setShowNewForm(false); setNewBuild(''); setNewNickname(''); setCreateError('') }} type="button">Cancel</button>
            </div>
          </form>
        )}
        {available.length === 0 && !showNewForm ? (
          <p className="modal-empty">{search.trim() ? `No beys match "${search}"` : 'All your Beys are already in this event.'}</p>
        ) : (
          <ul className="bey-pick-list">
            {available.map((bey) => (
              <li key={bey.id}>
                <button className="bey-pick-item" onClick={() => { onPick(bey.id); onClose() }} type="button">
                  <BeyAvatar bey={bey} size="md" />
                  <div><strong><BeyName bey={bey} /></strong><p>{bey.build}</p></div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── SortableBeyList ─────────────────────────────────────────────────────────

export function SortableBeyList({
  eventBeys, roster, onReorder, onSelectBey, onRemoveBey,
}: {
  eventBeys: EventBeyState[]
  roster: Bey[]
  onReorder: React.Dispatch<React.SetStateAction<EventBeyState[]>>
  onSelectBey: (id: string) => void
  onRemoveBey: (id: string) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef<{ fromIndex: number; offsetX: number; offsetY: number; itemHeight: number } | null>(null)
  const overIndex = useRef<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  function createGhost(sourceEl: HTMLElement, clientX: number, clientY: number) {
    const rect = sourceEl.getBoundingClientRect()
    const ghost = sourceEl.cloneNode(true) as HTMLDivElement
    ghost.className = 'ebe-ghost'
    ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;pointer-events:none;z-index:9999;opacity:0.85;box-shadow:0 8px 32px rgb(0 0 0/55%),0 0 16px rgb(243 196 73/30%);border:2px solid #f3c449;border-radius:0.85rem;transform:rotate(1.5deg) scale(1.03);background:#221530;`
    document.body.appendChild(ghost)
    ghostRef.current = ghost
    dragging.current!.offsetX = clientX - rect.left
    dragging.current!.offsetY = clientY - rect.top
    dragging.current!.itemHeight = rect.height
  }

  function moveGhost(clientX: number, clientY: number) {
    const g = ghostRef.current; const d = dragging.current
    if (!g || !d) return
    g.style.left = `${clientX - d.offsetX}px`
    g.style.top = `${clientY - d.offsetY}px`
  }

  function removeGhost() { ghostRef.current?.remove(); ghostRef.current = null }

  function indexAtY(clientY: number): number {
    const list = listRef.current
    if (!list || !dragging.current) return dragging.current!.fromIndex
    const items = Array.from(list.querySelectorAll<HTMLElement>('.event-bey-entry'))
    for (let i = 0; i < items.length; i++) {
      if (clientY < items[i].getBoundingClientRect().top + items[i].getBoundingClientRect().height / 2) return i
    }
    return items.length - 1
  }

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return
    moveGhost(e.clientX, e.clientY)
    const idx = indexAtY(e.clientY)
    if (idx !== overIndex.current) { overIndex.current = idx; setDropTarget(idx) }
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return
    const from = dragging.current.fromIndex
    const to = overIndex.current ?? from
    removeGhost()
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    dragging.current = null; overIndex.current = null
    setDragIndex(null); setDropTarget(null)
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
    e.preventDefault(); e.stopPropagation()
    const article = (e.currentTarget as HTMLElement).closest<HTMLElement>('.event-bey-entry')
    if (!article) return
    dragging.current = { fromIndex: index, offsetX: 0, offsetY: 0, itemHeight: 0 }
    overIndex.current = index
    createGhost(article, e.clientX, e.clientY)
    setDragIndex(index); setDropTarget(index)
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
  }

  useEffect(() => () => {
    removeGhost()
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
  }, [onPointerMove, onPointerUp])

  return (
    <div className="event-bey-list" ref={listRef}>
      {eventBeys.map(({ beyId, rounds }, index) => {
        const bey = roster.find((b) => b.id === beyId)
        const codeStr = roundsToCodeString(rounds)
        const isDragging = dragIndex === index
        const isDropTarget = dropTarget === index && dragIndex !== null && dragIndex !== index
        return (
          <article key={beyId} className={['event-bey-entry', isDragging ? 'ebe-is-dragging' : '', isDropTarget ? 'ebe-drop-target' : ''].filter(Boolean).join(' ')}>
            <span className="ebe-drag-handle" aria-hidden="true" title="Drag to reorder" onPointerDown={(e) => handleHandlePointerDown(e, index)}>⠿</span>
            <div className="ebe-left"><BeyAvatar bey={bey} size="md" /></div>
            <div className="ebe-main" onClick={() => !dragging.current && onSelectBey(beyId)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelectBey(beyId)}>
              <strong className="ebe-name"><BeyName bey={bey} /></strong>
              {codeStr.length > 0 ? (
                <code className="ebe-codes">
                  {[...codeStr].map((ch, i) => {
                    if (ch === '.') return <span key={i} className="ebe-dot">.</span>
                    return <span key={i} className={isWinCode(ch) ? 'stat-positive' : 'stat-negative'}>{tapeDisplay(ch)}</span>
                  })}
                </code>
              ) : (
                <span className="ebe-empty">No rounds yet — tap to score</span>
              )}
              <BeyStatRow beyId={beyId} rounds={rounds} roster={roster} />
            </div>
            <button className="ebe-remove" onClick={(e) => { e.stopPropagation(); onRemoveBey(beyId) }} type="button" aria-label={`Remove ${getBeyDisplayName(bey)} from event`}>✕</button>
          </article>
        )
      })}
    </div>
  )
}
