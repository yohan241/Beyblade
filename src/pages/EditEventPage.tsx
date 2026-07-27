import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useEvent } from '../hooks/useData'
import { updateEvent } from '../lib/db'

export function EditEventPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const eventState = useEvent(eventId)

  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [initialised, setInitialised] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Populate fields once data loads (only once)
  if (eventState.status === 'success' && eventState.data && !initialised) {
    setName(eventState.data.name)
    setDate(eventState.data.eventDate)
    setInitialised(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Event name is required.'); return }
    if (!eventId) return

    setSaving(true)
    try {
      await updateEvent(eventId, { name: name.trim(), eventDate: date })
      navigate(`/events/${eventId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event.')
      setSaving(false)
    }
  }

  if (eventState.status === 'loading') {
    return <section><PageHeader title="Loading…" /></section>
  }

  if (!eventState.data) {
    return (
      <section>
        <PageHeader title="Event not found" />
        <button className="text-link" onClick={() => navigate('/events')} type="button">
          Return to Events
        </button>
      </section>
    )
  }

  return (
    <section>
      <PageHeader
        eyebrow="Events"
        title="Edit Event"
        action={
          <button
            className="header-back-btn"
            type="button"
            onClick={() => navigate(`/events/${eventId}`)}
          >
            ← Back
          </button>
        }
      />

      <form className="add-event-details-form" onSubmit={handleSubmit} noValidate>
        <label className="form-label">
          Event name <span className="form-required">*</span>
          <input
            autoFocus
            className={`form-input${error ? ' form-input-error' : ''}`}
            maxLength={64}
            onChange={(e) => { setName(e.target.value); setError('') }}
            placeholder="e.g. Metro Summer Open"
            type="text"
            value={name}
          />
          {error && <span className="form-error-msg">{error}</span>}
        </label>

        <label className="form-label">
          Date
          <input
            className="form-input"
            onChange={(e) => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={saving}
            onClick={() => navigate(`/events/${eventId}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
