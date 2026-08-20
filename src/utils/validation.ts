export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) {
    return 'email is required'
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'password is required'
  }
  if (password.length < 8) {
    return 'password must be at least 8 characters'
  }
  return null
}
