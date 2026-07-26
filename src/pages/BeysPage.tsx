import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { PageHeader } from '../components/PageHeader'
import { beys, eventBeyEntries } from '../data/mockData'
import { calculateStatsFromRoundCodes, parseRoundCodes } from '../lib/stats'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import AddIcon from '@mui/icons-material/Add'

// ── Round code metadata for the breakdown display ──────────────────────────

type CodeMeta = {
  code: string
  label: string
  isWin: boolean
  canSelf: boolean
}

const CODE_META: CodeMeta[] = [
  { code: '1', label: 'Spin Finish',         isWin: true,  canSelf: false },
  { code: '2', label: 'Pocket Finish',        isWin: true,  canSelf: true  },
  { code: '3', label: 'Xtreme Finish',        isWin: true,  canSelf: true  },
  { code: '4', label: 'Burst Finish',         isWin: true,  canSelf: true  },
  { code: '9', label: 'No Contact (launch)',  isWin: true,  canSelf: false },
  { code: '0', label: 'Spin vs Stamina',      isWin: true,  canSelf: false },
  { code: '5', label: 'Opp Spin Finish',      isWin: false, canSelf: false },
  { code: '6', label: 'Opp Pocket Finish',    isWin: false, canSelf: true  },
  { code: '7', label: 'Opp Xtreme Finish',    isWin: false, canSelf: true  },
  { code: '8', label: 'Opp Burst Finish',     isWin: false, canSelf: true  },
]

// Count occurrences of each code + self-finish variants from a code string
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

export function BeysPage() {
  const navigate = useNavigate()
  const [expandedBeyId, setExpandedBeyId] = useState<string | null>(null)

  const beyStats = beys
    .map((bey) => {
      const allRoundCodes = eventBeyEntries
        .filter((entry) => entry.beyId === bey.id)
        .map((entry) => entry.roundCodes)
        .join('')

      return {
        bey,
        allRoundCodes,
        stats: calculateStatsFromRoundCodes(bey.id, getBeyDisplayName(bey), allRoundCodes),
      }
    })
    .sort((a, b) =>
      new Date(b.bey.createdAt).getTime() - new Date(a.bey.createdAt).getTime()
    )

  function toggleExpand(beyId: string) {
    setExpandedBeyId((prev) => (prev === beyId ? null : beyId))
  }

  return (
    <section>
      <PageHeader title="Beys" />

      <div className="stack-list">
        {beyStats.map(({ bey, allRoundCodes, stats }) => {
          const isExpanded = expandedBeyId === bey.id
          const breakdown = isExpanded ? buildCodeBreakdown(allRoundCodes) : null

          return (
            <div
              key={bey.id}
              className={`list-card bey-card bey-accordion${isExpanded ? ' bey-accordion-open' : ''}`}
            >
              {/* ── Collapsed header row (always visible) ── */}
              <button
                className="bey-accordion-trigger"
                onClick={() => toggleExpand(bey.id)}
                type="button"
                aria-expanded={isExpanded}
              >
                <div className="bey-image-placeholder" aria-hidden="true" />
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

              {/* ── Expanded breakdown ── */}
              {isExpanded && breakdown && (
                <div className="bey-breakdown">
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

                  <div className="bey-breakdown-section-label" style={{ marginTop: '0.75rem' }}>Points given</div>
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
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Box sx={{ '& > :not(style)': { m: 1 }, position: 'fixed', bottom: '4rem', right: '1rem' }}>
        <Fab color="primary" aria-label="add bey" onClick={() => navigate('/beys/new')}>
          <AddIcon />
        </Fab>
      </Box>
    </section>
  )
}
