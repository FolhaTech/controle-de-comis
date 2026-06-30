import { Consultant, Contract, Settings } from './types'

export const mockConsultants: Consultant[] = [
  { id: 'c1', name: 'Ana Silva', role: 'Consultora Senior', active: true },
  { id: 'c2', name: 'Carlos Santos', role: 'Consultor Pleno', active: true },
  { id: 'c3', name: 'Beatriz Lima', role: 'Consultora Junior', active: true },
]

export const mockSettings: Settings = {
  goals: {
    individualContracts: 50,
    individualValue: 135000,
    groupContracts: 200,
    groupValue: 540000,
    ticketMedio: 2700,
  },
  tiers: [
    { min: 10, max: 29, percentage: 2.5 },
    { min: 30, max: 36, percentage: 5.0 },
    { min: 37, max: 49, percentage: 6.0 },
    { min: 50, max: 999, percentage: 10.0 },
  ],
  bonuses: {
    highValueThreshold: 3000,
    highValuePercentage: 1.0,
    maxInstallments: 12,
    installmentsPercentage: 2.0,
  },
  quarterTiers: [
    { contracts: 105, award: 1250 },
    { contracts: 120, award: 1625 },
    { contracts: 150, award: 2500 },
  ],
  ipca: {
    year: 2025,
    value: 4.83,
    appliedPercentage: 70,
  },
}

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const pad = (n: number) => n.toString().padStart(2, '0')

export const mockContracts: Contract[] = [
  {
    id: '1',
    clientName: 'Empresa Alpha Ltda',
    consultantId: 'c1',
    date: `${currentYear}-${pad(currentMonth)}-10`,
    value: 3500,
    paymentMethod: 'Cartão',
    installments: 6,
    status: 'Ativo',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    clientName: 'João Ferreira',
    consultantId: 'c2',
    date: `${currentYear}-${pad(currentMonth)}-12`,
    value: 2800,
    paymentMethod: 'Boleto',
    installments: 12,
    status: 'Ativo',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    clientName: 'Construtora Beta',
    consultantId: 'c3',
    date: `${currentYear}-${pad(currentMonth)}-15`,
    value: 5000,
    paymentMethod: 'PIX',
    installments: 1,
    status: 'Distrato Pendente',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    clientName: 'Comércio Silva',
    consultantId: 'c1',
    date: `${currentYear}-${pad(currentMonth)}-05`,
    value: 1500,
    paymentMethod: 'Cartão',
    installments: 10,
    status: 'Cancelado',
    cancellationDate: `${currentYear}-${pad(currentMonth)}-20`,
    cancellationReason: 'Desistência',
    internalFailure: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    clientName: 'Indústria Gama',
    consultantId: 'c2',
    date: `${currentYear}-${pad(currentMonth)}-02`,
    value: 4200,
    paymentMethod: 'Transferência',
    installments: 4,
    status: 'Revertido',
    createdAt: new Date().toISOString(),
  },
]
