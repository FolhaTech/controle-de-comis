-- Ensure vw_formas_pagamentos view has proper SELECT access for authenticated users
-- The view uses security_invoker = true, so underlying works table RLS policies apply.

-- Re-confirm security_invoker on the view
ALTER VIEW public.vw_formas_pagamentos SET (security_invoker = true);

-- Ensure the view grants SELECT to authenticated
GRANT SELECT ON public.vw_formas_pagamentos TO authenticated;

-- Ensure the underlying works table has RLS enabled with SELECT policy
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "works_authenticated_select_v2" ON public.works;
CREATE POLICY "works_authenticated_select_v2" ON public.works
  FOR SELECT TO authenticated USING (true);

-- Ensure the existing allow_all_authenticated policy exists (idempotent)
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.works;
CREATE POLICY "allow_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
