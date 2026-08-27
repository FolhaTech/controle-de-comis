import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Contract } from '@/lib/types'
import { contractValue } from '@/lib/calculations'
import { format } from 'date-fns'

interface RecentActivityProps {
  contracts: Contract[]
  loading?: boolean
}

export function RecentActivity({ contracts, loading = false }: RecentActivityProps) {
  const recent = [...contracts]
    .sort((a, b) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime())
    .slice(0, 5)

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Ativo':
        return 'bg-success/15 text-success hover:bg-success/25'
      case 'Cancelado':
        return 'bg-destructive/15 text-destructive hover:bg-destructive/25'
      case 'Distrato Pendente':
        return 'bg-warning/15 text-warning-foreground hover:bg-warning/25'
      case 'Revertido':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recent.map((contract) => (
            <div
              key={contract.id}
              className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-medium text-sm">{contract.client || contract.name}</span>
                <span className="text-xs text-muted-foreground">
                  {contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : '—'}{' '}
                  • {contract.payment_method || '—'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-sm">
                  {formatCurrency(contractValue(contract))}
                </span>
                <Badge variant="secondary" className={getStatusColor(contract.status)}>
                  {contract.status || '—'}
                </Badge>
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">
              Nenhum contrato registrado no período selecionado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
