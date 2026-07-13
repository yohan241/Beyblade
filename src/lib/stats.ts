import type { BuildStats, BuildSummary } from '../types/tracker'

const roundPointValues: Record<string, number> = {
  '0': 2,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': -1,
  '6': -2,
  '7': -3,
  '8': -4,
  '9': 2,
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

  if (!/^(?:[0-9]\.?)+$/.test(normalizedCodes)) {
    throw new Error('Round codes can only contain a digit from 0 to 9 and a period.')
  }

  const parsedRounds = [...normalizedCodes.matchAll(/([0-9])(\.)?/g)].map((match) => ({
    code: match[1],
    isSelfFinish: match[2] === '.',
  }))

  const invalidSelfFinish = parsedRounds.some(
    (round) => round.isSelfFinish && !['2', '3', '4'].includes(round.code),
  )

  if (invalidSelfFinish) {
    throw new Error('A self-finish indicator can only follow a Pocket, Xtreme, or Burst finish.')
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
