import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { calculateStatsFromRoundCodes } from '../lib/stats'
import { useBeys, useEvents, useAllEntries } from '../hooks/useData'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import AddIcon from '@mui/icons-material/Add'

export function EventsPage() {
  const navigate = useNavigate()
  const beysState = useBeys()
  const eventsState = useEvents()
  const entriesState = useAllEntries()
  const [search, setSearch] = useState('')

  const loading =
    beysState.status === 'loading' ||
    eventsState.status === 'loading' ||
    entriesState.status === 'loading'
  const error = beysState.error ?? eventsState.error ?? entriesState.error

  const ordinalRanks = ['1st', '2nd', '3rd']

  const eventsWithStats =
    eventsState.status === 'success' &&
    beysState.status === 'success' &&
    entriesState.status === 'success'
      ? eventsState.data.map((event) => {
          const beysWithStats = entriesState.data
            .filter((entry) => entry.eventId === event.id)
            .map((entry) => {
              const bey = beysState.data.find((b) => b.id === entry.beyId)
              return {
                ...entry,
                bey,
                stats: calculateStatsFromRoundCodes(
                  entry.id,
                  getBeyDisplayName(bey),
                  entry.roundCodes,
                ),
              }
            })

          const topBeys = [...beysWithStats]
            .sort(
              (a, b) =>
                (b.stats.statPoints ?? -Infinity) - (a.stats.statPoints ?? -Infinity),
            )
            .slice(0, 3)

          return { ...event, beys: beysWithStats, topBeys }
        })
          .filter((event) =>
            !search.trim() || event.name.toLowerCase().includes(search.toLowerCase())
          )
      : []

  return (
    <section>
      <PageHeader title="Events" />

      <div className="page-search-wrap">
        <input
          className="page-search"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          type="search"
          value={search}
        />
      </div>

      {loading && <p className="page-intro">Loading…</p>}
      {error && <p className="form-error-msg">{error}</p>}

      {eventsState.status === 'success' && (
        <div className="stack-list">
          {eventsWithStats.length === 0 && !loading && (
            <article className="empty-state">
              <h2>No events yet</h2>
              <p>Tap the + button to log your first event.</p>
            </article>
          )}
          {eventsWithStats.map((event) => (
            <Link className="list-card event-link" key={event.id} to={event.id}>
              <div className="card-main">
                <div className="event-title-row">
                  <h2>{event.name}</h2>
                  <p>{new Date(`${event.eventDate}T00:00:00`).toLocaleDateString()}</p>
                </div>
                <p>{event.beys.length} Beys Total</p>
                {event.topBeys.length > 0 && (
                  <>
                    <h5 style={{ marginTop: '1rem', marginBottom: '0' }}>Top Beys:</h5>
                    <ol
                      className="top-beys"
                      aria-label="Top Beys by stat points"
                      style={{ marginTop: '0.2rem', marginBottom: '0' }}
                    >
                      {event.topBeys.map(({ id, bey, stats }, index) => (
                        <li key={id} style={{ marginLeft: '0.5rem' }}>
                          <span>{ordinalRanks[index]} </span>
                          <span><BeyName bey={bey} /></span>
                          <strong>{stats.statPoints ?? '—'} pts</strong>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
              <span aria-hidden="true" style={{ fontSize: '1.5rem', color: '#15221d' }}>›</span>
            </Link>
          ))}
        </div>
      )}

      <Box sx={{ '& > :not(style)': { m: 1 }, position: 'fixed', bottom: '4rem', right: '1rem' }}>
        <Fab color="primary" aria-label="add event" onClick={() => navigate('/events/new')}>
          <AddIcon />
        </Fab>
      </Box>
    </section>
  )
}
