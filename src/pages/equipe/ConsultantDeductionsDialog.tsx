import { useState } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Consultant, ConsultantDeduction } from '@/lib/types'
import useAppStore from '@/stores/useAppStore'
import { DeductionForm, type DeductionFormValues } from './DeductionForm'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

interface ConsultantDeductionsDialogProps {
  consultant: Consultant | null
  deductions: ConsultantDeduction[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConsultantDeductionsDialog({
  consultant,
  deductions,
  open,
  onOpenChange,
}: ConsultantDeductionsDialogProps) {
  const { addConsultantDeduction, updateConsultantDeduction, deleteConsultantDeduction } = useAppStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingDeduction, setEditingDeduction] = useState<ConsultantDeduction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ConsultantDeduction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const normalize = (v: string) => v.trim().toLowerCase()
  const target = consultant ? normalize(consultant.name) : ''
  const personDeductions = consultant
    ? deductions
        .filter((d) => normalize(d.consultant_name) === target)
        .sort((a, b) => (b.start_year - a.start_year) || (b.start_month - a.start_month))
    : []

  const handleOpenAdd = () => {
    setEditingDeduction(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (d: ConsultantDeduction) => {
    setEditingDeduction(d)
    setFormOpen(true)
  }

  const handleFormSubmit = async (values: DeductionFormValues) => {
    if (!consultant) return
    if (editingDeduction) {
      await updateConsultantDeduction(editingDeduction.id, values)
    } else {
      await addConsultantDeduction({ ...values, consultant_name: consultant.name })
    }
    setFormOpen(false)
    setEditingDeduction(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteConsultantDeduction(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Descontos de {consultant?.name}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleOpenAdd}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar desconto
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead className="text-right">Parcela</TableHead>
                <TableHead>Início</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personDeductions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum desconto cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                personDeductions.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.description || '—'}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {currencyFormatter.format(d.total_value)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {d.installments}x de {currencyFormatter.format(d.total_value / d.installments)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {MONTH_LABELS[d.start_month - 1]}/{d.start_year}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(d)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(d)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditingDeduction(null) }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editingDeduction ? 'Editar desconto' : 'Adicionar desconto'}</DialogTitle>
          </DialogHeader>
          <DeductionForm
            initialValues={
              editingDeduction
                ? {
                    description: editingDeduction.description ?? '',
                    total_value: editingDeduction.total_value,
                    installments: editingDeduction.installments,
                    start_month: editingDeduction.start_month,
                    start_year: editingDeduction.start_year,
                  }
                : undefined
            }
            onSubmit={handleFormSubmit}
            onCancel={() => { setFormOpen(false); setEditingDeduction(null) }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover desconto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o desconto{' '}
              <strong>{deleteTarget?.description || currencyFormatter.format(deleteTarget?.total_value ?? 0)}</strong>?
              Esta ação não pode ser desfeita.
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
