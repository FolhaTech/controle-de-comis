import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { buildPersonMonthlyTotals } from '@/lib/calculations'
import type { Contract, Consultant } from '@/lib/types'

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const compactCurrency = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const fullCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface MonthlyValuesTableProps {
  consultants: Consultant[]
  contracts: Contract[]
  year: number
  onYearChange: (year: number) => void
  loading?: boolean
}

export function MonthlyValuesTable({
  consultants,
  contracts,
  year,
  onYearChange,
  loading = false,
}: MonthlyValuesTableProps) {
  const names = consultants.map((c) => c.name).filter(Boolean)
  const rows = buildPersonMonthlyTotals(contracts, names, year)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 3 + i)

  const yearTotal = rows.reduce((sum, r) => sum + r.total, 0)
  const monthTotals = MONTH_LABELS.map((_, i) => rows.reduce((sum, r) => sum + r.months[i], 0))

  return (
    <div className="bg-white rounded-xl shadow-subtle border overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b">
        <div>
          <h3 className="font-serif text-lg font-semibold text-primary">
            Valores Fechados por Pessoa
          </h3>
          <p className="text-xs text-muted-foreground">Valores em R$, por mês de {year}</p>
        </div>
        <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead className="sticky left-0 bg-secondary/40 min-w-[160px]">Pessoa</TableHead>
              {MONTH_LABELS.map((m) => (
                <TableHead key={m} className="text-right whitespace-nowrap">
                  {m}
                </TableHead>
              ))}
              <TableHead className="text-right font-semibold whitespace-nowrap">
                Total {year}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={14}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                  Nenhum membro cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((row) => (
                  <TableRow key={row.name} className="hover:bg-secondary/20 transition-colors">
                    <TableCell className="sticky left-0 bg-white font-medium">
                      {row.name}
                    </TableCell>
                    {row.months.map((value, i) => (
                      <TableCell
                        key={i}
                        title={fullCurrency.format(value)}
                        className={`text-right whitespace-nowrap ${value === 0 ? 'text-muted-foreground/50' : ''}`}
                      >
                        {value === 0 ? '—' : compactCurrency.format(value)}
                      </TableCell>
                    ))}
                    <TableCell
                      title={fullCurrency.format(row.total)}
                      className="text-right whitespace-nowrap font-semibold text-primary"
                    >
                      {compactCurrency.format(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-secondary/30 font-semibold">
                  <TableCell className="sticky left-0 bg-secondary/30">Total Geral</TableCell>
                  {monthTotals.map((value, i) => (
                    <TableCell key={i} title={fullCurrency.format(value)} className="text-right whitespace-nowrap">
                      {value === 0 ? '—' : compactCurrency.format(value)}
                    </TableCell>
                  ))}
                  <TableCell
                    title={fullCurrency.format(yearTotal)}
                    className="text-right whitespace-nowrap text-primary"
                  >
                    {compactCurrency.format(yearTotal)}
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
