import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Users, AlertCircle, FileDown, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import useAppStore from '@/stores/useAppStore'
import {
  calculatePersonMonthlyCommission,
  calculateMonthlyDeduction,
  calculateCancelamentosDeduction,
  getAjudaCusto,
} from '@/lib/calculations'
import { ConsultantForm } from './equipe/ConsultantForm'
import { MonthlyValuesTable } from './equipe/MonthlyValuesTable'
import { CommissionMonthlyTable } from './equipe/CommissionMonthlyTable'
import { AttendantCommissionTable } from './equipe/AttendantCommissionTable'
import {
  ConsultantContractsDialog,
  type ContractsPeriod,
} from './equipe/ConsultantContractsDialog'
import { ConsultantDeductionsDialog } from './equipe/ConsultantDeductionsDialog'
import { Consultant } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { PremiacaoReport } from './equipe/premiacaoPdf'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR')

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

function formatPaymentType(type: string | null): string {
  switch (type) {
    case 'daily':
      return 'Diário'
    case 'monthly':
      return 'Mensal'
    default:
      return type || '—'
  }
}

function formatStatus(status: string | null): {
  label: string
  variant: 'default' | 'secondary'
  className: string
} {
  if (status === 'active') {
    return { label: 'Ativo', variant: 'default', className: 'bg-success hover:bg-success' }
  }
  return { label: 'Inativo', variant: 'secondary', className: '' }
}

function formatType(type: string | null): string {
  switch (type) {
    case 'atendente':
      return 'Atendente'
    case 'consultor':
      return 'Consultor'
    default:
      return type || '—'
  }
}

