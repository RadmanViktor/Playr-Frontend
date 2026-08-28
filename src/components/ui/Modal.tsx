import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useBodyScrollLock } from '../../lib/useBodyScrollLock'
import { useOverlayDismiss } from '../../lib/useOverlayDismiss'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  maxWidthClassName?: string
}

export function Modal({ title, onClose, children, maxWidthClassName = 'max-w-md' }: ModalProps) {
  useBodyScrollLock()
  const { backdropProps } = useOverlayDismiss({ onDismiss: onClose })

  return (
    <div
      // items-start on mobile: centring tall content pushes it off *both* the
      // top and the bottom of a short viewport, making it unreachable.
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 cursor-pointer sm:items-center"
      {...backdropProps}
    >
      <div
        className={`my-auto flex max-h-[90svh] w-full ${maxWidthClassName} cursor-default flex-col overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-5`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-muted hover:bg-surface-raised hover:text-text cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
