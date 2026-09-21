import type { Process, ProcessStats, PaginatedProcesses, QuarterData } from '@/lib/processos'

const sampleProcesses: Process[] = [
  {
    id: 'proc-1',
    processo_id: '2025-0001',
    dat_abertura: '2025-01-15',
    nom_tarefa: 'Análise de contrato',
    nome_cliente: 'Cliente Exemplo',
    cpf_cliente: '123.456.789-00',
    telefone_cliente: '1199999-9999',
    resumo_caso_cli: 'Contrato trabalhista',
    re_pre_prpocessual: '1',
    compro_end_pre_pro: '1',
    justica_grat_pre_pro: '0',
    cart_trab_pre_pro: '1',
    holerite_pre_pro: '1',
    decl_ir_pre_pro: '1',
    extrat_banco_pre_pro: '1',
    cart_convenio_pre_proc: '0',
    comp_pgto_conv_pre_proc: '0',
    laudo_psic_pre_proc: '0',
    laudo_cirurgia_pre_proc: '0',
    negativa_pre_pro: '0',
    custas_pre_proc: '0',
    valor: 25000,
    responsavel: 'Advogado A',
    created_at: new Date().toISOString(),
  },
  {
    id: 'proc-2',
    processo_id: '2025-0002',
    dat_abertura: '2025-02-20',
    nom_tarefa: 'Audiência inicial',
    nome_cliente: 'Cliente Beta',
    cpf_cliente: '987.654.321-00',
    telefone_cliente: '2198888-8888',
    resumo_caso_cli: 'Reclamação trabalhista',
    re_pre_prpocessual: '1',
    compro_end_pre_pro: '1',
    justica_grat_pre_pro: '1',
    cart_trab_pre_pro: '1',
    holerite_pre_pro: '1',
    decl_ir_pre_pro: '0',
    extrat_banco_pre_pro: '1',
    cart_convenio_pre_proc: '1',
    comp_pgto_conv_pre_proc: '0',
    laudo_psic_pre_proc: '0',
    laudo_cirurgia_pre_proc: '0',
    negativa_pre_pro: '0',
    custas_pre_proc: '0',
    valor: 14000,
    responsavel: 'Advogado B',
    created_at: new Date().toISOString(),
  },
]

const sampleStats: ProcessStats = {
  total: sampleProcesses.length,
  taskDistribution: [
    { nom_tarefa: 'Análise de contrato', count: 1 },
    { nom_tarefa: 'Audiência inicial', count: 1 },
  ],
  avgDocPercentage: 75,
}

const sampleQuarterData: QuarterData = {
  processes: sampleProcesses,
  stats: {
    total: sampleProcesses.length,
    avgDocPercentage: 75,
  },
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchProcesses(
  page: number,
  pageSize: number,
  q: string,
  sortBy = 'dat_abertura',
  sortDir: 'asc' | 'desc' = 'desc',
): Promise<PaginatedProcesses> {
  await delay(200)
  const query = q.trim().toLowerCase()
  const filtered = sampleProcesses.filter((process) => {
    const searchText = [
      process.processo_id,
      process.nome_cliente,
      process.cpf_cliente,
      process.nom_tarefa,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return searchText.includes(query)
  })

  const sorted = [...filtered].sort((a, b) => {
    const aValue = String(a[sortBy] ?? '').toLowerCase()
    const bValue = String(b[sortBy] ?? '').toLowerCase()
    if (sortDir === 'asc') return aValue.localeCompare(bValue)
    return bValue.localeCompare(aValue)
  })

  const start = (page - 1) * pageSize
  const paginated = sorted.slice(start, start + pageSize)
  return {
    data: paginated,
    total: filtered.length,
    page,
    pageSize,
  }
}

export async function fetchProcessDetail(id: string): Promise<Process> {
  await delay(100)
  const process = sampleProcesses.find((item) => item.id === id)
  if (!process) throw new Error('Processo não encontrado')
  return process
}

export async function fetchProcessStats(): Promise<ProcessStats> {
  await delay(100)
  return sampleStats
}

function getQuarterDateRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = startMonth + 2
  const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`
  const nextStartMonth = endMonth + 1
  const nextStartDate =
    nextStartMonth > 12
      ? `${year + 1}-01-01`
      : `${year}-${String(nextStartMonth).padStart(2, '0')}-01`
  return { startDate, nextStartDate }
}

const API_BASES = [
  (import.meta.env.VITE_API_URL as string | undefined)?.trim(),
  'http://localhost:4000',
  'http://localhost:4001',
  'http://localhost:4002',
].filter(Boolean) as string[]
API_BASES.push('') // same-origin fallback, e.g. Vercel's /api/*

function mapRowToProcess(row: Record<string, any>): Process {
  return {
    processo_id: String(row.processo_id ?? ''),
    dat_abertura: row.dat_abertura ? new Date(row.dat_abertura).toISOString() : null,
    nom_tarefa: row.nom_tarefa ?? null,
    nome_cliente: row.nome_cliente ?? null,
    cpf_cliente: row.cpf_cliente ?? null,
    telefone_cliente: row.telefone_cliente ?? null,
    resumo_caso_cli: row.resumo_caso_cli ?? null,
    re_pre_prpocessual: row.re_pre_prpocessual ?? null,
    compro_end_pre_pro: row.compro_end_pre_pro ?? null,
    justica_grat_pre_pro: row.justica_grat_pre_pro ?? null,
    cart_trab_pre_pro: row.cart_trab_pre_pro ?? null,
    holerite_pre_pro: row.holerite_pre_pro ?? null,
    decl_ir_pre_pro: row.decl_ir_pre_pro ?? null,
    extrat_banco_pre_pro: row.extrat_banco_pre_pro ?? null,
    cart_convenio_pre_proc: row.cart_convenio_pre_proc ?? null,
    comp_pgto_conv_pre_proc: row.comp_pgto_conv_pre_proc ?? null,
    laudo_psic_pre_proc: row.laudo_psic_pre_proc ?? null,
    laudo_cirurgia_pre_proc: row.laudo_cirurgia_pre_proc ?? null,
    negativa_pre_pro: row.negativa_pre_pro ?? null,
    custas_pre_proc: row.custas_pre_proc ?? null,
  }
}

export async function fetchQuarterData(year: number, quarter: number): Promise<QuarterData> {
  const { startDate, nextStartDate } = getQuarterDateRange(year, quarter)
  try {
    let lastError: unknown
    for (const API_BASE of API_BASES) {
      try {
        const url = `${API_BASE}/api/processos/quarter?start_date=${encodeURIComponent(
          startDate,
        )}&next_start_date=${encodeURIComponent(nextStartDate)}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const body = await res.json()
        const rows: Record<string, any>[] = body?.processes ?? []
        const processes = rows.map(mapRowToProcess)
        const stats: QuarterData['stats'] = {
          total: body?.stats?.total ?? processes.length,
          avgDocPercentage: body?.stats?.avgDocPercentage ?? 0,
        }
        return { processes, stats }
      } catch (error) {
        lastError = error
      }
    }

    throw lastError ?? new Error('API unavailable')
  } catch (_err) {
    // fallback to sample data when API not reachable
    await delay(100)
    return sampleQuarterData
  }
}
