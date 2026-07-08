-- Ensure RLS is enabled on works table
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

-- Create the specific SELECT policy as required by acceptance criteria
DROP POLICY IF EXISTS "Allow authenticated select on works" ON public.works;
CREATE POLICY "Allow authenticated select on works" ON public.works
  FOR SELECT TO authenticated USING (true);

-- Ensure existing ALL policy remains for other operations
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.works;
CREATE POLICY "allow_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed auth user: tiago.izaias@folhatech.com.br with password Skip@Pass
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tiago.izaias@folhatech.com.br') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'tiago.izaias@folhatech.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Tiago Izaias"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Skip@Pass', gen_salt('bf')), updated_at = NOW()
    WHERE email = 'tiago.izaias@folhatech.com.br';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  SELECT id, email, 'Tiago Izaias', 'admin' FROM auth.users WHERE email = 'tiago.izaias@folhatech.com.br'
  ON CONFLICT (id) DO NOTHING;
END $$;
