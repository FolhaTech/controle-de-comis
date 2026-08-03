import { Consultant } from '@/lib/types'

const TEAM_MEMBERS_STORAGE_KEY = 'controle-de-comis-team-members'

function loadTeamMembers(): Consultant[] {
  const stored = localStorage.getItem(TEAM_MEMBERS_STORAGE_KEY)
  if (!stored) return []

  try {
    return JSON.parse(stored) as Consultant[]
  } catch {
    return []
  }
}

function saveTeamMembers(items: Consultant[]) {
  localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(items))
}

function makeConsultant(name: string): Consultant {
  return {
    id: crypto.randomUUID(),
    name,
    role: null,
    phone: null,
    type: 'consultor',
    status: 'active',
    fixed_salary: null,
    participates_in_averages: false,
    average_start_date: null,
    pix_key: null,
    payment_type: null,
    admission_date: null,
    work_id: null,
    daily_cost: null,
    created_at: new Date().toISOString(),
    work_name: null,
  }
}

async function fetchInserridoPgtoNames(): Promise<string[]> {
  const API_BASES = [
    (import.meta.env.VITE_API_URL as string | undefined)?.trim(),
    'http://localhost:4000',
    'http://localhost:4001',
    'http://localhost:4002',
  ].filter(Boolean) as string[]
  API_BASES.push('') // same-origin fallback, e.g. Vercel's /api/*

  for (const API_BASE of API_BASES) {
    try {
      const res = await fetch(`${API_BASE}/api/inserrido-pgto`)
      if (!res.ok) continue
      const body = await res.json()
      const names: string[] = body?.names ?? []
      if (names.length) return names
    } catch {
      // try next base
    }
  }
  return []
}

export async function fetchTeamMembers() {
  const existing = loadTeamMembers()
  const namesFromContracts = await fetchInserridoPgtoNames()

  if (namesFromContracts.length === 0) {
    return { data: existing, error: null }
  }

  const existingByName = new Map(existing.map((c) => [c.name.trim().toLowerCase(), c]))
  let changed = false

  for (const name of namesFromContracts) {
    const key = name.trim().toLowerCase()
    if (!existingByName.has(key)) {
      existingByName.set(key, makeConsultant(name))
      changed = true
    }
  }

  const merged = Array.from(existingByName.values())
  if (changed) saveTeamMembers(merged)

  return { data: merged, error: null }
}

export async function createTeamMember(member: Partial<Consultant>) {
  const items = loadTeamMembers()
  const newMember: Consultant = {
    id: crypto.randomUUID(),
    name: member.name || 'Novo Consultor',
    role: member.role || 'Consultor',
    phone: member.phone || null,
    email: member.email || null,
    work_name: member.work_name || null,
    created_at: new Date().toISOString(),
  }
  saveTeamMembers([newMember, ...items])
  return { data: newMember, error: null }
}

export async function updateTeamMember(id: string, updates: Partial<Consultant>) {
  const items = loadTeamMembers()
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) {
    return { data: null, error: 'Consultor não encontrado' }
  }
  const updated = {
    ...items[index],
    ...updates,
  }
  const updatedItems = [...items]
  updatedItems[index] = updated
  saveTeamMembers(updatedItems)
  return { data: updated, error: null }
}

export async function deleteTeamMember(id: string) {
  const items = loadTeamMembers()
  saveTeamMembers(items.filter((item) => item.id !== id))
  return { error: null }
}
