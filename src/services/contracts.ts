import { Contract } from '@/lib/types'

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

function saveContracts(items: Contract[]) {
  localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(items))
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
        const contracts: Contract[] = []
        const seenProcessIds = new Set<string>()

        for (const r of rows) {
          const processId = String(r.processo_id ?? r.id ?? '')
          if (!processId || seenProcessIds.has(processId)) continue
          seenProcessIds.add(processId)

          contracts.push({
            id: processId,
            name: r.name ?? r.nom_tarefa ?? null,
            client: r.Cliente ?? r.client ?? null,
            client_cpf: r.CPF ?? r.client_cpf ?? null,
            client_phone: r.client_phone ?? null,
            client_email: r.client_email ?? null,
            contracted_value: parseNumericValue(r.valor_pagto ?? r.valor),
            entry_value: parseNumericValue(r.Entrada),
            entry_payment_method: normalizePaymentMethod(r.entry_payment_method),
            payment_method: normalizePaymentMethod(r.Formas_Pagamento ?? r.payment_method),
            installments: parseInstallments(r.Qtd_Parcelas),
            status: r.status ?? 'Ativo',
            start_date: r.Data_Execucao ? new Date(r.Data_Execucao).toISOString() : null,
            end_date_planned: r.end_date_planned ?? null,
            internal_failure: r.internal_failure ?? null,
            manager: r.manager ?? null,
            address: r.address ?? null,
            notes: r.resumo_pgto_clie ?? r.notes ?? null,
            created_at: r.created_at ?? null,
            budget_planned: null,
            progress_percentage: null,
            total_area: null,
            closed_by: parseClosedByName(r.inserrido_pgto),
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

export async function createContract(contract: Partial<Contract>) {
  const items = loadContracts()
  const newContract: Contract = {
    id: crypto.randomUUID(),
    name: contract.name || contract.client || 'Contrato',
    client: contract.client || null,
    client_cpf: contract.client_cpf || null,
    client_phone: contract.client_phone || null,
    client_email: contract.client_email || null,
    contracted_value: contract.contracted_value ?? null,
    entry_value: contract.entry_value ?? null,
    entry_payment_method: contract.entry_payment_method || null,
    payment_method: contract.payment_method || null,
    installments: contract.installments ?? null,
    status: contract.status || 'Ativo',
    start_date: contract.start_date || null,
    end_date_planned: contract.end_date_planned || null,
    internal_failure: contract.internal_failure ?? null,
    manager: contract.manager || null,
    address: contract.address || null,
    notes: contract.notes || null,
    closed_by: contract.closed_by || null,
    created_at: new Date().toISOString(),
  }
  const updated = [newContract, ...items]
  saveContracts(updated)
  return { data: newContract, error: null }
}

export async function updateContract(id: string, updates: Partial<Contract>) {
  const items = loadContracts()
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) {
    return { data: null, error: 'Contrato não encontrado' }
  }

  const updatedContract = {
    ...items[index],
    ...updates,
    name: updates.name || updates.client || items[index].name,
  }
  const updatedItems = [...items]
  updatedItems[index] = updatedContract
  saveContracts(updatedItems)
  return { data: updatedContract, error: null }
}

export async function deleteContract(id: string) {
  const items = loadContracts()
  saveContracts(items.filter((item) => item.id !== id))
  return { error: null }
}
