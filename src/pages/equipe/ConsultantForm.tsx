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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useAppStore from '@/stores/useAppStore'
import { Consultant } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

const formSchema = z
  .object({
    name: z.string().min(2, 'Nome muito curto'),
    role: z.string().min(1, 'Cargo obrigatório'),
    phone: z.string().optional(),
    pix_key: z.string().optional(),
    cnpj: z.string().optional(),
    payment_type: z.string().default('daily'),
    fixed_salary: z.coerce.number().min(0, 'Valor inválido'),
    is_attendant: z.boolean().default(false),
    is_active: z.boolean().default(true),
    participates_in_averages: z.boolean().default(false),
    average_start_date: z.string().optional(),
  })
  .refine((data) => !data.participates_in_averages || data.average_start_date, {
    message: 'Data inicial é obrigatória quando participa de médias',
    path: ['average_start_date'],
  })

interface ConsultantFormProps {
  consultant?: Consultant
  onSuccess: () => void
}

export function ConsultantForm({ consultant, onSuccess }: ConsultantFormProps) {
  const { addConsultant, updateConsultant } = useAppStore()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: consultant
      ? {
          name: consultant.name,
          role: consultant.role || '',
          phone: consultant.phone || '',
          pix_key: consultant.pix_key || '',
          cnpj: consultant.cnpj || '',
          payment_type: consultant.payment_type || 'daily',
          fixed_salary: consultant.fixed_salary || 0,
          is_attendant: consultant.type === 'atendente',
          is_active: consultant.status === 'active',
          participates_in_averages: consultant.participates_in_averages,
          average_start_date: consultant.average_start_date || '',
        }
      : {
          name: '',
          role: '',
          phone: '',
          pix_key: '',
          cnpj: '',
          payment_type: 'daily',
          fixed_salary: 0,
          is_attendant: false,
          is_active: true,
          participates_in_averages: false,
        },
  })

  const participates = form.watch('participates_in_averages')

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    const { is_attendant, is_active, ...rest } = values
    const memberData = {
      ...rest,
      type: is_attendant ? 'atendente' : 'consultor',
      status: is_active ? 'active' : 'inactive',
    }

    if (consultant) {
      const { error } = await updateConsultant(consultant.id, memberData)
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar.' })
      } else {
        toast({ title: 'Membro atualizado' })
        onSuccess()
      }
    } else {
      const { error } = await addConsultant(memberData)
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar.' })
      } else {
        toast({ title: 'Membro criado' })
        onSuccess()
      }
    }
    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Consultor Senior, Atendente Pré-processual" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
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
            name="pix_key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chave PIX</FormLabel>
                <FormControl>
                  <Input placeholder="email, CPF ou telefone" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ (para a Nota Fiscal / PDF de premiação)</FormLabel>
              <FormControl>
                <Input placeholder="00.000.000/0000-00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fixed_salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remuneração Fixa (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payment_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="is_attendant"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 border bg-white">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Atendente Pré-processual</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 border bg-white">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Ativo</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="participates_in_averages"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 border bg-secondary/20">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Participa de Médias</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Calcula média dos valores pagos em 12 meses a partir da data inicial.
                </p>
              </div>
            </FormItem>
          )}
        />

        {participates && (
          <div className="animate-fade-in-down">
            <FormField
              control={form.control}
              name="average_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Inicial (Início do período de 12 meses)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Form>
  )
}
