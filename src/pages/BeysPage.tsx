import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { BeyAvatar } from '../components/BeyAvatar'
import { PageHeader } from '../components/PageHeader'
import { calculateStatsFromRoundCodes, parseRoundCodes } from '../lib/stats'
import { useBeys, useAllEntries } from '../hooks/useData'
import { deleteBey } from '../lib/db'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import AddIcon from '@mui/icons-material/Add'
import type { Bey } from '../types/tracker'

// ── Round code metadata ────────────────────────────────────────────────────────

type CodeMeta = { code: string; label: string; isWin: boolean; canSelf: boolean }

const CODE_META: CodeMeta[] = [
  { code: '1', label: 'Spin Finish',        isWin: true,  canSelf: false },
  { code: '2', label: 'Pocket Finish',       isWin: true,  canSelf: true  },
  { code: '3', label: 'Xtreme Finish',       isWin: true,  canSelf: true  },
  { code: '4', label: 'Burst Finish',        isWin: true,  canSelf: true  },
  { code: '9', label: 'No Contact (launch)', isWin: true,  canSelf: false },
  { code: '0', label: 'Spin vs Stamina',     isWin: true,  canSelf: false },
  { code: '5', label: 'Opp Spin Finish',     isWin: false, canSelf: false },
  { code: '6', label: 'Opp Pocket Finish',   isWin: false, canSelf: true  },
  { code: '7', label: 'Opp Xtreme Finish',   isWin: false, canSelf: true  },
  { code: '8', label: 'Opp Burst Finish',    isWin: false, canSelf: true  },
]

function buildCodeBreakdown(roundCodes: string) {
  const parsed = parseRoundCodes(roundCodes)
  const counts: Record<string, { total: number; self: number }> = {}
  for (const { code, isSelfFinish } of parsed) {
    if (!counts[code]) counts[code] = { total: 0, self: 0 }
    counts[code].total++
    if (isSelfFinish) counts[code].self++
  }
  return counts
}

// ── Delete confirm inline ─────────────────────────────────────────────────────

