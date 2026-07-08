import { supabase } from '@/lib/supabase/client'
import { Consultant } from '@/lib/types'

export async function fetchTeamMembers() {
  const { data, error } = await supabase
    .from('team_members')
    .select('*, works(name)')
    .order('created_at', { ascending: false })

  const mapped = data?.map((item: Record<string, unknown>) => {
    const { works, ...member } = item
    return {
      ...member,
      work_name: (works as { name: string } | null)?.name || null,
    }
  }) as Consultant[] | null

  return { data: mapped, error }
}

export async function createTeamMember(member: Partial<Consultant>) {
  const { work_name, ...insertData } = member
  const { data, error } = await supabase.from('team_members').insert(insertData).select().single()
  return { data: data as Consultant | null, error }
}

export async function updateTeamMember(id: string, updates: Partial<Consultant>) {
  const { work_name, ...updateData } = updates
  const { data, error } = await supabase
    .from('team_members')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  return { data: data as Consultant | null, error }
}

export async function deleteTeamMember(id: string) {
  const { error } = await supabase.from('team_members').delete().eq('id', id)
  return { error }
}
