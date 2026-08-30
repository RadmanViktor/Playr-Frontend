import { useTranslation } from 'react-i18next'
import { supportedLanguages, languageStorageKey } from '../i18n/config'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common')

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const lng = event.target.value
    i18n.changeLanguage(lng)
    window.localStorage.setItem(languageStorageKey, lng)
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">{t('settings.language.label')}</p>
        <p className="text-xs text-muted">{t('settings.language.description')}</p>
      </div>
      <select
        value={i18n.resolvedLanguage ?? i18n.language}
        onChange={handleChange}
        aria-label={t('settings.language.label')}
        className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text"
      >
        {supportedLanguages.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
