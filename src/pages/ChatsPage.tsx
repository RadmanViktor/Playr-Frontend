import { useTranslation } from 'react-i18next'
import { ConversationsList } from '../components/ConversationsList'

export default function ChatsPage() {
  const { t } = useTranslation('pagesB')
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 border-l-4 border-primary pl-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{t('chats.eyebrow')}</p>
        <h1 className="text-3xl font-bold tracking-tight text-text">{t('chats.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {t('chats.subtitle')}
        </p>
      </div>

      <ConversationsList />
    </div>
  )
}
