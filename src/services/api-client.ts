// Shared "try each known API base" fetch helper for services that talk to
// tools/api-app.js — same set of candidate bases used by fetchContracts().
import { apiBases, authFetch } from './api-base'

export { apiBases }

export async function tryEachBase<T>(
  path: string,
  init: RequestInit | undefined,
  parse: (res: Response) => Promise<T>,
  preserveApiError = false,
): Promise<T> {
  let lastError: unknown
  for (const API_BASE of apiBases()) {
    let apiError = false
    try {
      const res = await authFetch(`${API_BASE}${path}`, init)
      if (!res.ok) {
        apiError = preserveApiError && !!res.headers.get('content-type')?.includes('application/json')
        if (!apiError) throw new Error(`API error ${res.status}`)
      }
      return await parse(res)
    } catch (error) {
      if (apiError) throw error
      lastError = error
    }
  }
  throw lastError ?? new Error('API unavailable')
}
