import { useState } from 'react'
import { Plus, Search, Trash2, Pencil } from 'lucide-react'
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
import { format } from 'date-fns'
import { Contract } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export default function Contratos() {
  const { contracts, filter, consultants, actionTypes, deleteContract } = useAppStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | undefined>(undefined)

  const filteredContracts = contracts.filter((c) => {
    if (!c.start_date) return false
    const d = new Date(c.start_date)
    const matchesPeriod = d.getMonth() + 1 === filter.month && d.getFullYear() === filter.year
    const matchesSearch = (c.client || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesPeriod && matchesSearch
  })

  const getConsultantName = (id: string | null) =>
    consultants.find((c) => c.id === id)?.name || 'Desconhecido'

  const getActionTypeName = (id: string | null) => actionTypes.find((a) => a.id === id)?.name || '—'

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-subtle border">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
            <ContractForm contract={editingContract} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-subtle border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>Cliente</TableHead>
              <TableHead>Consultor</TableHead>
              <TableHead className="hidden md:table-cell">Tipo de Ação</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="hidden lg:table-cell">Entrada</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum contrato encontrado para este período.
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => (
                <TableRow key={contract.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell className="font-medium">
                    {contract.client || '—'}
                    <span className="text-[10px] block text-muted-foreground">
                      {contract.client_cpf || ''}
                    </span>
                  </TableCell>
                  <TableCell>{getConsultantName(contract.consultant_id)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {getActionTypeName(contract.service_type)}
                  </TableCell>
                  <TableCell>
                    {contract.start_date
                      ? format(new Date(contract.start_date), 'dd/MM/yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(contract.contracted_value || 0)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {contract.is_entry_paid ? (
                      <span className="text-sm text-success">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(contract.entry_value || 0)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
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
