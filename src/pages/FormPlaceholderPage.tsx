import { Link, useLocation } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

export function FormPlaceholderPage() {
  const location = useLocation()
  const isEventForm = location.pathname.includes('events')
  const title = isEventForm ? 'New event' : 'Add Bey'

  return (
    <section>
      <PageHeader action={<Link className="text-link" to={isEventForm ? '/events' : '/beys'}>Cancel</Link>} title={title} />
      <form className="placeholder-form" onSubmit={(event) => event.preventDefault()}>
        <label>
          {isEventForm ? 'Event name' : 'Bey name'}
          <input placeholder={isEventForm ? 'e.g. Melbourne Tournament' : 'e.g. PW 1-70LR'} />
        </label>
        {isEventForm ? (
          <label>
            Date
            <input type="date" />
          </label>
        ) : (
          <label>
            Picture (optional)
            <input accept="image/*" type="file" />
          </label>
        )}
        <button type="submit">Save placeholder</button>
      </form>
    </section>
  )
}
