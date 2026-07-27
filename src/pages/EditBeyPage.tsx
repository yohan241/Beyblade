import { useParams, useNavigate } from 'react-router-dom'
import { useBeys } from '../hooks/useData'
import { AddBeyPage } from './AddBeyPage'
import { PageHeader } from '../components/PageHeader'

export function EditBeyPage() {
  const { beyId } = useParams()
  const beysState = useBeys()
  const navigate = useNavigate()

  if (beysState.status === 'loading') {
    return <section><PageHeader title="Loading…" /></section>
  }

  const bey = beysState.status === 'success'
    ? beysState.data.find((b) => b.id === beyId)
    : undefined

  if (!bey) {
    return (
      <section>
        <PageHeader title="Bey not found" />
        <button className="text-link" onClick={() => navigate('/beys')} type="button">
          Return to Beys
        </button>
      </section>
    )
  }

  return (
    <AddBeyPage
      editId={bey.id}
      initialNickname={bey.name ?? ''}
      initialBuild={bey.build}
      initialImageUrl={bey.imageUrl}
    />
  )
}
