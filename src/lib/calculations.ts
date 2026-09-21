import { Consultant, Contract, ConsultantDeduction, Settings } from './types'

// Fallback Ajuda de Custo when a consultant hasn't had fixed_salary filled in
// via the edit form yet (that field is saved per-browser, so this keeps the
// known values visible everywhere until someone fills the form for real).
const DEFAULT_AJUDA_CUSTO: Record<string, number> = {
  'amanda iagarashi': 1401.19,
  'camila salles': 1401.19,
  'kamila marson': 1463.75,
  'ivani silva': 2479.03,
  'denise germano': 2000.0,
}

export function getAjudaCusto(consultant: Consultant): number {
  if (consultant.fixed_salary) return consultant.fixed_salary
  return DEFAULT_AJUDA_CUSTO[consultant.name.trim().toLowerCase()] ?? 0
}

// Value to use everywhere "the contract's value" is shown or summed:
// valor_desconto_forma_pagamento (net, after payment-method discount),
// falling back to the gross contracted value when it isn't available.
export function contractValue(contract: Contract): number {
  // `commission_base_value` (valor_desconto_forma_pagamento) is sometimes stored as a
  // literal 0.00 in the DB when it was never actually populated, rather than NULL —
  // in those rows the real contract value only exists in `contracted_value`. Treating
  // 0 as "present" here would silently zero out the commission for those contracts.
  if (contract.commission_base_value != null && contract.commission_base_value > 0) {
    return contract.commission_base_value
  }
  return contract.contracted_value ?? 0
}

export function isContractValid(contract: Contract) {
  if (contract.status === 'Cancelado' && !contract.internal_failure) {
    return false
  }
  return true
}

// The date a contract counts against for month/year filtering everywhere in
// the app. Normally that's its own start_date — but a cancelled contract
// (with a cancellation_date on file, see ContractAdjustmentForm) counts
// against the month it was CANCELLED in instead: the clawback is a new
// event landing in that month, not a retroactive edit to a period that may
// already be closed.
export function contractPeriodDate(contract: Contract): Date | null {
  if (contract.status === 'Cancelado' && contract.cancellation_date) {
    const cancelled = new Date(contract.cancellation_date)
    if (!Number.isNaN(cancelled.getTime())) return cancelled
  }
  if (!contract.start_date) return null
  const start = new Date(contract.start_date)
  return Number.isNaN(start.getTime()) ? null : start
}

// How much to claw back from commission for one cancelled contract. A
// non-null cancellation_deduction means it went through the add/edit
// contract form, which already applied the mandatory 1-year-from-start_date
// rule (0 if the contract is older than a year, the entered amount
// otherwise) — that value is authoritative. A cancelled contract that was
// never edited through the form (status came straight from the CRM) has no
// such value on file, so it falls back to the full contract value.
export function cancellationDeductionAmount(contract: Contract): number {
  if (contract.status !== 'Cancelado' || contract.internal_failure) return 0
  return contract.cancellation_deduction != null ? contract.cancellation_deduction : contractValue(contract)
}

