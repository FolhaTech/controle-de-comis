DO $$
DECLARE
  new_user_id uuid;
  consultant_id uuid;
  attendant_id uuid;
  action_type_id uuid;
  action_type_id_2 uuid;
BEGIN
  -- Seed user tiago.izaias@folhatech.com.br
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tiago.izaias@folhatech.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
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

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (new_user_id, 'tiago.izaias@folhatech.com.br', 'Tiago Izaias', 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Seed consultant team member
  IF NOT EXISTS (SELECT 1 FROM public.team_members WHERE name = 'Carlos Eduardo Silva' AND type = 'consultor') THEN
    consultant_id := gen_random_uuid();
    INSERT INTO public.team_members (id, name, role, type, status, daily_cost, fixed_salary, participates_in_averages, payment_type)
    VALUES (consultant_id, 'Carlos Eduardo Silva', 'Consultor Jurídico', 'consultor', 'active', 200, 3000, true, 'monthly');
  ELSE
    SELECT id INTO consultant_id FROM public.team_members WHERE name = 'Carlos Eduardo Silva' AND type = 'consultor' LIMIT 1;
  END IF;

  -- Seed attendant team member
  IF NOT EXISTS (SELECT 1 FROM public.team_members WHERE name = 'Mariana Costa Reis' AND type = 'atendente') THEN
    attendant_id := gen_random_uuid();
    INSERT INTO public.team_members (id, name, role, type, status, daily_cost, fixed_salary, payment_type)
    VALUES (attendant_id, 'Mariana Costa Reis', 'Atendente Pré-processual', 'atendente', 'active', 150, 2200, 'daily');
  ELSE
    SELECT id INTO attendant_id FROM public.team_members WHERE name = 'Mariana Costa Reis' AND type = 'atendente' LIMIT 1;
  END IF;

  -- Get action type IDs
  SELECT id INTO action_type_id FROM public.action_types WHERE name = 'Direito do Trabalhador' LIMIT 1;
  SELECT id INTO action_type_id_2 FROM public.action_types WHERE name = 'Direito do Consumidor' LIMIT 1;

  -- Seed work/contract record 1
  IF NOT EXISTS (SELECT 1 FROM public.works WHERE client = 'João Pereira da Silva' AND client_cpf = '123.456.789-00') THEN
    INSERT INTO public.works (
      name, client, client_cpf, client_email, client_phone,
      consultant_id, pre_processual_agent_id, service_type,
      start_date, end_date_planned, contracted_value, payment_method,
      installments, status, entry_value, entry_payment_method, is_entry_paid,
      progress_percentage, total_area, manager, address
    ) VALUES (
      'João Pereira da Silva',
      'João Pereira da Silva',
      '123.456.789-00',
      'joao.pereira@email.com',
      '(11) 98765-4321',
      consultant_id,
      attendant_id,
      action_type_id,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '180 days',
      15000.00,
      'PIX',
      12,
      'Ativo',
      3000.00,
      'PIX',
      true,
      35,
      0,
      'Carlos Eduardo Silva',
      'Rua das Flores, 123 - São Paulo, SP'
    );
  END IF;

  -- Seed work/contract record 2
  IF NOT EXISTS (SELECT 1 FROM public.works WHERE client = 'Ana Beatriz Ferreira' AND client_cpf = '987.654.321-00') THEN
    INSERT INTO public.works (
      name, client, client_cpf, client_email, client_phone,
      consultant_id, pre_processual_agent_id, service_type,
      start_date, end_date_planned, contracted_value, payment_method,
      installments, status, entry_value, entry_payment_method, is_entry_paid,
      progress_percentage, total_area, manager, address
    ) VALUES (
      'Ana Beatriz Ferreira',
      'Ana Beatriz Ferreira',
      '987.654.321-00',
      'ana.ferreira@email.com',
      '(11) 91234-5678',
      consultant_id,
      attendant_id,
      action_type_id_2,
      CURRENT_DATE - INTERVAL '5 days',
      CURRENT_DATE + INTERVAL '120 days',
      8500.00,
      'Cartão',
      6,
      'Ativo',
      1500.00,
      'Cartão',
      true,
      60,
      0,
      'Carlos Eduardo Silva',
      'Av. Paulista, 1000 - São Paulo, SP'
    );
  END IF;

  -- Seed work/contract record 3 (cancelled)
  IF NOT EXISTS (SELECT 1 FROM public.works WHERE client = 'Roberto Alves Lima' AND client_cpf = '456.789.123-00') THEN
    INSERT INTO public.works (
      name, client, client_cpf, client_email, client_phone,
      consultant_id, pre_processual_agent_id, service_type,
      start_date, end_date_planned, contracted_value, payment_method,
      installments, status, entry_value, entry_payment_method, is_entry_paid,
      progress_percentage, total_area, manager, address,
      cancellation_date, cancellation_reason, internal_failure
    ) VALUES (
      'Roberto Alves Lima',
      'Roberto Alves Lima',
      '456.789.123-00',
      'roberto.lima@email.com',
      '(11) 99876-5432',
      consultant_id,
      attendant_id,
      action_type_id,
      CURRENT_DATE - INTERVAL '10 days',
      CURRENT_DATE + INTERVAL '90 days',
      12000.00,
      'Boleto',
      10,
      'Cancelado',
      2000.00,
      'Boleto',
      false,
      15,
      0,
      'Carlos Eduardo Silva',
      'Rua dos Pinheiros, 500 - São Paulo, SP',
      CURRENT_DATE - INTERVAL '2 days',
      'Cliente desistiu do processo',
      false
    );
  END IF;
END $$;
