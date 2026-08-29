import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordConfirmation,
  getPasswordStrength,
  MINIMUM_PASSWORD_SCORE,
} from './validation'

describe('validateEmail', () => {
  it('returns an error when the email is empty', () => {
    expect(validateEmail('')).toBe('email is required')
    expect(validateEmail('   ')).toBe('email is required')
  })

  it('returns an error when the email format is invalid', () => {
    expect(validateEmail('not-an-email')).toBe('enter a valid email address')
    expect(validateEmail('missing@domain')).toBe('enter a valid email address')
    expect(validateEmail('double@@example.com')).toBe('enter a valid email address')
    expect(validateEmail('empty@label..com')).toBe('enter a valid email address')
    expect(validateEmail('short@tld.c')).toBe('enter a valid email address')
  })

  it('returns null for a valid email', () => {
    expect(validateEmail('someone@example.com')).toBeNull()
    expect(validateEmail('  someone@example.co.uk  ')).toBeNull()
  })
})

describe('validateUsername', () => {
  it('returns an error when the username is empty', () => {
    expect(validateUsername('')).toBe('username is required')
    expect(validateUsername('   ')).toBe('username is required')
  })

  it('returns an error when the username is shorter than 3 characters', () => {
    expect(validateUsername('ab')).toBe('username must be between 3 and 32 characters')
  })

  it('returns an error when the username is longer than 32 characters', () => {
    expect(validateUsername('a'.repeat(33))).toBe(
      'username must be between 3 and 32 characters'
    )
  })

  it('returns null for a valid username', () => {
    expect(validateUsername('someone')).toBeNull()
  })
})

describe('validatePassword', () => {
  it('returns an error when the password is empty', () => {
    expect(validatePassword('')).toBe('password is required')
  })

  it('returns an error when the password is shorter than 8 characters', () => {
    expect(validatePassword('Short1')).toBe('password must be at least 8 characters')
  })

  it('requires a lowercase letter', () => {
    expect(validatePassword('PASSWORD123')).toBe('password must contain a lowercase letter')
  })

  it('requires an uppercase letter', () => {
    expect(validatePassword('password123')).toBe('password must contain an uppercase letter')
  })

  it('requires a number', () => {
    expect(validatePassword('PasswordOnly')).toBe('password must contain a number')
  })

  it('returns null for a password meeting the server policy', () => {
    expect(validatePassword('Password123')).toBeNull()
  })
})

describe('validatePasswordConfirmation', () => {
  it('requires a confirmation', () => {
    expect(validatePasswordConfirmation('Password123', '')).toBe('please confirm your password')
  })

  it('returns an error when the two values differ', () => {
    expect(validatePasswordConfirmation('Password123', 'Password124')).toBe(
      'passwords do not match'
    )
  })

  it('returns null when the two values match', () => {
    expect(validatePasswordConfirmation('Password123', 'Password123')).toBeNull()
  })
})

describe('getPasswordStrength', () => {
  it('reports which requirements are met', () => {
    expect(getPasswordStrength('Passw0rd!').requirements).toEqual({
      length: true,
      lowercase: true,
      uppercase: true,
      number: true,
      symbol: true,
    })
  })

  it('scores an empty password as weak', () => {
    expect(getPasswordStrength('').score).toBe(0)
  })

  it('never rates a password above fair when it fails the server policy', () => {
    // Long, but no uppercase and no digit - the server would reject it.
    expect(getPasswordStrength('thisisaverylongpassword').score).toBeLessThan(
      MINIMUM_PASSWORD_SCORE
    )
  })

  it('rates a compliant medium-length password as at least good', () => {
    expect(getPasswordStrength('Password123').score).toBeGreaterThanOrEqual(
      MINIMUM_PASSWORD_SCORE
    )
  })

  it('rates a long password with all character classes as strong', () => {
    const strength = getPasswordStrength('Tr0ub4dor&Elephant')
    expect(strength.score).toBe(3)
    expect(strength.label).toBe('strong')
  })

  it('penalises repeated characters', () => {
    expect(getPasswordStrength('Paaaassword1').score).toBeLessThan(
      getPasswordStrength('Pxbqzswoirt1').score
    )
  })

  it('penalises keyboard and alphabet sequences', () => {
    expect(getPasswordStrength('Qwerty12345').score).toBeLessThan(
      getPasswordStrength('Xmzqbt83Rk').score
    )
  })
})
