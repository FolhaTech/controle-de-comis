import { Contract, Settings } from './types'

// Value to use everywhere "the contract's value" is shown or summed:
// valor_desconto_forma_pagamento (net, after payment-method discount),
// falling back to the gross contracted value when it isn't available.
export function contractValue(contract: Contract): number {
  return contract.commission_base_value ?? contract.contracted_value ?? 0
}

export function isContractValid(contract: Contract) {
  if (contract.status === 'Cancelado' && !contract.internal_failure) {
    return false
  }
  return true
}

export function filterContractsByPeriod(contracts: Contract[], month: number, year: number) {
  return contracts.filter((c) => {
    if (!c.start_date) return false
    const d = new Date(c.start_date)
    return d.getMonth() + 1 === month && d.getFullYear() === year
  })
}

export function calculateMetrics(contracts: Contract[]) {
  let validContractsCount = 0
  let cancelledCount = 0
  let grossRevenue = 0

  contracts.forEach((c) => {
    if (isContractValid(c)) {
      validContractsCount++
      grossRevenue += contractValue(c)
    }
    if (c.status === 'Cancelado') {
      cancelledCount++
    }
  })

  const ticketMedio = validContractsCount > 0 ? grossRevenue / validContractsCount : 0

  return {
    validContractsCount,
    cancelledCount,
    grossRevenue,
    ticketMedio,
  }
}

export interface PersonMonthlyTotals {
  name: string
  months: number[]
  total: number
}

export function buildPersonMonthlyTotals(
  contracts: Contract[],
  names: string[],
  year: number,
  settings: Settings,
): PersonMonthlyTotals[] {
  const normalize = (value: string) => value.trim().toLowerCase()
  const now = new Date()
  const contractsByPersonMonth = new Map<string, Contract[][]>()
  for (const name of names) {
    contractsByPersonMonth.set(
      normalize(name),
      Array.from({ length: 12 }, () => []),
    )
  }

  for (const c of contracts) {
    if (!c.closed_by || !c.start_date) continue
    const monthsBuckets = contractsByPersonMonth.get(normalize(c.closed_by))
    if (!monthsBuckets) continue

    const date = new Date(c.start_date)
    if (date.getFullYear() !== year || date > now) continue
    monthsBuckets[date.getMonth()].push(c)
  }

  return names
    .map((name) => {
      const monthsBuckets =
        contractsByPersonMonth.get(normalize(name)) || Array.from({ length: 12 }, () => [])
      const months = monthsBuckets.map(
        (monthContracts) => calculateCommissionBreakdown(monthContracts, settings).total,
      )
      return { name, months, total: months.reduce((sum, v) => sum + v, 0) }
    })
    .sort((a, b) => b.total - a.total)
}

export function countValidContractsByPerson(
  contracts: Contract[],
  personName: string,
  month: number,
  year: number,
) {
  const normalize = (value: string) => value.trim().toLowerCase()
  const target = normalize(personName)

  return contracts.filter((c) => {
    if (!isContractValid(c) || !c.closed_by || !c.start_date) return false
    if (normalize(c.closed_by) !== target) return false
    const date = new Date(c.start_date)
    return date.getMonth() + 1 === month && date.getFullYear() === year
  }).length
}

export function calculateAttendantCommission(contractCount: number, settings: Settings) {
  const tier = settings.attendantCommission.tiers.find(
    (t) => contractCount >= t.min && (t.max === null || contractCount <= t.max),
  )
  const valuePerContract = tier ? tier.valuePerContract : 0
  const commissionValue = contractCount * valuePerContract

  return {
    contractCount,
    valuePerContract,
    commissionValue,
    baseAllowance: settings.attendantCommission.baseAllowance,
    total: settings.attendantCommission.baseAllowance + commissionValue,
  }
}

export interface CommissionBreakdownItem {
  contract: Contract
  percentage: number
  commissionValue: number
}

export function calculateCommissionBreakdown(contracts: Contract[], settings: Settings) {
  const validContracts = contracts.filter(isContractValid)
  const count = validContracts.length

  const tier = settings.tiers.find((t) => count >= t.min && count <= t.max)
  const basePercentage = tier ? tier.percentage : 0

  const items: CommissionBreakdownItem[] = validContracts.map((contract) => {
    const value = contractValue(contract)
    const isHighValue = value >= settings.bonuses.highValueThreshold

    let contractBonusPct = 0
    if (isHighValue && contract.payment_method === 'Cartão') {
      contractBonusPct = settings.bonuses.creditCardBonusPercentage
    } else if (isHighValue && contract.payment_method === 'À Vista') {
      contractBonusPct = settings.bonuses.cashBonusPercentage
    }

    const percentage = basePercentage + contractBonusPct
    return { contract, percentage, commissionValue: value * (percentage / 100) }
  })

  const baseCommission = items.reduce(
    (sum, i) => sum + contractValue(i.contract) * (basePercentage / 100),
    0,
  )
  const total = items.reduce((sum, i) => sum + i.commissionValue, 0)

  return { basePercentage, items, baseCommission, bonusValue: total - baseCommission, total }
}

export function calculatePersonMonthlyCommission(
  contracts: Contract[],
  personName: string,
  month: number,
  year: number,
  settings: Settings,
) {
  const normalize = (value: string) => value.trim().toLowerCase()
  const target = normalize(personName)
  const now = new Date()

  const personContracts = contracts.filter((c) => {
    if (!c.closed_by || normalize(c.closed_by) !== target) return false
    if (!c.start_date) return false
    const d = new Date(c.start_date)
    return d.getMonth() + 1 === month && d.getFullYear() === year && d <= now
  })

  return calculateCommissionBreakdown(personContracts, settings)
}

export function calculateCommission(contracts: Contract[], settings: Settings) {
  const { basePercentage, baseCommission, bonusValue, total } = calculateCommissionBreakdown(
    contracts,
    settings,
  )

  return {
    baseCommission,
    bonusValue,
    total,
    currentTier: basePercentage,
  }
}
