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
import useAppStore from '@/stores/useAppStore'
import { Contract } from '@/lib/types'

const formSchema = z.object({
  clientName: z.string().min(2, 'Nome muito curto'),
  consultantId: z.string().min(1, 'Selecione um consultor'),
  date: z.string().min(1, 'Data obrigatória'),
  value: z.coerce.number().min(1, 'Valor deve ser maior que 0'),
  paymentMethod: z.enum(['Cartão', 'Boleto', 'PIX', 'Transferência']),
  installments: z.coerce.number().min(1).max(24),
  status: z.enum(['Ativo', 'Cancelado', 'Distrato Pendente', 'Revertido']),
  cancellationDate: z.string().optional(),
  cancellationReason: z.string().optional(),
  internalFailure: z.boolean().default(false),
})

interface ContractFormProps {
  contract?: Contract
  onSuccess: () => void
}

export function ContractForm({ contract, onSuccess }: ContractFormProps) {
  const { consultants, addContract, updateContract } = useAppStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: contract || {
      clientName: '',
      consultantId: '',
      date: new Date().toISOString().split('T')[0],
      value: 0,
      paymentMethod: 'Cartão',
      installments: 1,
      status: 'Ativo',
      internalFailure: false,
    },
  })

  const status = form.watch('status')

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (contract) {
      updateContract(contract.id, values)
    } else {
      addContract(values)
    }
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientName"
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="consultantId"
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
                    {consultants.map((c) => (
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
            name="date"
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
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="value"
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
            name="paymentMethod"
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

        {status === 'Cancelado' && (
          <div className="space-y-4 p-4 border border-destructive/20 bg-destructive/5 rounded-md animate-fade-in-down">
            <h4 className="font-medium text-sm text-destructive">Detalhes do Cancelamento</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cancellationDate"
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
                name="cancellationReason"
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
              name="internalFailure"
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

        <Button type="submit" className="w-full mt-4">
          Salvar Contrato
        </Button>
      </form>
    </Form>
  )
}
