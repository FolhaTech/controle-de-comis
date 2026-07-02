import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
} from '@/components/ui/alert-dialog'
import useAppStore from '@/stores/useAppStore'
import { ConsultantForm } from './equipe/ConsultantForm'
import { Consultant } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export default function Equipe() {
  const { consultants, deleteConsultant } = useAppStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConsultant, setEditingConsultant] = useState<Consultant | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Consultant | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Equipe Comercial</h2>
          <p className="text-muted-foreground">Gerencie os consultores e seus acessos.</p>
        </div>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {consultants.map((consultant) => (
          <Card key={consultant.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground font-serif">
                  {consultant.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">{consultant.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{consultant.role || '—'}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={consultant.status === 'active' ? 'default' : 'secondary'}
                    className={consultant.status === 'active' ? 'bg-success hover:bg-success' : ''}
                  >
                    {consultant.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {consultant.type === 'atendente' && (
                    <Badge variant="outline" className="border-primary text-primary">
                      Atendente
                    </Badge>
                  )}
                  {consultant.participates_in_averages && (
                    <Badge variant="outline" className="border-blue-500 text-blue-600">
                      Participa de Médias
                    </Badge>
                  )}
                </div>

                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    Remuneração Fixa:{' '}
                    <span className="font-medium text-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(consultant.fixed_salary || 0)}
                    </span>
                  </p>
                  {consultant.phone && (
                    <p className="text-muted-foreground">
                      Telefone:{' '}
                      <span className="font-medium text-foreground">{consultant.phone}</span>
                    </p>
                  )}
                  {consultant.pix_key && (
                    <p className="text-muted-foreground">
                      PIX: <span className="font-medium text-foreground">{consultant.pix_key}</span>
                    </p>
                  )}
                  {consultant.participates_in_averages && consultant.average_start_date && (
                    <p className="text-muted-foreground">
                      Início Médias:{' '}
                      <span className="font-medium text-foreground">
                        {new Date(consultant.average_start_date).toLocaleDateString('pt-BR')}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(consultant)}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(consultant)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
              Tem certeza que deseja excluir este membro da equipe? Esta ação não pode ser desfeita.
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
    </div>
  )
}
