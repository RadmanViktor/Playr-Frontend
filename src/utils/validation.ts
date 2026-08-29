export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) {
    return 'email is required'
  }
  // Deliberately not exhaustive - the server's own EmailAddress check is the
  // final word. This only catches obvious mistakes before a round trip.
  const emailPattern = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i
  if (!emailPattern.test(trimmed)) {
    return 'enter a valid email address'
  }
  return null
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim()
  if (!trimmed) {
    return 'username is required'
  }
  if (trimmed.length < 3 || trimmed.length > 32) {
    return 'username must be between 3 and 32 characters'
  }
  return null
}

/**
 * Mirrors the server's ASP.NET Identity policy: at least 8 characters with an
 * uppercase letter, a lowercase letter and a digit. Symbols are optional there,
 * so they are not required here either.
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'password is required'
  }
  if (password.length < 8) {
    return 'password must be at least 8 characters'
  }
  if (!/[a-z]/.test(password)) {
    return 'password must contain a lowercase letter'
  }
  if (!/[A-Z]/.test(password)) {
    return 'password must contain an uppercase letter'
  }
  if (!/[0-9]/.test(password)) {
    return 'password must contain a number'
  }
  return null
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string
): string | null {
  if (!confirmation) {
    return 'please confirm your password'
  }
  if (password !== confirmation) {
    return 'passwords do not match'
  }
  return null
}

export const PASSWORD_STRENGTH_LABELS = ['weak', 'fair', 'good', 'strong'] as const

export type PasswordStrengthLabel = (typeof PASSWORD_STRENGTH_LABELS)[number]

export interface PasswordRequirements {
  length: boolean
  lowercase: boolean
  uppercase: boolean
  number: boolean
  symbol: boolean
}

export interface PasswordStrength {
  /** 0 = weak, 1 = fair, 2 = good, 3 = strong. */
  score: 0 | 1 | 2 | 3
  label: PasswordStrengthLabel
  requirements: PasswordRequirements
}

/** Minimum score accepted by the register form. */
export const MINIMUM_PASSWORD_SCORE = 2

const SEQUENCES = 'abcdefghijklmnopqrstuvwxyz0123456789qwertyuiopasdfghjklzxcvbnm'

function hasRun(password: string): boolean {
  return /(.)\1{2,}/.test(password)
}

function hasSequence(password: string): boolean {
  const lower = password.toLowerCase()
  for (let i = 0; i + 4 <= lower.length; i += 1) {
    const chunk = lower.slice(i, i + 4)
    if (SEQUENCES.includes(chunk)) {
      return true
    }
    const reversed = [...chunk].reverse().join('')
    if (SEQUENCES.includes(reversed)) {
      return true
    }
  }
  return false
}

export function getPasswordStrength(password: string): PasswordStrength {
  const requirements: PasswordRequirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }

  if (!password) {
    return { score: 0, label: 'weak', requirements }
  }

  let points = 0

  // Length is the strongest single signal, so it is weighted most heavily.
  if (password.length >= 8) points += 1
  if (password.length >= 12) points += 1
  if (password.length >= 16) points += 1

  const classes = [
    requirements.lowercase,
    requirements.uppercase,
    requirements.number,
    requirements.symbol,
  ].filter(Boolean).length
  points += classes

  // Repeated characters and keyboard/alphabet runs make a password far easier
  // to guess than its raw length and character mix suggest.
  if (hasRun(password)) points -= 2
  if (hasSequence(password)) points -= 2

  // Anything failing the hard requirements can never rank above "fair",
  // otherwise the meter would encourage passwords the server will reject.
  const meetsRequirements =
    requirements.length && requirements.lowercase && requirements.uppercase && requirements.number

  let score: PasswordStrength['score']
  if (!meetsRequirements || points <= 3) {
    score = points <= 2 ? 0 : 1
  } else if (points <= 5) {
    score = 2
  } else {
    score = 3
  }

  if (!meetsRequirements && score > 1) {
    score = 1
  }

  return { score, label: PASSWORD_STRENGTH_LABELS[score], requirements }
}
