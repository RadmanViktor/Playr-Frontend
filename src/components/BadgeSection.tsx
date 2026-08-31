import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../api/http'
import { getMyBadges, setActiveBadge, type UserBadge } from '../api/badgesApi'

interface BadgeSectionProps {
  token: string
}

/** Small colored dot representing a badge's tier, mirroring the ring colors used on Avatar. */
function BadgeTierDot({ type, level }: { type: string; level: string }) {
  const className =
    type === 'Creator'
      ? 'bg-gradient-to-tr from-fuchsia-500 via-primary to-cyan-400'
      : type === 'FirstHundredUsers'
        ? 'bg-gradient-to-tr from-amber-200 via-yellow-400 to-amber-200'
        : level === 'Bronze'
          ? 'bg-amber-700'
          : level === 'Silver'
            ? 'bg-gray-400'
            : level === 'Gold'
              ? 'bg-yellow-400'
              : 'bg-muted'
  return <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-full ${className}`} />
}

export function BadgeSection({ token }: BadgeSectionProps) {
  const { t } = useTranslation('componentsB')
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [activeBadgeType, setActiveBadgeType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyBadges(token)
      .then((data) => {
        setBadges(data.badges)
        setActiveBadgeType(data.activeBadgeType)
      })
      .catch(() => setError(t('badgeSection.loadError')))
      .finally(() => setIsLoading(false))
  }, [token, t])

  async function handleSelect(badgeType: string | null) {
    setError(null)
    setIsBusy(true)
    const previous = activeBadgeType
    setActiveBadgeType(badgeType)
    try {
      await setActiveBadge(token, badgeType)
    } catch (err) {
      setActiveBadgeType(previous)
      setError(err instanceof ApiError ? err.message : t('badgeSection.updateError'))
    } finally {
      setIsBusy(false)
    }
  }

  if (isLoading) return null

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4">
      <div>
        <h2 className="text-lg font-semibold text-text">{t('badgeSection.title')}</h2>
        <p className="text-muted text-sm">{t('badgeSection.description')}</p>
      </div>

      {error && <p className="text-frustrated text-sm">{error}</p>}

      {badges.length === 0 ? (
        <p className="text-muted text-sm">{t('badgeSection.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {badges.map((badge) => {
            const isActive = activeBadgeType === badge.type
            return (
              <li key={badge.type}>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleSelect(isActive ? null : badge.type)}
                  aria-pressed={isActive}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isActive ? 'border-primary bg-surface' : 'border-border bg-surface hover:bg-border'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <BadgeTierDot type={badge.type} level={badge.level} />
                    <span>
                      <span className="block text-sm font-medium text-text">
                        {t(`badgeSection.types.${badge.type}`, badge.type)}
                      </span>
                      <span className="block text-xs text-muted">
                        {badge.type === 'Creator'
                          ? t('badgeSection.creatorLevel')
                          : badge.type === 'FirstHundredUsers'
                            ? t('badgeSection.founderLevel')
                            : t(`badgeSection.levels.${badge.level}`, badge.level)}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs text-muted">
                    {isActive ? t('badgeSection.active') : t('badgeSection.select')}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
