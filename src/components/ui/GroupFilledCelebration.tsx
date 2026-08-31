import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PartyPopper, X } from 'lucide-react'
import { Button } from './Button'
import type { LfgGroup } from '../../api/lfgGroupsApi'

interface GroupFilledCelebrationProps {
  group: LfgGroup
  onOpenChat: () => void
  onClose: () => void
}

const CONFETTI_COLORS = ['bg-primary', 'bg-enjoying', 'bg-need-help', 'bg-frustrated', 'bg-completed']
const CONFETTI_COUNT = 24

/**
 * Full-screen celebratory overlay shown to every member of an LFG group the
 * moment it fills up (accepted count reaches the wanted count). Purely
 * client-side confetti (CSS keyframes), auto-dismisses after a while but can
 * also be closed/acted on immediately.
 */
export function GroupFilledCelebration({ group, onOpenChat, onClose }: GroupFilledCelebrationProps) {
  const { t } = useTranslation('componentsB')

  useEffect(() => {
    const timer = window.setTimeout(onClose, 12000)
    return () => window.clearTimeout(timer)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('groupFilledCelebration.title')}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: CONFETTI_COUNT }).map((_, index) => (
          <span
            key={index}
            className={`absolute top-[-5%] h-2.5 w-2.5 rounded-sm opacity-90 animate-confetti-fall ${CONFETTI_COLORS[index % CONFETTI_COLORS.length]}`}
            style={{
              left: `${(index * 97) % 100}%`,
              animationDelay: `${(index % 12) * 0.15}s`,
              animationDuration: `${2.5 + (index % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div
        className="relative w-full max-w-sm scale-100 animate-celebration-pop rounded-2xl border border-primary/40 bg-surface p-6 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('groupFilledCelebration.closeAriaLabel')}
          className="absolute right-3 top-3 rounded-lg p-1 text-muted hover:bg-surface-raised hover:text-text cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <PartyPopper className="h-8 w-8" aria-hidden="true" />
        </div>

        <h2 className="text-xl font-bold text-text">{t('groupFilledCelebration.title')}</h2>
        <p className="mt-1 text-sm text-muted">
          {t('groupFilledCelebration.subtitle', { gameName: group.gameName, count: group.playersWanted + 1 })}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Button className="w-full" onClick={onOpenChat}>
            {t('groupFilledCelebration.openChat')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {t('groupFilledCelebration.dismiss')}
          </Button>
        </div>
      </div>
    </div>
  )
}
