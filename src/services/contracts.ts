import { supabase } from '@/lib/supabase/client'
import { Contract } from '@/lib/types'

export async function fetchContracts(): Promise<{ data: Contract[] | null; error: any }> {
  const { data, error } = await supabase
    .from('vw_formas_pagamentos')
    .select('*')
    .order('created_at', { ascending: false, nullsFirst: false })

  if (error) {
    return { data: null, error }
  }

  const contracts = (data as Contract[] | null) ?? []
  const filtered = contracts.filter((c) => c.id != null)
  return { data: filtered, error: null }
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
