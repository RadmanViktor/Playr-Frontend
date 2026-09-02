import { API_BASE_URL, ApiError, parseErrorMessage } from './http'
import type { PlayStyle } from './profilesApi'

export type LfgGroupStatus = 'Open' | 'Filled' | 'Cancelled'
export type LfgApplicationStatus = 'Pending' | 'Accepted' | 'Declined' | 'Cancelled'
export type LfgInviteStatus = 'Pending' | 'Accepted' | 'Declined' | 'Cancelled'
// Serialized values from the backend's LfgMyMembershipStatus enum (Playr.Application.Lfg).
export type LfgMyMembershipStatus = 'None' | 'IsCreator' | 'IsMember'

export interface LfgGroup {
  id: string
  creatorUserId: string
  creatorUsername: string
  creatorDisplayName: string
  creatorAvatarUrl: string | null
  gameId: string
  gameName: string
  gameCoverImageUrl: string | null
  playStyle: PlayStyle | null
  note: string | null
  preferredMinAge: number | null
  preferredMaxAge: number | null
  microphoneRequired: boolean
  playersWanted: number
  acceptedCount: number
  status: LfgGroupStatus
  createdAt: string
  filledAt: string | null
  cancelledAt: string | null
  myMembershipStatus: LfgMyMembershipStatus
  myApplicationStatus: LfgApplicationStatus | null
  myInviteStatus: LfgInviteStatus | null
}

export interface LfgGroupApplication {
  id: string
  lfgGroupId: string
  gameName: string
  applicantUserId: string
  applicantUsername: string
  applicantDisplayName: string
  applicantAvatarUrl: string | null
  status: LfgApplicationStatus
  message: string | null
  createdAt: string
  respondedAt: string | null
}

export interface LfgGroupInvite {
  id: string
  lfgGroupId: string
  gameName: string
  inviterUserId: string
  inviteeUserId: string
  inviteeUsername: string
  inviteeDisplayName: string
  inviteeAvatarUrl: string | null
  status: LfgInviteStatus
  createdAt: string
  respondedAt: string | null
}

export interface CreateLfgGroupData {
  gameId: string
  playersWanted: number
  playStyle?: PlayStyle | null
  note?: string | null
  preferredMinAge?: number | null
  preferredMaxAge?: number | null
  microphoneRequired?: boolean
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function createLfgGroup(token: string, data: CreateLfgGroupData): Promise<LfgGroup> {
  const response = await fetch(`${API_BASE_URL}/api/lfg-groups`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to create group.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getOpenLfgGroups(token: string): Promise<LfgGroup[]> {
  const response = await fetch(`${API_BASE_URL}/api/lfg-groups/open`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load groups.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function applyToLfgGroup(
  token: string,
  lfgGroupId: string,
  message?: string | null,
): Promise<LfgGroupApplication> {
  const response = await fetch(`${API_BASE_URL}/api/lfg-groups/${lfgGroupId}/apply`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ message }),
  })
  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to apply to group.')
    throw new ApiError(response.status, errorMessage)
  }
  return response.json()
}

export async function getIncomingLfgApplications(token: string): Promise<LfgGroupApplication[]> {
  const response = await fetch(`${API_BASE_URL}/api/lfg-groups/incoming-applications`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load applications.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function acceptLfgApplication(token: string, applicationId: string): Promise<LfgGroupApplication> {
  const response = await fetch(`${API_BASE_URL}/api/lfg-groups/applications/${applicationId}/accept`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to accept application.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function declineLfgApplication(token: string, applicationId: string): Promise<LfgGroupApplication> {
  const response = await fetch(`${API_BASE_URL}/api/lfg-groups/applications/${applicationId}/decline`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to decline application.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function inviteToLfgGroup(
  token: string,
  lfgGroupId: string,
  inviteeUserId: string,
): Promise<LfgGroupInvite> {
  const response = await fetch(`${API_BASE_URL}/api/lfg-groups/${lfgGroupId}/invite`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ inviteeUserId }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to invite player.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getMyLfgGroupInvites(token: string): Promise<LfgGroupInvite[]> {
  const response = await fetch(`${API_BASE_URL}/api/lfg-groups/my-invites`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load invites.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function acceptLfgGroupInvite(token: string, inviteId: string): Promise<LfgGroupInvite> {
  const response = await fetch(`${API_BASE_URL}/api/lfg-groups/invites/${inviteId}/accept`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to accept invite.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function declineLfgGroupInvite(token: string, inviteId: string): Promise<LfgGroupInvite> {
  const response = await fetch(`${API_BASE_URL}/api/lfg-groups/invites/${inviteId}/decline`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to decline invite.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function cancelLfgGroup(token: string, lfgGroupId: string): Promise<LfgGroup> {
  const response = await fetch(`${API_BASE_URL}/api/lfg-groups/${lfgGroupId}/cancel`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to cancel group.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
