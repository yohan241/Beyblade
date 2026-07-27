import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { insertBey, uploadBeyImage, updateBey } from '../lib/db'

// ─── Crop helpers ─────────────────────────────────────────────────────────────

type CropState = {
  x: number  // 0–1 relative to natural image size
  y: number
  size: number  // square side, 0–1
}

/** Draw the cropped square onto a canvas and return it as a Blob */
function cropToBlob(img: HTMLImageElement, crop: CropState): Promise<Blob> {
  const natural = img.naturalWidth
  const naturalH = img.naturalHeight
  const px = Math.round(crop.x * natural)
  const py = Math.round(crop.y * naturalH)
  const ps = Math.round(crop.size * Math.min(natural, naturalH))
  const OUT = 512 // output resolution

  const canvas = document.createElement('canvas')
  canvas.width = OUT
  canvas.height = OUT
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, px, py, ps, ps, 0, 0, OUT, OUT)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.9,
    )
  })
}

// ─── Crop overlay component ───────────────────────────────────────────────────

function CropOverlay({
  src,
  crop,
  onChange,
}: {
  src: string
  crop: CropState
  onChange: (c: CropState) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<{ startX: number; startY: number; origCrop: CropState } | null>(null)
  const resizing = useRef<{ startX: number; startY: number; origCrop: CropState } | null>(null)
  function onBoxPointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = { startX: e.clientX, startY: e.clientY, origCrop: { ...crop } }
  }
  function onBoxPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    const rect = containerRef.current!.getBoundingClientRect()
    const dx = (e.clientX - dragging.current.startX) / rect.width
    const dy = (e.clientY - dragging.current.startY) / rect.height
    const oc = dragging.current.origCrop
    onChange({
      ...oc,
      x: Math.max(0, Math.min(1 - oc.size, oc.x + dx)),
      y: Math.max(0, Math.min(1 - oc.size, oc.y + dy)),
    })
  }
  function onBoxPointerUp() { dragging.current = null }

  // Resize handle (bottom-right corner)
  function onHandlePointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    resizing.current = { startX: e.clientX, startY: e.clientY, origCrop: { ...crop } }
  }
  function onHandlePointerMove(e: React.PointerEvent) {
    if (!resizing.current) return
    const rect = containerRef.current!.getBoundingClientRect()
    const delta = (e.clientX - resizing.current.startX) / rect.width
    const oc = resizing.current.origCrop
    const maxSize = Math.min(1 - oc.x, 1 - oc.y)
    onChange({ ...oc, size: Math.max(0.1, Math.min(maxSize, oc.size + delta)) })
  }
  function onHandlePointerUp() { resizing.current = null }

  const pct = (v: number) => `${(v * 100).toFixed(2)}%`

  return (
    <div className="crop-container" ref={containerRef}>
      <img src={src} className="crop-source-img" alt="Source" draggable={false} />

      {/* Dark overlay outside the crop box */}
      <div className="crop-shade" style={{
        clipPath: `polygon(
          0% 0%, 100% 0%, 100% 100%, 0% 100%,
          0% ${pct(crop.y)},
          ${pct(crop.x)} ${pct(crop.y)},
          ${pct(crop.x)} ${pct(crop.y + crop.size)},
          ${pct(crop.x + crop.size)} ${pct(crop.y + crop.size)},
          ${pct(crop.x + crop.size)} ${pct(crop.y)},
          0% ${pct(crop.y)}
        )`,
      }} />

      {/* Draggable crop box */}
      <div
        className="crop-box"
        style={{
          left: pct(crop.x),
          top: pct(crop.y),
          width: pct(crop.size),
          paddingTop: pct(crop.size), // keeps it square
        }}
        onPointerDown={onBoxPointerDown}
        onPointerMove={onBoxPointerMove}
        onPointerUp={onBoxPointerUp}
      >
        {/* Rule-of-thirds grid lines */}
        <div className="crop-grid">
          <div /><div /><div />
          <div /><div /><div />
          <div /><div /><div />
        </div>
        {/* Resize handle */}
        <div
          className="crop-handle"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = {
  /** When set we're editing an existing bey, not creating a new one */
  editId?: string
  initialNickname?: string
  initialBuild?: string
  initialImageUrl?: string
}

export function AddBeyPage({ editId, initialNickname = '', initialBuild = '', initialImageUrl }: Props) {
  const navigate = useNavigate()
  const imgRef = useRef<HTMLImageElement>(null)

  const [nickname, setNickname] = useState(initialNickname)
  const [build, setBuild] = useState(initialBuild)
  const [rawSrc, setRawSrc] = useState<string | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)       // ← stored blob
  const [croppedPreview, setCroppedPreview] = useState<string | null>(initialImageUrl ?? null)
  const [crop, setCrop] = useState<CropState>({ x: 0.1, y: 0.1, size: 0.8 })
  const [showCrop, setShowCrop] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setRawSrc(url)
    setCroppedBlob(null)
    setCrop({ x: 0.1, y: 0.1, size: 0.8 })
    setShowCrop(true)
  }

  const applyCrop = useCallback(async () => {
    if (!imgRef.current || !rawSrc) return
    const blob = await cropToBlob(imgRef.current, crop)
    setCroppedBlob(blob)                                                   // ← save blob
    setCroppedPreview(URL.createObjectURL(blob))
    setShowCrop(false)
  }, [crop, rawSrc])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!build.trim()) { setError('Build string is required, e.g. PW 1-70LR'); return }

    setSaving(true)
    setError('')
    try {
      if (croppedBlob) {
        // Upload image: insert bey first to get an id if creating new
        if (editId) {
          const imageUrl = await uploadBeyImage(editId, croppedBlob)
          await updateBey(editId, {
            name: nickname.trim() || undefined,
            build: build.trim(),
            imageUrl,
          })
        } else {
          const newBey = await insertBey({ name: nickname.trim() || undefined, build: build.trim() })
          const imageUrl = await uploadBeyImage(newBey.id, croppedBlob)
          await updateBey(newBey.id, { imageUrl })
        }
      } else if (editId) {
        await updateBey(editId, { name: nickname.trim() || undefined, build: build.trim() })
      } else {
        await insertBey({ name: nickname.trim() || undefined, build: build.trim() })
      }

      navigate('/beys')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Bey.')
      setSaving(false)
    }
  }

  const isEditing = Boolean(editId)

  return (
    <section>
      <PageHeader
        eyebrow="Beys"
        title={isEditing ? 'Edit Bey' : 'Add Bey'}
        action={
          <button className="header-back-btn" type="button" onClick={() => navigate('/beys')}>
            ← Back
          </button>
        }
      />

      <form className="add-bey-form" onSubmit={handleSubmit} noValidate>

        {/* ── Image / crop area ── */}
        {showCrop && rawSrc ? (
          <div className="crop-ui">
            <CropOverlay src={rawSrc} crop={crop} onChange={setCrop} />
            {/* Hidden img used by cropToBlob to get naturalWidth/Height */}
            <img ref={imgRef} src={rawSrc} style={{ display: 'none' }} alt="" />
            <div className="crop-actions">
              <button type="button" className="btn-primary" onClick={applyCrop}>
                ✓ Apply crop
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowCrop(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <label className="bey-image-picker" aria-label="Bey image (optional)">
            {croppedPreview ? (
              <div className="bey-avatar-preview-wrap">
                <img
                  className="bey-avatar-preview"
                  src={croppedPreview}
                  alt="Bey preview"
                />
                <span className="bey-avatar-preview-hint">Tap to change</span>
              </div>
            ) : (
              <div className="bey-image-placeholder-lg" aria-hidden="true">
                <span>📷</span>
                <span>Add photo</span>
              </div>
            )}
            <input
              accept="image/*"
              className="visually-hidden"
              onChange={handleFileChange}
              type="file"
            />
          </label>
        )}

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
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save Bey'}
          </button>
          <button type="button" className="btn-secondary" disabled={saving} onClick={() => navigate('/beys')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
