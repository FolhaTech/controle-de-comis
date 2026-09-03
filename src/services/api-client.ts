// Shared "try each known API base" fetch helper for services that talk to
// tools/api-app.js — same set of candidate bases used by fetchContracts().
export function apiBases(): string[] {
  const bases = [
    (import.meta.env.VITE_API_URL as string | undefined)?.trim(),
    'http://localhost:4000',
    'http://localhost:4001',
    'http://localhost:4002',
  ].filter(Boolean) as string[]
  bases.push('') // same-origin fallback, e.g. Vercel's /api/*
  return bases
}

export async function tryEachBase<T>(
  path: string,
  init: RequestInit | undefined,
  parse: (res: Response) => Promise<T>,
): Promise<T> {
  let lastError: unknown
  for (const API_BASE of apiBases()) {
    try {
      const res = await fetch(`${API_BASE}${path}`, init)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return await parse(res)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError ?? new Error('API unavailable')
}
