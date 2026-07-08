import { supabase } from '@/lib/supabase/client'
import { Contract } from '@/lib/types'

export async function fetchContracts() {
  const { data, error } = await supabase
    .from('works')
    .select('*')
    .order('created_at', { ascending: false })
  return { data: (data as Contract[] | null) ?? null, error }
}

export async function createContract(contract: Partial<Contract>) {
  const insertData = {
    ...contract,
    name: contract.client || 'Contrato',
  }
  const { data, error } = await supabase.from('works').insert(insertData).select().single()
  return { data: data as Contract | null, error }
}

export async function updateContract(id: string, updates: Partial<Contract>) {
  const updateData = {
    ...updates,
    ...(updates.client ? { name: updates.client } : {}),
  }
  const { data, error } = await supabase
    .from('works')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  return { data: data as Contract | null, error }
}

export async function deleteContract(id: string) {
  const { error } = await supabase.from('works').delete().eq('id', id)
  return { error }
}
