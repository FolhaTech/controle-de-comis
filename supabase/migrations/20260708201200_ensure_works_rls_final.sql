-- Final definitive RLS migration for works table and vw_formas_pagamentos view
-- Ensures authenticated users can SELECT all contract records without restrictions
-- Idempotent: uses DROP POLICY IF EXISTS before CREATE POLICY

ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

-- SELECT policy matching the acceptance criteria naming
DROP POLICY IF EXISTS "Allow authenticated select" ON public.works;
CREATE POLICY "Allow authenticated select" ON public.works
  FOR SELECT TO authenticated USING (true);

-- Additional SELECT policy for compatibility
DROP POLICY IF EXISTS "Allow authenticated select on works" ON public.works;
CREATE POLICY "Allow authenticated select on works" ON public.works
  FOR SELECT TO authenticated USING (true);

-- ALL policy for full CRUD operations (insert, update, delete)
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.works;
CREATE POLICY "allow_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure the view uses security_invoker so underlying works RLS policies apply
ALTER VIEW public.vw_formas_pagamentos SET (security_invoker = true);

-- Grant SELECT on the view to authenticated role
GRANT SELECT ON public.vw_formas_pagamentos TO authenticated;
