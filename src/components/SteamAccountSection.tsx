import { useEffect, useState } from 'react'
import { Button } from './ui/Button'
import { getSteamStatus, startSteamLink, unlinkSteam, type SteamAccount } from '../api/steamApi'
import { ApiError, resolveMediaUrl } from '../api/http'

interface SteamAccountSectionProps {
  token: string
}

export function SteamAccountSection({ token }: SteamAccountSectionProps) {
  const [account, setAccount] = useState<SteamAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSteamStatus(token)
      .then(setAccount)
      .catch(() => setError('Failed to load Steam status.'))
      .finally(() => setIsLoading(false))
  }, [token])

  async function handleLink() {
    setError(null)
    setIsBusy(true)
    try {
      const redirectUrl = await startSteamLink(token)
      window.location.href = redirectUrl
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to start Steam linking.')
      setIsBusy(false)
    }
  }

  async function handleUnlink() {
    setError(null)
    setIsBusy(true)
    try {
      await unlinkSteam(token)
      setAccount(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to unlink Steam account.')
    } finally {
      setIsBusy(false)
    }
  }

  if (isLoading) return null

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-4">
        <h2 className="text-lg font-semibold text-text">Steam account</h2>
      {error && <p className="text-frustrated text-sm">{error}</p>}
      {account ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {account.avatarUrl && (
              <img src={resolveMediaUrl(account.avatarUrl)!} alt="" className="h-10 w-10 rounded-full" />
            )}
            <div>
              <p className="text-text">{account.displayName ?? account.steamId}</p>
              <p className="text-muted text-sm">
                {account.isPublic ? 'Public game library' : 'Private profile – games cannot be fetched'}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" disabled={isBusy} onClick={handleUnlink}>
            Unlink
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted text-sm">Connect your Steam account to show your game library on your profile.</p>
          <Button size="sm" disabled={isBusy} onClick={handleLink}>
            Connect Steam
          </Button>
        </div>
      )}
    </div>
  )
}
