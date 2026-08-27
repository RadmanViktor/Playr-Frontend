export type MoodOption = 'None' | 'Enjoying' | 'Frustrated' | 'Completed' | 'Need Help'

export const MOOD_OPTIONS: MoodOption[] = ['None', 'Enjoying', 'Frustrated', 'Completed', 'Need Help']

export function moodOptionToApi(mood: MoodOption): string | null {
  if (mood === 'None') return null
  if (mood === 'Need Help') return 'NeedHelp'
  return mood
}

export function apiMoodToOption(mood: string | null): MoodOption {
  switch (mood) {
    case 'Enjoying':
      return 'Enjoying'
    case 'NeedHelp':
      return 'Need Help'
    case 'Frustrated':
      return 'Frustrated'
    case 'Completed':
      return 'Completed'
    default:
      return 'None'
  }
}
