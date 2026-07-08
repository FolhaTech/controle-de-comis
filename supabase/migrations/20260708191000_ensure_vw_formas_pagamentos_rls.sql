-- Ensure vw_formas_pagamentos view has proper SELECT grants for authenticated role
-- The view uses security_invoker = true, so underlying works table RLS policies apply.
-- This migration ensures both the GRANT on the view and the underlying table policy are correct.

-- Ensure the view grants SELECT to authenticated
GRANT SELECT ON public.vw_formas_pagamentos TO authenticated;

-- Ensure the underlying works table has a SELECT policy for authenticated users
-- (security_invoker views use the caller's permissions, so this is required)
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "works_authenticated_select_v2" ON public.works;
CREATE POLICY "works_authenticated_select_v2" ON public.works
  FOR SELECT TO authenticated USING (true);

-- Also ensure the existing allow_all_authenticated policy exists (idempotent)
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.works;
CREATE POLICY "allow_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Re-confirm security_invoker on the view so RLS from works is enforced
ALTER VIEW public.vw_formas_pagamentos SET (security_invoker = true);
