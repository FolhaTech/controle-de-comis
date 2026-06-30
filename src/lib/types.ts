export type ContractStatus = 'Ativo' | 'Cancelado' | 'Distrato Pendente' | 'Revertido'
export type PaymentMethod = 'Cartão' | 'Boleto' | 'PIX' | 'Transferência'

export interface Consultant {
  id: string
  name: string
  role: string
  active: boolean
}

export interface Contract {
  id: string
  clientName: string
  consultantId: string
  date: string // ISO format
  value: number
  paymentMethod: PaymentMethod
  installments: number
  status: ContractStatus
  cancellationDate?: string
  cancellationReason?: string
  internalFailure?: boolean
  createdAt: string
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
