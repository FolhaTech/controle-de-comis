import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface ProgressChartsProps {
  individualCount: number
  individualGoal: number
  groupCount: number
  groupGoal: number
  ticketMedio: number
  ticketMedioGoal: number
}

export function ProgressCharts({
  individualCount,
  individualGoal,
  groupCount,
  groupGoal,
  ticketMedio,
  ticketMedioGoal,
}: ProgressChartsProps) {
  const indPct = Math.min(100, (individualCount / individualGoal) * 100)
  const grpPct = Math.min(100, (groupCount / groupGoal) * 100)

  const ticketData = [
    { name: 'Atual', value: ticketMedio },
    { name: 'Faltante', value: Math.max(0, ticketMedioGoal - ticketMedio) },
  ]

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Meta Individual</CardTitle>
          <CardDescription>
            {individualCount} de {individualGoal} contratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="text-3xl font-bold mb-4">{indPct.toFixed(1)}%</div>
            <Progress value={indPct} className="h-3 w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-md">Meta Equipe</CardTitle>
          <CardDescription>
            {groupCount} de {groupGoal} contratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="text-3xl font-bold mb-4 text-primary">{grpPct.toFixed(1)}%</div>
            <Progress value={grpPct} className="h-3 w-full" indicatorColor="bg-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-md">Ticket Médio</CardTitle>
          <CardDescription>Meta: {formatCurrency(ticketMedioGoal)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[140px]">
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xl font-bold -mt-8">{formatCurrency(ticketMedio)}</div>
        </CardContent>
      </Card>
    </div>
  )
}