export default function Equipe() {
  const {
    consultants,
    consultantsLoading,
    fetchConsultants,
    deleteConsultant,
    contracts,
    contractsLoading,
    consultantDeductions,
    settings,
    filter,
  } = useAppStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConsultant, setEditingConsultant] = useState<Consultant | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Consultant | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewingContractsFor, setViewingContractsFor] = useState<Consultant | null>(null)
  const [viewingPeriod, setViewingPeriod] = useState<ContractsPeriod>('all')
  const [viewingDeductionsFor, setViewingDeductionsFor] = useState<Consultant | null>(null)
  const [valuesYear, setValuesYear] = useState(new Date().getFullYear())
  const [printTargets, setPrintTargets] = useState<Consultant[] | null>(null)
  const { toast } = useToast()

  // Print the mounted #premiacao-print-root (see main.css) once its content
  // has actually painted, then clear it once the browser's print dialog
  // closes — whether the user saved a PDF or cancelled.
  useEffect(() => {
    if (!printTargets) return
    const timer = setTimeout(() => window.print(), 80)
    return () => clearTimeout(timer)
  }, [printTargets])

  useEffect(() => {
    const handleAfterPrint = () => setPrintTargets(null)
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { error } = await fetchConsultants()
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar os membros da equipe.',
        })
      }
    }
    load()
  }, [fetchConsultants, toast])

  const handleEdit = (consultant: Consultant) => {
    setEditingConsultant(consultant)
    setIsDialogOpen(true)
  }

  const handleOpenNew = () => {
    setEditingConsultant(undefined)
    setIsDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const { error } = await deleteConsultant(deleteTarget.id)
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o membro da equipe.',
      })
    } else {
      toast({
        title: 'Membro excluído',
        description: 'O membro da equipe foi excluído com sucesso.',
      })
    }
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  const handlePrintOne = (consultant: Consultant) => setPrintTargets([consultant])

  const handlePrintAll = () => {
    if (consultants.length === 0) return
    setPrintTargets(consultants)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Equipe Comercial</h2>
          <p className="text-muted-foreground">Gerencie os consultores e seus acessos.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handlePrintAll}
            disabled={consultantsLoading || consultants.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {`Extrair PDFs (${MONTHS[filter.month - 1]}/${filter.year})`}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Novo Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingConsultant ? 'Editar Membro' : 'Registrar Novo Membro'}
                </DialogTitle>
              </DialogHeader>
              <ConsultantForm
                consultant={editingConsultant}
                onSuccess={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-subtle border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Tipo</TableHead>
              <TableHead className="hidden lg:table-cell">Pagamento</TableHead>
              <TableHead>Remuneração</TableHead>
              <TableHead>Remuneração + Ajuda de Custo</TableHead>
              <TableHead className="hidden xl:table-cell">Telefone</TableHead>
              <TableHead className="hidden xl:table-cell">PIX</TableHead>
              <TableHead className="hidden lg:table-cell">Admissão</TableHead>
              <TableHead className="hidden xl:table-cell">Projeto</TableHead>
              <TableHead>Contratos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consultantsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-32" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : consultants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Users className="h-10 w-10 opacity-40" />
                    <p className="font-medium">Nenhum membro da equipe encontrado</p>
                    <p className="text-sm">
                      Clique em "Novo Membro" para adicionar o primeiro consultor.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              consultants.map((consultant) => {
                const statusInfo = formatStatus(consultant.status)
                const remuneracao = calculatePersonMonthlyCommission(
                  contracts,
                  consultant.name,
                  filter.month,
                  filter.year,
                  settings,
                ).total
                const monthlyDeduction = calculateMonthlyDeduction(
                  consultantDeductions,
                  consultant.name,
                  filter.month,
                  filter.year,
                )
                const cancelamentosDeduction = calculateCancelamentosDeduction(
                  contracts,
                  consultant.name,
                  filter.month,
                  filter.year,
                )
                const remuneracaoComAjuda =
                  remuneracao + getAjudaCusto(consultant) - monthlyDeduction - cancelamentosDeduction
                return (
                  <TableRow key={consultant.id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell className="font-medium">{consultant.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {consultant.role || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant} className={statusInfo.className}>
                        {statusInfo.label}
                      </Badge>
                      {consultant.participates_in_averages && (
                        <Badge
                          variant="outline"
                          className="ml-1 border-blue-500 text-blue-600 text-[10px]"
                        >
                          Médias
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatType(consultant.type)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatPaymentType(consultant.payment_type)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {currencyFormatter.format(remuneracao)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {currencyFormatter.format(remuneracaoComAjuda)}
                      {monthlyDeduction > 0 && (
                        <span className="block text-[10px] font-normal text-destructive">
                          -{currencyFormatter.format(monthlyDeduction)} desconto
                        </span>
                      )}
                      {cancelamentosDeduction > 0 && (
                        <span className="block text-[10px] font-normal text-destructive">
                          -{currencyFormatter.format(cancelamentosDeduction)} cancelados
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {consultant.phone || '—'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {consultant.pix_key || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {consultant.admission_date
                        ? dateFormatter.format(new Date(consultant.admission_date))
                        : '—'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {consultant.work_name || '—'}
                    </TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(value) => {
                          setViewingContractsFor(consultant)
                          setViewingPeriod(value as ContractsPeriod)
                        }}
                      >
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                          <SelectValue placeholder="Ver contratos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os períodos</SelectItem>
                          {MONTHS.map((m, i) => (
                            <SelectItem key={i} value={`${i + 1}-${filter.year}`}>
                              {m}/{filter.year}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Período personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Extrair PDF"
                          onClick={() => handlePrintOne(consultant)}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Descontos"
                          onClick={() => setViewingDeductionsFor(consultant)}
                        >
                          <Wallet className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(consultant)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(consultant)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!consultantsLoading && consultants.length > 0 && (
        <Card className="bg-secondary/30">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5" />
              {consultants.length}{' '}
              {consultants.length === 1 ? 'membro cadastrado' : 'membros cadastrados'}
              {consultants.filter((c) => c.status === 'active').length > 0 && (
                <span>· {consultants.filter((c) => c.status === 'active').length} ativos</span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      <AttendantCommissionTable
        consultants={consultants}
        contracts={contracts}
        settings={settings}
        month={filter.month}
        year={filter.year}
        loading={consultantsLoading || contractsLoading}
      />

      <MonthlyValuesTable
        consultants={consultants}
        contracts={contracts}
        settings={settings}
        year={valuesYear}
        onYearChange={setValuesYear}
        loading={consultantsLoading || contractsLoading}
      />

      <CommissionMonthlyTable
        consultants={consultants}
        contracts={contracts}
        settings={settings}
        month={filter.month}
        year={filter.year}
        loading={consultantsLoading || contractsLoading}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta ação não
              pode ser desfeita.
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
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConsultantContractsDialog
        consultant={viewingContractsFor}
        contracts={contracts}
        settings={settings}
        open={!!viewingContractsFor}
        onOpenChange={(open) => {
          if (!open) setViewingContractsFor(null)
        }}
        initialPeriod={viewingPeriod}
        year={filter.year}
      />

      <ConsultantDeductionsDialog
        consultant={viewingDeductionsFor}
        deductions={consultantDeductions}
        open={!!viewingDeductionsFor}
        onOpenChange={(open) => {
          if (!open) setViewingDeductionsFor(null)
        }}
      />

      {/* Only visible while printing (see the @media print rule in main.css) —
          holds one or several Premiação reports for window.print() to turn
          into a PDF via the browser's own "Salvar como PDF" print target. */}
      {printTargets && (
        <div id="premiacao-print-root">
          {printTargets.map((consultant, index) => (
            <PremiacaoReport
              key={consultant.id}
              consultant={consultant}
              contracts={contracts}
              consultantDeductions={consultantDeductions}
              settings={settings}
              month={filter.month}
              year={filter.year}
              pageBreakAfter={index < printTargets.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
