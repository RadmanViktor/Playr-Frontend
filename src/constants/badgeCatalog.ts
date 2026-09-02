import {
  Award,
  Crown,
  Eclipse,
  Gamepad2,
  Heart,
  Library,
  MessageCircle,
  MessagesSquare,
  Moon,
  PenLine,
  Rocket,
  Shield,
  ThumbsUp,
  UserPlus,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Static catalog of every badge type the backend can grant. Used by the settings UI to render
 * a "locked badges" preview grid for badges the current user hasn't unlocked yet.
 *
 * Intentionally does NOT include exact thresholds or unlock rules - only a vague category
 * hint - so the frontend never leaks the precise "how" for a locked badge (that logic lives
 * in the backend's BadgeThresholds/BadgeService only).
 */
export interface BadgeCatalogEntry {
  type: string
  icon: LucideIcon
  /** i18n key suffix under badgeSection.categoryHints.* - a vague, non-numeric category hint. */
  categoryHintKey: string
  /** True for one-time/special badges that don't progress through Bronze/Silver/Gold tiers. */
  isSpecial: boolean
}

export const BADGE_CATALOG: readonly BadgeCatalogEntry[] = [
  { type: 'FirstHundredUsers', icon: Crown, categoryHintKey: 'foundingCommunity', isSpecial: true },
  { type: 'Poster', icon: PenLine, categoryHintKey: 'posting', isSpecial: false },
  { type: 'GameCritic', icon: Gamepad2, categoryHintKey: 'ratingGames', isSpecial: false },
  { type: 'Commentator', icon: MessageCircle, categoryHintKey: 'commenting', isSpecial: false },
  { type: 'Inviter', icon: UserPlus, categoryHintKey: 'invitingFriends', isSpecial: false },
  { type: 'Creator', icon: Shield, categoryHintKey: 'specialRecognition', isSpecial: true },
  { type: 'Admin', icon: Shield, categoryHintKey: 'specialRecognition', isSpecial: true },
  { type: 'Supporter', icon: ThumbsUp, categoryHintKey: 'likingPosts', isSpecial: false },
  { type: 'Popular', icon: Heart, categoryHintKey: 'postEngagement', isSpecial: false },
  { type: 'Socialite', icon: Users, categoryHintKey: 'socialConnections', isSpecial: false },
  { type: 'Chatterbox', icon: MessagesSquare, categoryHintKey: 'chatting', isSpecial: false },
  { type: 'Collector', icon: Library, categoryHintKey: 'gameLibrary', isSpecial: false },
  { type: 'Reactor', icon: Award, categoryHintKey: 'commentReactions', isSpecial: false },
  { type: 'Trailblazer', icon: Rocket, categoryHintKey: 'gettingStarted', isSpecial: true },
  { type: 'NightOwl', icon: Moon, categoryHintKey: 'timeOfDay', isSpecial: true },
  { type: 'Veteran', icon: Award, categoryHintKey: 'longevity', isSpecial: true },
  { type: 'Voidtouched', icon: Eclipse, categoryHintKey: 'hiddenGameTribute', isSpecial: true },
]
