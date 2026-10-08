import { apiBases, authFetch } from './api-base'

export const normalizeConsultantName = (name: string) => name.trim().toLowerCase()

export async function fetchConsultantEmails(): Promise<Record<string, string>> {
  let lastError: unknown
  for (const base of apiBases()) {
    try {
      const res = await authFetch(`${base}/api/consultant-emails`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const body = await res.json()
      const map: Record<string, string> = {}
      for (const row of (body?.data ?? []) as { name: string; email: string }[]) {
        map[row.name] = row.email
      }
      return map
    } catch (err) {
      lastError = err
    }
  }
  throw lastError ?? new Error('API unavailable')
}

export async function saveConsultantEmail(name: string, email: string): Promise<{ error: unknown }> {
  let lastError: unknown
  for (const base of apiBases()) {
    try {
      const res = await authFetch(`${base}/api/consultant-emails`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: normalizeConsultantName(name), email: email.trim() }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return { error: null }
    } catch (err) {
      lastError = err
    }
  }
  return { error: lastError ?? new Error('API unavailable') }
}
