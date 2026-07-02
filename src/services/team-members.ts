import { supabase } from '@/lib/supabase/client'

export async function deleteTeamMember(id: string) {
  const { error } = await supabase.from('team_members').delete().eq('id', id)

  return { error }
}
