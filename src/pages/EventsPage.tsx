import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { events } from '../data/mockData'

export function EventsPage() {
  return (
    <section>
      <PageHeader action={<Link className="button-link" to="new">New event</Link>} title="Events" />
      <div className="stack-list">
        {events.map((event) => (
          <Link className="list-card event-link" key={event.id} to={event.id}>
            <div className="card-main">
              <h2>{event.name}</h2>
              <p>{new Date(`${event.eventDate}T00:00:00`).toLocaleDateString()}</p>
            </div>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
