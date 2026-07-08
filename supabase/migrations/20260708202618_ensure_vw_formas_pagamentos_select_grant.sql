-- Idempotent migration: ensure authenticated users have SELECT on vw_formas_pagamentos
-- The view uses security_invoker = true, so underlying works RLS policies apply.

-- Ensure RLS is enabled on works (the view's source table)
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

-- Recreate SELECT policy for authenticated users on works
DROP POLICY IF EXISTS "works_authenticated_select_final" ON public.works;
CREATE POLICY "works_authenticated_select_final" ON public.works
  FOR SELECT TO authenticated USING (true);

-- Recreate full CRUD policy for authenticated users on works
DROP POLICY IF EXISTS "allow_all_authenticated_final" ON public.works;
CREATE POLICY "allow_all_authenticated_final" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure the view uses security_invoker so RLS from works is enforced
ALTER VIEW public.vw_formas_pagamentos SET (security_invoker = true);

-- Grant SELECT on the view to authenticated role
GRANT SELECT ON public.vw_formas_pagamentos TO authenticated;
