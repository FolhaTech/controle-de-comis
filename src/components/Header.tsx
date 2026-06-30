import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocation } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function Header() {
  const location = useLocation()
  const { filter, setFilter } = useAppStore()

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard / Metas 2026'
      case '/contratos':
        return 'Gestão de Contratos'
      case '/equipe':
        return 'Consultores'
      case '/quarter':
        return 'Metas Trimestrais (Quarter)'
      case '/configuracoes':
        return 'Configurações'
      default:
        return 'Controle de Comissão'
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => 2024 + i)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
      <h1 className="text-xl font-serif font-semibold text-primary hidden md:block">
        {getPageTitle()}
      </h1>

      <div className="flex items-center space-x-4 ml-auto">
        <div className="flex items-center space-x-2">
          <Select
            value={filter.month.toString()}
            onValueChange={(val) => setFilter({ month: parseInt(val) })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filter.year.toString()}
            onValueChange={(val) => setFilter({ year: parseInt(val) })}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  )
}
