#!/usr/bin/env node
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

async function getConnection() {
  const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env
  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    throw new Error('Missing MySQL environment variables')
  }
  return mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    port: 3306,
    // DATETIME columns are recorded in Brazil local time; pin this explicitly so
    // date math is identical regardless of the server process's own timezone
    // (e.g. Vercel's serverless functions run in UTC, not America/Sao_Paulo).
    timezone: '-03:00',
  })
}

app.get('/api/clients', async (req, res) => {
  let conn
  try {
    conn = await getConnection()
    const [rows] = await conn.execute(`SELECT DISTINCT Cliente as client FROM vw_formas_pagamentos WHERE Cliente IS NOT NULL ORDER BY Cliente`)
    const clients = (rows || []).map((r) => r.client)
    res.json({ clients })
  } catch (err) {
    console.error('GET /api/clients error', err)
    res.status(500).json({ error: String(err) })
  } finally {
    if (conn) try { await conn.end() } catch {}
  }
})

app.get('/api/inserrido-pgto', async (req, res) => {
  let conn
  try {
    conn = await getConnection()
    // nome_solicitante (who opened the client) is the same attribution field
    // used to build each contract's closed_by — keep the team roster in sync
    // with it, rather than the less reliable inserrido_pgto (who happened to
    // key in the payment, which can be a different person entirely).
    const [rows] = await conn.execute(
      `SELECT DISTINCT nome_solicitante FROM mod_cad_clientes WHERE nome_solicitante IS NOT NULL AND nome_solicitante <> ''`,
    )
    const names = new Set()
    for (const row of rows || []) {
      const name = (row.nome_solicitante || '').trim()
      if (name) names.add(name)
    }
    res.json({ names: Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR')) })
  } catch (err) {
    console.error('GET /api/inserrido-pgto error', err)
    res.status(500).json({ error: String(err) })
  } finally {
    if (conn) try { await conn.end() } catch {}
  }
})

// Built directly off the same base tables vw_formas_pagamentos joins (see
// SHOW CREATE VIEW vw_formas_pagamentos), but deliberately broader/richer:
//   - no restriction to nom_tarefa IN ('05.1...', '11...') — the view's filter
//     silently drops clients who've already paid but whose process hasn't
//     reached one of those two workflow steps yet (e.g. still stuck at
//     "07 - Solicitação/Validação de documentos").
//   - adds T3.nome_solicitante (who opened/originated the client) — the
//     correct field for attributing a contract to a consultant. T4.inserrido_pgto
//     (who happened to key in the payment) is a different, less reliable
//     signal: it can name whoever did data entry, sometimes disagreeing with
//     nome_solicitante entirely.
const FORMAS_PAGAMENTOS_QUERY = `
  SELECT DISTINCT T2.processo_id AS processo_id, T1.dat_abertura AS Data_Abertura, T2.dat_criacao AS Data_Criacao,
         T2.dat_limite AS Data_Limite, T2.dat_execucao AS Data_Execucao,
         T3.cpf_cliente AS CPF, T3.nome_cliente AS Cliente, T3.nome_solicitante AS nome_solicitante, T2.nom_tarefa AS nom_tarefa,
         T3.acao_cli AS acao_cli,
         T3.data_pgto_cliente AS data_pgto_cliente, T3.data_assinatura_contrato AS data_assinatura_contrato,
         (CASE WHEN T4.formas_pgto_cliente = 1 THEN 'Pix' WHEN T4.formas_pgto_cliente = 2 THEN 'Crédito'
               WHEN T4.formas_pgto_cliente = 3 THEN 'Boleto' WHEN T4.formas_pgto_cliente = 4 THEN 'À Vista' END) AS Formas_Pagamento,
         T4.quant_parcelas AS Qtd_Parcelas, T4.valor_entrada_pgto AS Entrada, T4.porcentagem_desc_pgto AS Porcentual_desconto,
         T4.valor_parcela_pgto AS valor_parcela_pgto, T4.val_desc_pgto AS val_desc_pgto, T4.valor_pagto AS valor_pagto,
         T4.valor_desconto_forma_pagamento AS valor_desconto_forma_pagamento, T4.valor_do_des_pagto_cliente AS valor_do_des_pagto_cliente,
         T4.data_entrada_pgto AS data_entrada_pgto, T4.data_venc_parcela AS data_venc_parcela, T4.compro_pagto AS compro_pagto,
         T4.descr_doc_comp AS descr_doc_comp, T4.inserrido_pgto AS inserrido_pgto, T4.resumo_pgto_clie AS resumo_pgto_clie
  FROM gdp_processo T1
  JOIN gdp_processo_tarefa T2 ON T1.id = T2.processo_id
  JOIN mod_cad_clientes T3 ON T2.id = T3.processo_tarefa_id
  JOIN mod_cad_clientes_x_pagamento_cliente T4 ON T3.id = T4.cad_clientes_id
  WHERE T4.valor_pagto IS NOT NULL
`

app.get('/api/vw_formas_pagamentos', async (req, res) => {
  let conn
  try {
    conn = await getConnection()
    const startDate = req.query.start_date
    const nextStartDate = req.query.next_start_date
    const limitParam = req.query.limit
    const limit = limitParam === undefined || limitParam === '' ? null : Number(limitParam)

    let query = FORMAS_PAGAMENTOS_QUERY
    const params = []
    if (startDate && nextStartDate) {
      query += ' AND COALESCE(T3.data_pgto_cliente, T4.data_entrada_pgto, T2.dat_execucao) >= ? AND COALESCE(T3.data_pgto_cliente, T4.data_entrada_pgto, T2.dat_execucao) < ?'
      params.push(startDate, nextStartDate)
    }
    query += ' ORDER BY COALESCE(T3.data_pgto_cliente, T4.data_entrada_pgto, T2.dat_execucao) DESC'
    if (limit !== null && Number.isFinite(limit) && limit > 0) {
      query += ' LIMIT ?'
      params.push(limit)
    }

    const [rows] = await conn.execute(query, params)
    res.json({ data: rows })
  } catch (err) {
    console.error('GET /api/vw_formas_pagamentos error', err)
    res.status(500).json({ error: String(err) })
  } finally {
    if (conn) try { await conn.end() } catch {}
  }
})

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

function isDocFilled(value) {
  return value !== null && value !== undefined && value !== '' && value !== '0'
}

app.get('/api/processos/quarter', async (req, res) => {
  let conn
  try {
    const startDate = req.query.start_date
    const nextStartDate = req.query.next_start_date
    if (!startDate || !nextStartDate) {
      return res.status(400).json({ error: 'start_date and next_start_date are required' })
    }

    conn = await getConnection()
    const [rows] = await conn.execute(
      `SELECT * FROM vw_clientes_docs_test WHERE dat_abertura >= ? AND dat_abertura < ? ORDER BY dat_abertura DESC`,
      [startDate, nextStartDate],
    )

    // Each processo_id repeats once per workflow step, with identical doc flags;
    // keep the row with the highest task label as the representative (furthest-along stage).
    const byProcesso = new Map()
    for (const row of rows || []) {
      const key = String(row.processo_id)
      const current = byProcesso.get(key)
      if (!current || String(row.nom_tarefa ?? '') > String(current.nom_tarefa ?? '')) {
        byProcesso.set(key, row)
      }
    }

    const processes = Array.from(byProcesso.values())
    const avgDocPercentage = processes.length
      ? processes.reduce((sum, p) => {
          const filled = DOC_COLUMNS.filter((c) => isDocFilled(p[c])).length
          return sum + (filled / DOC_COLUMNS.length) * 100
        }, 0) / processes.length
      : 0

    res.json({
      processes,
      stats: {
        total: processes.length,
        avgDocPercentage: Math.round(avgDocPercentage * 100) / 100,
      },
    })
  } catch (err) {
    console.error('GET /api/processos/quarter error', err)
    res.status(500).json({ error: String(err) })
  } finally {
    if (conn) try { await conn.end() } catch {}
  }
})

export default app
