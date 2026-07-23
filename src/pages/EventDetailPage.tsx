import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { beys, eventBeyEntries, events } from '../data/mockData'
import { calculateStatsFromRoundCodes } from '../lib/stats'

export function EventDetailPage() {
  const { eventId } = useParams()
  const event = events.find((candidate) => candidate.id === eventId)
  const entries = eventBeyEntries.filter((entry) => entry.eventId === eventId)

  if (!event) {
    return (
      <section>
        <PageHeader title="Event not found" />
        <Link className="text-link" to="/events">Return to events</Link>
      </section>
    )
  }

  return (
    <section>
      <PageHeader action={<Link className="text-link" to="/events">Back</Link>} eyebrow={event.eventDate} title={event.name} />
      <p className="page-intro">Each row is one Bey’s complete result string for this event.</p>
      <div className="stack-list">
        {entries.map((entry) => {
          const bey = beys.find((candidate) => candidate.id === entry.beyId)
          const stats = calculateStatsFromRoundCodes(entry.id, getBeyDisplayName(bey), entry.roundCodes)

          return (
            <article className="list-card" key={entry.id}>
              <div className="card-main">
                <h2><BeyName bey={bey} /></h2>
                <code aria-label={`Round codes: ${entry.roundCodes}`}>
                  {[...entry.roundCodes].map((roundCode, index) => {
                    const resultClass = /[5-8]/.test(roundCode)
                      ? 'stat-negative'
                      : /[0-4]|9/.test(roundCode)
                        ? 'stat-positive'
                        : 'round-code-marker'

                    return <span className={resultClass} key={`${roundCode}-${index}`}>{roundCode}</span>
                  })}
                </code>
              </div>
              <div className="stat-summary event-detail-stats">
                <span className="win-loss-summary">
                  <span className="stat-positive">{stats.wins}</span>–
                  <span className="stat-negative">{stats.losses}</span>
                </span>
                <span>{stats.wins}–{stats.losses}</span>
                <span>{stats.pointsFor}–{stats.pointsAgainst} points</span>
                <strong>{stats.statPoints ?? '—'}</strong>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
