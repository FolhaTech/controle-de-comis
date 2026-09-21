import { corsHeaders } from '../_shared/cors.ts'
import { createConnection } from 'npm:mysql2@3.14.0/promise'

type Connection = Awaited<ReturnType<typeof createConnection>>

async function getConnection(): Promise<Connection> {
  return createConnection({
    host: Deno.env.get('MYSQL_HOST'),
    user: Deno.env.get('MYSQL_USER'),
    password: Deno.env.get('MYSQL_PASSWORD'),
    database: Deno.env.get('MYSQL_DATABASE'),
    port: 3306,
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const startDate = url.searchParams.get('start_date')
  const nextStartDate = url.searchParams.get('next_start_date')

  let query = 'SELECT * FROM vw_formas_pagamentos'
  const params: (string | number)[] = []

  if (startDate && nextStartDate) {
    query += ' WHERE start_date >= ? AND start_date < ?'
    params.push(startDate, nextStartDate)
  }

  query += ' ORDER BY created_at DESC'

  let conn: Connection | undefined
  try {
    conn = await getConnection()
    const [rows] = await conn.execute(query, params)
    return new Response(JSON.stringify(rows), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } finally {
    if (conn) {
      try {
        await conn.end()
      } catch {
        // ignore
      }
    }
  }
})
