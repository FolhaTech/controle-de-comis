import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  DialogFooter,
  DialogClose,
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
import { Switch } from '@/components/ui/switch'
import useAppStore from '@/stores/useAppStore'
import { ActionType } from '@/lib/types'

export default function Parametros() {
  const { actionTypes, addActionType, updateActionType, deleteActionType } = useAppStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingActionType, setEditingActionType] = useState<ActionType | undefined>(undefined)
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)

  const handleOpenNew = () => {
    setEditingActionType(undefined)
    setName('')
    setActive(true)
    setIsDialogOpen(true)
  }

  const handleEdit = (actionType: ActionType) => {
    setEditingActionType(actionType)
    setName(actionType.name)
    setActive(actionType.active)
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!name.trim()) return

    if (editingActionType) {
      updateActionType(editingActionType.id, { name: name.trim(), active })
    } else {
      addActionType({ name: name.trim(), active })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteActionType(id)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold">Parâmetros do Sistema</h2>
          <p className="text-muted-foreground">
            Gerencie os tipos de ação disponíveis para seleção nos contratos.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} className="hidden sm:flex">
              <Plus className="mr-2 h-4 w-4" /> Novo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {editingActionType ? 'Editar Tipo de Ação' : 'Novo Tipo de Ação'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="actionName">Nome do Tipo de Ação</Label>
                <Input
                  id="actionName"
                  placeholder="Ex: Direito do Trabalhador"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3 bg-secondary/20">
                <div>
                  <Label htmlFor="actionActive" className="font-medium">
                    Ativo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Tipos inativos não aparecem nos formulários.
                  </p>
                </div>
                <Switch id="actionActive" checked={active} onCheckedChange={setActive} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleOpenNew} className="sm:hidden w-full">
            <Plus className="mr-2 h-4 w-4" /> Novo Tipo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingActionType ? 'Editar Tipo de Ação' : 'Novo Tipo de Ação'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="actionNameMobile">Nome do Tipo de Ação</Label>
              <Input
                id="actionNameMobile"
                placeholder="Ex: Direito do Trabalhador"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3 bg-secondary/20">
              <div>
                <Label className="font-medium">Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Tipos inativos não aparecem nos formulários.
                </p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl shadow-subtle border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actionTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Nenhum tipo de ação cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              actionTypes.map((actionType) => (
                <TableRow key={actionType.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell className="font-medium">{actionType.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={actionType.active ? 'default' : 'secondary'}
                      className={actionType.active ? 'bg-success hover:bg-success' : ''}
                    >
                      {actionType.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(actionType)}
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
                            <AlertDialogTitle>Excluir Tipo de Ação</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o tipo de ação{' '}
                              <strong>{actionType.name}</strong>? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(actionType.id)}
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
