import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { API_BASE_URL } from '../api/http'
import type { ChatMessage } from '../api/chatApi'
import type { Invitation } from '../api/invitationsApi'
import type { FriendRequest } from '../api/friendRequestsApi'
import type { NotificationItem } from '../api/notificationsApi'
import type { ProfileStatus } from '../api/profilesApi'
import type { LfgGroup, LfgGroupApplication, LfgGroupInvite } from '../api/lfgGroupsApi'

export interface FollowEvent {
  followerUserId: string
  followerUsername: string
  followerDisplayName: string
  followerAvatarUrl: string | null
  followingUserId: string
  followingUsername: string
  followingDisplayName: string
  followingAvatarUrl: string | null
  createdAt: string
}

export interface UserStatusChangedEvent {
  userId: string
  status: ProfileStatus
}

type MessageListener = (message: ChatMessage) => void
type InvitationListener = (invitation: Invitation) => void
type FriendRequestListener = (friendRequest: FriendRequest) => void
type NotificationListener = (notification: NotificationItem) => void
type FollowListener = (followEvent: FollowEvent) => void
type UserStatusChangedListener = (event: UserStatusChangedEvent) => void
type LfgGroupListener = (group: LfgGroup) => void
type LfgApplicationListener = (application: LfgGroupApplication) => void
type LfgGroupInviteListener = (invite: LfgGroupInvite) => void

let connection: HubConnection | null = null
let currentToken: string | null = null
const messageListeners = new Set<MessageListener>()
const invitationReceivedListeners = new Set<InvitationListener>()
const invitationUpdatedListeners = new Set<InvitationListener>()
const friendRequestReceivedListeners = new Set<FriendRequestListener>()
const friendRequestUpdatedListeners = new Set<FriendRequestListener>()
const notificationReceivedListeners = new Set<NotificationListener>()
const followReceivedListeners = new Set<FollowListener>()
const followRemovedListeners = new Set<FollowListener>()
const userStatusChangedListeners = new Set<UserStatusChangedListener>()
const lfgGroupUpdatedListeners = new Set<LfgGroupListener>()
const lfgApplicationReceivedListeners = new Set<LfgApplicationListener>()
const lfgGroupInviteReceivedListeners = new Set<LfgGroupInviteListener>()
const lfgGroupFilledListeners = new Set<LfgGroupListener>()

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
  hub.on('NotificationReceived', (notification: NotificationItem) => {
    notificationReceivedListeners.forEach((listener) => listener(notification))
  })
  hub.on('FollowReceived', (followEvent: FollowEvent) => {
    followReceivedListeners.forEach((listener) => listener(followEvent))
  })
  hub.on('FollowRemoved', (followEvent: FollowEvent) => {
    followRemovedListeners.forEach((listener) => listener(followEvent))
  })
  hub.on('UserStatusChanged', (event: UserStatusChangedEvent) => {
    userStatusChangedListeners.forEach((listener) => listener(event))
  })
  hub.on('LfgGroupUpdated', (group: LfgGroup) => {
    lfgGroupUpdatedListeners.forEach((listener) => listener(group))
  })
  hub.on('LfgApplicationReceived', (application: LfgGroupApplication) => {
    lfgApplicationReceivedListeners.forEach((listener) => listener(application))
  })
  hub.on('LfgGroupInviteReceived', (invite: LfgGroupInvite) => {
    lfgGroupInviteReceivedListeners.forEach((listener) => listener(invite))
  })
  hub.on('LfgGroupFilled', (group: LfgGroup) => {
    lfgGroupFilledListeners.forEach((listener) => listener(group))
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

/** Subscribe to notifications (e.g. @mentions) pushed to the current user right after they're created. */
export function onNotificationReceived(listener: NotificationListener): () => void {
  notificationReceivedListeners.add(listener)
  return () => notificationReceivedListeners.delete(listener)
}

/** Subscribe to being followed by another user, pushed in real time. */
export function onFollowReceived(listener: FollowListener): () => void {
  followReceivedListeners.add(listener)
  return () => followReceivedListeners.delete(listener)
}

/** Subscribe to being unfollowed by another user, pushed in real time. */
export function onFollowRemoved(listener: FollowListener): () => void {
  followRemovedListeners.add(listener)
  return () => followRemovedListeners.delete(listener)
}

/** Subscribe to any user's online/offline/looking-for-game status changes, pushed in real time. */
export function onUserStatusChanged(listener: UserStatusChangedListener): () => void {
  userStatusChangedListeners.add(listener)
  return () => userStatusChangedListeners.delete(listener)
}

/** Subscribe to updates on an LFG group you created (e.g. accepted count changes), pushed in real time. */
export function onLfgGroupUpdated(listener: LfgGroupListener): () => void {
  lfgGroupUpdatedListeners.add(listener)
  return () => lfgGroupUpdatedListeners.delete(listener)
}

/** Subscribe to new applications received on LFG groups you created. */
export function onLfgApplicationReceived(listener: LfgApplicationListener): () => void {
  lfgApplicationReceivedListeners.add(listener)
  return () => lfgApplicationReceivedListeners.delete(listener)
}

/** Subscribe to LFG group invites sent to the current user. */
export function onLfgGroupInviteReceived(listener: LfgGroupInviteListener): () => void {
  lfgGroupInviteReceivedListeners.add(listener)
  return () => lfgGroupInviteReceivedListeners.delete(listener)
}

/** Subscribe to an LFG group becoming filled, pushed to all members (including the creator). */
export function onLfgGroupFilled(listener: LfgGroupListener): () => void {
  lfgGroupFilledListeners.add(listener)
  return () => lfgGroupFilledListeners.delete(listener)
}
