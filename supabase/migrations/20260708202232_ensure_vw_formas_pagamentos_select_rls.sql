-- Ensure authenticated users have SELECT on works table and vw_formas_pagamentos view
-- Idempotent migration: safe to run multiple times

-- Enable RLS on works table
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

-- Drop and recreate SELECT policy for authenticated users on works
DROP POLICY IF EXISTS "Allow authenticated select" ON public.works;
CREATE POLICY "Allow authenticated select" ON public.works
  FOR SELECT TO authenticated USING (true);

-- Ensure allow_all_authenticated policy exists for full CRUD
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.works;
CREATE POLICY "allow_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure the view uses security_invoker so underlying works RLS policies apply
ALTER VIEW public.vw_formas_pagamentos SET (security_invoker = true);

-- Grant SELECT on the view to authenticated role
GRANT SELECT ON public.vw_formas_pagamentos TO authenticated;
