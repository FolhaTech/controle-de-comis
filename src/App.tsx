import { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/useAppStore'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Index from './pages/Index'
import Contratos from './pages/Contratos'
import Equipe from './pages/Equipe'
import Quarter from './pages/Quarter'
import Configuracoes from './pages/Configuracoes'
import Parametros from './pages/Parametros'
import Processos from './pages/Processos'
import PremiacaoPrintPage from './pages/PremiacaoPrintPage'
import NotFound from './pages/NotFound'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Processos, Parâmetros and Configurações hold admin-only actions (editing
// goals, tiers, action types and user roles) — a comum user who navigates here
// directly gets sent back to the dashboard, same as the hidden sidebar entry.
function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

const App = () => (
  <AuthProvider>
    <AppProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/contratos" element={<Contratos />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/quarter" element={<Quarter />} />
              <Route
                path="/configuracoes"
                element={
                  <RequireAdmin>
                    <Configuracoes />
                  </RequireAdmin>
                }
              />
              <Route
                path="/parametros"
                element={
                  <RequireAdmin>
                    <Parametros />
                  </RequireAdmin>
                }
              />
              <Route
                path="/processos"
                element={
                  <RequireAdmin>
                    <Processos />
                  </RequireAdmin>
                }
              />
            </Route>
            <Route
              path="/premiacao-print"
              element={
                <RequireAuth>
                  <PremiacaoPrintPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AppProvider>
  </AuthProvider>
)

export default App
