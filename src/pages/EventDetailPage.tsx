import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { BeyAvatar } from '../components/BeyAvatar'
import { calculateStatsFromRoundCodes } from '../lib/stats'
import { useBeys, useEvent, useEntriesForEvent } from '../hooks/useData'
import { deleteEvent } from '../lib/db'

export function EventDetailPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const eventState = useEvent(eventId)
  const entriesState = useEntriesForEvent(eventId)
  const beysState = useBeys()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loading =
    eventState.status === 'loading' ||
    entriesState.status === 'loading' ||
    beysState.status === 'loading'

  const error = eventState.error ?? entriesState.error ?? beysState.error

  async function handleDeleteEvent() {
    if (!eventId) return
    setDeleting(true)
    try {
      await deleteEvent(eventId)
      navigate('/events')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete event.')
      setDeleting(false)
    }
  }

  if (loading) {
    return <section><PageHeader title="Loading…" /></section>
  }

  if (error || (eventState.status === 'success' && !eventState.data)) {
    return (
      <section>
        <PageHeader title="Event not found" />
        <Link className="text-link" to="/events">Return to events</Link>
      </section>
    )
  }

  if (
    eventState.status !== 'success' ||
    entriesState.status !== 'success' ||
    beysState.status !== 'success'
  ) return null

  const event = eventState.data!
  const entries = entriesState.data
  const beys = beysState.data

  return (
    <section>
      <PageHeader
        action={<Link className="text-link" to="/events">Back</Link>}
        eyebrow={event.eventDate}
        title={event.name}
      />

      {/* ── Edit / Delete event actions ── */}
      <div className="event-detail-actions">
        <button
          className="btn-edit"
          onClick={() => navigate(`/events/${eventId}/edit`)}
          type="button"
        >
          ✏ Edit event
        </button>
        <button
          className="btn-danger-outline"
          onClick={() => setConfirmDelete(true)}
          type="button"
        >
          🗑 Delete event
        </button>
      </div>

      {/* ── Delete confirm ── */}
      {confirmDelete && (
        <div className="inline-confirm">
          <p className="inline-confirm-msg">
            Delete <strong>{event.name}</strong>? All match data for this event will be lost.
          </p>
          {deleteError && <p className="form-error-msg">{deleteError}</p>}
          <div className="inline-confirm-actions">
            <button
              className="btn-danger"
              disabled={deleting}
              onClick={handleDeleteEvent}
              type="button"
            >
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              className="btn-secondary"
              disabled={deleting}
              onClick={() => setConfirmDelete(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="stack-list">
        {entries.length === 0 && (
          <article className="empty-state">
            <h2>No entries</h2>
            <p>No Beys were recorded for this event.</p>
          </article>
        )}
        {entries.map((entry) => {
          const bey = beys.find((b) => b.id === entry.beyId)
          const stats = calculateStatsFromRoundCodes(
            entry.id,
            getBeyDisplayName(bey),
            entry.roundCodes,
          )

          return (
            <article className="list-card" key={entry.id}>
              <BeyAvatar bey={bey} size="md" />
              <div className="card-main">
                <h2><BeyName bey={bey} /></h2>
                <code aria-label={`Round codes: ${entry.roundCodes}`}>
                  {[...entry.roundCodes].map((ch, index) => {
                    const cls = /[5-8]/.test(ch)
                      ? 'stat-negative'
                      : /[0-4]|9/.test(ch)
                        ? 'stat-positive'
                        : 'round-code-marker'
                    return <span className={cls} key={`${ch}-${index}`}>{ch}</span>
                  })}
                </code>
              </div>
              <div className="stat-summary event-detail-stats">
                <span className="win-loss-summary">
                  <span className="stat-positive">{stats.wins}</span>–
                  <span className="stat-negative">{stats.losses} </span>  - &nbsp;
                  <span className={stats.winRate >= 50 ? 'stat-positive' : 'stat-negative'}>
                  {Math.round(stats.winRate)}% WR</span>
                </span>
                <span>{stats.wins}–{stats.losses}</span>
                <span className={Math.round(stats.scoreOverOpponentRate ?? 0) >= 101 ? 'stat-positive' : 'stat-negative'}>
                  {Math.round(stats.scoreOverOpponentRate ?? 0)}% SOOR</span>
                          <span>{stats.pointsFor}–{stats.pointsAgainst} pts</span>

                <strong>{stats.statPoints ?? '—'}</strong>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
