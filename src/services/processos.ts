import { supabase } from '@/lib/supabase/client'
import type { Process, ProcessStats, PaginatedProcesses } from '@/lib/processos'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/processos`
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

async function getHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    apikey: API_KEY,
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }
}

export async function fetchProcesses(
  page: number,
  pageSize: number,
  q: string,
  sortBy = 'dat_abertura',
  sortDir: 'asc' | 'desc' = 'desc',
): Promise<PaginatedProcesses> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    q,
    sortBy,
    sortDir,
  })
  const headers = await getHeaders()
  const response = await fetch(`${FUNCTION_URL}?${params}`, { headers })
  if (!response.ok) throw new Error('Failed to fetch processes')
  return response.json()
}

export async function fetchProcessDetail(id: string): Promise<Process> {
  const params = new URLSearchParams({ action: 'detail', id })
  const headers = await getHeaders()
  const response = await fetch(`${FUNCTION_URL}?${params}`, { headers })
  if (!response.ok) throw new Error('Failed to fetch process detail')
  return response.json()
}

export async function fetchProcessStats(): Promise<ProcessStats> {
  const params = new URLSearchParams({ action: 'stats' })
  const headers = await getHeaders()
  const response = await fetch(`${FUNCTION_URL}?${params}`, { headers })
  if (!response.ok) throw new Error('Failed to fetch stats')
  return response.json()
}
