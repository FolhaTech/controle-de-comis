export interface Process {
  processo_id: string
  dat_abertura: string | null
  nom_tarefa: string | null
  nome_cliente: string | null
  cpf_cliente: string | null
  telefone_cliente: string | null
  resumo_caso_cli: string | null
  re_pre_prpocessual: string | null
  compro_end_pre_pro: string | null
  justica_grat_pre_pro: string | null
  cart_trab_pre_pro: string | null
  holerite_pre_pro: string | null
  decl_ir_pre_pro: string | null
  extrat_banco_pre_pro: string | null
  cart_convenio_pre_proc: string | null
  comp_pgto_conv_pre_proc: string | null
  laudo_psic_pre_proc: string | null
  laudo_cirurgia_pre_proc: string | null
  negativa_pre_pro: string | null
  custas_pre_proc: string | null
  [key: string]: string | null
}

export interface TaskDistribution {
  nom_tarefa: string
  count: number
}

export interface ProcessStats {
  total: number
  taskDistribution: TaskDistribution[]
  avgDocPercentage: number
}

export interface PaginatedProcesses {
  data: Process[]
  total: number
  page: number
  pageSize: number
}

export const DOCUMENT_FIELDS = [
  { key: 're_pre_prpocessual', label: 'RE Pré-Processual' },
  { key: 'compro_end_pre_pro', label: 'Comprovante de Endereço' },
  { key: 'justica_grat_pre_pro', label: 'Justiça Gratuita' },
  { key: 'cart_trab_pre_pro', label: 'Carteira de Trabalho' },
  { key: 'holerite_pre_pro', label: 'Holerite' },
  { key: 'decl_ir_pre_pro', label: 'Declaração de IR' },
  { key: 'extrat_banco_pre_pro', label: 'Extrato Bancário' },
  { key: 'cart_convenio_pre_proc', label: 'Carta Convênio' },
  { key: 'comp_pgto_conv_pre_proc', label: 'Comprovante Pagamento Convênio' },
  { key: 'laudo_psic_pre_proc', label: 'Laudo Psicológico' },
  { key: 'laudo_cirurgia_pre_proc', label: 'Laudo Cirurgia' },
  { key: 'negativa_pre_pro', label: 'Negativa' },
  { key: 'custas_pre_proc', label: 'Custas' },
] as const

export function isDocFilled(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value !== ''
}
