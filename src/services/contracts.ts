import { Contract, ContractAdjustment } from '@/lib/types'
import { fetchContractAdjustments } from './contract-adjustments'

const CONTRACTS_STORAGE_KEY = 'controle-de-comis-contracts'

const initialContracts: Contract[] = [
  {
    id: 'contract-1',
    name: 'Contrato 1',
    client: 'João Silva',
    client_cpf: '123.456.789-00',
    client_phone: '1199999-9999',
    client_email: 'joao.silva@example.com',
    contracted_value: 12500,
    entry_value: 2500,
    entry_payment_method: 'Pix',
    payment_method: 'Boleto',
    installments: 10,
    status: 'Ativo',
    start_date: '2025-01-10',
    end_date_planned: '2025-12-10',
    internal_failure: false,
    manager: 'Advogado A',
    address: 'Rua A, 123',
    notes: 'Contrato inicial de exemplo',
    created_at: new Date().toISOString(),
  },
  {
    id: 'contract-2',
    name: 'Contrato 2',
    client: 'Maria Oliveira',
    client_cpf: '987.654.321-00',
    client_phone: '2198888-8888',
    client_email: 'maria.oliveira@example.com',
    contracted_value: 7500,
    entry_value: 1500,
    entry_payment_method: 'Cartão de Crédito',
    payment_method: 'Pix',
    installments: 6,
    status: 'Ativo',
    start_date: '2025-02-01',
    end_date_planned: '2025-08-01',
    internal_failure: false,
    manager: 'Advogado B',
    address: 'Avenida B, 456',
    notes: 'Contrato interno de exemplo',
    created_at: new Date().toISOString(),
  },
]

function loadContracts(): Contract[] {
  const stored = localStorage.getItem(CONTRACTS_STORAGE_KEY)
  if (!stored) return initialContracts

  try {
    return JSON.parse(stored) as Contract[]
  } catch {
    return initialContracts
  }
}

function parseNumericValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d,.-]/g, '').replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function parseInstallments(value: unknown): number | null {
  const parsed = parseNumericValue(value)
  if (parsed !== null) return Math.trunc(parsed)

  if (typeof value === 'string') {
    const match = value.match(/(\d+)/)
    return match ? Number(match[1]) : null
  }

  return null
}

function parseClosedByName(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const separatorIndex = value.indexOf(' - ')
  const name = (separatorIndex === -1 ? value : value.slice(0, separatorIndex)).trim()
  return name || null
}

function normalizePaymentMethod(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('pix')) return 'PIX'
  if (normalized.includes('boleto')) return 'Boleto'
  if (normalized.includes('cart') || normalized.includes('credito') || normalized.includes('crédito')) {
    return 'Cartão'
  }
  if (normalized.includes('transf')) return 'Transferência'
  return value
}

// Competências before this date were already closed and paid out under the
// old rule (payment date only, no signature check) — applying the grace
// window retroactively would reclassify already-paid contracts into a later
// month and double-count them. The grace window only applies to payments on
// or after this cutoff.
const GRACE_WINDOW_CUTOFF = new Date(2026, 7, 1) // 2026-08-01

