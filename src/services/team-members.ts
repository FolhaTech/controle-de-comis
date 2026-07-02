import { supabase } from '@/lib/supabase/client'
import { Consultant } from '@/lib/types'

export async function fetchTeamMembers() {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: false })
  return { data: data as Consultant[] | null, error }
}

export async function createTeamMember(member: Partial<Consultant>) {
  const { data, error } = await supabase.from('team_members').insert(member).select().single()
  return { data: data as Consultant | null, error }
}

export async function updateTeamMember(id: string, updates: Partial<Consultant>) {
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data as Consultant | null, error }
}

export async function deleteTeamMember(id: string) {
  const { error } = await supabase.from('team_members').delete().eq('id', id)
  return { error }
}
