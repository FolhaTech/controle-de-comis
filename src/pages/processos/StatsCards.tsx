import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, ListChecks, ClipboardCheck } from 'lucide-react'
import type { ProcessStats } from '@/lib/processos'

interface StatsCardsProps {
  stats: ProcessStats | null
  loading: boolean
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const formatNumber = (val: number) => new Intl.NumberFormat('pt-BR').format(val)

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-32 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const topTask = stats.taskDistribution[0]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
          <FileText className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
          <p className="text-xs text-muted-foreground mt-1">Registros no banco</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tarefas Diferentes</CardTitle>
          <ListChecks className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.taskDistribution.length}</div>
          {topTask && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Principal: {topTask.nom_tarefa} ({formatNumber(topTask.count)})
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow bg-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">Saúde Documental</CardTitle>
          <ClipboardCheck className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats.avgDocPercentage.toFixed(1)}%
          </div>
          <p className="text-xs text-primary/70 mt-1">Média de docs anexados</p>
        </CardContent>
      </Card>
    </div>
  )
}
