import { useEffect, useMemo, useState } from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { fetchConsultantEmails, normalizeConsultantName } from '@/services/consultant-emails'
import { sendPremiacaoEmails } from '@/services/premiacao-email'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function previousMonth() {
  const now = new Date()
  return now.getMonth() === 0
    ? { month: 12, year: now.getFullYear() - 1 }
    : { month: now.getMonth(), year: now.getFullYear() }
}

export function PremiacaoEmailDialog() {
  const { toast } = useToast()
  const { consultants } = useAppStore()
  const initial = previousMonth()
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(String(initial.month))
  const [year, setYear] = useState(String(initial.year))
  const [secret, setSecret] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [emails, setEmails] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const members = useMemo(
    () => [...consultants].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [consultants],
  )

  useEffect(() => {
    if (!open) return
    fetchConsultantEmails()
      .then((map) => {
        setEmails(map)
        setSelected(
          new Set(
            consultants
              .filter((c) => map[normalizeConsultantName(c.name)])
              .map((c) => c.name),
          ),
        )
      })
      .catch(() => {
        setEmails({})
        setSelected(new Set())
      })
  }, [open, consultants])

  const emailOf = (name: string) => emails[normalizeConsultantName(name)]

  const toggle = (name: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(name)
      else next.delete(name)
      return next
    })
  }

  const handleSend = async () => {
    setIsSending(true)
    const { data, error } = await sendPremiacaoEmails(secret, Number(month), Number(year), [...selected])
    setIsSending(false)
    if (error || !data) {
      toast({ variant: 'destructive', title: 'Envio não realizado', description: error ?? 'Erro desconhecido.' })
      return
    }
    setSecret('')
    setOpen(false)
    toast({
      title: `${data.sent.length} PDF(s) enviado(s)`,
      description: data.sent.length
        ? data.sent.join(', ')
        : 'Nenhum consultor selecionado tinha contratos no mês com email cadastrado.',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Mail className="mr-2 h-4 w-4" />
          Enviar premiação por email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar premiação por email</DialogTitle>
          <DialogDescription>
            Escolha quem recebe. Cada consultor selecionado recebe o próprio PDF no email cadastrado. A senha de envio
            não é guardada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Mês</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="premiacao-year">Ano</Label>
              <Input id="premiacao-year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Consultores</Label>
              <span className="text-xs text-muted-foreground">{selected.size} selecionado(s)</span>
            </div>
            <div className="max-h-[260px] overflow-y-auto rounded-md border divide-y">
              {members.map((member) => {
                const email = emailOf(member.name)
                return (
                  <label
                    key={member.id}
                    className={`flex items-center gap-3 px-3 py-2 text-sm ${email ? 'cursor-pointer' : 'opacity-60'}`}
                  >
                    <Checkbox
                      checked={selected.has(member.name)}
                      disabled={!email}
                      onCheckedChange={(checked) => toggle(member.name, checked === true)}
                    />
                    <span className="flex-1">
                      <span className="font-medium">{member.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {email ?? 'sem email cadastrado (cadastre na tela Equipe)'}
                      </span>
                    </span>
                  </label>
                )
              })}
              {members.length === 0 && (
                <p className="px-3 py-4 text-sm text-muted-foreground">Nenhum consultor cadastrado.</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="premiacao-secret">Senha de envio</Label>
            <Input
              id="premiacao-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSend} disabled={isSending || !secret || selected.size === 0}>
            {isSending ? 'Enviando...' : `Enviar para ${selected.size}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
