-- Ensure authenticated users can SELECT from works table and vw_formas_pagamentos view
-- This migration creates the exact policy required by the acceptance criteria

ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

-- Create the specific SELECT policy with the exact name from acceptance criteria
DROP POLICY IF EXISTS "Allow authenticated select" ON public.works;
CREATE POLICY "Allow authenticated select" ON public.works
  FOR SELECT TO authenticated USING (true);

-- Ensure the broader ALL policy also exists for other operations
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.works;
CREATE POLICY "allow_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure the view uses security_invoker so underlying RLS policies apply
ALTER VIEW public.vw_formas_pagamentos SET (security_invoker = true);

-- Grant SELECT on the view to authenticated role
GRANT SELECT ON public.vw_formas_pagamentos TO authenticated;
