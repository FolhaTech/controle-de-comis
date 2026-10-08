import { tryEachBase } from './api-client'

export interface AppUser {
  id: number
  email: string
  role: 'admin' | 'comum'
  consultant_name: string | null
  created_at: string | null
}

export async function fetchUsers(): Promise<{ data: AppUser[] | null; error: unknown }> {
  try {
    const data = await tryEachBase<AppUser[]>('/api/users', undefined, async (res) => {
      const body = await res.json()
      return body?.data ?? []
    })
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export interface CreateUserInput {
  email: string
  password: string
  role: 'admin' | 'comum'
  consultant_name?: string | null
}

export async function createUser(input: CreateUserInput): Promise<{ data: AppUser | null; error: unknown }> {
  try {
    const data = await tryEachBase<AppUser | { error: string }>(
      '/api/users',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) },
      async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`)
        return body?.data ?? null
      },
    )
    return { data: data as AppUser, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export interface UpdateUserInput {
  role?: 'admin' | 'comum'
  consultant_name?: string | null
  password?: string
}

export async function updateUser(
  id: number,
  updates: UpdateUserInput,
): Promise<{ data: AppUser | null; error: unknown }> {
  try {
    const data = await tryEachBase<AppUser>(
      `/api/users/${id}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) },
      async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`)
        return body?.data ?? null
      },
    )
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteUser(id: number): Promise<{ error: unknown }> {
  try {
    await tryEachBase<null>(`/api/users/${id}`, { method: 'DELETE' }, async (res) => {
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`)
      return null
    })
    return { error: null }
  } catch (error) {
    return { error }
  }
}
