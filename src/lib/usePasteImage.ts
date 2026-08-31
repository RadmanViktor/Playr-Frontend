import { useCallback, useEffect, useRef } from 'react'

interface UsePasteImageBindings {
  onMouseEnter: () => void
  onMouseLeave: () => void
  onFocus: () => void
  onBlur: () => void
  tabIndex: number
}

/**
 * Lets a component accept a pasted (Ctrl+V) image while it is hovered or
 * focused, without stealing paste events intended for elsewhere on the page
 * (e.g. text inputs).
 *
 * Returns event bindings to spread onto the component's interactive
 * container element.
 */
export function usePasteImage(onFile: (file: File) => void): {
  bindings: UsePasteImageBindings
} {
  const isActiveRef = useRef(false)

  const onMouseEnter = useCallback(() => {
    isActiveRef.current = true
  }, [])
  const onMouseLeave = useCallback(() => {
    isActiveRef.current = false
  }, [])
  const onFocus = useCallback(() => {
    isActiveRef.current = true
  }, [])
  const onBlur = useCallback(() => {
    isActiveRef.current = false
  }, [])

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      if (!isActiveRef.current) return
      const items = event.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) onFile(file)
          return
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [onFile])

  return { bindings: { onMouseEnter, onMouseLeave, onFocus, onBlur, tabIndex: 0 } }
}
