import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export interface DeductionFormValues {
  description: string
  total_value: number
  installments: number
  start_month: number
  start_year: number
}

interface DeductionFormProps {
  initialValues?: Partial<DeductionFormValues>
  onSubmit: (values: DeductionFormValues) => Promise<void>
  onCancel: () => void
}

export function DeductionForm({ initialValues, onSubmit, onCancel }: DeductionFormProps) {
  const now = new Date()
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [totalValue, setTotalValue] = useState(
    initialValues?.total_value != null ? String(initialValues.total_value) : '',
  )
  const [installments, setInstallments] = useState(String(initialValues?.installments ?? 1))
  const [startMonth, setStartMonth] = useState(String(initialValues?.start_month ?? now.getMonth() + 1))
  const [startYear, setStartYear] = useState(String(initialValues?.start_year ?? now.getFullYear()))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const numericValue = Number(totalValue.replace(',', '.'))
  const numericInstallments = Number(installments)
  const numericYear = Number(startYear)
  const isValid =
    Number.isFinite(numericValue) &&
    numericValue > 0 &&
    Number.isInteger(numericInstallments) &&
    numericInstallments >= 1 &&
    Number.isInteger(numericYear) &&
    numericYear >= 2000

  const handleSubmit = async () => {
    if (!isValid) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        description: description.trim(),
        total_value: numericValue,
        installments: numericInstallments,
        start_month: Number(startMonth),
        start_year: numericYear,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const installmentPreview =
    isValid && numericInstallments > 1 ? numericValue / numericInstallments : null

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="ded-description">Descrição (opcional)</Label>
        <Input
          id="ded-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Adiantamento salarial"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="ded-value">Valor total</Label>
          <Input
            id="ded-value"
            type="number"
            step="0.01"
            min="0"
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value)}
            placeholder="0,00"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ded-installments">Parcelas</Label>
          <Input
            id="ded-installments"
            type="number"
            min="1"
            step="1"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="ded-start-month">Mês inicial</Label>
          <Select value={startMonth} onValueChange={setStartMonth}>
            <SelectTrigger id="ded-start-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ded-start-year">Ano inicial</Label>
          <Input
            id="ded-start-year"
            type="number"
            step="1"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
          />
        </div>
      </div>
      {installmentPreview != null && (
        <p className="text-xs text-muted-foreground">
          {numericInstallments}x de{' '}
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installmentPreview)}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!isValid || isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogFooter>
    </div>
  )
}
