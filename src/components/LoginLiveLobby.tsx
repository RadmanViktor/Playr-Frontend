import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Radio, Users } from 'lucide-react'
import { resolveMediaUrl } from '../api/http'
import {
  getPublicLookingForGameSummary,
  type PublicLookingForGameSummary,
} from '../api/publicLobbyApi'
import { Avatar } from './ui/Avatar'

const REFRESH_INTERVAL_MS = 60_000

type LobbyState =
  | { status: 'loading' }
  | { status: 'loaded'; summary: PublicLookingForGameSummary }
  | { status: 'empty' }
  | { status: 'unavailable' }

export function LoginLiveLobby() {
  const { t } = useTranslation('pagesB')
  const [state, setState] = useState<LobbyState>({ status: 'loading' })
  const lastRequestAt = useRef<number | null>(null)
  const requestInFlight = useRef(false)

  useEffect(() => {
    let active = true

    async function loadLobby() {
      const now = Date.now()
      if (
        document.hidden ||
        requestInFlight.current ||
        (lastRequestAt.current !== null && now - lastRequestAt.current < REFRESH_INTERVAL_MS)
      ) {
        return
      }

      requestInFlight.current = true
      lastRequestAt.current = now
      try {
        const summary = await getPublicLookingForGameSummary()
        if (!active) return
        setState(summary.totalCount > 0 && summary.players.length > 0
          ? { status: 'loaded', summary }
          : { status: 'empty' })
      } catch {
        if (!active) return
        setState((current) => current.status === 'loaded' ? current : { status: 'unavailable' })
      } finally {
        requestInFlight.current = false
      }
    }

    void loadLobby()
    const intervalId = window.setInterval(loadLobby, REFRESH_INTERVAL_MS)
    const handleVisibilityChange = () => void loadLobby()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <section className="live-lobby" aria-labelledby="live-lobby-title">
        <LobbyHeader title={t('login.liveLobby.title')} />
        <div className="animate-pulse p-4 sm:p-5" role="status">
          <span className="sr-only">{t('login.liveLobby.loading')}</span>
          <div className="h-28 rounded-xl bg-white/5 lg:h-56" />
          <div className="mt-3 h-16 rounded-xl bg-white/5" />
          <div className="mt-2 hidden h-16 rounded-xl bg-white/5 lg:block" />
        </div>
      </section>
    )
  }

  if (state.status === 'empty' || state.status === 'unavailable') {
    const unavailable = state.status === 'unavailable'
    return (
      <section className="live-lobby" aria-labelledby="live-lobby-title">
        <LobbyHeader title={t('login.liveLobby.title')} />
        <div className="flex min-h-36 flex-col items-center justify-center px-7 py-10 text-center lg:min-h-96">
          <span className="mb-4 rounded-full border border-primary/20 bg-primary/10 p-3 text-primary">
            <Users size={22} aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-text">
            {t(unavailable ? 'login.liveLobby.unavailableTitle' : 'login.liveLobby.emptyTitle')}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
            {t(unavailable
              ? 'login.liveLobby.unavailableDescription'
              : 'login.liveLobby.emptyDescription')}
          </p>
        </div>
      </section>
    )
  }

  const { summary } = state
  const coverUrl = resolveMediaUrl(summary.featuredGame?.coverImageUrl)

  return (
    <section className="live-lobby" aria-labelledby="live-lobby-title">
      <LobbyHeader
        title={t('login.liveLobby.title')}
        count={t('login.liveLobby.count', { count: summary.totalCount })}
      />

      <div className="p-3 sm:p-5">
        {summary.featuredGame && (
          <div className="relative hidden min-h-56 overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(135deg,#172d51,#36195c_58%,#10091b)] lg:block">
            {coverUrl && (
              <img
                data-testid="live-lobby-cover"
                src={coverUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-55"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0813] via-[#0c0813]/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <span className="rounded-md bg-primary/25 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-purple-100">
                {t('login.liveLobby.featured')}
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
                {summary.featuredGame.name}
              </h2>
              <p className="mt-1 text-xs text-white/65">
                {t('login.liveLobby.featuredCount', {
                  count: summary.featuredGame.playerCount,
                })}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-2 lg:mt-3">
          {summary.players.slice(0, 3).map((player, index) => {
            const name = player.displayName || player.username
            return (
              <Link
                key={player.username}
                to={`/profile/${player.username}`}
                aria-label={name}
                className={`${index > 0 ? 'hidden lg:flex' : 'flex'} group items-center rounded-xl border border-white/7 bg-white/[0.025] p-3 transition-colors hover:border-primary/35 hover:bg-primary/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
              >
                <Avatar
                  src={player.avatarUrl ?? undefined}
                  alt={name}
                  status="looking-for-game"
                />
                <span className="ml-3 min-w-0">
                  <span className="block truncate text-sm font-semibold text-text group-hover:text-white">
                    {name}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                    {player.gameName}
                  </span>
                </span>
                <span className="ml-auto rounded-md bg-primary/10 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-purple-200">
                  {t(`login.liveLobby.playStyles.${player.playStyle}`)}
                </span>
              </Link>
            )
          })}
        </div>

        <p className="mt-3 text-center text-[0.7rem] text-muted lg:hidden">
          {t('login.liveLobby.mobileHint', { count: summary.totalCount })}
        </p>
      </div>
    </section>
  )
}

function LobbyHeader({ title, count }: { title: string; count?: string }) {
  return (
    <div className="flex items-center border-b border-white/7 px-4 py-3.5 sm:px-5">
      <Radio size={15} className="mr-2 text-primary" aria-hidden="true" />
      <span id="live-lobby-title" className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-text">
        {title}
      </span>
      {count && (
        <span className="ml-auto inline-flex items-center rounded-full border border-enjoying/25 bg-enjoying/8 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-enjoying">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-enjoying shadow-[0_0_8px_var(--color-enjoying)]" />
          {count}
        </span>
      )}
    </div>
  )
}
