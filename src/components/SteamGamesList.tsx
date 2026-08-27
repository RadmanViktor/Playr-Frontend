import { useEffect, useState } from 'react'
import { getSteamGames, type SteamGame } from '../api/steamApi'
import { SteamAchievementsList } from './SteamAchievementsList'

interface SteamGamesListProps {
  userId: string
}

function formatPlaytime(minutes: number): string {
  const hours = Math.round(minutes / 60)
  return hours > 0 ? `${hours} h` : `${minutes} min`
}

export function SteamGamesList({ userId }: SteamGamesListProps) {
  const [games, setGames] = useState<SteamGame[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<SteamGame | null>(null)

  useEffect(() => {
    setIsLoading(true)
    getSteamGames(userId)
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setIsLoading(false))
  }, [userId])

  if (isLoading) return <p className="text-muted">Loading…</p>
  if (!games || games.length === 0) {
    return <p className="text-muted">No Steam games to show.</p>
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {games.map((game) => (
          <li
            key={game.appId}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface-raised p-3 hover:bg-border"
            onClick={() => setSelectedGame(game)}
          >
            {game.iconUrl && <img src={game.iconUrl} alt="" className="h-8 w-8 rounded" />}
            <span className="flex-1 text-text">{game.name}</span>
            <span className="text-muted text-sm">{formatPlaytime(game.playtimeForeverMinutes)}</span>
          </li>
        ))}
      </ul>

      {selectedGame && (
        <SteamAchievementsList
          userId={userId}
          appId={selectedGame.appId}
          gameName={selectedGame.name}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </>
  )
}
