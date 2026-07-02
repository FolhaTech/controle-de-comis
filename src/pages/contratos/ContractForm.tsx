import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import useAppStore from '@/stores/useAppStore'
import { Contract } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/

const formSchema = z.object({
  client: z.string().min(2, 'Nome muito curto'),
  client_cpf: z
    .string()
    .min(1, 'CPF obrigatório')
    .refine((val) => cpfRegex.test(val), 'Formato inválido'),
  client_phone: z.string().min(8, 'Telefone inválido'),
  client_email: z.string().email('E-mail inválido'),
  consultant_id: z.string().min(1, 'Selecione um consultor'),
  pre_processual_agent_id: z.string().min(1, 'Selecione um atendente'),
  service_type: z.string().min(1, 'Selecione um tipo de ação'),
  start_date: z.string().min(1, 'Data obrigatória'),
  contracted_value: z.coerce.number().min(1, 'Valor deve ser maior que 0'),
  payment_method: z.enum(['Cartão', 'Boleto', 'PIX', 'Transferência']),
  installments: z.coerce.number().min(1).max(24),
  status: z.enum(['Ativo', 'Cancelado', 'Distrato Pendente', 'Revertido']),
  entry_value: z.coerce.number().min(0),
  entry_payment_method: z.enum(['Cartão', 'Boleto', 'PIX', 'Transferência']),
  is_entry_paid: z.boolean(),
  cancellation_date: z.string().optional(),
  cancellation_reason: z.string().optional(),
  internal_failure: z.boolean().default(false),
})

interface ContractFormProps {
  contract?: Contract
  onSuccess: () => void
}

export function ContractForm({ contract, onSuccess }: ContractFormProps) {
  const { consultants, actionTypes, addContract, updateContract } = useAppStore()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const attendants = consultants.filter((c) => c.type === 'atendente' && c.status === 'active')
  const salesConsultants = consultants.filter(
    (c) => c.type !== 'atendente' && c.status === 'active',
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: contract
      ? {
          client: contract.client || '',
          client_cpf: contract.client_cpf || '',
          client_phone: contract.client_phone || '',
          client_email: contract.client_email || '',
          consultant_id: contract.consultant_id || '',
          pre_processual_agent_id: contract.pre_processual_agent_id || '',
          service_type: contract.service_type || '',
          start_date: contract.start_date || '',
          contracted_value: contract.contracted_value || 0,
          payment_method:
            (contract.payment_method as 'Cartão' | 'Boleto' | 'PIX' | 'Transferência') || 'Cartão',
          installments: contract.installments || 1,
          status:
            (contract.status as 'Ativo' | 'Cancelado' | 'Distrato Pendente' | 'Revertido') ||
            'Ativo',
          entry_value: contract.entry_value || 0,
          entry_payment_method:
            (contract.entry_payment_method as 'Cartão' | 'Boleto' | 'PIX' | 'Transferência') ||
            'Cartão',
          is_entry_paid: contract.is_entry_paid || false,
          cancellation_date: contract.cancellation_date || '',
          cancellation_reason: contract.cancellation_reason || '',
          internal_failure: contract.internal_failure || false,
        }
      : {
          client: '',
          client_cpf: '',
          client_phone: '',
          client_email: '',
          consultant_id: '',
          pre_processual_agent_id: '',
          service_type: '',
          start_date: new Date().toISOString().split('T')[0],
          contracted_value: 0,
          payment_method: 'Cartão',
          installments: 1,
          status: 'Ativo',
          entry_value: 0,
          entry_payment_method: 'Cartão',
          is_entry_paid: false,
          internal_failure: false,
        },
  })

  const status = form.watch('status')

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    if (contract) {
      const { error } = await updateContract(contract.id, values)
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar.' })
      } else {
        toast({ title: 'Contrato atualizado' })
        onSuccess()
      }
    } else {
      const { error } = await addContract(values)
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar.' })
      } else {
        toast({ title: 'Contrato criado' })
        onSuccess()
      }
    }
    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="text-sm font-semibold text-primary">Dados do Cliente</h3>
        <FormField
          control={form.control}
          name="client"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cliente</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="client_cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF / CNPJ</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="client_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="client_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="cliente@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <h3 className="text-sm font-semibold text-primary">Equipe & Tipo de Ação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="consultant_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Consultor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {salesConsultants.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pre_processual_agent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Atendente Pré-processual</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {attendants.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="service_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Ação</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {actionTypes
                      .filter((a) => a.active)
                      .map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <h3 className="text-sm font-semibold text-primary">Dados do Contrato</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do Contrato</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Distrato Pendente">Distrato Pendente</SelectItem>
                    <SelectItem value="Revertido">Revertido</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="contracted_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="installments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcelas</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <h3 className="text-sm font-semibold text-primary">Entrada (Down Payment)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="entry_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da Entrada (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="entry_payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_entry_paid"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md p-3 border">
                <FormLabel>Entrada Paga?</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {status === 'Cancelado' && (
          <div className="space-y-4 p-4 border border-destructive/20 bg-destructive/5 rounded-md animate-fade-in-down">
            <h4 className="font-medium text-sm text-destructive">Detalhes do Cancelamento</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cancellation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cancellation_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="internal_failure"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 shadow-sm border bg-white">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Falha Interna</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Se marcado, o cancelamento não afeta a meta do comercial.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Contrato'}
        </Button>
      </form>
    </Form>
  )
}
