import { createConnection } from 'npm:mysql2@3.14.0/promise'

type Connection = Awaited<ReturnType<typeof createConnection>>

const SORTABLE_COLUMNS: Record<string, string> = {
  dat_abertura: 'dat_abertura',
  nome_cliente: 'nome_cliente',
  processo_id: 'processo_id',
  nom_tarefa: 'nom_tarefa',
}

const DOC_COLUMNS = [
  're_pre_prpocessual',
  'compro_end_pre_pro',
  'justica_grat_pre_pro',
  'cart_trab_pre_pro',
  'holerite_pre_pro',
  'decl_ir_pre_pro',
  'extrat_banco_pre_pro',
  'cart_convenio_pre_proc',
  'comp_pgto_conv_pre_proc',
  'laudo_psic_pre_proc',
  'laudo_cirurgia_pre_proc',
  'negativa_pre_pro',
  'custas_pre_proc',
]

export async function getConnection(): Promise<Connection> {
  return createConnection({
    host: Deno.env.get('MYSQL_HOST'),
    user: Deno.env.get('MYSQL_USER'),
    password: Deno.env.get('MYSQL_PASSWORD'),
    database: Deno.env.get('MYSQL_DATABASE'),
    port: 3306,
  })
}

function buildWhere(q: string): { clause: string; params: string[] } {
  if (!q || !q.trim()) return { clause: '', params: [] }
  const term = `%${q}%`
  return {
    clause: 'WHERE nome_cliente LIKE ? OR cpf_cliente LIKE ? OR CAST(processo_id AS CHAR) LIKE ?',
    params: [term, term, term],
  }
}

export async function getProcesses(
  conn: Connection,
  page: number,
  pageSize: number,
  q: string,
  sortBy: string,
  sortDir: string,
) {
  const safePage = Math.max(1, page)
  const safePageSize = Math.max(1, Math.min(100, pageSize))
  const offset = (safePage - 1) * safePageSize
  const { clause, params } = buildWhere(q)
  const sortCol = SORTABLE_COLUMNS[sortBy] || 'dat_abertura'
  const sortDirSafe = sortDir === 'asc' ? 'ASC' : 'DESC'

  const [countRows] = await conn.execute(
    `SELECT COUNT(*) as total FROM vw_clientes_docs_test ${clause}`,
    params,
  )
  const total = (countRows as Record<string, unknown>[])[0].total as number

  const [rows] = await conn.execute(
    `SELECT * FROM vw_clientes_docs_test ${clause} ORDER BY ${sortCol} ${sortDirSafe} LIMIT ${safePageSize} OFFSET ${offset}`,
    params,
  )

  return { data: rows as Record<string, unknown>[], total, page: safePage, pageSize: safePageSize }
}

export async function getProcessDetail(conn: Connection, id: string) {
  const [rows] = await conn.execute(
    'SELECT * FROM vw_clientes_docs_test WHERE processo_id = ? LIMIT 1',
    [id],
  )
  const arr = rows as Record<string, unknown>[]
  return arr[0] || null
}

export async function getStats(conn: Connection) {
  const [countRows] = await conn.execute('SELECT COUNT(*) as total FROM vw_clientes_docs_test')
  const total = (countRows as Record<string, unknown>[])[0].total as number

  const [taskRows] = await conn.execute(
    'SELECT nom_tarefa, COUNT(*) as count FROM vw_clientes_docs_test GROUP BY nom_tarefa ORDER BY count DESC',
  )

  const docCases = DOC_COLUMNS.map(
    (col) => `CASE WHEN ${col} IS NOT NULL AND ${col} != '' AND ${col} != '0' THEN 1 ELSE 0 END`,
  ).join(' + ')

  const [avgRows] = await conn.execute(
    `SELECT AVG((${docCases}) / 13.0 * 100) as avg_doc_percentage FROM vw_clientes_docs_test`,
  )
  const avgDocPercentage =
    ((avgRows as Record<string, unknown>[])[0].avg_doc_percentage as number) || 0

  return {
    total,
    taskDistribution: taskRows as Record<string, unknown>[],
    avgDocPercentage: Math.round(avgDocPercentage * 100) / 100,
  }
}
