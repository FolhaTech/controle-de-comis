import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { countValidContractsByPerson, calculateAttendantCommission } from '@/lib/calculations'
import type { Contract, Consultant, Settings } from '@/lib/types'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface AttendantCommissionTableProps {
  consultants: Consultant[]
  contracts: Contract[]
  settings: Settings
  month: number
  year: number
  loading?: boolean
}

export function AttendantCommissionTable({
  consultants,
  contracts,
  settings,
  month,
  year,
  loading = false,
}: AttendantCommissionTableProps) {
  const attendants = consultants.filter((c) => c.type === 'atendente')

  const rows = attendants.map((attendant) => {
    const contractCount = countValidContractsByPerson(contracts, attendant.name, month, year)
    const commission = calculateAttendantCommission(contractCount, settings)
    return { attendant, ...commission }
  })

  const totalGeral = rows.reduce((sum, r) => sum + r.total, 0)
  const monthLabel = String(month).padStart(2, '0')

  return (
    <div className="bg-white rounded-xl shadow-subtle border overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-serif text-lg font-semibold text-primary">
          Comissão de Atendimento (Setor Trabalhista)
        </h3>
        <p className="text-xs text-muted-foreground">
          Ajuda de custo + comissão por contrato fechado em {monthLabel}/{year}
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>Atendente</TableHead>
              <TableHead className="text-right">Contratos Fechados</TableHead>
              <TableHead className="text-right">Valor / Contrato</TableHead>
              <TableHead className="text-right">Comissão</TableHead>
              <TableHead className="text-right">Ajuda de Custo</TableHead>
              <TableHead className="text-right font-semibold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum atendente cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((row) => (
                  <TableRow key={row.attendant.id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell className="font-medium">{row.attendant.name}</TableCell>
                    <TableCell className="text-right">{row.contractCount}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.valuePerContract === 0
                        ? '—'
                        : currencyFormatter.format(row.valuePerContract)}
                    </TableCell>
                    <TableCell className="text-right">
                      {currencyFormatter.format(row.commissionValue)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {currencyFormatter.format(row.baseAllowance)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {currencyFormatter.format(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-secondary/30 font-semibold">
                  <TableCell colSpan={5}>Total Geral</TableCell>
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
