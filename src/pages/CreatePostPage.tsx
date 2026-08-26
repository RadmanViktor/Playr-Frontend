import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { MediaUploadInput } from '../components/MediaUploadInput'
import { useAuth } from '../context/AuthContext'
import { getGames, type Game } from '../api/gamesApi'
import { createPost } from '../api/postsApi'
import { ApiError } from '../api/http'

type MoodOption = 'None' | 'Enjoying' | 'Frustrated' | 'Completed' | 'Need Help'
const MOOD_OPTIONS: MoodOption[] = ['None', 'Enjoying', 'Frustrated', 'Completed', 'Need Help']

function moodToApi(mood: MoodOption): string | null {
  if (mood === 'None') return null
  if (mood === 'Need Help') return 'NeedHelp'
  return mood
}

export default function CreatePostPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [games, setGames] = useState<Game[]>([])
  const [gamesError, setGamesError] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState('')
  const [selectedMood, setSelectedMood] = useState<MoodOption>('None')
  const [text, setText] = useState('')
  const [textError, setTextError] = useState<string | null>(null)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    getGames()
      .then((g) => {
        setGames(g)
        if (g.length > 0) setSelectedGameId(g[0].id)
      })
      .catch(() => setGamesError('Failed to load games.'))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTextError(null)
    setSubmitError(null)

    const trimmed = text.trim()
    if (!selectedGameId) { setSubmitError('Please select a game.'); return }
    if (!trimmed) { setTextError('Post text is required.'); return }
    if (trimmed.length > 1000) { setTextError('Post text cannot be longer than 1000 characters.'); return }

    setIsSubmitting(true)
    try {
      await createPost(token!, { gameId: selectedGameId, textContent: trimmed, mood: moodToApi(selectedMood), media: mediaFile })
      navigate('/feed')
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text">Create Post</h1>

      {gamesError && <p className="text-frustrated">{gamesError}</p>}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Game
          <select
            aria-label="Select a game"
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-text"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
          >
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">Mood (optional)</span>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood}
                type="button"
                aria-pressed={selectedMood === mood}
                onClick={() => setSelectedMood(mood)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  selectedMood === mood
                    ? 'bg-primary text-white'
                    : 'bg-surface-raised text-muted hover:text-text'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm text-muted">
          What happened?
          <textarea
            aria-label="Post text"
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-text resize-none h-32 outline-none focus:border-primary"
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
          />
          <span className="text-xs text-muted self-end">{text.length} / 1000</span>
        </label>

        {textError && <p className="text-frustrated text-sm">{textError}</p>}

        <MediaUploadInput
          file={mediaFile}
          onFileChange={setMediaFile}
          error={mediaError}
          onError={setMediaError}
        />

        {submitError && <p className="text-frustrated text-sm">{submitError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Posting…' : 'Post'}
        </Button>
      </form>
    </div>
  )
}
