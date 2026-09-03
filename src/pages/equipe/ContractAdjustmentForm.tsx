import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface ContractAdjustmentFormValues {
  client: string
  case_type: string
  value: number
  start_date: string
  closed_by: string
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const numericValue = Number(value.replace(',', '.'))
  const isValid =
    client.trim().length > 0 &&
    Number.isFinite(numericValue) &&
    numericValue >= 0 &&
    startDate.length > 0 &&
    (!consultantOptions || closedBy.length > 0)

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
