import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthUser {
  id: string
  email: string
  full_name: string
  role: string
}

interface AuthContextType {
  user: AuthUser | null
  session: Record<string, string> | null
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<{ error: unknown }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user] = useState<AuthUser>({
    id: 'local-user',
    email: 'usuario@local.com',
    full_name: 'Usuário Local',
    role: 'Administrador',
  })
  const [session] = useState<Record<string, string>>({ token: 'local-session' })
  const [loading] = useState(false)

  const signIn = async () => {
    return { error: null }
  }

  const signOut = async () => {
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
