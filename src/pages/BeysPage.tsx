import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BeyName, getBeyDisplayName } from '../components/BeyName'
import { PageHeader } from '../components/PageHeader'
import { beys, eventBeyEntries } from '../data/mockData'
import { calculateStatsFromRoundCodes } from '../lib/stats'
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';

const pinnedBeysStorageKey = 'beyblade-pinned-beys'

export function BeysPage() {
  const [pinnedBeyIds, setPinnedBeyIds] = useState<string[]>(() => {
    const savedPins = localStorage.getItem(pinnedBeysStorageKey)

    try {
      return savedPins ? JSON.parse(savedPins) : []
    } catch {
      return []
    }
  })

  const beyStats = beys
    .map((bey) => {
      const allRoundCodes = eventBeyEntries
        .filter((entry) => entry.beyId === bey.id)
        .map((entry) => entry.roundCodes)
        .join('')

      return {
        bey,
        stats: calculateStatsFromRoundCodes(bey.id, getBeyDisplayName(bey), allRoundCodes),
      }
    })
    .sort((first, second) => {
      const firstIsPinned = pinnedBeyIds.includes(first.bey.id)
      const secondIsPinned = pinnedBeyIds.includes(second.bey.id)

      if (firstIsPinned !== secondIsPinned) {
        return firstIsPinned ? -1 : 1
      }

      return new Date(second.bey.createdAt).getTime() - new Date(first.bey.createdAt).getTime()
    })

  function togglePin(beyId: string) {
    setPinnedBeyIds((currentPins) => {
      const nextPins = currentPins.includes(beyId)
        ? currentPins.filter((id) => id !== beyId)
        : [...currentPins, beyId]

      localStorage.setItem(pinnedBeysStorageKey, JSON.stringify(nextPins))
      return nextPins
    })
  }

  return (
    <section>
      <PageHeader title="Beys" />
      {/* <p className="page-intro">Newest Beys first. Select a Bey to pin or unpin it.</p> */}
      <div className="stack-list">
        {beyStats.map(({ bey, stats }) => {
          const isPinned = pinnedBeyIds.includes(bey.id)

          return (
            <button
              aria-pressed={isPinned}
              className={`list-card bey-card${isPinned ? ' bey-card-pinned' : ''}`}
              key={bey.id}
              onClick={() => togglePin(bey.id)}
              type="button"
            >
              <div className="bey-image-placeholder" aria-hidden="true" />
              <div className="card-main">
                <h2><BeyName bey={bey} /></h2>
                <p>
                  <span className="stat-positive">{stats.wins}</span>–
                  <span className="stat-negative">{stats.losses}</span> ({stats.matches}) ·{' '}
                  <span className="stat-positive">{stats.pointsFor}</span>–
                  <span className="stat-negative">{stats.pointsAgainst}</span> points
                </p>
              </div>
              <div className="stat-summary">
                <span className={stats.winRate >= 50 ? 'stat-positive' : 'stat-negative'}>
                  {Math.round(stats.winRate)}% WR
                </span>
                <span>{Math.round(stats.scoreOverOpponentRate ?? 0)}% SOOR</span>
                <strong>{stats.statPoints ?? '—'}</strong>
                <small>{isPinned ? 'Pinned' : ''}</small>
              </div>
            </button>
          )
        })}
      </div>
      <Box sx={{ '& > :not(style)': { m: 1 }, position: 'fixed', bottom: '4rem', right: '1rem' }}>
      <Fab color="primary" aria-label="add">
        <AddIcon />
      </Fab>
    </Box>
    </section>
  )
}
