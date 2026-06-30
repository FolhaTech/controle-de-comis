import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts'
import useAppStore from '@/stores/useAppStore'
import { isContractValid } from '@/lib/calculations'

export default function Quarter() {
  const { contracts, settings, filter } = useAppStore()

  // Simple quarter calculation based on current selected month
  const quarter = Math.ceil(filter.month / 3)
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = quarter * 3

  const quarterContracts = contracts.filter((c) => {
    const d = new Date(c.date)
    const m = d.getMonth() + 1
    return m >= startMonth && m <= endMonth && d.getFullYear() === filter.year && isContractValid(c)
  })

  const totalValid = quarterContracts.length

  const getTierStatus = (target: number) => {
    if (totalValid >= target) return { color: 'var(--success)', pct: 100 }
    return { color: 'var(--primary)', pct: Math.min(100, (totalValid / target) * 100) }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-primary text-primary-foreground p-8 rounded-xl shadow-elevation relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-serif font-bold mb-2">
            Q{quarter} / {filter.year}
          </h2>
          <p className="text-primary-foreground/80 max-w-xl">
            Acompanhe o desempenho do trimestre atual. As metas trimestrais recompensam a
            consistência e o alto volume de fechamentos da equipe comercial.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg
            width="200"
            height="200"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {settings.quarterTiers.map((tier, index) => {
          const status = getTierStatus(tier.contracts)
          const data = [
            { name: 'Feitos', value: Math.min(totalValid, tier.contracts) },
            { name: 'Faltam', value: Math.max(0, tier.contracts - totalValid) },
          ]

          return (
            <Card
              key={index}
              className={`relative overflow-hidden ${totalValid >= tier.contracts ? 'border-success ring-1 ring-success/20' : ''}`}
            >
              {totalValid >= tier.contracts && (
                <div className="absolute top-0 right-0 bg-success text-success-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  ATINGIDA
                </div>
              )}
              <CardHeader className="text-center pb-0">
                <CardTitle className="text-lg text-muted-foreground">Nível {index + 1}</CardTitle>
                <CardDescription className="font-bold text-2xl text-foreground mt-1">
                  {tier.contracts} <span className="text-sm font-normal">contratos</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-4">
                <div className="h-40 w-full mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill={`hsl(${status.color})`} />
                        <Cell fill="hsl(var(--muted))" />
                        <Label
                          value={`${status.pct.toFixed(0)}%`}
                          position="center"
                          className="font-bold text-2xl fill-foreground"
                        />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center bg-secondary w-full py-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                    Prêmio
                  </p>
                  <p className="font-bold text-xl text-primary">{formatCurrency(tier.award)}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progresso Geral do Trimestre</CardTitle>
          <CardDescription>
            Status atual: {totalValid} contratos validados em Q{quarter}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">0</span>
              {settings.quarterTiers.map((t) => (
                <span key={t.contracts} className="font-medium">
                  {t.contracts}
                </span>
              ))}
            </div>
            <Progress
              value={(totalValid / settings.quarterTiers[2].contracts) * 100}
              className="h-4"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
