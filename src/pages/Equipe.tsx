import { useState } from 'react'
import { Plus, Pencil, Phone } from 'lucide-react'
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
import useAppStore from '@/stores/useAppStore'
import { ConsultantForm } from './equipe/ConsultantForm'
import { Consultant } from '@/lib/types'

export default function Equipe() {
  const { consultants } = useAppStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConsultant, setEditingConsultant] = useState<Consultant | undefined>(undefined)

  const handleEdit = (consultant: Consultant) => {
    setEditingConsultant(consultant)
    setIsDialogOpen(true)
  }

  const handleOpenNew = () => {
    setEditingConsultant(undefined)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Equipe Comercial</h2>
          <p className="text-muted-foreground">Gerencie os consultores e seus acessos.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} className="hidden sm:flex">
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleOpenNew} className="sm:hidden w-full">
            <Plus className="mr-2 h-4 w-4" /> Novo Membro
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConsultant ? 'Editar Membro' : 'Registrar Novo Membro'}
            </DialogTitle>
          </DialogHeader>
          <ConsultantForm consultant={editingConsultant} onSuccess={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>

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
                <p className="text-sm text-muted-foreground">{consultant.role}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={consultant.active ? 'default' : 'secondary'}
                    className={consultant.active ? 'bg-success hover:bg-success' : ''}
                  >
                    {consultant.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {consultant.isAttendant && (
                    <Badge variant="outline" className="border-primary text-primary">
                      Atendente
                    </Badge>
                  )}
                  {consultant.participatesInAverages && (
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
                      }).format(consultant.fixedRemuneration)}
                    </span>
                  </p>
                  {consultant.participatesInAverages && consultant.averagesStartDate && (
                    <p className="text-muted-foreground">
                      Início Médias:{' '}
                      <span className="font-medium text-foreground">
                        {new Date(consultant.averagesStartDate).toLocaleDateString('pt-BR')}
                      </span>
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleEdit(consultant)}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
