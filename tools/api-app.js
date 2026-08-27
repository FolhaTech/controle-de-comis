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
    const [rows] = await conn.execute(
      `SELECT DISTINCT inserrido_pgto FROM vw_formas_pagamentos WHERE inserrido_pgto IS NOT NULL AND inserrido_pgto <> ''`,
    )
    const names = new Set()
    for (const row of rows || []) {
      const raw = row.inserrido_pgto
      if (!raw) continue
      const separatorIndex = raw.indexOf(' - ')
      const name = (separatorIndex === -1 ? raw : raw.slice(0, separatorIndex)).trim()
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

app.get('/api/vw_formas_pagamentos', async (req, res) => {
  let conn
  try {
    conn = await getConnection()
    const startDate = req.query.start_date
    const nextStartDate = req.query.next_start_date
    const limitParam = req.query.limit
    const limit = limitParam === undefined || limitParam === '' ? null : Number(limitParam)

    let query = 'SELECT * FROM vw_formas_pagamentos'
    const params = []
    if (startDate && nextStartDate) {
      query += ' WHERE COALESCE(data_entrada_pgto, Data_Execucao) >= ? AND COALESCE(data_entrada_pgto, Data_Execucao) < ?'
      params.push(startDate, nextStartDate)
    }
    query += ' ORDER BY COALESCE(data_entrada_pgto, Data_Execucao) DESC'
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
