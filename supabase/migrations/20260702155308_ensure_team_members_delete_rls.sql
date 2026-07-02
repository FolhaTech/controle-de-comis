DROP POLICY IF EXISTS "team_members_authenticated_delete" ON public.team_members;

CREATE POLICY "team_members_authenticated_delete" ON public.team_members
  FOR DELETE TO authenticated USING (true);
