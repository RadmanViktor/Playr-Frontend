import { Card } from '../components/ui/Card'
import { ConversationsList } from '../components/ConversationsList'

export default function ChatsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="mb-1 text-lg font-semibold text-text">Chats</h1>
        <p className="text-sm text-muted">Conversations you've had with other players.</p>
      </Card>

      <ConversationsList />
    </div>
  )
}
