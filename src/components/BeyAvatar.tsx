import type { Bey } from '../types/tracker'

type BeyAvatarProps = {
  bey?: Bey
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASS: Record<string, string> = {
  sm: 'bey-avatar bey-avatar-sm',
  md: 'bey-avatar bey-avatar-md',
  lg: 'bey-avatar bey-avatar-lg',
}

export function BeyAvatar({ bey, size = 'md' }: BeyAvatarProps) {
  const cls = SIZE_CLASS[size]

  if (bey?.imageUrl) {
    return (
      <div className={cls} aria-hidden="true">
        <img src={bey.imageUrl} alt={bey.build} className="bey-avatar-img" />
      </div>
    )
  }

  // Fallback: show the build string (or a ? if no bey at all)
  const label = bey?.build ?? '?'
  return (
    <div className={`${cls} bey-avatar-placeholder`} aria-hidden="true">
      <span className="bey-avatar-label">{label}</span>
    </div>
  )
}
