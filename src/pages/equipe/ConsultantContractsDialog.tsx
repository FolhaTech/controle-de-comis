import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  isContractValid,
  calculateCommissionBreakdown,
  calculateAttendantCommission,
  contractValue as valueOf,
} from '@/lib/calculations'
import type { Contract, Consultant, Settings } from '@/lib/types'
import { format } from 'date-fns'
import { useContractRowActions } from '@/hooks/use-contract-row-actions'
import { ContractAdjustmentForm, toEditableStatus, type ContractAdjustmentFormValues } from './ContractAdjustmentForm'

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
    case 'Em processo':
      return 'bg-warning/15 text-warning-foreground hover:bg-warning/25'
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

  const { isManualContract, saveAdd, saveEdit, removeContract } = useContractRowActions()
  const [formOpen, setFormOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      setPeriod(initialPeriod)
      setCustomFrom('')
      setCustomTo('')
    }
  }, [open, initialPeriod, consultant?.id])

  const toDateInputValue = (iso: string | null) => (iso ? iso.slice(0, 10) : '')

  const handleOpenAdd = () => {
    setEditingContract(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (c: Contract) => {
    setEditingContract(c)
    setFormOpen(true)
  }

  const handleFormSubmit = async (values: ContractAdjustmentFormValues) => {
    if (!consultant) return
    if (editingContract) {
      await saveEdit(editingContract, values, consultant.name)
    } else {
      await saveAdd(values, consultant.name)
    }
    setFormOpen(false)
    setEditingContract(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !consultant) return
    setIsDeleting(true)
    await removeContract(deleteTarget, consultant.name)
    setIsDeleting(false)
    setDeleteTarget(null)
  }

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
    <>
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
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar contrato
              </Button>
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
                <TableHead>Tipo de Ação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                        <TableCell className="text-sm text-muted-foreground">
                          {c.case_type || '—'}
                        </TableCell>
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
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEdit(c)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(c)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="bg-secondary/30 font-semibold">
                    <TableCell colSpan={4}>Total a Receber</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-primary">
                      {currencyFormatter.format(totalAReceber)}
                    </TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>

    <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditingContract(null) }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{editingContract ? 'Editar contrato' : 'Adicionar contrato'}</DialogTitle>
        </DialogHeader>
        <ContractAdjustmentForm
          initialValues={
            editingContract
              ? {
                  client: editingContract.client || editingContract.name || '',
                  case_type: editingContract.case_type || '',
                  value: valueOf(editingContract),
                  start_date: toDateInputValue(editingContract.start_date),
                  status: toEditableStatus(editingContract.status),
                  cancellation_deduction: editingContract.cancellation_deduction,
                }
              : undefined
          }
          onSubmit={handleFormSubmit}
          onCancel={() => { setFormOpen(false); setEditingContract(null) }}
        />
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover contrato</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover o contrato de{' '}
            <strong>{deleteTarget?.client || deleteTarget?.name}</strong> da apuração de{' '}
            {consultant?.name}? Esta ação não afeta o cadastro original no Triare.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDeleteConfirm()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Removendo...' : 'Remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
