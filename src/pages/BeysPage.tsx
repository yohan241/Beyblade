import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { BeyAvatar } from '../components/BeyAvatar'
import { BeyBreakdown } from '../components/BeyBreakdown'
import { PageHeader } from '../components/PageHeader'
import { calculateStatsFromRoundCodes } from '../lib/stats'
import { useBeys, useAllEntries } from '../hooks/useData'
import { deleteBey } from '../lib/db'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import AddIcon from '@mui/icons-material/Add'
import type { Bey } from '../types/tracker'

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
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const loading = beysState.status === 'loading' || entriesState.status === 'loading'
  const error = beysState.error ?? entriesState.error

  const visibleBeys = beysState.status === 'success'
    ? beysState.data
        .filter((b) => !deletedIds.includes(b.id))
        .filter((b) => {
          if (!search.trim()) return true
          const q = search.toLowerCase()
          return (
            b.build.toLowerCase().includes(q) ||
            (b.name ?? '').toLowerCase().includes(q)
          )
        })
    : []

  function handleDeleted(beyId: string) {
    setDeletedIds((prev) => [...prev, beyId])
    setExpandedBeyId(null)
    setConfirmDeleteId(null)
  }

  return (
    <section>
      <PageHeader title="Beys" />

      <div className="page-search-wrap">
        <input
          className="page-search"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search beys…"
          type="search"
          value={search}
        />
      </div>

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
                    <span  className={Math.round(stats.scoreOverOpponentRate ?? 0) >= 101 ? 'stat-positive' : 'stat-negative'}>
                      {Math.round(stats.scoreOverOpponentRate ?? 0)}% SOOR</span>
                    <strong>{stats.statPoints ?? '—'}</strong>
                  </div>
                  <span className="bey-accordion-chevron" aria-hidden="true">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {/* ── Expanded section ── */}
                {isExpanded && (
                  <div className="bey-breakdown-wrapper">
                    <BeyBreakdown stats={stats} allRoundCodes={allRoundCodes} />

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
