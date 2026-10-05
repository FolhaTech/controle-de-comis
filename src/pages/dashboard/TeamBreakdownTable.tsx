import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import type { Consultant, Contract, Settings } from '@/lib/types'
import { calculatePersonMonthlyCommission, contractValue, isContractValid } from '@/lib/calculations'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const normalize = (value: string) => value.trim().toLowerCase()

interface TeamBreakdownTableProps {
  consultants: Consultant[]
  // Contracts already scoped to the selected period + tarefa (but not team) —
  // drives the Contratos/Valor columns, so those two react to the tarefa filter.
  displayContracts: Contract[]
  // Contracts scoped to the period only — passed to calculatePersonMonthlyCommission
  // so Remuneração always matches the real monthly payout (same source as the
  // Equipe page), regardless of the tarefa filter skewing the commission tier.
  periodContracts: Contract[]
  settings: Settings
  month: number
  year: number
  loading?: boolean
}

export function TeamBreakdownTable({
  consultants,
  displayContracts,
  periodContracts,
  settings,
  month,
  year,
  loading = false,
}: TeamBreakdownTableProps) {
  const rows = consultants
    .map((consultant) => {
      const target = normalize(consultant.name)
      const personDisplayContracts = displayContracts.filter(
        (c) => c.closed_by && normalize(c.closed_by) === target && isContractValid(c),
      )
      const count = personDisplayContracts.length
      const totalValue = personDisplayContracts.reduce((sum, c) => sum + contractValue(c), 0)
      const remuneracao = calculatePersonMonthlyCommission(
        periodContracts,
        consultant.name,
        month,
        year,
        settings,
      ).total
      return { consultant, count, totalValue, remuneracao }
    })
    .filter((row) => row.count > 0 || row.remuneracao !== 0)
    .sort((a, b) => b.totalValue - a.totalValue)

  const totals = rows.reduce(
    (acc, row) => ({
      count: acc.count + row.count,
      totalValue: acc.totalValue + row.totalValue,
      remuneracao: acc.remuneracao + row.remuneracao,
    }),
    { count: 0, totalValue: 0, remuneracao: 0 },
  )

  return (
    <div className="bg-white rounded-xl shadow-subtle border p-4 space-y-4">
      <h3 className="font-serif text-lg font-semibold text-primary">Detalhamento por Equipe</h3>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>Consultor</TableHead>
              <TableHead className="text-center">Qtd. Contratos</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-right">Remuneração</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum resultado para os filtros selecionados
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((row) => (
                  <TableRow key={row.consultant.id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell className="font-medium">{row.consultant.name}</TableCell>
                    <TableCell className="text-center">{row.count}</TableCell>
                    <TableCell className="text-right">
                      {currencyFormatter.format(row.totalValue)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {currencyFormatter.format(row.remuneracao)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-secondary/30 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-center">{totals.count}</TableCell>
                  <TableCell className="text-right">
                    {currencyFormatter.format(totals.totalValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {currencyFormatter.format(totals.remuneracao)}
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
