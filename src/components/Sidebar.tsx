import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  Target,
  Settings,
  LogOut,
  Menu,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'Contratos', path: '/contratos' },
  { icon: Users, label: 'Equipe', path: '/equipe' },
  { icon: Target, label: 'Quarter', path: '/quarter' },
  { icon: SlidersHorizontal, label: 'Parâmetros', path: '/parametros' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
]

export function Sidebar({ className }: { className?: string }) {
  const location = useLocation()

  const NavContent = () => (
    <div className="flex h-full flex-col bg-primary text-primary-foreground">
      <div className="p-6 flex items-center justify-center border-b border-white/10">
        <h2 className="text-xl font-serif font-bold text-white text-center leading-tight">
          Arantes Arimura
          <br />
          Advocacia
        </h2>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10',
              location.pathname === item.path ? 'bg-white/20 text-white' : 'text-white/80',
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Ana Silva</span>
            <span className="text-xs text-white/60">Gestora Comercial</span>
          </div>
          <button className="text-white/80 hover:text-white transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-3 left-4 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-primary border-none">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className={cn('hidden md:flex w-72 flex-col fixed inset-y-0 z-20', className)}>
        <NavContent />
      </aside>
    </>
  )
}
