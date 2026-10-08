import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  DialogDescription,
  DialogFooter,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { useAuth } from '@/hooks/use-auth'
import { AppUser, createUser, deleteUser, fetchUsers, updateUser } from '@/services/users'

interface FormState {
  email: string
  password: string
  role: 'admin' | 'comum'
  consultant_name: string
}

const emptyForm: FormState = { email: '', password: '', role: 'comum', consultant_name: '' }

export function UserManagement() {
  const { toast } = useToast()
  const { consultants } = useAppStore()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await fetchUsers()
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os usuários.' })
    } else if (data) {
      setUsers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleOpenNew = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (target: AppUser) => {
    setEditingUser(target)
    setForm({ email: target.email, password: '', role: target.role, consultant_name: target.consultant_name || '' })
    setIsDialogOpen(true)
  }

  const isValid =
    form.role === 'admin'
      ? editingUser || (form.email && form.password)
      : form.consultant_name.trim().length > 0 && (editingUser || (form.email && form.password))

  const handleSubmit = async () => {
    setIsSaving(true)
    const consultant_name = form.role === 'comum' ? form.consultant_name.trim() : null
    const { error } = editingUser
      ? await updateUser(editingUser.id, {
          role: form.role,
          consultant_name,
          ...(form.password ? { password: form.password } : {}),
        })
      : await createUser({ email: form.email.trim().toLowerCase(), password: form.password, role: form.role, consultant_name })
    setIsSaving(false)
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: String((error as Error)?.message || error) })
      return
    }
    toast({ title: editingUser ? 'Usuário atualizado' : 'Usuário criado' })
    setIsDialogOpen(false)
    load()
  }

  const handleDelete = async (target: AppUser) => {
    const { error } = await deleteUser(target.id)
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: String((error as Error)?.message || error) })
    } else {
      toast({ title: 'Usuário excluído' })
      load()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Usuários e papéis</h3>
          <p className="text-sm text-muted-foreground">
            Admin vê e edita tudo. Comum vê só os dados do consultor vinculado.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew}>
              <Plus className="mr-2 h-4 w-4" /> Novo usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Deixe a senha em branco para mantê-la.'
                  : 'O usuário entra com este email e senha.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  disabled={!!editingUser}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="user-password">
                  Senha {editingUser && <span className="text-muted-foreground">(opcional)</span>}
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Papel</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v as 'admin' | 'comum' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comum">Comum (vê só os próprios dados)</SelectItem>
                    <SelectItem value="admin">Admin (vê e edita tudo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.role === 'comum' && (
                <div className="space-y-1">
                  <Label>De quem são os dados</Label>
                  <Select
                    value={form.consultant_name}
                    onValueChange={(v) => setForm((f) => ({ ...f, consultant_name: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o consultor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {consultants.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!isValid || isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-subtle border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Dados de quem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                      {u.role === 'admin' ? 'Admin' : 'Comum'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.consultant_name || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenEdit(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={u.id === currentUser?.id}
                            title={u.id === currentUser?.id ? 'Você não pode excluir sua própria conta' : undefined}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o acesso de <strong>{u.email}</strong>?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(u)}
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
