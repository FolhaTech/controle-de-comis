import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
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
import useAppStore from '@/stores/useAppStore'
import { ContractForm } from './contratos/ContractForm'
import { format } from 'date-fns'
import { Contract } from '@/lib/types'

export default function Contratos() {
  const { contracts, filter, consultants } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | undefined>(undefined)

  const filteredContracts = contracts.filter((c) => {
    const d = new Date(c.date)
    const matchesPeriod = d.getMonth() + 1 === filter.month && d.getFullYear() === filter.year
    const matchesSearch = c.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesPeriod && matchesSearch
  })

  const getConsultantName = (id: string) =>
    consultants.find((c) => c.id === id)?.name || 'Desconhecido'

  const getStatusColor = (status: string) => {
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
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Pgto/Parc.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum contrato encontrado para este período.
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => (
                <TableRow key={contract.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell className="font-medium">{contract.clientName}</TableCell>
                  <TableCell>{getConsultantName(contract.consultantId)}</TableCell>
                  <TableCell>{format(new Date(contract.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      contract.value,
                    )}
                  </TableCell>
                  <TableCell>
                    {contract.paymentMethod} ({contract.installments}x)
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(contract.status)}>
                      {contract.status}
                    </Badge>
                    {contract.status === 'Cancelado' && contract.internalFailure && (
                      <span className="text-[10px] block text-muted-foreground mt-1">
                        Falha Interna
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(contract)}>
                      Editar
                    </Button>
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
