import { useState } from 'react'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { PageHeader } from '../components/PageHeader'
import { beys, eventBeyEntries } from '../data/mockData'
import { calculateStatsFromRoundCodes } from '../lib/stats'

type SortOption = 'statPoints' | 'winRate' | 'scoreOverOpponentRate'

export function LeaderboardPage() {
  // Keep as a string so the field can be empty without snapping back to 0
  const [minimumMatchesInput, setMinimumMatchesInput] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('statPoints')

  const minimumMatches = minimumMatchesInput === '' ? 0 : Math.max(0, Number(minimumMatchesInput))

  const overallStats = beys
    .map((bey) => {
      const allRoundCodes = eventBeyEntries
        .filter((entry) => entry.beyId === bey.id)
        .map((entry) => entry.roundCodes)
        .join('')

      return calculateStatsFromRoundCodes(bey.id, getBeyDisplayName(bey), allRoundCodes)
    })
    .filter((stats) => stats.matches >= minimumMatches)
    .sort((first, second) => {
      const firstValue = first[sortBy] ?? -Infinity
      const secondValue = second[sortBy] ?? -Infinity

      return secondValue - firstValue || first.name.localeCompare(second.name)
    })

  return (
    <section>
      <PageHeader title="Leaderboard" />

      <form className="leaderboard-controls" onSubmit={(event) => event.preventDefault()}>
        <label>
          Minimum matches
          <input
            min="0"
            onChange={(e) => {
              const raw = e.target.value
              // Allow empty, or any non-negative integer
              if (raw === '' || /^\d+$/.test(raw)) setMinimumMatchesInput(raw)
            }}
            placeholder="0"
            type="number"
            value={minimumMatchesInput}
          />
        </label>
        <label>
          Sort by
          <select onChange={(event) => setSortBy(event.target.value as SortOption)} value={sortBy}>
            <option value="statPoints">Stat points</option>
            <option value="winRate">Win rate</option>
            <option value="scoreOverOpponentRate">SOOR</option>
          </select>
        </label>
      </form>

      <div className="stack-list">
        {overallStats.length === 0 ? (
          <article className="empty-state">
            <h2>No Beys match these filters</h2>
            <p>Try lowering the minimum matches requirement.</p>
          </article>
        ) : (
          overallStats.map((stats, index) => (
            <article className="list-card" key={stats.id}>
              <p className="rank-number">#{index + 1}</p>
              <div className="card-main">
                <h2><BeyName bey={beys.find((bey) => bey.id === stats.id)} /></h2>
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
          ))
        )}
      </div>
    </section>
  )
}
