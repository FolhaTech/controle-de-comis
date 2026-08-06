import { corsHeaders } from '../_shared/cors.ts'
import { getConnection, getProcesses, getProcessDetail, getStats, getQuarterData } from './db.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'list'

  let conn
  try {
    conn = await getConnection()

    if (action === 'stats') {
      const stats = await getStats(conn)
      return new Response(JSON.stringify(stats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'detail') {
      const id = url.searchParams.get('id')
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const process = await getProcessDetail(conn, id)
      if (!process) {
        return new Response(JSON.stringify({ error: 'Process not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify(process), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10)
    const q = url.searchParams.get('q') || ''
    const sortBy = url.searchParams.get('sortBy') || 'dat_abertura'
    const sortDir = url.searchParams.get('sortDir') || 'desc'

    const result = await getProcesses(conn, page, pageSize, q, sortBy, sortDir)
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error', detail: String(err) }), {
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
