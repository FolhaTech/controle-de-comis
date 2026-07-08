-- Consolidation migration: ensure RLS SELECT policies on works table and vw_formas_pagamentos view grants
-- Also ensure profile sync for tiago.izaias@folhatech.com.br

-- 1. Ensure works table has RLS enabled with SELECT policy for authenticated
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "works_authenticated_select_v2" ON public.works;
CREATE POLICY "works_authenticated_select_v2" ON public.works
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "allow_all_authenticated" ON public.works;
CREATE POLICY "allow_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Ensure vw_formas_pagamentos view grants SELECT to authenticated
-- The view uses security_invoker = true, so underlying works table RLS applies
ALTER VIEW public.vw_formas_pagamentos SET (security_invoker = true);
GRANT SELECT ON public.vw_formas_pagamentos TO authenticated;

-- 3. Ensure profile exists for tiago.izaias@folhatech.com.br linked by correct UUID
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'tiago.izaias@folhatech.com.br';

  IF existing_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (existing_user_id, 'tiago.izaias@folhatech.com.br', 'Tiago Izaias', 'admin')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  END IF;
END $$;
