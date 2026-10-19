import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { authFetch, apiBases } from '@/services/api-base'

interface AtendenteResult {
  responsavel: string
  liberacoes: number
  bateu_individual: boolean
  streak_individual: number
  valor_individual: number
  valor_coletivo: number
  valor_total: number
}

interface ComissaoPreResult {
  periodo: string
  inicio: string
  fim: string
  total_pastas: number
  valor_gestao: number
  gestora_direta: string
  atendentes: AtendenteResult[]
}

const currency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

// Print-only page for the Comissão Pré PDF (see /api/cron/comissao-pre and the
// "Consolidar" button): renders the same numbers the admin screen shows, so
// the headless Chromium print job and the live preview never drift apart.
export default function ComissaoPrePrintPage() {
  const [params] = useSearchParams()
  const periodo = params.get('periodo') ?? ''
  const [data, setData] = useState<ComissaoPreResult | null>(null)

  useEffect(() => {
    if (!periodo) return
    ;(async () => {
      for (const base of apiBases()) {
        try {
          const res = await authFetch(`${base}/api/pre-processual/periodo/${periodo}`)
          if (!res.ok) continue
          setData(await res.json())
          return
        } catch {
          // try next base
        }
      }
    })()
  }, [periodo])

  return (
    <div id="comissao-pre-print-root" data-ready={data ? 'true' : 'false'} style={{ fontFamily: 'Arial, sans-serif', padding: 24 }}>
      {data && (
        <>
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>Comissão Pré — {data.periodo}</h1>
          <p style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>
            Período: {formatDate(data.inicio)} a {formatDate(data.fim)} · Total de pastas liberadas: {data.total_pastas}
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#192768', color: '#fff' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Atendente</th>
                <th style={{ textAlign: 'right', padding: 6 }}>Liberações</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Meta individual</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Streak</th>
                <th style={{ textAlign: 'right', padding: 6 }}>Individual</th>
                <th style={{ textAlign: 'right', padding: 6 }}>Coletivo</th>
                <th style={{ textAlign: 'right', padding: 6 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.atendentes.map((a) => (
                <tr key={a.responsavel} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: 6 }}>{a.responsavel}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{a.liberacoes}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{a.bateu_individual ? 'Sim' : 'Não'}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{a.streak_individual || '—'}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{currency(a.valor_individual)}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{currency(a.valor_coletivo)}</td>
                  <td style={{ padding: 6, textAlign: 'right', fontWeight: 'bold' }}>{currency(a.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 20, padding: 12, background: '#f4f4f4', fontSize: 12 }}>
            <strong>Gestão direta ({data.gestora_direta}):</strong> {currency(data.valor_gestao)}
          </div>
        </>
      )}
    </div>
  )
}
