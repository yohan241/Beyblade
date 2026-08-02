import type { BuildStats, BuildSummary } from '../types/tracker'

const roundPointValues: Record<string, number> = {
  '0': 2,   // Spin vs Stamina win
  '1': 1,   // Spin Finish win
  '2': 2,   // Pocket Finish win
  '3': 3,   // Xtreme Finish win
  '4': 4,   // Burst Finish win
  '5': -1,  // Opp Spin Finish
  '6': -2,  // Opp Pocket Finish
  '7': -3,  // Opp Xtreme Finish
  '8': -4,  // Opp Burst Finish
  '9': 2,   // No Contact win
  'a': -2,  // Opp Spin vs Stamina (loss, displayed as red 0)
  'b': -2,  // Opp No Contact (loss, displayed as red 9)
}

export type ParsedRound = {
  code: string
  isSelfFinish: boolean
}

export function parseRoundCodes(roundCodes: string): ParsedRound[] {
  const normalizedCodes = roundCodes.replaceAll(/\s/g, '')

  if (normalizedCodes.length === 0) {
    return []
  }

  if (!/^(?:[0-9ab]\.?)+$/.test(normalizedCodes)) {
    throw new Error('Round codes can only contain a digit (0–9) or letter (a, b) and a period.')
  }

  const parsedRounds = [...normalizedCodes.matchAll(/([0-9ab])(\.)?/g)].map((match) => ({
    code: match[1],
    isSelfFinish: match[2] === '.',
  }))

  const invalidSelfFinish = parsedRounds.some(
    (round) => round.isSelfFinish && !['2', '3', '4', '6', '7', '8'].includes(round.code),
  )

  if (invalidSelfFinish) {
    throw new Error('A self-finish indicator can only follow a Pocket, Xtreme, or Burst finish (codes 2–4 or 6–8).')
  }

  return parsedRounds
}

export function calculateStatsFromRoundCodes(id: string, name: string, roundCodes: string): BuildStats {
  const parsedRounds = parseRoundCodes(roundCodes)
  const pointsFor = parsedRounds.reduce(
    (total, round) => total + Math.max(roundPointValues[round.code], 0),
    0,
  )
  const pointsAgainst = parsedRounds.reduce(
    (total, round) => total + Math.abs(Math.min(roundPointValues[round.code], 0)),
    0,
  )
  const wins = parsedRounds.filter((round) => roundPointValues[round.code] > 0).length
  const losses = parsedRounds.length - wins

  return calculateBuildStats({ id, name, wins, losses, pointsFor, pointsAgainst })
}

export function calculateBuildStats(build: BuildSummary): BuildStats {
  const matches = build.wins + build.losses
  const winRate = matches === 0 ? 0 : (build.wins / matches) * 100
  const scoreOverOpponentRate =
    build.pointsAgainst === 0 ? null : (build.pointsFor / build.pointsAgainst) * 100

  return {
    ...build,
    matches,
    winRate,
    scoreOverOpponentRate,
    statPoints:
      scoreOverOpponentRate === null
        ? null
        : Math.round(winRate) + Math.round(scoreOverOpponentRate),
  }
}
