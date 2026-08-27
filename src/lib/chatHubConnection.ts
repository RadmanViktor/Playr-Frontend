import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { API_BASE_URL } from '../api/http'
import type { ChatMessage } from '../api/chatApi'

type MessageListener = (message: ChatMessage) => void

let connection: HubConnection | null = null
let currentToken: string | null = null
const listeners = new Set<MessageListener>()

function buildConnection(token: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/chat`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()
}

/** Ensures a single SignalR connection is active for the given token. Safe to call repeatedly. */
export async function connectChatHub(token: string): Promise<void> {
  if (connection && currentToken === token && connection.state !== HubConnectionState.Disconnected) {
    return
  }

  await disconnectChatHub()

  currentToken = token
  const hub = buildConnection(token)
  hub.on('ReceiveMessage', (message: ChatMessage) => {
    listeners.forEach((listener) => listener(message))
  })

  try {
    await hub.start()
    connection = hub
  } catch {
    connection = null
  }
}

export async function disconnectChatHub(): Promise<void> {
  if (connection) {
    try {
      await connection.stop()
    } catch {
      /* ignore */
    }
  }
  connection = null
  currentToken = null
}

/** Subscribe to every incoming chat message pushed over the hub. Returns an unsubscribe function. */
export function onChatMessage(listener: MessageListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
