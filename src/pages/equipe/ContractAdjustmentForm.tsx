import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface ContractAdjustmentFormValues {
  client: string
  case_type: string
  value: number
  start_date: string
  closed_by: string
  status: 'Ativo' | 'Cancelado' | 'Em processo'
  // Only meaningful when status is 'Cancelado' — see the same field on
  // Contract/ContractAdjustment in lib/types.ts.
  cancellation_deduction: number | null
}

// Mandatory rule (no manual override): a contract cancelled within 1 year of
// its own start_date has its commission clawed back; past that, it's exempt.
export function isWithinOneYearOfStart(startDateStr: string): boolean {
  if (!startDateStr) return false
  const start = new Date(startDateStr)
  if (Number.isNaN(start.getTime())) return false
  const oneYearLater = new Date(start)
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
  return new Date() < oneYearLater
}

// The form's status select only offers these three — coerce anything else
// (older CRM-derived values like "Distrato Pendente"/"Revertido", or null)
// down to 'Ativo' when opening a contract for editing.
export function toEditableStatus(status: string | null): ContractAdjustmentFormValues['status'] {
  if (status === 'Cancelado' || status === 'Em processo') return status
  return 'Ativo'
}

interface ContractAdjustmentFormProps {
  initialValues?: Partial<ContractAdjustmentFormValues>
  // Provided only where the contract isn't already scoped to one consultant
  // (the Contratos page) — renders a required "Consultor" select and
  // includes closed_by in the submitted values. Omitted in the per-consultant
  // Equipe dialog, where the caller already knows which consultant this is.
  consultantOptions?: string[]
  onSubmit: (values: ContractAdjustmentFormValues) => Promise<void>
  onCancel: () => void
}

export function ContractAdjustmentForm({
  initialValues,
  consultantOptions,
  onSubmit,
  onCancel,
}: ContractAdjustmentFormProps) {
  const [client, setClient] = useState(initialValues?.client ?? '')
  const [caseType, setCaseType] = useState(initialValues?.case_type ?? '')
  const [value, setValue] = useState(initialValues?.value != null ? String(initialValues.value) : '')
  const [startDate, setStartDate] = useState(initialValues?.start_date ?? '')
  const [closedBy, setClosedBy] = useState(initialValues?.closed_by ?? '')
  const [status, setStatus] = useState<ContractAdjustmentFormValues['status']>(initialValues?.status ?? 'Ativo')
  const [cancellationDeduction, setCancellationDeduction] = useState(
    initialValues?.cancellation_deduction != null ? String(initialValues.cancellation_deduction) : '',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const numericValue = Number(value.replace(',', '.'))
  const isValid =
    client.trim().length > 0 &&
    Number.isFinite(numericValue) &&
    numericValue >= 0 &&
    startDate.length > 0 &&
    (!consultantOptions || closedBy.length > 0)

  const isCancelled = status === 'Cancelado'
  const withinOneYear = isCancelled && isWithinOneYearOfStart(startDate)
  const numericDeduction = Number(cancellationDeduction.replace(',', '.'))

  const handleSubmit = async () => {
    if (!isValid) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        client: client.trim(),
        case_type: caseType.trim(),
        value: numericValue,
        start_date: startDate,
        closed_by: closedBy,
        status,
        cancellation_deduction: !isCancelled
          ? null
          : !withinOneYear
            ? 0
            : Number.isFinite(numericDeduction) && numericDeduction >= 0
              ? numericDeduction
              : 0,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {consultantOptions && (
        <div className="space-y-1">
          <Label htmlFor="adj-consultant">Consultor</Label>
          <Select value={closedBy} onValueChange={setClosedBy}>
            <SelectTrigger id="adj-consultant">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {consultantOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="adj-client">Cliente</Label>
        <Input id="adj-client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nome do cliente" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="adj-case-type">Tipo de Ação</Label>
        <Input id="adj-case-type" value={caseType} onChange={(e) => setCaseType(e.target.value)} placeholder="Ex: Saúde - Reparadora" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="adj-value">Valor</Label>
        <Input id="adj-value" type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0,00" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="adj-date">Data</Label>
        <Input id="adj-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="adj-status">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as ContractAdjustmentFormValues['status'])}>
          <SelectTrigger id="adj-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
            <SelectItem value="Em processo">Em processo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isCancelled && (
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="adj-deduct" className="cursor-default">
              Descontar valor?
            </Label>
            <Switch id="adj-deduct" checked={withinOneYear} disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            {startDate.length === 0
              ? 'Informe a data do contrato para calcular a regra de 1 ano.'
              : withinOneYear
                ? 'Cancelado dentro de 1 ano da data do contrato — o desconto é aplicado automaticamente.'
                : 'Contrato fechado há mais de 1 ano — não será descontado.'}
          </p>
          {withinOneYear && (
            <div className="space-y-1">
              <Label htmlFor="adj-deduct-value">Quantidade a descontar (R$)</Label>
              <Input
                id="adj-deduct-value"
                type="number"
                step="0.01"
                min="0"
                value={cancellationDeduction}
                onChange={(e) => setCancellationDeduction(e.target.value)}
                placeholder="0,00"
              />
            </div>
          )}
        </div>
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