// The competência is the payment date's own month, unless payment landed in
// the last 2 days of the month and the signature paperwork
// (data_assinatura_contrato) trails into the following month: the cutoff is
// day 3 — signed by day 3 of the next month still counts for the payment's
// month, signed day 4+ rolls the contract into the (immediate) next month.
// Only ever shifts by exactly one month — a signature far from the payment
// date (a different month entirely, often a data-entry typo) is ignored and
// the payment's own month is kept.
function resolveCompetenciaDate(paymentDateStr: string, signatureDateStr: unknown): Date {
  const paymentDate = new Date(paymentDateStr)
  const lastDayOfMonth = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0).getDate()
  const isNearMonthEnd = paymentDate.getDate() >= lastDayOfMonth - 1

  if (paymentDate < GRACE_WINDOW_CUTOFF || !isNearMonthEnd || typeof signatureDateStr !== 'string' || !signatureDateStr) {
    return paymentDate
  }

  const signatureDate = new Date(signatureDateStr)
  if (Number.isNaN(signatureDate.getTime())) return paymentDate

  const sameMonthAsPayment =
    signatureDate.getFullYear() === paymentDate.getFullYear() &&
    signatureDate.getMonth() === paymentDate.getMonth()
  if (sameMonthAsPayment) return paymentDate

  const nextMonthDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 1)
  const isImmediateNextMonth =
    signatureDate.getFullYear() === nextMonthDate.getFullYear() &&
    signatureDate.getMonth() === nextMonthDate.getMonth()

  if (isImmediateNextMonth) {
    return signatureDate.getDate() <= 3 ? paymentDate : signatureDate
  }

  // Signature isn't in the payment's month nor the immediate next one —
  // likely a data anomaly, not a genuine trailing signature. Keep payment's month.
  return paymentDate
}

