import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import useAppStore from '@/stores/useAppStore'
import { ContractForm } from './contratos/ContractForm'
import { Contract } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const displayText = (value: string | null) => value || '—'
const displayInstallments = (installments: number | null) =>
  installments && installments > 0 ? `${installments}x` : '—'
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy')
  } catch {
    return '—'
  }
}

export default function Contratos() {
  const { contracts, contractsLoading, contractsError, filter, deleteContract, fetchContracts } =
    useAppStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | undefined>(undefined)
  const [viewMode, setViewMode] = useState<'all' | 'period'>('all')
  const [contratoSearchOpen, setContratoSearchOpen] = useState(false)
  const [contratoSearchTerm, setContratoSearchTerm] = useState('')

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const filteredContracts = (contracts ?? []).filter((c) => {
    const matchesSearch =
      (c?.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesContrato = (c?.name || '')
      .toLowerCase()
      .includes(contratoSearchTerm.toLowerCase())
    if (viewMode === 'all') return matchesSearch && matchesContrato
    if (!c?.start_date) return false
    const d = new Date(c.start_date)
    return (
      d.getMonth() + 1 === filter.month &&
      d.getFullYear() === filter.year &&
      matchesSearch &&
      matchesContrato
    )
  })

  const periodTotalValue = filteredContracts.reduce(
    (sum, c) => sum + (c.contracted_value || 0),
    0,
  )

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

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract)
    setIsDialogOpen(true)
  }
  const handleOpenNew = () => {
    setEditingContract(undefined)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteContract(id)
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir.' })
    } else {
      toast({ title: 'Contrato excluído' })
    }
  }

  const escapeCsvValue = (value: string | number | null | undefined) => {
    const str = value === null || value === undefined ? '' : String(value)
    return /[";\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }

  const handleExport = () => {
    const headers = [
      'Cliente',
      'CPF',
      'Telefone',
      'Email',
      'Contrato',
      'Valor Total',
      'Entrada',
      'Entrada Paga',
      'Forma de Pagamento',
      'Método de Entrada',
      'Parcelas',
      'Status',
      'Data de Início',
    ]

    const rows = filteredContracts.map((contract) => [
      contract.client || contract.name || '',
      contract.client_cpf || '',
      contract.client_phone || '',
      contract.client_email || '',
      contract.name || '',
      currencyFormatter.format(contract.contracted_value || 0),
      contract.entry_value != null && contract.entry_value > 0
        ? currencyFormatter.format(contract.entry_value)
        : '',
      contract.entry_value != null && contract.entry_value > 0
        ? contract.is_entry_paid
          ? 'Pago'
          : 'Pendente'
        : '',
      contract.payment_method || '',
      contract.entry_payment_method || '',
      displayInstallments(contract.installments),
      contract.status || '',
      formatDate(contract.start_date),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(';'))
      .join('\r\n')

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contratos-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({ title: 'Exportação concluída', description: `${rows.length} contrato(s) exportado(s).` })
  }

  const tableHeaders = [
    'Cliente',
    'Contrato',
    'Valor Total',
    'Entrada',
    'Forma de Pagamento',
    'Método de Entrada',
    'Parcelas',
    'Status',
    'Data de Início',
  ]
  const hiddenClasses = [
    '',
    'hidden lg:table-cell',
    '',
    'hidden sm:table-cell',
    'hidden md:table-cell',
    'hidden lg:table-cell',
    'hidden sm:table-cell',
    '',
    'hidden md:table-cell',
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-subtle border">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setViewMode('all')}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'period' ? 'default' : 'outline'}
              onClick={() => setViewMode('period')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              {String(filter.month).padStart(2, '0')}/{filter.year}
            </Button>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredContracts.length === 0}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingContract ? 'Editar Contrato' : 'Registrar Novo Contrato'}
                </DialogTitle>
              </DialogHeader>
              <ContractForm
                contract={editingContract}
                onSuccess={() => {
                  setIsDialogOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === 'period' && !contractsLoading && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Valor fechado em {String(filter.month).padStart(2, '0')}/{filter.year}
            </p>
            <p className="text-2xl font-bold text-primary">
              {currencyFormatter.format(periodTotalValue)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredContracts.length}{' '}
            {filteredContracts.length === 1 ? 'contrato fechado' : 'contratos fechados'}
          </p>
        </div>
      )}

      {contractsError && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 animate-fade-in-down">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{contractsError}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-subtle border overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              {tableHeaders.map((header, i) => (
                <TableHead key={header} className={hiddenClasses[i]}>
                  {header === 'Contrato' ? (
                    <div className="flex items-center gap-1">
                      <span>{header}</span>
                      <button
                        type="button"
                        onClick={() => setContratoSearchOpen((open) => !open)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Buscar por contrato"
                      >
                        <Search className="h-3.5 w-3.5" />
                      </button>
                      {contratoSearchOpen && (
                        <Input
                          autoFocus
                          value={contratoSearchTerm}
                          onChange={(e) => setContratoSearchTerm(e.target.value)}
                          placeholder="Localizar..."
                          className="h-7 w-32 text-xs font-normal"
                        />
                      )}
                    </div>
                  ) : (
                    header
                  )}
                </TableHead>
              ))}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contractsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={10}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Nenhum contrato encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract, index) => (
                <TableRow
                  key={contract.id ?? `${contract.name}-${index}`}
                  className="hover:bg-secondary/20 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-start gap-1.5">
                      <div>
                        {contract.client || contract.name || '—'}
                        <span className="text-[10px] block text-muted-foreground">
                          {contract.client_cpf || ''}
                        </span>
                      </div>
                      {(contract.client_phone || contract.client_email) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-secondary text-muted-foreground cursor-help hover:bg-secondary/80 transition-colors">
                              <Phone className="h-2.5 w-2.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <div className="text-xs space-y-1">
                              {contract.client_phone && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="h-3 w-3" />
                                  <span>{contract.client_phone}</span>
                                </div>
                              )}
                              {contract.client_email && (
                                <div className="flex items-center gap-1.5">
                                  <Mail className="h-3 w-3" />
                                  <span>{contract.client_email}</span>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {contract.name || '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {currencyFormatter.format(contract.contracted_value || 0)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm">
                        {contract.entry_value != null && contract.entry_value > 0
                          ? currencyFormatter.format(contract.entry_value)
                          : '—'}
                      </span>
                      {contract.entry_value != null && contract.entry_value > 0 && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] w-fit ${contract.is_entry_paid ? 'border-success/30 text-success bg-success/5' : 'border-warning/30 text-warning-foreground bg-warning/5'}`}
                        >
                          {contract.is_entry_paid ? (
                            <>
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                              Pago
                            </>
                          ) : (
                            <>
                              <Clock className="h-2.5 w-2.5 mr-0.5" />
                              Pendente
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {displayText(contract.payment_method)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {displayText(contract.entry_payment_method)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {displayInstallments(contract.installments)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(contract.status)}>
                      {contract.status || '—'}
                    </Badge>
                    {contract.status === 'Cancelado' && contract.internal_failure && (
                      <span className="text-[10px] block text-muted-foreground mt-1">
                        Falha Interna
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDate(contract.start_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(contract)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o contrato de{' '}
                              <strong>{contract.client}</strong>? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(contract.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
