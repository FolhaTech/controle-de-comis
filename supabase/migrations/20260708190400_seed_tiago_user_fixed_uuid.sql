DO $$
DECLARE
  fixed_user_id uuid := 'c5e8f2a1-3b4d-4e5f-8a9b-0c1d2e3f4a5b'::uuid;
  existing_id uuid;
BEGIN
  -- Check if user already exists (from previous migration)
  SELECT id INTO existing_id FROM auth.users WHERE email = 'tiago.izaias@folhatech.com.br';

  IF existing_id IS NOT NULL THEN
    -- Update password for existing user to ensure correct credentials
    UPDATE auth.users
    SET encrypted_password = crypt('Planet17566@!@', gen_salt('bf')),
        updated_at = NOW()
    WHERE id = existing_id;

    -- Use existing ID for profile sync
    fixed_user_id := existing_id;
  ELSE
    -- Insert new user with fixed UUID (idempotent check)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tiago.izaias@folhatech.com.br') THEN
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud,
        confirmation_token, recovery_token, email_change_token_new,
        email_change, email_change_token_current,
        phone, phone_change, phone_change_token, reauthentication_token
      ) VALUES (
        fixed_user_id,
        '00000000-0000-0000-0000-000000000000',
        'tiago.izaias@folhatech.com.br',
        crypt('Planet17566@!@', gen_salt('bf')),
        NOW(), NOW(), NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Tiago Izaias"}',
        false, 'authenticated', 'authenticated',
        '', '', '', '', '',
        NULL, '', '', ''
      );
    END IF;
  END IF;

  -- Upsert profile linked to the auth user with the same UUID
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (fixed_user_id, 'tiago.izaias@folhatech.com.br', 'Tiago Izaias', 'admin')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
END $$;
