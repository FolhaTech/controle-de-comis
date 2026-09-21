import type { ActionType } from '@/lib/types'

const ACTION_TYPES_STORAGE_KEY = 'controle-de-comis-action-types'

const initialActionTypes: ActionType[] = [
  { id: '1', name: 'Direito do Trabalhador', active: true, created_at: new Date().toISOString() },
  { id: '2', name: 'Direito do Consumidor', active: true, created_at: new Date().toISOString() },
]

function loadActionTypes(): ActionType[] {
  const stored = localStorage.getItem(ACTION_TYPES_STORAGE_KEY)
  if (!stored) return initialActionTypes
  try {
    return JSON.parse(stored) as ActionType[]
  } catch {
    return initialActionTypes
  }
}

function saveActionTypes(items: ActionType[]) {
  localStorage.setItem(ACTION_TYPES_STORAGE_KEY, JSON.stringify(items))
}

export async function fetchActionTypes() {
  const data = loadActionTypes()
  return { data, error: null }
}

export async function createActionType(actionType: { name: string; active: boolean }) {
  const items = loadActionTypes()
  const newItem: ActionType = {
    id: crypto.randomUUID(),
    name: actionType.name,
    active: actionType.active,
    created_at: new Date().toISOString(),
  }
  const newItems = [newItem, ...items]
  saveActionTypes(newItems)
  return { data: newItem, error: null }
}

export async function updateActionType(id: string, updates: Partial<ActionType>) {
  const items = loadActionTypes()
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) {
    return { data: null, error: 'Action type not found' }
  }
  const updated = { ...items[index], ...updates }
  const newItems = [...items]
  newItems[index] = updated
  saveActionTypes(newItems)
  return { data: updated, error: null }
}

export async function deleteActionType(id: string) {
  const items = loadActionTypes()
  const newItems = items.filter((item) => item.id !== id)
  saveActionTypes(newItems)
  return { error: null }
}
