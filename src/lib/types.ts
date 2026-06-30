export type ContractStatus = 'Ativo' | 'Cancelado' | 'Distrato Pendente' | 'Revertido'
export type PaymentMethod = 'Cartão' | 'Boleto' | 'PIX' | 'Transferência'
export type YesNo = 'Sim' | 'Não'

export interface ActionType {
  id: string
  name: string
  active: boolean
}

export interface Consultant {
  id: string
  name: string
  role: string
  active: boolean
  isAttendant: boolean
  fixedRemuneration: number
  participatesInAverages: boolean
  averagesStartDate?: string
}

export interface Contract {
  id: string
  clientName: string
  cpf: string
  phone: string
  email: string
  consultantId: string
  attendantId: string
  actionTypeId: string
  date: string
  value: number
  paymentMethod: PaymentMethod
  installments: number
  status: ContractStatus
  downPaymentValue: number
  downPaymentMethod: PaymentMethod
  downPaymentStatus: YesNo
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
