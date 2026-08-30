import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react'
import { Smile } from 'lucide-react'

interface EmojiPickerButtonProps {
  onSelect: (emoji: string) => void
}

export function EmojiPickerButton({ onSelect }: EmojiPickerButtonProps) {
  const { t } = useTranslation('componentsB')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  function handleEmojiClick(data: EmojiClickData) {
    onSelect(data.emoji)
    setOpen(false)
  }

  return (
    <div className="relative hidden sm:block" ref={containerRef}>
      <button
        type="button"
        aria-label={t('emojiPickerButton.addEmojiAriaLabel')}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center rounded-lg p-1.5 text-muted hover:text-text hover:bg-surface-raised cursor-pointer transition-colors"
      >
        <Smile className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-20 mb-2">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK} width={300} height={350} />
        </div>
      )}
    </div>
  )
}
