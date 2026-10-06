import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const initial = previousMonth()
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(String(initial.month))
  const [year, setYear] = useState(String(initial.year))
  const [secret, setSecret] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    setIsSending(true)
    const { data, error } = await sendPremiacaoEmails(secret, Number(month), Number(year))
    setIsSending(false)
    if (error || !data) {
      toast({ variant: 'destructive', title: 'Envio não realizado', description: error ?? 'Erro desconhecido.' })
      return
    }
    setSecret('')
    setOpen(false)
    const skipped = data.skipped_without_email.length
    toast({
      title: `${data.sent.length} PDF(s) enviado(s)`,
      description: skipped
        ? `Sem email cadastrado: ${data.skipped_without_email.join(', ')}`
        : 'Todos os consultores com contratos receberam.',
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Enviar premiação por email</DialogTitle>
          <DialogDescription>
            Cada consultor com contratos no mês recebe o PDF no email cadastrado. A senha de envio não é guardada.
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
          <Button onClick={handleSend} disabled={isSending || !secret}>
            {isSending ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
