ALTER TABLE public.action_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "action_types_authenticated_all" ON public.action_types;
CREATE POLICY "action_types_authenticated_all" ON public.action_types
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
