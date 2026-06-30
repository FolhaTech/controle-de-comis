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
import useAppStore from '@/stores/useAppStore'
import { Consultant } from '@/lib/types'

const formSchema = z
  .object({
    name: z.string().min(2, 'Nome muito curto'),
    role: z.string().min(1, 'Cargo obrigatório'),
    active: z.boolean().default(true),
    isAttendant: z.boolean().default(false),
    fixedRemuneration: z.coerce.number().min(0, 'Valor inválido'),
    participatesInAverages: z.boolean().default(false),
    averagesStartDate: z.string().optional(),
  })
  .refine((data) => !data.participatesInAverages || data.averagesStartDate, {
    message: 'Data inicial é obrigatória quando participa de médias',
    path: ['averagesStartDate'],
  })

interface ConsultantFormProps {
  consultant?: Consultant
  onSuccess: () => void
}

export function ConsultantForm({ consultant, onSuccess }: ConsultantFormProps) {
  const { addConsultant, updateConsultant } = useAppStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: consultant || {
      name: '',
      role: '',
      active: true,
      isAttendant: false,
      fixedRemuneration: 0,
      participatesInAverages: false,
    },
  })

  const participates = form.watch('participatesInAverages')

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (consultant) {
      updateConsultant(consultant.id, values)
    } else {
      addConsultant(values)
    }
    onSuccess()
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

        <FormField
          control={form.control}
          name="fixedRemuneration"
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isAttendant"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 border bg-white">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Atendente Pré-processual</FormLabel>
                  <p className="text-xs text-muted-foreground">Marcar se o membro é atendente.</p>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 border bg-white">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Ativo</FormLabel>
                  <p className="text-xs text-muted-foreground">Membro ativo na equipe.</p>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="participatesInAverages"
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
              name="averagesStartDate"
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

        <Button type="submit" className="w-full mt-4">
          Salvar
        </Button>
      </form>
    </Form>
  )
}
