import { tryEachBase } from './api-client'

export interface AtendenteResult {
  responsavel: string
  liberacoes: number
  bateu_individual: boolean
  streak_individual: number
  valor_individual: number
  valor_coletivo: number
  valor_total: number
}

export interface ComissaoPreResult {
  periodo: string
  inicio: string
  fim: string
  total_pastas: number
  valor_gestao: number
  gestora_direta: string
  atendentes: AtendenteResult[]
  email_sent?: boolean
}

export async function uploadPlanilha(file: File): Promise<{ data: { imported: number; periodos: string[] } | null; error: unknown }> {
  try {
    const form = new FormData()
    form.append('file', file)
    const data = await tryEachBase<{ imported: number; periodos: string[] }>(
      '/api/pre-processual/upload',
      { method: 'POST', body: form },
      async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`)
        return body
      },
    )
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function fetchPeriodo(label: string): Promise<{ data: ComissaoPreResult | null; error: unknown }> {
  try {
    const data = await tryEachBase<ComissaoPreResult>(`/api/pre-processual/periodo/${label}`, undefined, async (res) => {
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`)
      return body
    })
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function consolidarPeriodo(label: string): Promise<{ data: ComissaoPreResult | null; error: unknown }> {
  try {
    const data = await tryEachBase<ComissaoPreResult>(
      '/api/pre-processual/consolidar',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ periodo: label }) },
      async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`)
        return body
      },
    )
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export interface HistoricoResult {
  premiacoes: (AtendenteResult & { periodo: string })[]
  gestao: { periodo: string; total_pastas: number; valor_gestao: number }[]
}

export async function fetchHistorico(): Promise<{ data: HistoricoResult | null; error: unknown }> {
  try {
    const data = await tryEachBase<HistoricoResult>('/api/pre-processual/historico', undefined, async (res) => {
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`)
      return body
    })
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Rótulo do período atual (mês de fechamento), mesma regra do servidor:
// dia >= 20 pertence ao período que fecha no mês seguinte.
export function currentPeriodoLabel(): string {
  const d = new Date()
  const closing = new Date(d.getFullYear(), d.getMonth() + (d.getDate() >= 20 ? 1 : 0), 1)
  return `${closing.getFullYear()}-${String(closing.getMonth() + 1).padStart(2, '0')}`
}
