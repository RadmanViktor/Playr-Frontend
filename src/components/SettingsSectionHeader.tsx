import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface SettingsSectionHeaderProps {
  title: string
}

export function SettingsSectionHeader({ title }: SettingsSectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/settings"
        aria-label="Back to settings"
        className="rounded-lg p-1 text-muted hover:bg-surface-raised hover:text-text"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>
      <h1 className="text-2xl font-bold text-text">{title}</h1>
    </div>
  )
}
