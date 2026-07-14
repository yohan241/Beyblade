import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { beys, eventBeyEntries, events } from '../data/mockData'
import { calculateStatsFromRoundCodes } from '../lib/stats'

export function EventsPage() {

  const eventsWithStats = events.map((event) => {
    const beysWithStats = eventBeyEntries
      .filter((entry) => entry.eventId === event.id)
      .map((entry) => ({
        ...entry,
        stats: calculateStatsFromRoundCodes(
          entry.id,
          beys.find((bey) => bey.id === entry.beyId)?.name ?? 'Unknown Bey',
          entry.roundCodes,
        ),
      }))
    const topBeys = beysWithStats
      .sort((first, second) => (second.stats.statPoints ?? -Infinity) - (first.stats.statPoints ?? -Infinity))
      .slice(0, 3)

    return { ...event, beys: beysWithStats, topBeys }
  });

  const ordinalRanks = ['1st', '2nd', '3rd']
  return (
    <section>
      <PageHeader  title="Events" />
      <div className="stack-list">
        {eventsWithStats.map((event) => (
          <Link className="list-card event-link" key={event.id} to={event.id}>
            <div className="card-main">
              <div className="event-title-row">
                <h2>{event.name}</h2>
                <p>{new Date(`${event.eventDate}T00:00:00`).toLocaleDateString()}</p>
              </div>
              <p>{event.beys.length} Beys Total</p>
              <h5 style={{ marginTop: '1rem', marginBottom: '0rem' }}>Top Beys:</h5>
              {event.topBeys.length > 0 && (
                <ol className="top-beys" aria-label="Top Beys by stat points" style={{ marginTop: '0.2rem', marginBottom: '0rem' }}>
                  {event.topBeys.map(({ id, stats }, index) => (
                    <li key={id} style={{marginLeft: '0.5rem'}}>
                      <span>{ordinalRanks[index]} </span> 
                      <span>{stats.name}</span>
                      <strong>{stats.statPoints ?? '—'} pts</strong>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <span aria-hidden="true" style={{ fontSize: '1.5rem', color: '#15221d' }}>›</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
