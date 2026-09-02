import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { ApiError } from '../api/http'
import { getMyBadges, setActiveBadge, type UserBadge } from '../api/badgesApi'
import { BADGE_CATALOG } from '../constants/badgeCatalog'

interface BadgeSectionProps {
  token: string
}

/** Small colored dot representing a badge's tier, mirroring the ring colors used on Avatar. */
function BadgeTierDot({ type, level }: { type: string; level: string }) {
  const className =
    type === 'Creator' || type === 'Admin'
      ? 'bg-gradient-to-tr from-fuchsia-500 via-primary to-cyan-400'
      : type === 'FirstHundredUsers'
        ? 'bg-gradient-to-tr from-amber-200 via-yellow-400 to-amber-200'
        : type === 'Voidtouched'
          ? 'bg-gradient-to-tr from-black via-gray-600 to-gray-200 shadow-[0_0_8px_rgba(220,215,228,0.45)]'
        : level === 'Bronze'
          ? 'bg-amber-700'
          : level === 'Silver'
            ? 'bg-gray-400'
            : level === 'Gold'
              ? 'bg-yellow-400'
              : 'bg-muted'
  return <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-full ${className}`} />
}

/** Grayed-out, blurred preview card for a badge the user hasn't unlocked yet. */
function LockedBadgeCard({ type, Icon }: { type: string; Icon: typeof Lock }) {
  const { t } = useTranslation('componentsB')
  return (
    <div className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-lg border border-border bg-surface p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/10 group-hover:via-transparent group-hover:to-cyan-400/10 group-hover:opacity-100"
      />
      <span className="relative flex h-10 w-10 items-center justify-center">
        <Icon className="badge-icon-locked h-8 w-8 text-text transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
        <Lock className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-surface-raised p-0.5 text-muted" aria-hidden="true" />
      </span>
      <span className="relative text-xs font-medium text-text">{t(`badgeSection.types.${type}`, type)}</span>
    </div>
  )
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

  const unlockedTypes = new Set(badges.map((badge) => badge.type))
  const lockedBadges = BADGE_CATALOG.filter((entry) => !unlockedTypes.has(entry.type))

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
                    <span className="block text-sm font-medium text-text">
                      {t(`badgeSection.types.${badge.type}`, badge.type)}
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

      {lockedBadges.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div>
            <h3 className="text-sm font-semibold text-text">{t('badgeSection.upcomingTitle')}</h3>
            <p className="text-muted text-xs">{t('badgeSection.upcomingDescription')}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {lockedBadges.map((entry) => (
              <LockedBadgeCard key={entry.type} type={entry.type} Icon={entry.icon} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
