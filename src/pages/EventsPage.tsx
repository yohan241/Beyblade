import { Link, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
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
  const [tagSearch, setTagSearch] = useState('')
  const [selectedBeyIds, setSelectedBeyIds] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)

  const loading =
    beysState.status === 'loading' ||
    eventsState.status === 'loading' ||
    entriesState.status === 'loading'
  const error = beysState.error ?? eventsState.error ?? entriesState.error

  const ordinalRanks = ['1st', '2nd', '3rd']

  // Build a set of bey IDs that actually appear in at least one event
  const activeBeyIds = useMemo(() => {
    if (entriesState.status !== 'success') return new Set<string>()
    return new Set(entriesState.data.map((e) => e.beyId))
  }, [entriesState])

  // Beys available as filter tags (only those used in events), filtered by tag search
  const tagBeys = useMemo(() => {
    if (beysState.status !== 'success') return []
    return beysState.data
      .filter((b) => activeBeyIds.has(b.id))
      .filter((b) => {
        if (!tagSearch.trim()) return true
        const q = tagSearch.toLowerCase()
        return (
          b.build.toLowerCase().includes(q) ||
          (b.name ?? '').toLowerCase().includes(q)
        )
      })
  }, [beysState, activeBeyIds, tagSearch])

  function toggleBeyFilter(beyId: string) {
    setSelectedBeyIds((prev) =>
      prev.includes(beyId) ? prev.filter((id) => id !== beyId) : [...prev, beyId],
    )
  }

  // Compute events with stats + apply both name search and bey filters
  const eventsWithStats = useMemo(() => {
    if (
      eventsState.status !== 'success' ||
      beysState.status !== 'success' ||
      entriesState.status !== 'success'
    ) return []

    return eventsState.data
      .map((event) => {
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
          .sort((a, b) => (b.stats.statPoints ?? -Infinity) - (a.stats.statPoints ?? -Infinity))
          .slice(0, 3)

        return { ...event, beys: beysWithStats, topBeys }
      })
      // Name search
      .filter((event) =>
        !search.trim() || event.name.toLowerCase().includes(search.toLowerCase()),
      )
      // Bey tag filter — event must contain ALL selected beys
      .filter((event) => {
        if (selectedBeyIds.length === 0) return true
        const eventBeyIds = new Set(event.beys.map((b) => b.beyId))
        return selectedBeyIds.every((id) => eventBeyIds.has(id))
      })
  }, [eventsState, beysState, entriesState, search, selectedBeyIds])

  const hasActiveFilters = selectedBeyIds.length > 0 || search.trim().length > 0

  return (
    <section>
      <PageHeader title="Events" />

      {/* ── Search bar ── */}
      <div className="page-search-wrap">
        <input
          className="page-search"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          type="search"
          value={search}
        />
      </div>

      {/* ── Bey filter panel ── */}
      {(beysState.status === 'success' && activeBeyIds.size > 0) && (
        <div className={`bey-filter-panel${filterOpen ? ' bey-filter-panel-open' : ''}`}>
          <div className="bey-filter-header">
            <button
              className="bey-filter-toggle"
              onClick={() => setFilterOpen((v) => !v)}
              type="button"
              aria-expanded={filterOpen}
            >
              <span className="bey-filter-title">Filter by Bey</span>
              {selectedBeyIds.length > 0 && (
                <span className="bey-filter-badge">{selectedBeyIds.length}</span>
              )}
              <span className="bey-filter-chevron" aria-hidden="true">
                {filterOpen ? '▲' : '▼'}
              </span>
            </button>
            {selectedBeyIds.length > 0 && (
              <button
                className="bey-filter-clear"
                onClick={() => setSelectedBeyIds([])}
                type="button"
              >
                Clear
              </button>
            )}
          </div>

          {filterOpen && (
            <>
              {activeBeyIds.size > 6 && (
                <input
                  className="bey-filter-search"
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search beys…"
                  type="search"
                  value={tagSearch}
                />
              )}
              <div className="bey-filter-tags">
                {tagBeys.map((bey) => {
                  const isSelected = selectedBeyIds.includes(bey.id)
                  return (
                    <button
                      key={bey.id}
                      className={`bey-filter-tag${isSelected ? ' bey-filter-tag-active' : ''}`}
                      onClick={() => toggleBeyFilter(bey.id)}
                      type="button"
                      aria-pressed={isSelected}
                    >
                      {getBeyDisplayName(bey)}
                    </button>
                  )
                })}
                {tagBeys.length === 0 && tagSearch.trim() && (
                  <span className="bey-filter-empty">No beys match "{tagSearch}"</span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {loading && <p className="page-intro">Loading…</p>}
      {error && <p className="form-error-msg">{error}</p>}

      {eventsState.status === 'success' && (
        <div className="stack-list">
          {eventsWithStats.length === 0 && !loading && (
            <article className="empty-state">
              <h2>{hasActiveFilters ? 'No events match' : 'No events yet'}</h2>
              <p>
                {hasActiveFilters
                  ? 'Try adjusting your search or bey filters.'
                  : 'Tap the + button to log your first event.'}
              </p>
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
