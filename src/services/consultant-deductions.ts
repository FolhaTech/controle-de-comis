import type { ConsultantDeduction } from '@/lib/types'
import { tryEachBase } from './api-client'

export async function fetchConsultantDeductions(): Promise<{ data: ConsultantDeduction[] | null; error: any }> {
  try {
    const data = await tryEachBase<ConsultantDeduction[]>('/api/consultant-deductions', undefined, async (res) => {
      const body = await res.json()
      return body?.data ?? []
    })
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export type ConsultantDeductionInput = {
  consultant_name: string
  description?: string | null
  total_value: number
  installments: number
  start_month: number
  start_year: number
}

export async function createConsultantDeduction(
  input: ConsultantDeductionInput,
): Promise<{ data: ConsultantDeduction | null; error: any }> {
  try {
    const data = await tryEachBase<ConsultantDeduction>('/api/consultant-deductions', {
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

export type ConsultantDeductionUpdate = {
  description?: string | null
  total_value?: number
  installments?: number
  start_month?: number
  start_year?: number
}

export async function updateConsultantDeduction(
  id: string,
  updates: ConsultantDeductionUpdate,
): Promise<{ data: ConsultantDeduction | null; error: any }> {
  try {
    const data = await tryEachBase<ConsultantDeduction>(`/api/consultant-deductions/${id}`, {
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

export async function deleteConsultantDeduction(id: string): Promise<{ error: any }> {
  try {
    await tryEachBase<void>(`/api/consultant-deductions/${id}`, { method: 'DELETE' }, async () => undefined)
    return { error: null }
  } catch (error) {
    return { error }
  }
}
