import { describe, it, expect } from 'vitest'
import { validateEmail, validateUsername, validatePassword } from './validation'

describe('validateEmail', () => {
  it('returns an error when the email is empty', () => {
    expect(validateEmail('')).toBe('email is required')
    expect(validateEmail('   ')).toBe('email is required')
  })

  it('returns an error when the email format is invalid', () => {
    expect(validateEmail('not-an-email')).toBe('enter a valid email address')
    expect(validateEmail('missing@domain')).toBe('enter a valid email address')
  })

  it('returns null for a valid email', () => {
    expect(validateEmail('someone@example.com')).toBeNull()
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
    expect(validatePassword('short1')).toBe('password must be at least 8 characters')
  })

  it('returns null for a valid password', () => {
    expect(validatePassword('password123')).toBeNull()
  })
})
