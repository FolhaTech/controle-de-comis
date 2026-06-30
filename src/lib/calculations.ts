import { Contract, Settings } from './types'

export function isContractValid(contract: Contract) {
  // A contract is valid for goals/revenue if it's Ativo, Revertido, or Distrato Pendente.
  // It's also valid if it's Cancelado but due to internal failure.
  if (contract.status === 'Cancelado' && !contract.internalFailure) {
    return false
  }
  return true
}

export function filterContractsByPeriod(contracts: Contract[], month: number, year: number) {
  return contracts.filter((c) => {
    const d = new Date(c.date)
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
      grossRevenue += c.value
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

export function calculateCommission(contracts: Contract[], settings: Settings) {
  const validContracts = contracts.filter(isContractValid)
  const count = validContracts.length

  // Find applicable tier
  const tier = settings.tiers.find((t) => count >= t.min && count <= t.max)
  const basePercentage = tier ? tier.percentage : 0

  let baseCommission = 0
  let bonusValue = 0

  validContracts.forEach((c) => {
    // Base commission
    baseCommission += c.value * (basePercentage / 100)

    // Bonuses
    let contractBonusPct = 0
    if (c.value >= settings.bonuses.highValueThreshold) {
      contractBonusPct += settings.bonuses.highValuePercentage
    }
    if (c.installments <= settings.bonuses.maxInstallments) {
      contractBonusPct += settings.bonuses.installmentsPercentage
    }

    bonusValue += c.value * (contractBonusPct / 100)
  })

  return {
    baseCommission,
    bonusValue,
    total: baseCommission + bonusValue,
    currentTier: basePercentage,
  }
}
