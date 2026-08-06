#!/usr/bin/env node
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

async function main() {
  const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env
  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    console.error('Faltam variáveis de ambiente MySQL. Verifique o arquivo .env')
    process.exit(1)
  }

  let conn
  try {
    conn = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      port: 3306,
    })

    const [rows] = await conn.execute('SELECT * FROM vw_formas_pagamentos LIMIT 1')
    if (!rows || (rows && rows.length === 0)) {
      console.log('View vazia ou não encontrada: vw_formas_pagamentos')
      return
    }

    const sample = rows[0]
    console.log('Colunas encontradas na view:')
    console.log(Object.keys(sample).join(', '))
    console.log('\nLinha de amostra:')
    console.log(JSON.stringify(sample, null, 2))
  } catch (err) {
    console.error('Erro ao consultar o banco:', err?.message ?? String(err))
    process.exit(2)
  } finally {
    if (conn) {
      try { await conn.end() } catch {}
    }
  }
}

main()
