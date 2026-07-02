ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS fixed_salary numeric DEFAULT 0;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS participates_in_averages boolean DEFAULT false;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS average_start_date date;
