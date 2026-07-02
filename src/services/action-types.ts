import { supabase } from '@/lib/supabase/client'
import { ActionType } from '@/lib/types'

export async function fetchActionTypes() {
  const { data, error } = await supabase.from('action_types').select('*').order('name')
  return { data: data as ActionType[] | null, error }
}

export async function createActionType(actionType: { name: string; active: boolean }) {
  const { data, error } = await supabase.from('action_types').insert(actionType).select().single()
  return { data: data as ActionType | null, error }
}

export async function updateActionType(id: string, updates: Partial<ActionType>) {
  const { data, error } = await supabase
    .from('action_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data as ActionType | null, error }
}

export async function deleteActionType(id: string) {
  const { error } = await supabase.from('action_types').delete().eq('id', id)
  return { error }
}
