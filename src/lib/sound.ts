let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return null
  if (!audioContext) {
    audioContext = new AudioContextCtor()
  }
  return audioContext
}

/**
 * Plays a short, pleasant two-tone "ding" using the Web Audio API.
 * No external audio asset is required.
 */
export function playNotificationSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {
      /* ignore - some browsers require a user gesture first */
    })
  }

  const now = ctx.currentTime
  const notes = [
    { frequency: 880, start: 0, duration: 0.12 },
    { frequency: 1174.66, start: 0.1, duration: 0.18 },
  ]

  for (const note of notes) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(note.frequency, now + note.start)

    gain.gain.setValueAtTime(0, now + note.start)
    gain.gain.linearRampToValueAtTime(0.2, now + note.start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(now + note.start)
    oscillator.stop(now + note.start + note.duration + 0.02)
  }
}
