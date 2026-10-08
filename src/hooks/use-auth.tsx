import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { apiBases, authFetch, getAuthToken, setAuthToken, AUTH_EXPIRED_EVENT } from '@/services/api-base'

export interface AuthUser {
  id: number
  email: string
  role: 'admin' | 'comum'
  consultant_name: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const signOut = useCallback(() => {
    setAuthToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      for (const base of apiBases()) {
        try {
          const res = await authFetch(`${base}/api/auth/me`)
          if (!res.ok) throw new Error(`status ${res.status}`)
          const body = await res.json()
          if (!cancelled) setUser(body.user)
          break
        } catch {
          // try next base
        }
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleExpired = () => signOut()
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired)
  }, [signOut])

  const signIn = useCallback(async (email: string, password: string) => {
    let lastError = 'Não foi possível conectar ao servidor.'
    for (const base of apiBases()) {
      try {
        const res = await fetch(`${base}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          return { error: body?.error ?? 'Email ou senha inválidos.' }
        }
        setAuthToken(body.token)
        setUser(body.user)
        return { error: null }
      } catch (err) {
        lastError = String(err)
      }
    }
    return { error: lastError }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
  )
}
