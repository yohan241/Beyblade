import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

export function AddBeyPage() {
  const navigate = useNavigate()

  const [nickname, setNickname] = useState('')
  const [build, setBuild] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState('')

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!build.trim()) {
      setError('Build string is required, e.g. PW 1-70LR')
      return
    }
    // TODO: persist to store / backend
    navigate('/beys')
  }

  return (
    <section>
      <PageHeader
        eyebrow="Beys"
        title="Add Bey"
        action={
          <button className="header-back-btn" type="button" onClick={() => navigate('/beys')}>
            ← Back
          </button>
        }
      />

      <form className="add-bey-form" onSubmit={handleSubmit} noValidate>
        {/* Image picker */}
        <label className="bey-image-picker" aria-label="Bey image (optional)">
          {imagePreview ? (
            <img className="bey-image-preview" src={imagePreview} alt="Bey preview" />
          ) : (
            <div className="bey-image-placeholder-lg" aria-hidden="true">
              <span>📷</span>
              <span>Add photo</span>
            </div>
          )}
          <input
            accept="image/*"
            className="visually-hidden"
            onChange={handleImage}
            type="file"
          />
        </label>

        <div className="form-fields">
          <label className="form-label">
            Nickname <span className="form-optional">(optional)</span>
            <input
              className="form-input"
              maxLength={48}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Purple Reign"
              type="text"
              value={nickname}
            />
          </label>

          <label className="form-label">
            Build string <span className="form-required">*</span>
            <input
              className={`form-input${error ? ' form-input-error' : ''}`}
              maxLength={32}
              onChange={(e) => { setBuild(e.target.value); setError('') }}
              placeholder="e.g. PW 1-70LR"
              type="text"
              value={build}
            />
            {error && <span className="form-error-msg">{error}</span>}
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Save Bey</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/beys')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
