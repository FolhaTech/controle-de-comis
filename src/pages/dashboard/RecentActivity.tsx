import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Contract } from '@/lib/types'
import { format } from 'date-fns'

export function RecentActivity({ contracts }: { contracts: Contract[] }) {
  const recent = [...contracts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const getStatusColor = (status: string) => {
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
                <span className="font-medium text-sm">{contract.clientName}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(contract.date), 'dd/MM/yyyy')} • {contract.paymentMethod}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-sm">{formatCurrency(contract.value)}</span>
                <Badge variant="secondary" className={getStatusColor(contract.status)}>
                  {contract.status}
                </Badge>
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">
              Nenhum contrato registrado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
