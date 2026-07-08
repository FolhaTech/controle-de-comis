-- Definitive idempotent migration: ensure vw_formas_pagamentos view is accessible
-- to authenticated users via RLS on the underlying works table.
-- The view uses security_invoker = true, so works RLS policies apply transparently.

-- 1. Enable RLS on works (the view's source table)
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

-- 2. SELECT policy for authenticated users on works
DROP POLICY IF EXISTS "works_vw_select_authenticated" ON public.works;
CREATE POLICY "works_vw_select_authenticated" ON public.works
  FOR SELECT TO authenticated USING (true);

-- 3. Full CRUD policy for authenticated users on works
DROP POLICY IF EXISTS "works_vw_all_authenticated" ON public.works;
CREATE POLICY "works_vw_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Ensure the view uses security_invoker so underlying RLS is enforced
ALTER VIEW public.vw_formas_pagamentos SET (security_invoker = true);

-- 5. Grant SELECT on the view to authenticated role
GRANT SELECT ON public.vw_formas_pagamentos TO authenticated;