export function filterContractsByPeriod(contracts: Contract[], month: number, year: number) {
  return contracts.filter((c) => {
    const d = contractPeriodDate(c)
    if (!d) return false
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
    if (!c.closed_by) continue
    const monthsBuckets = contractsByPersonMonth.get(normalize(c.closed_by))
    if (!monthsBuckets) continue

    const date = contractPeriodDate(c)
    if (!date || date.getFullYear() !== year || date > now) continue
    monthsBuckets[date.getMonth()].push(c)
  }

  return names
    .map((name) => {
      const monthsBuckets =
        contractsByPersonMonth.get(normalize(name)) || Array.from({ length: 12 }, () => [])
      const months = monthsBuckets.map((monthContracts) => {
        const breakdown = calculateCommissionBreakdown(monthContracts, settings)
        const trabalhistaCount = monthContracts.filter(
          (c) => c.service_type === 'Trabalhista' && isContractValid(c),
        ).length
        return breakdown.total + calculateAttendantCommission(trabalhistaCount, settings).commissionValue
      })
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
    if (!isContractValid(c) || !c.closed_by) return false
    if (normalize(c.closed_by) !== target) return false
    const date = contractPeriodDate(c)
    if (!date) return false
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

// A non-Trabalhista contract closed with a R$0,00 value (a fixed-fee case,
// not billed as a percentage of value) is paid a flat premiação instead —
// keyed by the consultant's current gatilho (the tier percentage from
// settings.tiers, based on contract count), not by payment method: a R$0
// contract can never trigger the high-value bonus anyway, so there's no
// payment-method distinction to make for it.
const ZERO_VALUE_FLAT_FEE: Record<number, number> = {
  2.5: 50,
  5: 100,
  6: 150,
  10: 200,
}

// Trabalhista contracts are never billed as a percentage of value — they're
// charged per-contract via calculateAttendantCommission's tiers instead, so
// they're excluded here entirely (see calculatePersonMonthlyCommission).
export function calculateCommissionBreakdown(contracts: Contract[], settings: Settings) {
  const validContracts = contracts.filter((c) => c.service_type !== 'Trabalhista' && isContractValid(c))
  const count = validContracts.length

  const tier = settings.tiers.find((t) => count >= t.min && count <= t.max)
  const basePercentage = tier ? tier.percentage : 0

  const items: CommissionBreakdownItem[] = validContracts.map((contract) => {
    const value = contractValue(contract)
    if (value === 0) {
      const flatFee = ZERO_VALUE_FLAT_FEE[basePercentage] ?? 0
      return { contract, percentage: basePercentage, commissionValue: flatFee }
    }

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

  const baseCommission = items.reduce((sum, i) => {
    const value = contractValue(i.contract)
    return sum + (value === 0 ? i.commissionValue : value * (basePercentage / 100))
  }, 0)
  const total = items.reduce((sum, i) => sum + i.commissionValue, 0)

  return { basePercentage, items, baseCommission, bonusValue: total - baseCommission, total }
}

function filterPersonPeriodContracts(
  contracts: Contract[],
  personName: string,
  month: number,
  year: number,
) {
  const normalize = (value: string) => value.trim().toLowerCase()
  const target = normalize(personName)
  const now = new Date()

  return contracts.filter((c) => {
    if (!c.closed_by || normalize(c.closed_by) !== target) return false
    const d = contractPeriodDate(c)
    if (!d) return false
    return d.getMonth() + 1 === month && d.getFullYear() === year && d <= now
  })
}

// Trabalhista contracts are billed per-contract (see calculateAttendantCommission's
// tiers), not as a percentage of value, so their commission is computed
// separately here and added on top of the regular value-based breakdown.
export function calculatePersonMonthlyCommission(
  contracts: Contract[],
  personName: string,
  month: number,
  year: number,
  settings: Settings,
) {
  const personContracts = filterPersonPeriodContracts(contracts, personName, month, year)
  const breakdown = calculateCommissionBreakdown(personContracts, settings)

  const trabalhistaCount = personContracts.filter(
    (c) => c.service_type === 'Trabalhista' && isContractValid(c),
  ).length
  const trabalhista = calculateAttendantCommission(trabalhistaCount, settings)

  return {
    ...breakdown,
    trabalhistaContractCount: trabalhistaCount,
    trabalhistaValuePerContract: trabalhista.valuePerContract,
    trabalhistaCommissionValue: trabalhista.commissionValue,
    total: breakdown.total + trabalhista.commissionValue,
  }
}

// How much of personName's commission for month/year must be clawed back
// for cancelled contracts — see cancellationDeductionAmount. isContractValid
// already excludes a cancelled contract's own commission from
// calculatePersonMonthlyCommission, but this is a further, separate
// deduction (e.g. the value already paid out before the cancellation), so it
// must be subtracted everywhere commission is shown, not just on the PDF.
export function calculateCancelamentosDeduction(
  contracts: Contract[],
  personName: string,
  month: number,
  year: number,
): number {
  const personContracts = filterPersonPeriodContracts(contracts, personName, month, year)
  return personContracts
    .filter((c) => c.status === 'Cancelado' && !c.internal_failure)
    .reduce((sum, c) => sum + cancellationDeductionAmount(c), 0)
}

// Sum of the monthly installment of every deduction (advance, loan,
// equipment...) active for `personName` in `month`/`year`. A deduction of
// total_value split into `installments` starting at start_month/start_year
// contributes total_value/installments to each of those consecutive months;
// installments defaults to 1, so an unparcelled deduction is just applied
// once in its start month.
export function calculateMonthlyDeduction(
  deductions: ConsultantDeduction[],
  personName: string,
  month: number,
  year: number,
): number {
  const normalize = (v: string) => v.trim().toLowerCase()
  const target = normalize(personName)
  return deductions
    .filter((d) => normalize(d.consultant_name) === target)
    .reduce((sum, d) => {
      const installmentIndex = (year - d.start_year) * 12 + (month - d.start_month)
      const installments = d.installments > 0 ? d.installments : 1
      if (installmentIndex < 0 || installmentIndex >= installments) return sum
      return sum + d.total_value / installments
    }, 0)
}

export interface ActiveDeductionDetail {
  deduction: ConsultantDeduction
  // 1-based — "parcela 3 de 12", not the 0-based installmentIndex used
  // internally to decide whether the deduction is active this month.
  installmentNumber: number
  installmentValue: number
}

// The itemized breakdown behind calculateMonthlyDeduction's sum — every
// deduction active for personName in month/year, with which installment
// number it is and the value of just that installment, so callers (the PDF)
// can show which parcela is being taken and from when it started, not just
// a single combined total.
export function getActiveDeductions(
  deductions: ConsultantDeduction[],
  personName: string,
  month: number,
  year: number,
): ActiveDeductionDetail[] {
  const normalize = (v: string) => v.trim().toLowerCase()
  const target = normalize(personName)
  const active: ActiveDeductionDetail[] = []
  for (const d of deductions) {
    if (normalize(d.consultant_name) !== target) continue
    const installmentIndex = (year - d.start_year) * 12 + (month - d.start_month)
    const installments = d.installments > 0 ? d.installments : 1
    if (installmentIndex < 0 || installmentIndex >= installments) continue
    active.push({
      deduction: d,
      installmentNumber: installmentIndex + 1,
      installmentValue: d.total_value / installments,
    })
  }
  return active
}

// Isolates just the Trabalhista slice of a person's monthly commission — a
// read-only breakout of what calculatePersonMonthlyCommission already computes.
export function calculateTrabalhistaCommission(
  contracts: Contract[],
  personName: string,
  month: number,
  year: number,
  settings: Settings,
) {
  const result = calculatePersonMonthlyCommission(contracts, personName, month, year, settings)
  return {
    contractCount: result.trabalhistaContractCount,
    valuePerContract: result.trabalhistaValuePerContract,
    commissionValue: result.trabalhistaCommissionValue,
  }
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
