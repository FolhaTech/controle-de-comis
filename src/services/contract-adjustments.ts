import type { ContractAdjustment } from '@/lib/types'
import { tryEachBase } from './api-client'

export async function fetchContractAdjustments(): Promise<{ data: ContractAdjustment[] | null; error: any }> {
  try {
    const data = await tryEachBase<ContractAdjustment[]>('/api/contract-adjustments', undefined, async (res) => {
      const body = await res.json()
      return body?.data ?? []
    })
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export type ContractAdjustmentInput = {
  action: ContractAdjustment['action']
  target_processo_id?: string | null
  closed_by: string
  client?: string | null
  case_type?: string | null
  value?: number | null
  start_date?: string | null
}

export async function createContractAdjustment(input: ContractAdjustmentInput): Promise<{ data: ContractAdjustment | null; error: any }> {
  try {
    const data = await tryEachBase<ContractAdjustment>('/api/contract-adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }, async (res) => {
      const body = await res.json()
      return body?.data ?? null
    })
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export type ContractAdjustmentUpdate = {
  client?: string | null
  case_type?: string | null
  value?: number | null
  start_date?: string | null
  closed_by?: string
}

export async function updateContractAdjustment(id: string, updates: ContractAdjustmentUpdate): Promise<{ data: ContractAdjustment | null; error: any }> {
  try {
    const data = await tryEachBase<ContractAdjustment>(`/api/contract-adjustments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }, async (res) => {
      const body = await res.json()
      return body?.data ?? null
    })
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteContractAdjustment(id: string): Promise<{ error: any }> {
  try {
    await tryEachBase<void>(`/api/contract-adjustments/${id}`, { method: 'DELETE' }, async () => undefined)
    return { error: null }
  } catch (error) {
    return { error }
  }
}
