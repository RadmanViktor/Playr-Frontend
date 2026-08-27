import { useEffect, useState } from 'react'
import { getSteamAchievements, type SteamAchievement } from '../api/steamApi'

interface SteamAchievementsListProps {
  userId: string
  appId: number
  gameName: string
  onClose: () => void
}

export function SteamAchievementsList({ userId, appId, gameName, onClose }: SteamAchievementsListProps) {
  const [achievements, setAchievements] = useState<SteamAchievement[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    getSteamAchievements(userId, appId)
      .then(setAchievements)
      .catch(() => setError('Failed to load achievements.'))
      .finally(() => setIsLoading(false))
  }, [userId, appId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">{gameName} – Achievements</h3>
          <button className="text-muted hover:text-text" onClick={onClose}>
            ✕
          </button>
        </div>

        {isLoading ? (
          <p className="text-muted">Loading…</p>
        ) : error ? (
          <p className="text-frustrated">{error}</p>
        ) : !achievements || achievements.length === 0 ? (
          <p className="text-muted">No achievements to show for this game.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {achievements.map((achievement) => (
              <li
                key={achievement.apiName}
                className={`flex items-center gap-3 rounded-lg border border-border p-2 ${
                  achievement.achieved ? 'bg-surface-raised' : 'opacity-50'
                }`}
              >
                {(achievement.achieved ? achievement.iconUrl : achievement.iconGrayUrl) && (
                  <img
                    src={(achievement.achieved ? achievement.iconUrl : achievement.iconGrayUrl) ?? undefined}
                    alt=""
                    className="h-8 w-8 rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="text-text text-sm">{achievement.displayName ?? achievement.apiName}</p>
                  {achievement.achieved && achievement.unlockedAt && (
                    <p className="text-muted text-xs">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
