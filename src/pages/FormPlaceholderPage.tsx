import { Link, useLocation } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

export function FormPlaceholderPage() {
  const location = useLocation()
  const isEventForm = location.pathname.includes('events')
  const title = isEventForm ? 'New event' : 'Add Bey'

  return (
    <section>
      <PageHeader title={title} />
      <form className="placeholder-form" onSubmit={(event) => event.preventDefault()}>
        <div className="form-intro" style={{marginBottom: '15rem'}}>
         <label>
          {isEventForm ? 'Event name' : 'Bey Name'}
          <input placeholder={isEventForm ? 'e.g. Melbourne Tournament' : 'e.g. Lancelot'} />
        </label>
        <label>
          {isEventForm ? 'Event name' : 'Bey Build'}
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
      </div>
      <div className="form-actions" style={{ gap: '1rem', marginTop: '1rem', display: 'flex' }}>
        <button type="submit" style={{ flex: 1 }}>Save</button>
        <button type="reset" style={{ flex: 1 }}>Cancel</button>
      </div>
      </form>
    </section>
  )
}
