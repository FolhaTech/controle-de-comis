export type ContractStatus = 'Ativo' | 'Cancelado' | 'Distrato Pendente' | 'Revertido'
export type PaymentMethod = 'Cartão' | 'Boleto' | 'PIX' | 'Transferência'

export interface ActionType {
  id: string
  name: string
  active: boolean
  created_at: string
}

export interface Consultant {
  id: string
  name: string
  role: string | null
  phone: string | null
  type: string | null
  status: string | null
  fixed_salary: number | null
  participates_in_averages: boolean
  average_start_date: string | null
  pix_key: string | null
  payment_type: string | null
  admission_date: string | null
  work_id: string | null
  daily_cost: number | null
  created_at: string | null
  work_name?: string | null
}

export interface Contract {
  id: string
  name: string | null
  client: string | null
  client_cpf: string | null
  client_email: string | null
  client_phone: string | null
  consultant_id: string | null
  pre_processual_agent_id: string | null
  service_type: string | null
  start_date: string | null
  contracted_value: number | null
  payment_method: string | null
  installments: number | null
  status: string | null
  entry_value: number | null
  entry_payment_method: string | null
  is_entry_paid: boolean | null
  cancellation_date: string | null
  cancellation_reason: string | null
  internal_failure: boolean | null
  created_at: string | null
  manager: string | null
  address: string | null
  end_date_planned: string | null
  budget_planned: number | null
  progress_percentage: number | null
  notes: string | null
  total_area: number | null
}

export interface Settings {
  goals: {
    individualContracts: number
    individualValue: number
    groupContracts: number
    groupValue: number
    ticketMedio: number
  }
  tiers: {
    min: number
    max: number
    percentage: number
  }[]
  bonuses: {
    highValueThreshold: number
    highValuePercentage: number
    maxInstallments: number
    installmentsPercentage: number
  }
  quarterTiers: {
    contracts: number
    award: number
  }[]
  ipca: {
    year: number
    value: number
    appliedPercentage: number
  }
}

export interface FilterContext {
  month: number
  year: number
}
