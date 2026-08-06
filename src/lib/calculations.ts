import { Contract, Settings } from './types'

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
      grossRevenue += c.contracted_value || 0
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
): PersonMonthlyTotals[] {
  const normalize = (value: string) => value.trim().toLowerCase()
  const monthsByPerson = new Map<string, number[]>()
  for (const name of names) {
    monthsByPerson.set(normalize(name), new Array(12).fill(0))
  }

  for (const c of contracts) {
    if (!isContractValid(c) || !c.closed_by || !c.start_date) continue
    const months = monthsByPerson.get(normalize(c.closed_by))
    if (!months) continue

    const date = new Date(c.start_date)
    if (date.getFullYear() !== year) continue
    months[date.getMonth()] += c.contracted_value || 0
  }

  return names
    .map((name) => {
      const months = monthsByPerson.get(normalize(name)) || new Array(12).fill(0)
      return { name, months, total: months.reduce((sum, v) => sum + v, 0) }
    })
    .sort((a, b) => b.total - a.total)
}

export function calculateCommission(contracts: Contract[], settings: Settings) {
  const validContracts = contracts.filter(isContractValid)
  const count = validContracts.length

  const tier = settings.tiers.find((t) => count >= t.min && count <= t.max)
  const basePercentage = tier ? tier.percentage : 0

  let baseCommission = 0
  let bonusValue = 0

  validContracts.forEach((c) => {
    const value = c.contracted_value || 0
    baseCommission += value * (basePercentage / 100)

    let contractBonusPct = 0
    if (value >= settings.bonuses.highValueThreshold) {
      contractBonusPct += settings.bonuses.highValuePercentage
    }
    if ((c.installments || 1) <= settings.bonuses.maxInstallments) {
      contractBonusPct += settings.bonuses.installmentsPercentage
    }

    bonusValue += value * (contractBonusPct / 100)
  })

  return {
    baseCommission,
    bonusValue,
    total: baseCommission + bonusValue,
    currentTier: basePercentage,
  }
}
