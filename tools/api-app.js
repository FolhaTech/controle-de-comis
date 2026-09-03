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
// SHOW CREATE VIEW vw_formas_pagamentos) — same nom_tarefa restriction as the
// view (only counts a contract once it's reached "05.1 - Financeiro link Pgto"
// or "11 - Confecção inicial", i.e. payment confirmed via data_pgto_cliente or
// the case is a recognized Trabalhista intake), but adds two things the view
// doesn't expose:
//   - T3.nome_solicitante (who opened/originated the client) — the correct
//     field for attributing a contract to a consultant. T4.inserrido_pgto
//     (who happened to key in the payment) is a different, less reliable
//     signal: it can name whoever did data entry, sometimes disagreeing with
//     nome_solicitante entirely.
//   - T3.acao_cli (the real practice-area/case-type label) — lets the UI show
//     why the same client/CPF can legitimately appear more than once (two
//     separate matters), instead of looking like a duplicate.
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
  LEFT JOIN mod_cad_clientes_x_pagamento_cliente T4 ON T3.id = T4.cad_clientes_id
  WHERE (T2.nom_tarefa = '05.1 - Financeiro link Pgto' AND T4.valor_pagto IS NOT NULL)
     OR T2.nom_tarefa = '11 - Confecção inicial'
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

// Manual corrections to the live CRM-derived contract list (add a contract
// not tracked by the CRM workflow, override a field on one that is, or
// exclude one entirely) — kept in our own table since we don't write back
// into the CRM's tables. Applied on top of FORMAS_PAGAMENTOS_QUERY's output
// by fetchContracts() in src/services/contracts.ts.
app.get('/api/contract-adjustments', async (req, res) => {
  let conn
  try {
    conn = await getConnection()
    const [rows] = await conn.execute(`SELECT * FROM contract_adjustments ORDER BY created_at DESC`)
    res.json({ data: rows })
  } catch (err) {
    console.error('GET /api/contract-adjustments error', err)
    res.status(500).json({ error: String(err) })
  } finally {
    if (conn) try { await conn.end() } catch {}
  }
})

app.post('/api/contract-adjustments', async (req, res) => {
  let conn
  try {
    const { action, target_processo_id, closed_by, client, case_type, value, start_date } = req.body || {}
    if (!action || !['add', 'edit', 'remove'].includes(action)) {
      return res.status(400).json({ error: 'action must be one of add, edit, remove' })
    }
    if (!closed_by) {
      return res.status(400).json({ error: 'closed_by is required' })
    }
    if ((action === 'edit' || action === 'remove') && !target_processo_id) {
      return res.status(400).json({ error: 'target_processo_id is required for edit/remove' })
    }

    const id = req.body?.id || crypto.randomUUID()
    conn = await getConnection()
    await conn.execute(
      `INSERT INTO contract_adjustments (id, action, target_processo_id, closed_by, client, case_type, value, start_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, action, target_processo_id ?? null, closed_by, client ?? null, case_type ?? null, value ?? null, start_date ?? null],
    )
    const [rows] = await conn.execute(`SELECT * FROM contract_adjustments WHERE id = ?`, [id])
    res.status(201).json({ data: rows[0] ?? null })
  } catch (err) {
    console.error('POST /api/contract-adjustments error', err)
    res.status(500).json({ error: String(err) })
  } finally {
    if (conn) try { await conn.end() } catch {}
  }
})

app.put('/api/contract-adjustments/:id', async (req, res) => {
  let conn
  try {
    const { id } = req.params
    const { client, case_type, value, start_date, closed_by } = req.body || {}
    conn = await getConnection()
    if (closed_by) {
      await conn.execute(
        `UPDATE contract_adjustments SET client = ?, case_type = ?, value = ?, start_date = ?, closed_by = ? WHERE id = ?`,
        [client ?? null, case_type ?? null, value ?? null, start_date ?? null, closed_by, id],
      )
    } else {
      await conn.execute(
        `UPDATE contract_adjustments SET client = ?, case_type = ?, value = ?, start_date = ? WHERE id = ?`,
        [client ?? null, case_type ?? null, value ?? null, start_date ?? null, id],
      )
    }
    const [rows] = await conn.execute(`SELECT * FROM contract_adjustments WHERE id = ?`, [id])
    if (!rows.length) return res.status(404).json({ error: 'not found' })
    res.json({ data: rows[0] })
  } catch (err) {
    console.error('PUT /api/contract-adjustments/:id error', err)
    res.status(500).json({ error: String(err) })
  } finally {
    if (conn) try { await conn.end() } catch {}
  }
})

app.delete('/api/contract-adjustments/:id', async (req, res) => {
  let conn
  try {
    const { id } = req.params
    conn = await getConnection()
    await conn.execute(`DELETE FROM contract_adjustments WHERE id = ?`, [id])
    res.json({ error: null })
  } catch (err) {
    console.error('DELETE /api/contract-adjustments/:id error', err)
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
