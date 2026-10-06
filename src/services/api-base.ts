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
