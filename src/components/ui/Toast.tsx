import { useEffect, useRef } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ToastProps {
  message: string
  onDismiss: () => void
  durationMs?: number
}

export function Toast({ message, onDismiss, durationMs = 3000 }: ToastProps) {
  const { t } = useTranslation('ui')
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), durationMs)
    return () => clearTimeout(timer)
  }, [message, durationMs])

  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 shadow-lg">
        <CheckCircle2 className="h-4 w-4 text-enjoying" aria-hidden="true" />
        <p role="status" className="text-sm text-text">{message}</p>
        <button
          type="button"
          aria-label={t('toast.dismiss')}
          onClick={onDismiss}
          className="ml-2 rounded-md p-0.5 text-muted hover:text-text cursor-pointer"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
