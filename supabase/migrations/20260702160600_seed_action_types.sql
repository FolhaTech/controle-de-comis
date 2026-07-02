INSERT INTO public.action_types (name, active) VALUES
  ('Direito do Trabalhador', true),
  ('Direito do Consumidor', true),
  ('Direito Civil', true),
  ('Direito Bancário', true),
  ('Direito Previdenciário', true)
ON CONFLICT (name) DO NOTHING;
