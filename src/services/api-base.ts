export function apiBases(): string[] {
  const bases = [
    (import.meta.env.VITE_API_URL as string | undefined)?.trim(),
    'http://localhost:4000',
    'http://localhost:4001',
    'http://localhost:4002',
  ].filter(Boolean) as string[]
  bases.push('') // same-origin fallback, e.g. Vercel's /api/*
  return bases
}

const TOKEN_KEY = 'controle-de-comis-token'

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore storage failures (private mode, quota, ...)
  }
}

// Dispatched whenever an API call comes back 401 (missing, invalid or expired
// token) so the auth layer can log the user out without every service needing
// to know about routing — see AuthProvider in hooks/use-auth.tsx.
export const AUTH_EXPIRED_EVENT = 'controle-de-comis-auth-expired'

// Drop-in replacement for fetch() that attaches the signed-in user's token and
// reports an expired/invalid session. Every authenticated API call should go
// through this instead of the global fetch.
export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(url, { ...init, headers })
  if (res.status === 401) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
  }
  return res
}
