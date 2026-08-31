import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  isContractValid,
  calculateCommissionBreakdown,
  calculateAttendantCommission,
  contractValue as valueOf,
} from '@/lib/calculations'
import type { Contract, Consultant, Settings } from '@/lib/types'
import { format } from 'date-fns'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function getStatusColor(status: string | null) {
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

export type ContractsPeriod = 'all' | `${number}-${number}` | 'custom'

interface ConsultantContractsDialogProps {
  consultant: Consultant | null
  contracts: Contract[]
  settings: Settings
  open: boolean
  onOpenChange: (open: boolean) => void
  initialPeriod?: ContractsPeriod
  year: number
}

export function ConsultantContractsDialog({
  consultant,
  contracts,
  settings,
  open,
  onOpenChange,
  initialPeriod = 'all',
  year,
}: ConsultantContractsDialogProps) {
  const [period, setPeriod] = useState<ContractsPeriod>(initialPeriod)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => {
    if (open) {
      setPeriod(initialPeriod)
      setCustomFrom('')
      setCustomTo('')
    }
  }, [open, initialPeriod, consultant?.id])

  const normalize = (value: string) => value.trim().toLowerCase()
  const target = consultant ? normalize(consultant.name) : ''

  const personContracts = consultant
    ? contracts
        .filter((c) => c.closed_by && normalize(c.closed_by) === target)
        .filter((c) => {
          if (period === 'all') return true
          if (!c.start_date) return false
          const d = new Date(c.start_date)

          if (period === 'custom') {
            if (!customFrom && !customTo) return false
            if (customFrom && d < new Date(`${customFrom}T00:00:00`)) return false
            if (customTo && d > new Date(`${customTo}T23:59:59`)) return false
            return true
          }

          const [month, y] = period.split('-').map(Number)
          return d.getMonth() + 1 === month && d.getFullYear() === y
        })
        .sort((a, b) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime())
    : []

  const validContracts = personContracts.filter(isContractValid)
  const totalValue = validContracts.reduce((sum, c) => sum + valueOf(c), 0)

  const breakdown = calculateCommissionBreakdown(personContracts, settings)
  const commissionByContractId = new Map(breakdown.items.map((item) => [item.contract.id, item]))

  const trabalhistaContracts = personContracts.filter(
    (c) => c.service_type === 'Trabalhista' && isContractValid(c),
  )
  const trabalhista = calculateAttendantCommission(trabalhistaContracts.length, settings)
  const totalAReceber = breakdown.total + trabalhista.commissionValue

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Contratos fechados por {consultant?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pb-2 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">{personContracts.length}</strong> contrato(s)
              </span>
              <span>
                <strong className="text-foreground">{validContracts.length}</strong> válido(s)
              </span>
              <span>
                Total:{' '}
                <strong className="text-foreground">{currencyFormatter.format(totalValue)}</strong>
              </span>
              <span>
                A Receber ({breakdown.basePercentage}%
                {trabalhistaContracts.length > 0 ? ' + trabalhista' : ''}):{' '}
                <strong className="text-primary">
                  {currencyFormatter.format(totalAReceber)}
                </strong>
              </span>
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as ContractsPeriod)}>
              <SelectTrigger className="h-8 w-[170px] text-xs">
                <SelectValue placeholder="Competência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={`${i + 1}-${year}`}>
                    {m}/{year}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Período personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {period === 'custom' && (
            <div className="flex items-end gap-3 animate-fade-in-down">
              <div className="space-y-1">
                <Label htmlFor="customFrom" className="text-xs">
                  De
                </Label>
                <Input
                  id="customFrom"
                  type="date"
                  className="h-8 w-[150px] text-xs"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customTo" className="text-xs">
                  Até
                </Label>
                <Input
                  id="customTo"
                  type="date"
                  className="h-8 w-[150px] text-xs"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="max-h-[55vh] pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {period === 'custom' && !customFrom && !customTo
                      ? 'Selecione a data inicial e/ou final.'
                      : 'Nenhum contrato encontrado para esta competência.'}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {personContracts.map((c) => {
                    const item = commissionByContractId.get(c.id)
                    const isTrabalhista = c.service_type === 'Trabalhista'
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.client || c.name || '—'}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {currencyFormatter.format(valueOf(c))}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                          {isTrabalhista ? 'Trabalhista' : item ? `${item.percentage.toFixed(1)}%` : '—'}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap font-medium text-primary">
                          {isTrabalhista
                            ? currencyFormatter.format(trabalhista.valuePerContract)
                            : item
                              ? currencyFormatter.format(item.commissionValue)
                              : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {c.start_date ? format(new Date(c.start_date), 'dd/MM/yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(c.status)}>
                            {c.status || '—'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="bg-secondary/30 font-semibold">
                    <TableCell colSpan={3}>Total a Receber</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-primary">
                      {currencyFormatter.format(totalAReceber)}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
