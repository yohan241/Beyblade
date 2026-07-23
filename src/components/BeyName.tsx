import type { Bey } from '../types/tracker'

type BeyNameProps = {
  bey?: Bey
}

export function getBeyDisplayName(bey?: Bey): string {
  return bey?.name?.trim() || bey?.build || 'Unknown Bey'
}

export function BeyName({ bey }: BeyNameProps) {
  const displayName = getBeyDisplayName(bey)
  const build = bey?.name?.trim() ? bey.build : undefined

  return (
    <>
      {displayName}
      {build ? <span className="bey-build"> ({build})</span> : null}
    </>
  )
}
