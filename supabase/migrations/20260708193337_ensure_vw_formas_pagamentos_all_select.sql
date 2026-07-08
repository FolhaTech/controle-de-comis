-- Ensure authenticated users have SELECT on vw_formas_pagamentos and works table
-- This migration is idempotent and guarantees RLS policies are in place

-- Enable RLS on works table
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

-- Drop and recreate SELECT policy for authenticated users on works
DROP POLICY IF EXISTS "works_authenticated_select_v2" ON public.works;
CREATE POLICY "works_authenticated_select_v2" ON public.works
  FOR SELECT TO authenticated USING (true);

-- Ensure allow_all_authenticated policy exists
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.works;
CREATE POLICY "allow_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Re-confirm security_invoker on the view so RLS from works is enforced
ALTER VIEW public.vw_formas_pagamentos SET (security_invoker = true);

-- Grant SELECT on the view to authenticated role
GRANT SELECT ON public.vw_formas_pagamentos TO authenticated;
