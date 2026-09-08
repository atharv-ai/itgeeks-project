/**
 * src/lib/auth.ts
 * Pure helpers for JWT token management in localStorage.
 */

const TOKEN_KEY = "ss_token"
const EMAIL_KEY = "ss_email"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

export function getStoredEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY)
}

export function setStoredEmail(email: string): void {
  localStorage.setItem(EMAIL_KEY, email)
}

/** Decode the JWT payload (no verification — server already validated it). */
function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

/** Returns true if a token exists and has not yet expired. */
export function isAuthenticated(): boolean {
  const token = getToken()
  if (!token) return false
  const payload = decodePayload(token)
  if (!payload) return false
  const exp = payload["exp"] as number | undefined
  if (!exp) return false
  return Date.now() / 1000 < exp
}