export async function fetchContracts(): Promise<{ data: Contract[] | null; error: any }> {
  // Helper to deduplicate contracts by id or composite key
  const uniqueContracts = (items: Contract[]) => {
    const map = new Map<string, Contract>()
    for (const c of items) {
      const key = c.id || `${c.client ?? ''}|${c.client_cpf ?? ''}|${c.start_date ?? ''}|${c.contracted_value ?? ''}`
      if (!map.has(key)) map.set(key, c)
    }
    return Array.from(map.values())
  }

  // Try to fetch from backend view first
  try {
    const API_BASES = [
      (import.meta.env.VITE_API_URL as string | undefined)?.trim(),
      'http://localhost:4000',
      'http://localhost:4001',
      'http://localhost:4002',
    ].filter(Boolean) as string[]
    API_BASES.push('') // same-origin fallback, e.g. Vercel's /api/*

    let lastError: unknown
    for (const API_BASE of API_BASES) {
      try {
        const url = `${API_BASE}/api/vw_formas_pagamentos`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const body = await res.json()
        const rows: Record<string, any>[] = body?.data ?? []

        // "11 - Confecção inicial" is the labor-law (trabalhista) intake step: it
        // has no reliable payment confirmation, so once a client's case reaches
        // "05.1 - Financeiro link Pgto" that's the authoritative record and the
        // trabalhista intake row for that same client name should be ignored.
        const TASK_FINANCEIRO = '05.1 - Financeiro link Pgto'
        const TASK_TRABALHISTA = '11 - Confecção inicial'
        const TASK_CANCELADO = '15 - Cancelamento contrato'
        // Pré-processual/financeiro have until day 4/5 of the following month
        // to push a confirmed-paid case (data_pgto_cliente already set) through
        // to 05.1, and the firm's own closing only runs day 6 — so a case that
        // has progressed past early intake (01-03) to any of these stages is
        // real, just administratively behind, not a false positive like the
        // ones caught earlier via data_entrada_pgto (Rayane/Luana/José Antonio).
        const LATE_STAGE_TASKS = new Set<string>([
          '04 - Baixa em Sistema',
          '05 - Validação do Pagamento',
          '07 - Solicitação/Validação de documentos',
          '08.5 - Atendimento por consultora',
          '10  - Pre-Processual',
        ])
        const namesWithFinanceiro = new Set<string>()
        const cancelledProcessIds = new Set<string>()
        for (const r of rows) {
          if (r.nom_tarefa === TASK_FINANCEIRO && typeof r.Cliente === 'string' && r.Cliente.trim()) {
            namesWithFinanceiro.add(r.Cliente.trim().toLowerCase())
          }
          if (r.nom_tarefa === TASK_CANCELADO) {
            const processId = String(r.processo_id ?? r.id ?? '')
            if (processId) cancelledProcessIds.add(processId)
          }
        }

        // The API can list the same processo_id more than once — one row per
        // workflow step touch, now including clients who've paid but whose
        // process hasn't reached Financeiro/Trabalhista yet. Prefer, in order:
        // the Financeiro row, then the Trabalhista row, then a late-stage
        // touch (see LATE_STAGE_TASKS), then whichever copy has an actual
        // valor_pagto over a 0/empty one.
        const taskPriority = (task: unknown) => {
          if (task === TASK_FINANCEIRO) return 3
          if (task === TASK_TRABALHISTA) return 2
          if (typeof task === 'string' && LATE_STAGE_TASKS.has(task)) return 1
          return 0
        }
        const bestRowByProcessId = new Map<string, Record<string, any>>()
        for (const r of rows) {
          const processId = String(r.processo_id ?? r.id ?? '')
          if (!processId) continue
          if (cancelledProcessIds.has(processId)) continue
          const existing = bestRowByProcessId.get(processId)
          if (!existing) {
            bestRowByProcessId.set(processId, r)
            continue
          }
          const existingPriority = taskPriority(existing.nom_tarefa)
          const candidatePriority = taskPriority(r.nom_tarefa)
          if (candidatePriority > existingPriority) {
            bestRowByProcessId.set(processId, r)
            continue
          }
          if (candidatePriority < existingPriority) continue

          const existingHasValue = (parseNumericValue(existing.valor_pagto ?? existing.valor) ?? 0) > 0
          const candidateHasValue = (parseNumericValue(r.valor_pagto ?? r.valor) ?? 0) > 0
          if (candidateHasValue && !existingHasValue) {
            bestRowByProcessId.set(processId, r)
            continue
          }
          if (existingHasValue && !candidateHasValue) continue

          // Same priority tier, both (or neither) have a value — the contract
          // terms can get revised across touches, so prefer whichever was
          // created most recently.
          const existingCreated = existing.Data_Criacao ? new Date(existing.Data_Criacao).getTime() : 0
          const candidateCreated = r.Data_Criacao ? new Date(r.Data_Criacao).getTime() : 0
          if (candidateCreated > existingCreated) {
            bestRowByProcessId.set(processId, r)
          }
        }

        // Manual corrections (add/edit/remove a contract) made from the
        // Equipe UI, kept in our own contract_adjustments table since we
        // don't write back into the CRM's tables. A failure here shouldn't
        // break the whole contracts fetch — just means no adjustments apply.
        const { data: adjustments } = await fetchContractAdjustments()
        const removedProcessIds = new Set<string>()
        const editsByProcessId = new Map<string, ContractAdjustment>()
        const addedAdjustments: ContractAdjustment[] = []
        for (const adj of adjustments ?? []) {
          if (adj.action === 'remove' && adj.target_processo_id) {
            removedProcessIds.add(adj.target_processo_id)
          } else if (adj.action === 'edit' && adj.target_processo_id) {
            editsByProcessId.set(adj.target_processo_id, adj)
          } else if (adj.action === 'add') {
            addedAdjustments.push(adj)
          }
        }

        const contracts: Contract[] = []
        for (const [processId, r] of bestRowByProcessId) {
          if (removedProcessIds.has(processId)) continue
          const isTrabalhista = r.nom_tarefa === TASK_TRABALHISTA
          if (isTrabalhista) {
            const name = typeof r.Cliente === 'string' ? r.Cliente.trim().toLowerCase() : ''
            if (name && namesWithFinanceiro.has(name)) continue
          }

          // Without a confirmed data_pgto_cliente, the contract doesn't count
          // toward any competência yet — no falling back to data_entrada_pgto
          // or Data_Execucao. Once it's filled in, the end-of-month grace
          // window (resolveCompetenciaDate) applies as usual.
          const startDate = r.data_pgto_cliente
            ? resolveCompetenciaDate(r.data_pgto_cliente, r.data_assinatura_contrato)
            : null

          // A manual edit overrides only the fields it carries — everything
          // else (payment method...) stays as fetched.
          const edit = editsByProcessId.get(processId)
          const editedValue = edit?.value != null ? Number(edit.value) : null
          const editedStartDate = edit?.start_date ? new Date(edit.start_date) : null

          contracts.push({
            id: processId,
            name: r.name ?? r.nom_tarefa ?? null,
            client: edit?.client || r.Cliente || r.client || null,
            client_cpf: r.CPF ?? r.client_cpf ?? null,
            client_phone: r.client_phone ?? null,
            client_email: r.client_email ?? null,
            consultant_id: null,
            pre_processual_agent_id: null,
            service_type: isTrabalhista ? 'Trabalhista' : null,
            case_type: edit?.case_type || (typeof r.acao_cli === 'string' && r.acao_cli.trim() ? r.acao_cli.trim() : null),
            contracted_value: editedValue ?? parseNumericValue(r.valor_pagto ?? r.valor),
            commission_base_value: editedValue ?? parseNumericValue(r.valor_desconto_forma_pagamento),
            entry_value: parseNumericValue(r.Entrada),
            entry_payment_method: normalizePaymentMethod(r.entry_payment_method),
            is_entry_paid: Boolean(r.data_entrada_pgto),
            payment_method: normalizePaymentMethod(r.Formas_Pagamento ?? r.payment_method),
            installments: parseInstallments(r.Qtd_Parcelas),
            status: edit?.status || r.status || 'Ativo',
            start_date: editedStartDate
              ? editedStartDate.toISOString()
              : startDate
                ? startDate.toISOString()
                : null,
            end_date_planned: r.end_date_planned ?? null,
            cancellation_date: null,
            cancellation_reason: null,
            cancellation_deduction: edit?.cancellation_deduction != null ? Number(edit.cancellation_deduction) : null,
            internal_failure: r.internal_failure ?? null,
            manager: r.manager ?? null,
            address: r.address ?? null,
            notes: r.resumo_pgto_clie ?? r.notes ?? null,
            created_at: r.created_at ?? null,
            budget_planned: null,
            progress_percentage: null,
            total_area: null,
            // nome_solicitante (who opened the client) is the reliable
            // attribution field — inserrido_pgto (who keyed in the payment)
            // can name a different person entirely, including administrative
            // staff who process payments on behalf of the actual consultant.
            // A manual edit can reassign this (e.g. a case wrongly attributed
            // in the CRM, like Andreia de Aguiar's).
            closed_by: edit?.closed_by ||
              (typeof r.nome_solicitante === 'string' && r.nome_solicitante.trim()
                ? r.nome_solicitante.trim()
                : parseClosedByName(r.inserrido_pgto)),
          })
        }

        for (const adj of addedAdjustments) {
          const value = adj.value != null ? Number(adj.value) : null
          contracts.push({
            id: adj.id,
            name: adj.client,
            client: adj.client,
            client_cpf: null,
            client_phone: null,
            client_email: null,
            consultant_id: null,
            pre_processual_agent_id: null,
            service_type: null,
            case_type: adj.case_type,
            contracted_value: value,
            commission_base_value: value,
            entry_value: null,
            entry_payment_method: null,
            is_entry_paid: null,
            payment_method: null,
            installments: null,
            status: adj.status || 'Ativo',
            start_date: adj.start_date ? new Date(adj.start_date).toISOString() : null,
            end_date_planned: null,
            cancellation_date: null,
            cancellation_reason: null,
            cancellation_deduction: adj.cancellation_deduction != null ? Number(adj.cancellation_deduction) : null,
            internal_failure: null,
            manager: null,
            address: null,
            notes: null,
            created_at: adj.created_at,
            budget_planned: null,
            progress_percentage: null,
            total_area: null,
            closed_by: adj.closed_by,
          })
        }

        return { data: uniqueContracts(contracts), error: null }
      } catch (error) {
        lastError = error
      }
    }

    throw lastError ?? new Error('API unavailable')
  } catch (_err) {
    // fallback to local storage and dedupe
    const data = loadContracts() ?? []
    return { data: uniqueContracts(data), error: null }
  }
}

