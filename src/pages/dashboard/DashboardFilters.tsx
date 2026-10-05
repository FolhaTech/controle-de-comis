import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface DashboardFiltersProps {
  team: string
  onTeamChange: (value: string) => void
  teamOptions: string[]
  task: string
  onTaskChange: (value: string) => void
  taskOptions: string[]
}

export function DashboardFilters({
  team,
  onTeamChange,
  teamOptions,
  task,
  onTaskChange,
  taskOptions,
}: DashboardFiltersProps) {
  const { filter, setFilter } = useAppStore()
  const years = Array.from({ length: 5 }, (_, i) => 2024 + i)
  const hasActiveFilters = team !== 'all' || task !== 'all'

  return (
    <div className="bg-white rounded-xl shadow-subtle border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros
        </div>

        <Select
          value={filter.month.toString()}
          onValueChange={(val) => setFilter({ month: parseInt(val) })}
        >
          <SelectTrigger className="w-[140px]">
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

        <Select value={team} onValueChange={onTeamChange}>
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Equipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda a equipe</SelectItem>
            {teamOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={task} onValueChange={onTaskChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Tarefa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as tarefas</SelectItem>
            {taskOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onTeamChange('all')
              onTaskChange('all')
            }}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  )
}
