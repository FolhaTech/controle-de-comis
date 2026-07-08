ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_authenticated" ON public.works;
CREATE POLICY "allow_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
