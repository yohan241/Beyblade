import { parseRoundCodes } from '../lib/stats'
import type { BuildStats } from '../types/tracker'

// ─── Code metadata ────────────────────────────────────────────────────────────

type CodeMeta = { code: string; label: string; isWin: boolean; canSelf: boolean }

export const CODE_META: CodeMeta[] = [
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
  { code: 'a', label: 'Opp Spin vs Stamina',  isWin: false, canSelf: false },
  { code: 'b', label: 'Opp No Contact',       isWin: false, canSelf: false },
]

export function buildCodeBreakdown(roundCodes: string) {
  const parsed = parseRoundCodes(roundCodes)
  const counts: Record<string, { total: number; self: number }> = {}
  for (const { code, isSelfFinish } of parsed) {
    if (!counts[code]) counts[code] = { total: 0, self: 0 }
    counts[code].total++
    if (isSelfFinish) counts[code].self++
  }
  return counts
}

// ─── Component ────────────────────────────────────────────────────────────────

type BeyBreakdownProps = {
  stats: BuildStats
  allRoundCodes: string
}

export function BeyBreakdown({ stats, allRoundCodes }: BeyBreakdownProps) {
  const breakdown = buildCodeBreakdown(allRoundCodes)

  return (
    <div className="bey-breakdown">
      <p className="bey-breakdown-headline">
        <span className={stats.winRate >= 50 ? 'stat-positive' : 'stat-negative'}>
          {Math.round(stats.winRate)}% WR
        </span>
        {' · '}
        <span className={Math.round(stats.scoreOverOpponentRate ?? 0) >= 101 ? 'stat-positive' : 'stat-negative'}>
          {Math.round(stats.scoreOverOpponentRate ?? 0)}% SOOR
        </span>
        {' · '}
        <strong className="bsr-stat">{stats.statPoints ?? '—'} SP</strong>
        {' · '}
        <span className="stat-positive">{stats.wins}W</span>
        {' '}
        <span className="stat-negative">{stats.losses}L</span>
        {' '}
        <span style={{ color: '#9c91a2' }}>({stats.matches} matches)</span>
      </p>

      <div className="bbd-two-col">
        <div>
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
        </div>

        <div>
          <div className="bey-breakdown-section-label">Points given</div>
          <ul className="bey-breakdown-list">
            {CODE_META.filter((m) => !m.isWin).map((meta) => {
              const entry = breakdown[meta.code]
              if (!entry) return null
              return (
                <li key={meta.code} className="bbd-row bbd-loss">
                  <span className="bbd-code stat-negative">{meta.code === 'a' ? '0' : meta.code === 'b' ? '9' : meta.code}</span>
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
        </div>
      </div>

      {allRoundCodes.replace(/\s/g, '').length === 0 && (
        <p className="bey-breakdown-empty">No match data recorded yet.</p>
      )}
    </div>
  )
}
