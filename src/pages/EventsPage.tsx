import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { beys, eventBeyEntries, events } from '../data/mockData'
import { calculateStatsFromRoundCodes } from '../lib/stats'
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';


export function EventsPage() {

  const eventsWithStats = events.map((event) => {
    const beysWithStats = eventBeyEntries
      .filter((entry) => entry.eventId === event.id)
      .map((entry) => {
        const bey = beys.find((candidate) => candidate.id === entry.beyId)

        return {
          ...entry,
          bey,
          stats: calculateStatsFromRoundCodes(entry.id, getBeyDisplayName(bey), entry.roundCodes),
        }
      })
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
                  {event.topBeys.map(({ id, bey, stats }, index) => (
                    <li key={id} style={{marginLeft: '0.5rem'}}>
                      <span>{ordinalRanks[index]} </span> 
                      <span><BeyName bey={bey} /></span>
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
      <Box sx={{ '& > :not(style)': { m: 1 }, position: 'fixed', bottom: '4rem', right: '1rem' }}>
      <Fab color="primary" aria-label="add">
        <AddIcon />
      </Fab>
    </Box>
    </section>
  )
}
