import { apiBases } from './api-base'

export interface PremiacaoEmailResult {
  sent: string[]
  skipped_without_email: string[]
  month: number
  year: number
}

export async function sendPremiacaoEmails(
  secret: string,
  month: number,
  year: number,
): Promise<{ data: PremiacaoEmailResult | null; error: string | null }> {
  let lastError = 'API indisponível'
  for (const base of apiBases()) {
    try {
      const res = await fetch(`${base}/api/premiacao/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ month, year }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.status === 401) return { data: null, error: 'Senha de envio incorreta.' }
      if (!res.ok) return { data: null, error: body?.error ?? `Erro ${res.status}` }
      return { data: body as PremiacaoEmailResult, error: null }
    } catch (err) {
      lastError = String(err)
    }
  }
  return { data: null, error: lastError }
}
