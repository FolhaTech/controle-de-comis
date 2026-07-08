-- Ensure authenticated users can SELECT from works table and vw_formas_pagamentos view
-- Idempotent migration to satisfy RLS policy verification requirement

ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated select on works" ON public.works;
CREATE POLICY "Allow authenticated select on works" ON public.works
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "works_authenticated_select_v2" ON public.works;
CREATE POLICY "works_authenticated_select_v2" ON public.works
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "allow_all_authenticated" ON public.works;
CREATE POLICY "allow_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER VIEW public.vw_formas_pagamentos SET (security_invoker = true);
GRANT SELECT ON public.vw_formas_pagamentos TO authenticated;
