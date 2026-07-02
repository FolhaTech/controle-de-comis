CREATE TABLE IF NOT EXISTS public.action_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
