import { useState } from 'react'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { BeyAvatar } from '../components/BeyAvatar'
import { PageHeader } from '../components/PageHeader'
import { calculateStatsFromRoundCodes } from '../lib/stats'
import { useBeys, useAllEntries } from '../hooks/useData'

type SortOption = 'statPoints' | 'winRate' | 'scoreOverOpponentRate'

export function LeaderboardPage() {
  const beysState = useBeys()
  const entriesState = useAllEntries()
  const [minimumMatchesInput, setMinimumMatchesInput] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('statPoints')

  const minimumMatches =
    minimumMatchesInput === '' ? 0 : Math.max(0, Number(minimumMatchesInput))

  const loading = beysState.status === 'loading' || entriesState.status === 'loading'
  const error = beysState.error ?? entriesState.error

  const overallStats =
    beysState.status === 'success' && entriesState.status === 'success'
      ? beysState.data
          .map((bey) => {
            const allRoundCodes = entriesState.data
              .filter((e) => e.beyId === bey.id)
              .map((e) => e.roundCodes)
              .join('')
            return calculateStatsFromRoundCodes(bey.id, getBeyDisplayName(bey), allRoundCodes)
          })
          .filter((s) => s.matches >= minimumMatches)
          .sort((a, b) => {
            const av = a[sortBy] ?? -Infinity
            const bv = b[sortBy] ?? -Infinity
            return bv - av || a.name.localeCompare(b.name)
          })
      : []

  return (
    <section>
      <PageHeader title="Leaderboard" />

      <form className="leaderboard-controls" onSubmit={(e) => e.preventDefault()}>
        <label>
          Minimum matches
          <input
            min="0"
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '' || /^\d+$/.test(raw)) setMinimumMatchesInput(raw)
            }}
            placeholder="0"
            type="number"
            value={minimumMatchesInput}
          />
        </label>
        <label>
          Sort by
          <select onChange={(e) => setSortBy(e.target.value as SortOption)} value={sortBy}>
            <option value="statPoints">Stat points</option>
            <option value="winRate">Win rate</option>
            <option value="scoreOverOpponentRate">SOOR</option>
          </select>
        </label>
      </form>

      {loading && <p className="page-intro">Loading…</p>}
      {error && <p className="form-error-msg">{error}</p>}

      <div className="stack-list">
        {!loading && overallStats.length === 0 && (
          <article className="empty-state">
            <h2>No Beys match these filters</h2>
            <p>Try lowering the minimum matches requirement.</p>
          </article>
        )}
        {overallStats.map((stats, index) => {
          const bey = beysState.status === 'success'
            ? beysState.data.find((b) => b.id === stats.id)
            : undefined
          return (
            <article className="list-card" key={stats.id}>
              <p className="rank-number">#{index + 1}</p>
              <BeyAvatar bey={bey} size="md" />
              <div className="card-main">
                <h2><BeyName bey={bey} /></h2>
                <p>
                  <span className="stat-positive">{stats.wins}</span>–
                  <span className="stat-negative">{stats.losses}</span> ({stats.matches}) ·{' '}
                  <span className="stat-positive">{stats.pointsFor}</span>–
                  <span className="stat-negative">{stats.pointsAgainst}</span> points
                </p>
              </div>
              <div className="stat-summary">
                <span className={stats.winRate >= 50 ? 'stat-positive' : 'stat-negative'}>
                  {Math.round(stats.winRate)}% WR
                </span>
                <span>{Math.round(stats.scoreOverOpponentRate ?? 0)}% SOOR</span>
                <strong>{stats.statPoints ?? '—'}</strong>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
