import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
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
          const stats = calculateStatsFromRoundCodes(entry.id, bey?.name ?? 'Unknown Bey', entry.roundCodes)

          return (
            <article className="list-card" key={entry.id}>
              <div className="card-main">
                <h2>{stats.name}</h2>
                <code>{entry.roundCodes}</code>
              </div>
              <div className="stat-summary">
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
