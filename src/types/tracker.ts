export type BuildSummary = {
  id: string
  name: string
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
}

export type BuildStats = BuildSummary & {
  matches: number
  winRate: number
  scoreOverOpponentRate: number | null
  statPoints: number | null
}

export type Bey = {
  id: string
  name: string
  imageUrl?: string
}

export type TrackerEvent = {
  id: string
  name: string
  eventDate: string
}

export type EventBeyEntry = {
  id: string
  eventId: string
  beyId: string
  roundCodes: string
}
