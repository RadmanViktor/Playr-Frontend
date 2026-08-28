import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { API_BASE_URL } from '../api/http'
import type { ChatMessage } from '../api/chatApi'
import type { Invitation } from '../api/invitationsApi'
import type { FriendRequest } from '../api/friendRequestsApi'

type MessageListener = (message: ChatMessage) => void
type InvitationListener = (invitation: Invitation) => void
type FriendRequestListener = (friendRequest: FriendRequest) => void

let connection: HubConnection | null = null
let currentToken: string | null = null
const messageListeners = new Set<MessageListener>()
const invitationReceivedListeners = new Set<InvitationListener>()
const invitationUpdatedListeners = new Set<InvitationListener>()
const friendRequestReceivedListeners = new Set<FriendRequestListener>()
const friendRequestUpdatedListeners = new Set<FriendRequestListener>()

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
    messageListeners.forEach((listener) => listener(message))
  })
  hub.on('InvitationReceived', (invitation: Invitation) => {
    invitationReceivedListeners.forEach((listener) => listener(invitation))
  })
  hub.on('InvitationUpdated', (invitation: Invitation) => {
    invitationUpdatedListeners.forEach((listener) => listener(invitation))
  })
  hub.on('FriendRequestReceived', (friendRequest: FriendRequest) => {
    friendRequestReceivedListeners.forEach((listener) => listener(friendRequest))
  })
  hub.on('FriendRequestUpdated', (friendRequest: FriendRequest) => {
    friendRequestUpdatedListeners.forEach((listener) => listener(friendRequest))
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
  messageListeners.add(listener)
  return () => messageListeners.delete(listener)
}

/** Subscribe to invitations pushed to the current user right after they're created. */
export function onInvitationReceived(listener: InvitationListener): () => void {
  invitationReceivedListeners.add(listener)
  return () => invitationReceivedListeners.delete(listener)
}

/** Subscribe to invitation status changes (accepted/declined/cancelled), pushed to both parties. */
export function onInvitationUpdated(listener: InvitationListener): () => void {
  invitationUpdatedListeners.add(listener)
  return () => invitationUpdatedListeners.delete(listener)
}

/** Subscribe to friend requests pushed to the current user right after they're created. */
export function onFriendRequestReceived(listener: FriendRequestListener): () => void {
  friendRequestReceivedListeners.add(listener)
  return () => friendRequestReceivedListeners.delete(listener)
}

/** Subscribe to friend request status changes (accepted/declined/cancelled), pushed to both parties. */
export function onFriendRequestUpdated(listener: FriendRequestListener): () => void {
  friendRequestUpdatedListeners.add(listener)
  return () => friendRequestUpdatedListeners.delete(listener)
}
