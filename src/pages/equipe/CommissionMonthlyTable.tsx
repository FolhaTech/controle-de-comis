import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { calculatePersonMonthlyCommission } from '@/lib/calculations'
import type { Contract, Consultant, Settings } from '@/lib/types'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface CommissionMonthlyTableProps {
  consultants: Consultant[]
  contracts: Contract[]
  settings: Settings
  month: number
  year: number
  loading?: boolean
}

export function CommissionMonthlyTable({
  consultants,
  contracts,
  settings,
  month,
  year,
  loading = false,
}: CommissionMonthlyTableProps) {
  const rows = consultants.map((consultant) => {
    const breakdown = calculatePersonMonthlyCommission(
      contracts,
      consultant.name,
      month,
      year,
      settings,
    )
    return {
      consultant,
      contractCount: breakdown.items.length,
      ...breakdown,
    }
  })

  const totalGeral = rows.reduce((sum, r) => sum + r.total, 0)
  const monthLabel = String(month).padStart(2, '0')

  return (
    <div className="bg-white rounded-xl shadow-subtle border overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-serif text-lg font-semibold text-primary">Comissão do Mês</h3>
        <p className="text-xs text-muted-foreground">
          Calculada pela quantidade de contratos já feitos até hoje em {monthLabel}/{year}
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>Pessoa</TableHead>
              <TableHead className="text-right">Contratos até hoje</TableHead>
              <TableHead className="text-right">Faixa</TableHead>
              <TableHead className="text-right font-semibold">Comissão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum membro cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((row) => (
                  <TableRow
                    key={row.consultant.id}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <TableCell className="font-medium">{row.consultant.name}</TableCell>
                    <TableCell className="text-right">{row.contractCount}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.basePercentage}%
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {currencyFormatter.format(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-secondary/30 font-semibold">
                  <TableCell colSpan={3}>Total Geral</TableCell>
                  <TableCell className="text-right text-primary">
                    {currencyFormatter.format(totalGeral)}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
