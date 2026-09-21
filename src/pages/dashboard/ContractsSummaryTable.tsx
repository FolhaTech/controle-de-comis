import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Contract } from '@/lib/types'
import { contractValue } from '@/lib/calculations'

function formatCurrency(val: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function getStatusBadge(status: string | null) {
  if (!status) return <Badge variant="secondary">—</Badge>
  const variant =
    status === 'Ativo' ? 'default' : status === 'Cancelado' ? 'destructive' : 'secondary'
  return <Badge variant={variant}>{status}</Badge>
}

interface ContractsSummaryTableProps {
  contracts: Contract[]
  loading: boolean
}

export function ContractsSummaryTable({ contracts, loading }: ContractsSummaryTableProps) {
  const displayContracts = contracts.slice(0, 10)

  return (
    <div className="bg-white rounded-xl shadow-subtle border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-primary">Contratos do Mês</h3>
        <Link to="/contratos" className="text-sm text-primary hover:underline">
          Ver todos
        </Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>Nome</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor Contratado</TableHead>
              <TableHead className="text-right">Valor de Entrada</TableHead>
              <TableHead>Método de Pagamento</TableHead>
              <TableHead className="text-center">Parcelas</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : displayContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum contrato encontrado
                </TableCell>
              </TableRow>
            ) : (
              displayContracts.map((c) => (
                <TableRow key={c.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell className="font-medium max-w-[180px] truncate">
                    {c.name || '—'}
                  </TableCell>
                  <TableCell className="font-medium max-w-[150px] truncate">
                    {c.client || '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(contractValue(c))}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(c.entry_value)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.payment_method || '—'}
                  </TableCell>
                  <TableCell className="text-center">{c.installments || '—'}</TableCell>
                  <TableCell>{getStatusBadge(c.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
