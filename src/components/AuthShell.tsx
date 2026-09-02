import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

interface AuthShellProps {
  children: ReactNode
  showcase?: ReactNode
}

export function AuthShell({ children, showcase }: AuthShellProps) {
  const { t } = useTranslation('pagesB')

  return (
    <main className="auth-shell relative min-h-dvh overflow-x-hidden px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <div className="auth-glow auth-glow-primary" aria-hidden="true" />
      <div className="auth-glow auth-glow-secondary" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-7xl flex-col lg:min-h-[calc(100dvh-4rem)]">
        <header className="flex items-center justify-between">
          <Link
            to="/login"
            className="group inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            aria-label="PLAYR"
          >
            <span className="auth-brand-mark" aria-hidden="true">
              <span>P</span>
            </span>
            <span className="text-sm font-bold tracking-[0.22em] text-text transition-colors group-hover:text-white">
              PLAYR
            </span>
          </Link>
          <span className="hidden text-[0.65rem] font-semibold tracking-[0.18em] text-muted/60 sm:block">
            {t('authShell.tagline')}
          </span>
        </header>

        <div
          className={
            showcase
              ? 'my-auto grid w-full items-center gap-10 py-10 lg:grid-cols-[minmax(20rem,0.82fr)_minmax(30rem,1.18fr)] lg:gap-14'
              : 'my-auto flex w-full justify-center py-10'
          }
        >
          <div className={showcase ? 'auth-panel-enter w-full' : 'auth-panel-enter w-full max-w-md'}>
            {children}
          </div>
          {showcase && (
            <aside data-testid="auth-showcase" className="auth-showcase-enter min-w-0">
              {showcase}
            </aside>
          )}
        </div>

        <footer className="pb-1 text-center text-[0.6rem] font-medium tracking-[0.14em] text-muted/45 lg:text-left">
          {t('authShell.footer')}
        </footer>
      </div>
    </main>
  )
}
