import { calculateStatsFromRoundCodes } from '../lib/stats'
import { beys, eventBeyEntries } from '../data/mockData'
import { PageHeader } from '../components/PageHeader'

export function LeaderboardPage() {
  const overallStats = beys
    .map((bey) => {
      const allRoundCodes = eventBeyEntries
        .filter((entry) => entry.beyId === bey.id)
        .map((entry) => entry.roundCodes)
        .join('')

      return calculateStatsFromRoundCodes(bey.id, bey.name, allRoundCodes)
    })
    .filter((stats) => stats.matches >= 20)
    .sort((first, second) => (second.statPoints ?? 0) - (first.statPoints ?? 0))

  return (
    <section>
      <PageHeader title="Leaderboard" />
      <p className="page-intro">Builds with at least 20 rounds are ranked by stat points.</p>

      <div className="stack-list">
        {overallStats.length === 0 ? (
          <article className="empty-state">
            <h2>No ranked Beys yet</h2>
            <p>Add event results until a Bey reaches 20 rounds.</p>
          </article>
        ) : (
          overallStats.map((stats, index) => (
            <article className="list-card" key={stats.id}>
              <p className="rank-number">#{index + 1}</p>
              <div className="card-main">
                <h2>{stats.name}</h2>
                <p>
                  {stats.wins}–{stats.losses} ({stats.matches}) · {stats.pointsFor}–
                  {stats.pointsAgainst} points
                </p>
              </div>
              <div className="stat-summary">
                <span>{Math.round(stats.winRate)}% WR</span>
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
