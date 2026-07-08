-- Ensure RLS is enabled and policies exist for all required tables
-- Idempotent: uses DROP POLICY IF EXISTS before CREATE POLICY

ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.works;
CREATE POLICY "allow_all_authenticated" ON public.works
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.team_members;
CREATE POLICY "allow_all_authenticated" ON public.team_members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.attendance_records;
CREATE POLICY "allow_all_authenticated" ON public.attendance_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.attendance_extras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.attendance_extras;
CREATE POLICY "allow_all_authenticated" ON public.attendance_extras
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.expenses;
CREATE POLICY "allow_all_authenticated" ON public.expenses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.revenues;
CREATE POLICY "allow_all_authenticated" ON public.revenues
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.action_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "action_types_authenticated_all" ON public.action_types;
CREATE POLICY "action_types_authenticated_all" ON public.action_types
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.services;
CREATE POLICY "allow_all_authenticated" ON public.services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.work_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.work_services;
CREATE POLICY "allow_all_authenticated" ON public.work_services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.compositions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.compositions;
CREATE POLICY "allow_all_authenticated" ON public.compositions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_authenticated_all" ON public.profiles;
CREATE POLICY "profiles_authenticated_all" ON public.profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.company_settings;
CREATE POLICY "allow_all_authenticated" ON public.company_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.materials;
CREATE POLICY "allow_all_authenticated" ON public.materials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.material_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.material_movements;
CREATE POLICY "allow_all_authenticated" ON public.material_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.work_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.work_stages;
CREATE POLICY "allow_all_authenticated" ON public.work_stages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.work_diaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.work_diaries;
CREATE POLICY "allow_all_authenticated" ON public.work_diaries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.service_providers;
CREATE POLICY "allow_all_authenticated" ON public.service_providers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.external_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.external_contracts;
CREATE POLICY "allow_all_authenticated" ON public.external_contracts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.team_member_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.team_member_documents;
CREATE POLICY "allow_all_authenticated" ON public.team_member_documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.compositions_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.compositions_history;
CREATE POLICY "allow_all_authenticated" ON public.compositions_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.consumption_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.consumption_tracking;
CREATE POLICY "allow_all_authenticated" ON public.consumption_tracking
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.work_extra_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.work_extra_materials;
CREATE POLICY "allow_all_authenticated" ON public.work_extra_materials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.densidades_insumo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.densidades_insumo;
CREATE POLICY "allow_all_authenticated" ON public.densidades_insumo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