function DeleteBeyConfirm({
  bey,
  onCancel,
  onDeleted,
}: {
  bey: Bey
  onCancel: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setDeleting(true)
    try {
      await deleteBey(bey.id)
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.')
      setDeleting(false)
    }
  }

  return (
    <div className="inline-confirm">
      <p className="inline-confirm-msg">
        Delete <strong>{getBeyDisplayName(bey)}</strong>? This removes all event entries for this Bey.
      </p>
      {error && <p className="form-error-msg">{error}</p>}
      <div className="inline-confirm-actions">
        <button className="btn-danger" disabled={deleting} onClick={confirm} type="button">
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button className="btn-secondary" disabled={deleting} onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BeysPage() {
  const navigate = useNavigate()
  const beysState = useBeys()
  const entriesState = useAllEntries()

  const [expandedBeyId, setExpandedBeyId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  // Local list so we can remove deleted beys without refetching
  const [deletedIds, setDeletedIds] = useState<string[]>([])

  const loading = beysState.status === 'loading' || entriesState.status === 'loading'
  const error = beysState.error ?? entriesState.error

  const visibleBeys = beysState.status === 'success'
    ? beysState.data.filter((b) => !deletedIds.includes(b.id))
    : []

  function handleDeleted(beyId: string) {
    setDeletedIds((prev) => [...prev, beyId])
    setExpandedBeyId(null)
    setConfirmDeleteId(null)
  }

  return (
    <section>
      <PageHeader title="Beys" />

      {loading && <p className="page-intro">Loading…</p>}
      {error && <p className="form-error-msg">{error}</p>}

      {beysState.status === 'success' && entriesState.status === 'success' && (
        <div className="stack-list">
          {visibleBeys.length === 0 && (
            <article className="empty-state">
              <h2>No Beys yet</h2>
              <p>Tap the + button to add your first Bey.</p>
            </article>
          )}

          {visibleBeys.map((bey) => {
            const allRoundCodes = entriesState.data
              .filter((e) => e.beyId === bey.id)
              .map((e) => e.roundCodes)
              .join('')

            const stats = calculateStatsFromRoundCodes(bey.id, getBeyDisplayName(bey), allRoundCodes)
            const isExpanded = expandedBeyId === bey.id
            const breakdown = isExpanded ? buildCodeBreakdown(allRoundCodes) : null
            const isConfirming = confirmDeleteId === bey.id

            return (
              <div
                key={bey.id}
                className={`list-card bey-card bey-accordion${isExpanded ? ' bey-accordion-open' : ''}`}
              >
                {/* ── Header row ── */}
                <button
                  className="bey-accordion-trigger"
                  onClick={() => {
                    setExpandedBeyId((prev) => (prev === bey.id ? null : bey.id))
                    setConfirmDeleteId(null)
                  }}
                  type="button"
                  aria-expanded={isExpanded}
                >
                  <BeyAvatar bey={bey} size="md" />
                  <div className="card-main">
                    <h2><BeyName bey={bey} /></h2>
                    <p>
                      <span className="stat-positive">{stats.wins}</span>–
                      <span className="stat-negative">{stats.losses}</span>{' '}
                      ({stats.matches}) ·{' '}
                      <span className="stat-positive">{stats.pointsFor}</span>–
                      <span className="stat-negative">{stats.pointsAgainst}</span> pts
                    </p>
                  </div>
                  <div className="stat-summary">
                    <span className={stats.winRate >= 50 ? 'stat-positive' : 'stat-negative'}>
                      {Math.round(stats.winRate)}% WR
                    </span>
                    <span>{Math.round(stats.scoreOverOpponentRate ?? 0)}% SOOR</span>
                    <strong>{stats.statPoints ?? '—'}</strong>
                  </div>
                  <span className="bey-accordion-chevron" aria-hidden="true">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {/* ── Expanded section ── */}
                {isExpanded && (
                  <div className="bey-breakdown">
                    {breakdown && (
                      <>
                        <p className="bey-breakdown-headline">
                          <span className={stats.winRate >= 50 ? 'stat-positive' : 'stat-negative'}>
                            {Math.round(stats.winRate)}% WR
                          </span>
                          {' · '}
                          <span>{Math.round(stats.scoreOverOpponentRate ?? 0)}% SOOR</span>
                          {' · '}
                          <strong className="bsr-stat">{stats.statPoints ?? '—'} SP</strong>
                        </p>

                        <div className="bey-breakdown-section-label">Points gained</div>
                        <ul className="bey-breakdown-list">
                          {CODE_META.filter((m) => m.isWin).map((meta) => {
                            const entry = breakdown[meta.code]
                            if (!entry) return null
                            return (
                              <li key={meta.code} className="bbd-row bbd-win">
                                <span className="bbd-code stat-positive">{meta.code}</span>
                                <span className="bbd-label">{meta.label}</span>
                                <span className="bbd-count">
                                  ×{entry.total}
                                  {meta.canSelf && entry.self > 0 && (
                                    <span className="bbd-self"> ({entry.self} SF)</span>
                                  )}
                                </span>
                              </li>
                            )
                          })}
                        </ul>

                        <div className="bey-breakdown-section-label" style={{ marginTop: '0.75rem' }}>
                          Points given
                        </div>
                        <ul className="bey-breakdown-list">
                          {CODE_META.filter((m) => !m.isWin).map((meta) => {
                            const entry = breakdown[meta.code]
                            if (!entry) return null
                            return (
                              <li key={meta.code} className="bbd-row bbd-loss">
                                <span className="bbd-code stat-negative">{meta.code}</span>
                                <span className="bbd-label">{meta.label}</span>
                                <span className="bbd-count">
                                  ×{entry.total}
                                  {meta.canSelf && entry.self > 0 && (
                                    <span className="bbd-self"> ({entry.self} SF)</span>
                                  )}
                                </span>
                              </li>
                            )
                          })}
                        </ul>

                        {allRoundCodes.length === 0 && (
                          <p className="bey-breakdown-empty">No match data recorded yet.</p>
                        )}
                      </>
                    )}

                    {/* ── Edit / Delete buttons ── */}
                    {!isConfirming && (
                      <div className="bey-accordion-actions">
                        <button
                          className="btn-edit"
                          onClick={() => navigate(`/beys/${bey.id}/edit`)}
                          type="button"
                        >
                          ✏ Edit
                        </button>
                        <button
                          className="btn-danger-outline"
                          onClick={() => setConfirmDeleteId(bey.id)}
                          type="button"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    )}

                    {/* ── Delete confirm ── */}
                    {isConfirming && (
                      <DeleteBeyConfirm
                        bey={bey}
                        onCancel={() => setConfirmDeleteId(null)}
                        onDeleted={() => handleDeleted(bey.id)}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Box sx={{ '& > :not(style)': { m: 1 }, position: 'fixed', bottom: '4rem', right: '1rem' }}>
        <Fab color="primary" aria-label="add bey" onClick={() => navigate('/beys/new')}>
          <AddIcon />
        </Fab>
      </Box>
    </section>
  )
}
