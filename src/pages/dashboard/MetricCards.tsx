import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, XCircle, DollarSign, Wallet } from 'lucide-react'

interface MetricCardsProps {
  validContractsCount: number
  cancelledCount: number
  grossRevenue: number
  netRevenue: number
}

export function MetricCards({
  validContractsCount,
  cancelledCount,
  grossRevenue,
  netRevenue,
}: MetricCardsProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
          <Activity className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{validContractsCount}</div>
          <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cancelamentos</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{cancelledCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Distratos no mês</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(grossRevenue)}</div>
          <p className="text-xs text-muted-foreground mt-1">Volume de vendas</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow bg-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            Estimativa de Pagamento
          </CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(netRevenue)}</div>
          <p className="text-xs text-primary/70 mt-1">Comissões + Bônus</p>
        </CardContent>
      </Card>
    </div>
  )
}
