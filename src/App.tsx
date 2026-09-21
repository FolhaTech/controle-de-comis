import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/useAppStore'
import { AuthProvider } from '@/hooks/use-auth'
import Layout from './components/Layout'
import Index from './pages/Index'
import Contratos from './pages/Contratos'
import Equipe from './pages/Equipe'
import Quarter from './pages/Quarter'
import Configuracoes from './pages/Configuracoes'
import Parametros from './pages/Parametros'
import Processos from './pages/Processos'
import NotFound from './pages/NotFound'

const App = () => (
  <AppProvider>
    <AuthProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/contratos" element={<Contratos />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/quarter" element={<Quarter />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/parametros" element={<Parametros />} />
              <Route path="/processos" element={<Processos />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </AppProvider>
)

export default App
