import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { beys } from '../data/mockData'

export function BeysPage() {
  return (
    <section>
      <PageHeader action={<Link className="button-link" to="new">Add Bey</Link>} title="Beys" />
      <div className="stack-list">
        {beys.map((bey) => (
          <article className="list-card" key={bey.id}>
            <div className="bey-image-placeholder" aria-hidden="true" />
            <div className="card-main">
              <h2>{bey.name}</h2>
              <p>Optional image and build details go here.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
