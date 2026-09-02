import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Award, X } from 'lucide-react'
import { BADGE_CATALOG } from '../../constants/badgeCatalog'
import { Button } from './Button'
import { useBodyScrollLock } from '../../lib/useBodyScrollLock'

interface BadgeUnlockCelebrationProps {
  badgeType: string
  onClose: () => void
}

const VOID_PARTICLE_COUNT = 28

export function BadgeUnlockCelebration({ badgeType, onClose }: BadgeUnlockCelebrationProps) {
  const { t } = useTranslation('componentsB')
  const badge = BADGE_CATALOG.find((entry) => entry.type === badgeType)
  const Icon = badge?.icon ?? Award
  const isVoidtouched = badgeType === 'Voidtouched'
  const title = t('badgeUnlockCelebration.title')
  const dialogRef = useRef<HTMLDivElement>(null)
  const [keepOpen, setKeepOpen] = useState(false)
  useBodyScrollLock()

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (document.activeElement === dialogRef.current) {
        event.preventDefault()
        const focusTarget = event.shiftKey ? last : first
        focusTarget.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      previousFocus?.focus()
    }
  }, [onClose])

  useEffect(() => {
    if (keepOpen) return

    let remainingMs = 12_000
    let startedAt = Date.now()
    let timer: number | undefined
    function startTimer() {
      startedAt = Date.now()
      timer = window.setTimeout(onClose, remainingMs)
    }
    function pauseTimer() {
      if (timer === undefined) return
      window.clearTimeout(timer)
      remainingMs = Math.max(0, remainingMs - (Date.now() - startedAt))
      timer = undefined
    }
    function handleVisibilityChange() {
      if (document.hidden) pauseTimer()
      else if (timer === undefined) startTimer()
    }

    if (!document.hidden) startTimer()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [keepOpen, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      ref={dialogRef}
      tabIndex={-1}
      className={`badge-celebration fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 sm:items-center ${
        isVoidtouched ? 'badge-celebration-voidtouched' : 'bg-black/75'
      }`}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {Array.from({ length: VOID_PARTICLE_COUNT }).map((_, index) => (
          <span
            key={index}
            className={isVoidtouched ? 'badge-void-particle' : 'badge-soul-particle'}
            style={{
              left: `${(index * 37) % 100}%`,
              top: `${(index * 61) % 100}%`,
              animationDelay: `${(index % 9) * -0.4}s`,
              animationDuration: `${4.5 + (index % 6) * 0.7}s`,
            }}
          />
        ))}
      </div>

      <section className={`badge-celebration-card relative my-auto max-h-[90svh] w-full max-w-md overflow-y-auto rounded-3xl p-7 text-center sm:p-9 ${
        isVoidtouched ? 'badge-celebration-card-voidtouched' : 'border border-primary/40 bg-surface'
      }`}>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('badgeUnlockCelebration.closeAriaLabel')}
          className="absolute right-3 top-3 rounded-full p-2 text-muted transition-colors hover:bg-white/10 hover:text-text cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <p className="badge-celebration-eyebrow text-xs font-semibold uppercase tracking-[0.35em] text-muted">
          {t('badgeUnlockCelebration.eyebrow')}
        </p>
        <div
          data-testid="badge-celebration-emblem"
          className={`badge-celebration-emblem mx-auto my-6 flex h-28 w-28 items-center justify-center rounded-full ${
            isVoidtouched ? 'badge-celebration-emblem-voidtouched' : 'bg-primary/15 text-primary'
          }`}
        >
          <Icon className="h-14 w-14" strokeWidth={1.5} aria-hidden="true" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-text">{title}</h2>
        <p className="mt-3 text-xl font-semibold text-text">
          {t(`badgeSection.types.${badgeType}`, badgeType)}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
          {t(`badgeUnlockCelebration.descriptions.${badgeType}`, t('badgeUnlockCelebration.defaultDescription'))}
        </p>

        <Button className="mt-7 w-full" onClick={onClose}>
          {t('badgeUnlockCelebration.continue')}
        </Button>
        {!keepOpen && (
          <Button variant="ghost" className="mt-1 w-full" onClick={() => setKeepOpen(true)}>
            {t('badgeUnlockCelebration.keepOpen')}
          </Button>
        )}
      </section>
    </div>
  )
}
