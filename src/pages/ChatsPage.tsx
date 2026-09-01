import { useTranslation } from 'react-i18next'
import { ConversationsList } from '../components/ConversationsList'

export default function ChatsPage() {
  const { t } = useTranslation('pagesB')
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 border-l-4 border-primary pl-4">
        <h1 className="text-3xl font-bold tracking-tight text-text">{t('chats.title')}</h1>
      </div>

      <ConversationsList />
    </div>
  )
}
