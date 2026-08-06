#!/usr/bin/env node
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { writeFile } from 'fs/promises'

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

    const [rows] = await conn.execute(
      `SELECT DISTINCT Cliente FROM vw_formas_pagamentos WHERE Cliente IS NOT NULL ORDER BY Cliente`,
    )

    if (!rows || rows.length === 0) {
      console.log('Nenhum cliente encontrado na view vw_formas_pagamentos')
      return
    }

    const clients = rows.map((r) => r.Cliente).filter(Boolean)
    clients.forEach((c) => console.log(c))

    // Save to workspace file in UTF-8
    try {
      await writeFile('tools/clients.txt', clients.join('\n'), 'utf8')
      console.log('\nLista completa salva em tools/clients.txt')
    } catch (e) {
      console.error('Erro salvando arquivo:', e?.message ?? String(e))
    }
  } catch (err) {
    console.error('Erro ao consultar o banco:', err?.message ?? String(err))
    process.exit(2)
  } finally {
    if (conn) {
      try {
        await conn.end()
      } catch {
        // ignore
      }
    }
  }
}

main()
