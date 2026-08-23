import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export type InvitationStatus = 'Pending' | 'Accepted' | 'Declined'

export interface Invitation {
  id: string
  senderUserId: string
  senderUsername: string
  senderDisplayName: string
  senderAvatarUrl: string | null
  recipientUserId: string
  recipientUsername: string
  recipientDisplayName: string
  recipientAvatarUrl: string | null
  message: string
  status: InvitationStatus
  createdAt: string
  respondedAt: string | null
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function sendInvitation(
  token: string,
  recipientUserId: string,
  message: string,
): Promise<Invitation> {
  const response = await fetch(`${API_BASE_URL}/api/invitations`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ recipientUserId, message }),
  })
  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to send invitation.')
    throw new ApiError(response.status, errorMessage)
  }
  return response.json()
}

export async function getIncomingInvitations(token: string): Promise<Invitation[]> {
  const response = await fetch(`${API_BASE_URL}/api/invitations/incoming`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load invitations.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getSentInvitations(token: string): Promise<Invitation[]> {
  const response = await fetch(`${API_BASE_URL}/api/invitations/sent`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load invitations.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function acceptInvitation(token: string, invitationId: string): Promise<Invitation> {
  const response = await fetch(`${API_BASE_URL}/api/invitations/${invitationId}/accept`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to accept invitation.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function declineInvitation(token: string, invitationId: string): Promise<Invitation> {
  const response = await fetch(`${API_BASE_URL}/api/invitations/${invitationId}/decline`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to decline invitation.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
